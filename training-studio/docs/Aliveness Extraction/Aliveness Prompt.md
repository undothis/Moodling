You are helping build an extraction system for an app called Mood Leaf. The system analyzes conversations to train a LLaMA model to be more human — not to diagnose or treat, but to understand and reflect the texture of human experience.

Look at the Aliveness Extraction research to get more information

## Current extraction categories (expand from these)

life_lessons - "Wisdom gained from experience"
wisdom_perspective - "Insights about life, often from age/experience"
growth_moments - "Turning points and breakthroughs"
real_quotes - "Actual words people use to describe experiences"

## App philosophy (MUST align with this)

Mood Leaf is a journaling app where:
- AI Coach
- The AI Coach is curious, not prescriptive
- The Coach uses tentative language: "it seems like...", "I wonder if..."
- The Coaches goal is to become unnecessary
- Journaling is called "leaving a leaf" — release, not archive
- No diagnosing, no prescribing, no toxic positivity
- Meet people where they are, don't push them somewhere
- Privacy first, on-device

## Your task

Create 25-35 extraction categories that capture the full texture of human conversation. These will be used to:
1. Tag meaningful moments in conversations
2. Train the model to recognize humanness
3. Help the Coach respond authentically

## Category format

For each category, provide:
```python
"category_name": {
    "description": "What this captures (1 sentence)",
    "why_human": "Why this matters for humanness (1 sentence)", 
    "examples": [
        "Example phrase or pattern 1",
        "Example phrase or pattern 2",
        "Example phrase or pattern 3"
    ],
    "Coach_note": "How the Coach should respond when detecting this"
}
```

## What to include

Draw from these domains:

**Emotional texture**
- Emotional granularity (specific vs vague emotion words)
- Mixed/ambivalent feelings (both/and, not either/or)
- Body-based emotion ("pit in my stomach", "weight on shoulders")
- Emotional truths admitted when guards are down

**Cognitive patterns**
- Contradictions held without resolution
- Unresolved questions people carry
- How people talk about past/present/future
- Self-protective language (hedging, minimizing)

**Relational signals**
- Permission-seeking ("Is it okay if I feel...")
- Repair attempts ("Can I try that again?")
- Bids for witness ("I just needed someone to know")
- Attachment echoes in speech

**Authenticity markers**
- Micro-confessions ("I know this sounds dumb but...")
- Topic circling before going direct
- Self-interruption and retreat
- Humor as coping vs deflection
- Guarded hope vs naive optimism

**Meta-conversational**
- Tone shifts (humor → serious, confident → hesitant)
- Meaningful silence/hesitation
- What's NOT said (avoided topics, abrupt changes)
- Readiness signals (ready to go deeper)
- Exit signals (needs to surface)

**The rare gold**
- Moments of self-kindness
- Values in conflict
- Identity friction (who I am vs who I'm expected to be)
- Memory echoes shaping current reactions
- Meaning resistance ("don't turn this into a lesson")

## Constraints

- NO clinical/diagnostic language ("depression symptoms" ❌, "feeling low" ✓)
- NO pathologizing normal human experience
- Categories should be observable in natural speech, not inferred diagnoses
- Descriptions should sound like a wise friend, not a therapist
- The Couch notes should be tentative, not prescriptive

## Output

Provide the complete Python dictionary ready to paste into config.py. Start with the 4 existing categories, then add 25-30 new ones organized by domain.
