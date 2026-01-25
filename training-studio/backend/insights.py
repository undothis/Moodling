"""
Insight extraction service using Claude API.
Extracts coaching insights from transcripts with prosody context.
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

import httpx

from models import (
    ExtractedInsight, ExtractionCategory, InsightStatus,
    TranscriptResult, ProsodicFeatures, InterviewStatistics
)
from config import settings, EXTRACTION_CATEGORIES


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
            raise ValueError("Anthropic API key not configured")

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

                if response.status_code != 200:
                    error_data = response.json()
                    raise Exception(f"Claude API error: {error_data}")

                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")

                # Parse JSON response
                insights = self._parse_insights_response(content, video_title)
                return insights

        except Exception as e:
            print(f"[Insights] Extraction error: {e}")
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
        """Build the extraction prompt for Claude."""

        # Build category descriptions
        category_section = "\n".join([
            f"- **{cat}**: {EXTRACTION_CATEGORIES.get(cat, cat)}"
            for cat in categories
        ])

        # Build prosody context if available
        prosody_context = ""
        if prosody:
            prosody_context = f"""

## Prosody Context (How They Spoke)

The speaker exhibited the following vocal qualities:
- **Pitch**: Mean {prosody.pitch.mean:.0f}Hz, trajectory: {prosody.pitch.trajectory}
- **Speech Rate**: {prosody.rhythm.speech_rate_wpm:.0f} WPM
- **Pauses**: {prosody.pauses.frequency_per_minute:.1f} per minute, pattern: {prosody.pauses.pattern}
- **Volume Trajectory**: {prosody.volume.trajectory}
- **Aliveness Score**: {prosody.aliveness_score:.0f}/100
- **Emotional Expressiveness**: {prosody.emotional_expressiveness:.0f}/100

Use this context to understand the emotional weight and authenticity of statements.
When someone speaks slowly with many pauses, they may be processing difficult emotions.
Rising pitch and increased pace often indicate excitement or anxiety.
A sagging volume trajectory may indicate hopelessness or fatigue.
"""

        # Build facial emotion context if available
        facial_context = ""
        if facial_emotions:
            emotions = facial_emotions.get("dominant_emotions", [])
            intensity = facial_emotions.get("average_intensity", 0.5)
            micro_expressions = facial_emotions.get("micro_expressions", [])
            emotional_shifts = facial_emotions.get("emotional_shifts", [])

            facial_context = f"""

## Facial Expression Context (What We Observed)

Visual analysis detected the following emotional cues:
- **Dominant Emotions**: {', '.join(emotions) if emotions else 'neutral'}
- **Emotional Intensity**: {intensity:.0%}
- **Micro-expressions**: {', '.join(micro_expressions) if micro_expressions else 'none detected'}
- **Emotional Shifts**: {len(emotional_shifts)} significant changes during the video

This is crucial for understanding what people FEEL vs what they SAY.
When someone says "I'm fine" but shows sadness, that incongruence is meaningful.
The AI coach should learn to gently acknowledge unspoken emotions.
"""

        # Truncate transcript if too long
        transcript_text = transcript.text
        if len(transcript_text) > 15000:
            transcript_text = transcript_text[:15000] + "\n\n[... transcript truncated for length ...]"

        prompt = f"""You are an expert at extracting therapeutic and coaching insights from interview transcripts for training an AI wellness coach.

## Source
- **Video**: "{video_title}"
- **Channel**: {channel_name}

## Your Task

Extract {max_insights} high-quality insights that would help an AI coach better understand and support humans.

Focus on:
1. **Real human experiences** - Specific, authentic moments
2. **Emotional patterns** - How people actually feel and cope
3. **What helps and hurts** - Practical wisdom about support
4. **Communication insights** - How people want to be talked to
5. **Neurological diversity** - Different ways minds work
{prosody_context}{facial_context}
## Categories to Extract

{category_section}

## Transcript

{transcript_text}

## Output Format

Return ONLY valid JSON with this structure:

```json
{{
  "insights": [
    {{
      "title": "Brief descriptive title (5-10 words)",
      "insight": "The full insight (2-4 sentences). Be specific about the human experience observed.",
      "category": "category_name from list above",
      "coaching_implication": "How an AI coach should behave differently based on this insight",
      "timestamp": "approximate timestamp if relevant (e.g., '12:34')",
      "emotional_context": {{
        "emotions": ["primary_emotion", "secondary_emotion"],
        "intensity": 0.7,
        "incongruence": false,
        "therapeutic_response": "how to acknowledge these emotions"
      }},
      "quality_score": 85,
      "specificity_score": 90,
      "actionability_score": 80,
      "safety_score": 95,
      "novelty_score": 75,
      "confidence": 0.9
    }}
  ]
}}
```

## Scoring Guidelines

- **quality_score** (0-100): Overall insight quality and usefulness
- **specificity_score** (0-100): How specific vs generic (low = "people like feeling understood", high = specific pattern)
- **actionability_score** (0-100): How directly the coach can use this
- **safety_score** (0-100): Could applying this insight cause harm? (100 = completely safe)
- **novelty_score** (0-100): Is this a unique insight or common knowledge?
- **confidence** (0-1): Your confidence in the extraction accuracy

## Important Notes

1. Prioritize insights that are SPECIFIC and ACTIONABLE
2. Reject generic platitudes ("be kind", "listen more")
3. Look for contradictions and complexity - humans are messy
4. Capture the "how" not just the "what" - how did they cope? how did they feel?
5. Flag anything potentially harmful with low safety_score
6. Include direct quotes when they capture something powerful

Return ONLY the JSON, no other text."""

        return prompt

    def _parse_insights_response(
        self,
        response_text: str,
        video_title: str
    ) -> List[ExtractedInsight]:
        """Parse Claude's response into insight objects."""
        insights = []

        try:
            # Extract JSON from response (handle markdown code blocks)
            json_text = response_text
            if "```json" in response_text:
                json_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_text = response_text.split("```")[1].split("```")[0]

            data = json.loads(json_text.strip())

            for item in data.get("insights", []):
                # Validate category
                category_str = item.get("category", "emotional_struggles")
                try:
                    category = ExtractionCategory(category_str)
                except ValueError:
                    category = ExtractionCategory.EMOTIONAL_STRUGGLES

                # Determine if needs review based on scores
                quality = item.get("quality_score", 0)
                safety = item.get("safety_score", 100)
                flagged = (
                    quality < settings.human_review_threshold or
                    safety < settings.min_safety_score
                )

                # Auto-reject if below minimum thresholds
                if (quality < settings.min_quality_score or
                    safety < settings.min_safety_score):
                    status = InsightStatus.REJECTED
                elif quality >= settings.human_review_threshold:
                    status = InsightStatus.PENDING  # Auto-approve candidates still need review
                else:
                    status = InsightStatus.PENDING

                # Extract emotional context if present
                emotional_context = item.get("emotional_context", {})

                insight = ExtractedInsight(
                    id=str(uuid.uuid4()),
                    video_id="",  # Set by caller
                    title=item.get("title", "Untitled")[:200],
                    insight=item.get("insight", "")[:2000],
                    category=category,
                    coaching_implication=item.get("coaching_implication", "")[:1000],
                    timestamp=item.get("timestamp"),
                    quality_score=item.get("quality_score", 0),
                    specificity_score=item.get("specificity_score", 0),
                    actionability_score=item.get("actionability_score", 0),
                    safety_score=item.get("safety_score", 100),
                    novelty_score=item.get("novelty_score", 0),
                    confidence=item.get("confidence", 0),
                    status=status,
                    flagged_for_review=flagged,
                    created_at=datetime.utcnow(),
                    emotional_context=emotional_context  # Include emotional context
                )
                insights.append(insight)

        except json.JSONDecodeError as e:
            print(f"[Insights] JSON parse error: {e}")
            print(f"[Insights] Response was: {response_text[:500]}...")

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
            print(f"[Insights] Scoring error: {e}")

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
            print(f"[Insights] Classification error: {e}")

        return {
            "interview_type": "coaching_conversation",
            "therapeutic_approach": None,
            "confidence": 0.5
        }


# Global service instance
insight_service = InsightExtractionService()
