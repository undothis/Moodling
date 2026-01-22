# Cognitive Profile System

## Philosophy

Traditional intelligence metrics fail most people. IQ tests reward one type of mind. School works for some brains, not others.

This system discovers HOW someone is smart, not IF they're smart.

## Relationship to MoodPrint

The Cognitive Profile is one core component of the **MoodPrint** - the complete synthesis of everything we know about a person. While MoodPrint combines cognitive profile + memory + conversation patterns + quality metrics, this document focuses specifically on HOW someone thinks.

```
┌─────────────────────────────────────────────┐
│              MOODPRINT                       │
│  (The complete picture of a person)         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     COGNITIVE PROFILE (this doc)     │   │
│  │     How they think                   │   │
│  └─────────────────────────────────────┘   │
│  + Memory Tiers (what they shared)          │
│  + Conversation Patterns (how to talk)      │
│  + Quality Metrics (how well we're doing)   │
└─────────────────────────────────────────────┘
```

**Core beliefs:**
- People think in fundamentally different ways
- Mismatch between thinking style and communication = feeling unheard
- Sensitivity is a strength, not a weakness
- Non-linear thinkers are often brilliant systems thinkers
- Emotional intelligence is intelligence

## The Problem We're Solving

If someone processes through metaphor and gets bullet points, they feel unheard at a STRUCTURAL level. Most AI just matches "warm" vs "direct" - that's surface.

We go deeper:
- How do they naturally process information?
- How do they best receive new ideas?
- Do they need to be heard first, or do they want solutions?
- Are they energized or drained by social interaction?
- Do they need structure or freedom?

## Validation vs Solution Orientation

**Critical insight:** This is often described as a gender difference (women want to be heard, men want solutions). But it's actually a SPECTRUM that exists in everyone.

**Our approach:**
- Don't assume based on gender
- Ask directly (subtly) in onboarding
- Weight the preference (70% validation, 30% solution)
- Allow it to evolve over time

**In the profile:**
```typescript
emotionalProcessing: 'feeler_first' | 'thinker_first' | 'integrated' | ...
validateFirst: boolean  // Should coach validate before suggesting?
```

**How it shapes responses:**
```
User: "I'm so frustrated with my job"

If validateFirst = true (weight high):
→ "That sounds really exhausting. What's been the hardest part?"

If validateFirst = false (weight low):
→ "That's tough. Have you thought about what you'd want to change?"
```

## Dimensions Captured

### 1. Processing Style
How you naturally make sense of information.

| Style | Description | Signs |
|-------|-------------|-------|
| **Patterns** | Sees connections, systems, underlying structures | "Everything is connected" |
| **Details** | Notices specifics, step-by-step, precise | "Walk me through it" |
| **Stories** | Understands through narrative and examples | "Give me an example" |
| **Feelings** | Processes through emotional resonance first | "Why does this matter?" |
| **Actions** | Learns by doing, figures it out hands-on | "Let me try" |
| **Synthesis** | Pulls from multiple sources, makes new wholes | "It's like a combination of..." |

### 2. Learning Style
How you best receive new information.

- **Visual**: Needs diagrams, images, written text
- **Auditory**: Needs conversation, explanation
- **Kinesthetic**: Needs practice, movement, hands-on
- **Reading**: Needs text, notes, written form
- **Social**: Needs discussion, dialogue
- **Solitary**: Needs alone time to process

### 3. Social Orientation
How social interaction affects your energy.

- **Energized by people**: Connection is fuel
- **Drained by people**: Needs recovery after socializing
- **Selective**: Deep connections > many connections
- **Situational**: Depends on context and people

### 4. Emotional Processing
When and how emotions surface.

- **Feeler-first**: Emotions come first, then logic
- **Thinker-first**: Logic first, emotions processed after
- **Integrated**: Emotions and logic intertwined
- **Action-oriented**: Processes emotions through doing
- **Delayed**: Emotions surface later, not in moment

### 5. Communication Style
How you prefer to be spoken to.

- **Direct**: Get to the point
- **Exploratory**: Think out loud, wander to answers
- **Reflective**: Need time, prefer writing
- **Collaborative**: Build understanding together
- **Metaphorical**: Analogies and images help

### 6. Structure Preference
How you relate to plans and organization.

- **Loves structure**: Plans calm you
- **Needs flexibility**: Too much structure suffocates
- **Structured start**: Need structure to begin, then flow
- **Emergent**: Structure emerges from doing

## Adaptive Onboarding

The onboarding adapts to the user:

**High self-awareness signals:**
- "I like thinking about this stuff"
- Thoughtful, nuanced answers
→ Ask deeper, more introspective questions

**Developing self-awareness signals:**
- "I'm not sure I know myself that well"
- Simple, uncertain answers
→ Keep questions concrete, accessible

**Example question adaptation:**
```
Basic: "When someone explains something new, what helps you understand it?"

Deep (only if self-aware): "Do you often see how different parts of life connect to each other?"
```

## Profile Reveal

After onboarding, the coach explains the user to themselves.

**Goals:**
- Create an "aha, that's me" moment
- Help them understand their own mind
- Set expectations for how the coach will adapt
- Empower, not label

**Example output:**
```
Based on what you've shared, I'm seeing some patterns that might resonate.

**How you think:** You're a natural systems thinker. You see connections that
others miss. This is a real strength - even if traditional education didn't
always reward it.

**How you feel:** Emotions come first for you - they're not separate from
your thinking, they're part of how you understand things.

**How to talk with you:** Let's explore it together - I think out loud.
Talking helps you process, even when you don't have the answer yet.

One more thing: If traditional school didn't work for you, that says nothing
about your intelligence. The system rewards one type of mind. Your mind works
differently - and that's actually valuable.

This is just a starting point. I'll learn more about you as we talk.
```

## Coach Adaptations

The profile generates specific adaptations:

```typescript
{
  useMetaphors: true,       // Use analogies - helps them understand
  useExamples: true,        // Give concrete stories
  useStepByStep: false,     // Don't be overly linear
  showBigPicture: true,     // Connect to larger patterns
  validateFirst: true,      // ALWAYS validate before suggesting
  allowWandering: true,     // Let conversation explore
  provideStructure: false,  // Don't over-organize
  giveTimeToThink: true,    // Don't ask rapid questions
  questionType: 'open'      // Open-ended, not specific
}
```

## Learning Over Time

The profile isn't fixed. It evolves:

1. **Initial profile** from onboarding
2. **Refinement** from conversation patterns
3. **Explicit feedback** ("Can you just give me steps?")
4. **Scoring** tells us when responses match/mismatch

```typescript
// In long-term memory
confirmedFits: ['responds well to metaphors', 'needs validation first']
confirmedMisfits: ['gets frustrated with open questions']
```

## Integration Points

### Conversation Controller
```typescript
cognitiveAdaptations: {
  useMetaphors: boolean;
  validateFirst: boolean;
  // ... shapes every response
}
```

### Claude API Context
```typescript
USER'S COGNITIVE PROFILE:
- Thinks in: patterns with synthesis
- Communication style: metaphorical
- Emotional processing: feeler_first
- Highly sensitive - be gentle

ADAPT YOUR RESPONSES:
- Use metaphors and analogies
- Connect to bigger picture
- Always validate emotions FIRST
```

### Human-ness Scoring
A new scoring dimension:
- Did response match their thinking style?
- Did we validate when they needed validation?
- Did we give structure when they wanted structure?

## No Jargon Policy

**We never say:**
- INFP, INTJ, etc.
- High IQ / low IQ
- Neurotypical / neurodivergent (unless they use it)
- Clinical labels

**We say:**
- "You think in patterns"
- "You're a natural systems thinker"
- "Emotions come first for you"
- "You need to feel connected before engaging"

## Files

| File | Purpose |
|------|---------|
| `cognitiveProfileService.ts` | Profile types, onboarding, adaptations |
| `conversationController.ts` | Uses profile to shape responses |
| `claudeAPIService.ts` | Injects profile context into prompts |
