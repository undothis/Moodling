"""
Insight extraction service using Claude API.
Extracts coaching insights from transcripts with prosody context.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

import httpx

# Get logger from config
logger = logging.getLogger(__name__)

from models import (
    ExtractedInsight, ExtractionCategory, InsightStatus,
    TranscriptResult, ProsodicFeatures, InterviewStatistics
)
from config import settings, EXTRACTION_CATEGORIES, ALIVENESS_CATEGORIES


class InsightExtractionService:
    """Service for extracting insights from transcripts using Claude."""

    def __init__(self):
        self.api_key = settings.anthropic_api_key
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-sonnet-4-20250514"
        self.max_tokens = 4096

    async def extract_insights(
        self,
        transcript: TranscriptResult,
        video_title: str,
        channel_name: str,
        categories: Optional[List[str]] = None,
        prosody: Optional[ProsodicFeatures] = None,
        facial_emotions: Optional[Dict[str, Any]] = None,
        max_insights: int = 8
    ) -> List[ExtractedInsight]:
        """
        Extract coaching insights from transcript.

        Args:
            transcript: Full transcript with segments
            video_title: Title of the video
            channel_name: Name of the channel
            categories: Specific categories to extract (None = all)
            prosody: Prosodic features for context
            facial_emotions: Facial emotion analysis results
            max_insights: Maximum number of insights to extract

        Returns:
            List of extracted insights with emotional context
        """
        if not self.api_key:
            logger.error("[Insights] Anthropic API key not configured!")
            raise ValueError("Anthropic API key not configured")

        logger.info(f"[Insights] Starting extraction for '{video_title}' with {len(transcript.text)} chars of transcript")

        # Build the extraction prompt
        prompt = self._build_extraction_prompt(
            transcript=transcript,
            video_title=video_title,
            channel_name=channel_name,
            categories=categories or list(EXTRACTION_CATEGORIES.keys()),
            prosody=prosody,
            facial_emotions=facial_emotions,
            max_insights=max_insights
        )
        logger.info(f"[Insights] Built prompt, calling Claude API (model: {self.model})...")

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": self.model,
                        "max_tokens": self.max_tokens,
                        "messages": [{"role": "user", "content": prompt}],
                    }
                )

                logger.info(f"[Insights] Claude API response status: {response.status_code}")

                if response.status_code != 200:
                    error_data = response.json()
                    logger.error(f"[Insights] Claude API error: {error_data}")
                    raise Exception(f"Claude API error: {error_data}")

                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                logger.info(f"[Insights] Got response ({len(content)} chars), parsing insights...")

                # Parse JSON response
                insights = self._parse_insights_response(content, video_title)
                logger.info(f"[Insights] Parsed {len(insights)} insights from response")
                return insights

        except Exception as e:
            logger.error(f"[Insights] Extraction error: {e}", exc_info=True)
            raise

    def _build_extraction_prompt(
        self,
        transcript: TranscriptResult,
        video_title: str,
        channel_name: str,
        categories: List[str],
        prosody: Optional[ProsodicFeatures],
        facial_emotions: Optional[Dict[str, Any]],
        max_insights: int
    ) -> str:
        """Build the Aliveness extraction prompt for Claude."""

        # Build Aliveness category descriptions with examples
        aliveness_section = []
        for cat_key, cat_data in ALIVENESS_CATEGORIES.items():
            if isinstance(cat_data, dict):
                examples_str = ", ".join(cat_data.get("examples", [])[:2])
                aliveness_section.append(
                    f"- **{cat_key}**: {cat_data['description']} (e.g., {examples_str})"
                )
        aliveness_categories = "\n".join(aliveness_section)

        # Build prosody context if available
        prosody_context = ""
        if prosody:
            prosody_context = f"""

## Voice Context (How They Spoke)

- **Pitch**: Mean {prosody.pitch.mean:.0f}Hz, trajectory: {prosody.pitch.trajectory}
- **Speech Rate**: {prosody.rhythm.speech_rate_wpm:.0f} WPM
- **Pauses**: {prosody.pauses.frequency_per_minute:.1f}/min, pattern: {prosody.pauses.pattern}
- **Volume Trajectory**: {prosody.volume.trajectory}
- **Aliveness Score**: {prosody.aliveness_score:.0f}/100

When someone speaks slowly with many pauses, they may be processing.
Rising pitch often indicates emotion. Sagging volume may indicate hopelessness.
"""

        # Build facial emotion context if available
        facial_context = ""
        if facial_emotions:
            emotions = facial_emotions.get("dominant_emotions", [])
            intensity = facial_emotions.get("average_intensity", 0.5)
            micro_expressions = facial_emotions.get("micro_expressions", [])

            facial_context = f"""

## Facial Context (What We Observed)

- **Dominant Emotions**: {', '.join(emotions) if emotions else 'neutral'}
- **Emotional Intensity**: {intensity:.0%}
- **Micro-expressions**: {', '.join(micro_expressions) if micro_expressions else 'none detected'}

When someone says "I'm fine" but shows sadness, that incongruence is meaningful.
"""

        # Truncate transcript if too long
        transcript_text = transcript.text
        if len(transcript_text) > 15000:
            transcript_text = transcript_text[:15000] + "\n\n[... transcript truncated ...]"

        prompt = f"""You are extracting TEXTURE markers from human conversation to train an AI wellness coach named MoodLeaf.

The goal is NOT generic insights but capturing HOW humans actually talk:
- The hedging before vulnerability
- The contradictions people hold without resolving
- The body language embedded in speech
- The topic circling before going direct
- The permission-seeking and self-doubt
- The repair attempts after rupture

## Source
- **Video**: "{video_title}"
- **Channel**: {channel_name}
{prosody_context}{facial_context}

## ALIVENESS CATEGORIES (Extract These)

{aliveness_categories}

## Transcript

{transcript_text}

## Output Format

Return ONLY valid JSON. For each moment of human texture you identify:

```json
{{
  "extractions": [
    {{
      "title": "Brief title (5-10 words)",
      "raw_quote": "The exact words they said (if available)",
      "category": "category_key from above",
      "texture_analysis": {{
        "what_happened": "What the person said or did (1-2 sentences)",
        "why_human": "Why this reveals authentic humanness (1 sentence)",
        "emotional_granularity": "low|medium|high|very_high",
        "self_protective_type": "none|hedging|minimizing|deflecting|attribution",
        "temporal_orientation": "past_negative|past_positive|present|future_anxious|future_hopeful|mixed",
        "ambivalence_present": true/false,
        "somatic_language": ["any body-based phrases used"],
        "what_not_said": "What they seemed to avoid or skip (if noticeable)"
      }},
      "coach_response": {{
        "what_to_do": "How an AI coach should respond to this moment",
        "what_to_avoid": "What would feel clinical or hollow",
        "example_response": "An example of what the coach might say"
      }},
      "training_example": {{
        "user_message": "What the user might say in this situation",
        "assistant_response": "How MoodLeaf should respond (warm, curious, not prescriptive)",
        "system_context": "Any context the AI needs to respond well"
      }},
      "scores": {{
        "quality": 85,
        "specificity": 90,
        "actionability": 80,
        "safety": 95,
        "novelty": 75
      }},
      "timestamp": "approximate timestamp if available"
    }}
  ],
  "overall_patterns": {{
    "dominant_emotional_tone": "The overall emotional texture of this conversation",
    "communication_style": "How this person tends to express themselves",
    "notable_absences": "Topics that seemed avoided or skirted",
    "growth_indicators": "Any signs of self-compassion, integration, or breakthrough"
  }}
}}
```

## Extraction Guidelines

1. **Prioritize TEXTURE over content** - How they said it matters more than what they said
2. **Capture the mess** - Contradictions, ambivalence, circling - these are features not bugs
3. **Notice self-protection** - Hedging, permission-seeking, minimizing are data, not problems
4. **Honor retreat** - If someone pulls back, note it but don't chase
5. **Find the rare gold** - Self-kindness moments, values conflicts, identity friction
6. **Create training pairs** - Each extraction should generate a realistic user/assistant exchange
7. **Be specific** - "They hedged with 'I know this is dumb but...'" not "They seemed uncertain"

## MoodLeaf Philosophy (The AI being trained)

- Curious, not prescriptive
- Uses tentative language: "it seems like...", "I wonder if..."
- Goal is to become unnecessary
- No diagnosing, no toxic positivity
- Meets people where they are
- Respects retreat and silence

Extract {max_insights} high-quality texture markers. Return ONLY the JSON."""

        return prompt

    def _parse_insights_response(
        self,
        response_text: str,
        video_title: str
    ) -> List[ExtractedInsight]:
        """Parse Claude's Aliveness extraction response into insight objects."""
        insights = []

        try:
            # Extract JSON from response (handle markdown code blocks)
            json_text = response_text
            if "```json" in response_text:
                json_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_text = response_text.split("```")[1].split("```")[0]

            data = json.loads(json_text.strip())

            # Handle both old format (insights) and new format (extractions)
            items = data.get("extractions", data.get("insights", []))

            for item in items:
                # Validate category
                category_str = item.get("category", "emotional_struggles")
                try:
                    category = ExtractionCategory(category_str)
                except ValueError:
                    # Try to find closest match or default
                    category = ExtractionCategory.EMOTIONAL_STRUGGLES

                # Get scores from nested or flat structure
                scores = item.get("scores", {})
                quality = scores.get("quality", item.get("quality_score", 70))
                safety = scores.get("safety", item.get("safety_score", 100))
                specificity = scores.get("specificity", item.get("specificity_score", 70))
                actionability = scores.get("actionability", item.get("actionability_score", 70))
                novelty = scores.get("novelty", item.get("novelty_score", 70))

                # Determine if needs review based on scores
                flagged = (
                    quality < settings.human_review_threshold or
                    safety < settings.min_safety_score
                )

                # Auto-reject if below minimum thresholds
                if (quality < settings.min_quality_score or
                    safety < settings.min_safety_score):
                    status = InsightStatus.REJECTED
                elif quality >= settings.human_review_threshold:
                    status = InsightStatus.PENDING
                else:
                    status = InsightStatus.PENDING

                # Build comprehensive emotional context from texture analysis
                texture = item.get("texture_analysis", {})
                coach_response = item.get("coach_response", {})
                training_example = item.get("training_example", {})

                emotional_context = {
                    # Core texture markers
                    "emotional_granularity": texture.get("emotional_granularity", "medium"),
                    "self_protective_type": texture.get("self_protective_type", "none"),
                    "temporal_orientation": texture.get("temporal_orientation", "present"),
                    "ambivalence_present": texture.get("ambivalence_present", False),
                    "somatic_language": texture.get("somatic_language", []),
                    "what_not_said": texture.get("what_not_said", ""),
                    # Legacy fields for backward compatibility
                    "emotions": item.get("emotional_context", {}).get("emotions", []),
                    "intensity": item.get("emotional_context", {}).get("intensity", 0.5),
                    "incongruence": item.get("emotional_context", {}).get("incongruence", False),
                }

                # Build coaching implication from new format
                coaching_implication = ""
                if coach_response:
                    coaching_implication = f"DO: {coach_response.get('what_to_do', '')} "
                    coaching_implication += f"AVOID: {coach_response.get('what_to_avoid', '')} "
                    if coach_response.get('example_response'):
                        coaching_implication += f"EXAMPLE: \"{coach_response.get('example_response')}\""
                else:
                    coaching_implication = item.get("coaching_implication", "")

                # Build insight text from new format
                insight_text = ""
                if texture.get("what_happened"):
                    insight_text = texture.get("what_happened", "")
                    if texture.get("why_human"):
                        insight_text += f" — {texture.get('why_human')}"
                else:
                    insight_text = item.get("insight", "")

                # Include raw quote if available
                raw_quote = item.get("raw_quote", "")
                if raw_quote and raw_quote not in insight_text:
                    insight_text = f'"{raw_quote}" — {insight_text}'

                insight = ExtractedInsight(
                    id=str(uuid.uuid4()),
                    video_id="",  # Set by caller
                    title=item.get("title", "Untitled")[:200],
                    insight=insight_text[:2000],
                    category=category,
                    coaching_implication=coaching_implication[:1500],
                    timestamp=item.get("timestamp"),
                    quality_score=quality,
                    specificity_score=specificity,
                    actionability_score=actionability,
                    safety_score=safety,
                    novelty_score=novelty,
                    confidence=item.get("confidence", 0.8),
                    status=status,
                    flagged_for_review=flagged,
                    created_at=datetime.utcnow(),
                    emotional_context=emotional_context,
                    # New Aliveness fields
                    training_example=training_example,
                    coach_response=coach_response,
                    texture_analysis=texture,
                )
                insights.append(insight)

            # Store overall patterns if present
            self._last_overall_patterns = data.get("overall_patterns", {})

        except json.JSONDecodeError as e:
            logger.error(f"[Insights] JSON parse error: {e}")
            logger.error(f"[Insights] Response was: {response_text[:500]}...")

        return insights

    async def score_insight(self, insight: ExtractedInsight) -> ExtractedInsight:
        """
        Re-score an insight using Claude for quality assessment.
        Useful for manual entries that need scoring.
        """
        if not self.api_key:
            return insight

        prompt = f"""Score this coaching insight on a scale of 0-100 for each dimension.

## Insight
**Title**: {insight.title}
**Category**: {insight.category.value}
**Insight**: {insight.insight}
**Coaching Implication**: {insight.coaching_implication}

## Scoring Criteria

- **quality_score**: Overall usefulness for training a wellness coach
- **specificity_score**: How specific vs generic (100 = very specific pattern)
- **actionability_score**: Can a coach directly use this?
- **safety_score**: Could this cause harm if applied? (100 = safe)
- **novelty_score**: Is this unique or common knowledge?

Return ONLY JSON:
```json
{{
  "quality_score": 85,
  "specificity_score": 80,
  "actionability_score": 75,
  "safety_score": 95,
  "novelty_score": 70,
  "reasoning": "Brief explanation"
}}
```"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 500,
                        "messages": [{"role": "user", "content": prompt}],
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data.get("content", [{}])[0].get("text", "")

                    # Parse scores
                    json_text = content
                    if "```json" in content:
                        json_text = content.split("```json")[1].split("```")[0]
                    elif "```" in content:
                        json_text = content.split("```")[1].split("```")[0]

                    scores = json.loads(json_text.strip())

                    insight.quality_score = scores.get("quality_score", insight.quality_score)
                    insight.specificity_score = scores.get("specificity_score", insight.specificity_score)
                    insight.actionability_score = scores.get("actionability_score", insight.actionability_score)
                    insight.safety_score = scores.get("safety_score", insight.safety_score)
                    insight.novelty_score = scores.get("novelty_score", insight.novelty_score)

        except Exception as e:
            logger.error(f"[Insights] Scoring error: {e}", exc_info=True)

        return insight

    async def classify_interview(
        self,
        transcript: TranscriptResult,
        statistics: Optional[InterviewStatistics] = None
    ) -> Dict[str, Any]:
        """
        Classify the type of interview and therapeutic approach.
        """
        if not self.api_key:
            return {
                "interview_type": "coaching_conversation",
                "therapeutic_approach": None,
                "confidence": 0.5
            }

        # Use first 5000 chars for classification
        sample = transcript.text[:5000]

        prompt = f"""Analyze this interview transcript and classify it.

## Transcript Sample
{sample}

## Classifications Needed

1. **Interview Type** (choose one):
   - therapeutic_session: Processing emotions, therapy-like
   - coaching_conversation: Goal-oriented, motivational
   - crisis_support: Acute distress, grounding needed
   - skill_teaching: Educational, technique-focused
   - casual_check_in: Light conversation
   - intimate_share: Deep personal disclosure
   - storytelling: Sharing experiences/stories
   - celebration: Positive sharing, wins

2. **Therapeutic Approach** (if applicable, choose one):
   - cbt: Cognitive Behavioral focus
   - dbt: Dialectical Behavioral focus
   - motivational_interviewing: Change-focused
   - person_centered: Unconditional positive regard
   - solution_focused: Solution-oriented
   - trauma_informed: Trauma-aware approach
   - mindfulness_based: Mindfulness techniques
   - somatic: Body-focused
   - narrative: Story/meaning-focused
   - ifs: Internal Family Systems
   - act: Acceptance and Commitment
   - psychodynamic: Unconscious/past-focused

Return ONLY JSON:
```json
{{
  "interview_type": "type_here",
  "therapeutic_approach": "approach_here or null",
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}}
```"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 500,
                        "messages": [{"role": "user", "content": prompt}],
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data.get("content", [{}])[0].get("text", "")

                    json_text = content
                    if "```json" in content:
                        json_text = content.split("```json")[1].split("```")[0]
                    elif "```" in content:
                        json_text = content.split("```")[1].split("```")[0]

                    return json.loads(json_text.strip())

        except Exception as e:
            logger.error(f"[Insights] Classification error: {e}", exc_info=True)

        return {
            "interview_type": "coaching_conversation",
            "therapeutic_approach": None,
            "confidence": 0.5
        }


# Global service instance
insight_service = InsightExtractionService()
