# Hybrid AI Architecture

## Overview

Mood Leaf uses a hybrid AI architecture designed to:
1. **Maximize human-like conversation** - Not just helpful, but genuinely natural
2. **Adapt to how each person thinks** - Cognitive profiles shape every response
3. **Own the user's data locally** - Claude can disappear, the system survives
4. **Self-improve over time** - Scores responses, learns what works

## What is MoodPrint?

**MoodPrint** is the synthesis of everything we know about a person - their unique fingerprint of how they think, feel, and communicate.

Think of it like a fingerprint for the mind:
- **Cognitive Profile**: HOW they think (patterns, details, stories, feelings)
- **Memory Tiers**: WHAT they've shared (short-term, mid-term, long-term)
- **Conversation Patterns**: HOW to talk to them (tone, length, timing)
- **Quality Metrics**: HOW WELL we're doing (scores, common issues)

The MoodPrint evolves over time as we learn more about the user. It's not a label - it's a living understanding that shapes every interaction.

```typescript
// Get the complete MoodPrint
const moodPrint = await getMoodPrint();

// Get a quick summary
const summary = await getMoodPrintSummary();
// { summary: "Someone who sees connections, where emotions come first.",
//   keyTraits: ["Systems thinker", "Needs validation first", "Learns through metaphors"],
//   communicationGuide: "validate emotions first, use metaphors, connect to bigger picture." }

// Get context formatted for LLM injection
const context = await getMoodPrintContextForLLM();
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                              │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────────┐    ┌────────────┐ │
│  │   Journal   │───▶│  Conversation        │───▶│   Memory   │ │
│  │     UI      │    │  Controller          │    │   Tiers    │ │
│  └─────────────┘    │  (Rules Layer)       │    │            │ │
│                     │                      │    │ Short-term │ │
│                     │ • Energy matching    │    │ Mid-term   │ │
│                     │ • Cognitive profile  │    │ Long-term  │ │
│                     │ • Timing rules       │    │            │ │
│                     │ • AI tick blocking   │    └────────────┘ │
│                     └──────────┬───────────┘                    │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                      ▼
     ┌─────────────────┐                  ┌─────────────────────┐
     │   LOCAL LLM     │                  │     CLAUDE API      │
     │   (Future)      │                  │   (Current)         │
     │                 │                  │                     │
     │ • Daily chat    │                  │ • Daily chat (now)  │
     │ • Fast/cheap    │                  │ • Score responses   │
     │ • Offline       │                  │ • Compress memory   │
     │ • Trainable     │                  │ • Safety monitor    │
     └─────────────────┘                  └─────────────────────┘
```

## Core Services

### 1. Conversation Controller (`conversationController.ts`)

The "soul" layer that makes responses feel human.

**What it does:**
- Detects user energy (low/medium/high) and mood
- Generates response directives (timing, length, tone)
- Blocks AI tick phrases ("I understand", "That's valid")
- Controls memory callback frequency
- Integrates cognitive profile adaptations

**Key function:**
```typescript
generateResponseDirectives(ctx: ConversationContext): Promise<ResponseDirectives>
```

**Output example:**
```typescript
{
  artificialDelay: 2000,      // Pause before heavy topic response
  maxLength: 'brief',         // Don't lecture when user is struggling
  tone: 'gentle',
  allowQuestions: false,      // Don't interrogate during distress
  cognitiveAdaptations: {
    useMetaphors: true,       // User learns through analogies
    validateFirst: true,      // Always validate emotions first
    showBigPicture: true,     // Connect to larger patterns
  }
}
```

### 2. Cognitive Profile Service (`cognitiveProfileService.ts`)

Discovers HOW someone thinks - not IF they're smart.

**Dimensions captured:**
- **Processing Style**: patterns, details, stories, feelings, actions, synthesis
- **Learning Style**: visual, auditory, kinesthetic, reading, social, solitary
- **Social Orientation**: energized by people, drained by people, selective
- **Emotional Processing**: feeler-first, thinker-first, integrated, action-oriented
- **Communication Style**: direct, exploratory, reflective, collaborative, metaphorical
- **Structure Preference**: loves structure, needs flexibility, emergent

**Adaptive onboarding:**
- Questions adapt based on responses
- High self-awareness → deeper questions
- Developing self-awareness → simpler questions
- No jargon - just human language

**Profile reveal:**
After onboarding, the coach explains the user to themselves:
```typescript
generateProfileReveal(): Promise<string>
```

### 3. Human Score Service (`humanScoreService.ts`)

Scores every AI response for "human-ness."

**Scoring dimensions (100 points):**
- Natural language (0-15)
- Emotional timing (0-20)
- Brevity control (0-15)
- Memory use (0-15)
- Imperfection (0-10)
- Personality consistency (0-15)
- Avoided AI ticks (0-10)

**Two scoring modes:**
1. **Local scoring** - Instant, always available, rule-based
2. **Claude scoring** - Background, more accurate, collects training data

**The path to Claude independence:**
```
Now: Claude scores every response → saves {input, output, score}
500+ examples: Can train small local scorer
1000+ examples: Local scorer reliable, Claude optional
```

### 4. Memory Tier Service (`memoryTierService.ts`)

Three-tier memory system owned locally.

**Short-term (current session):**
- Last 20 messages verbatim
- Current mood and energy
- Topics discussed
- Emotional arc

**Mid-term (weekly, Claude-compressed):**
- Weekly summaries
- Recurring themes
- Notable moments
- Flags to monitor

**Long-term (core identity):**
- Communication preferences
- Relationship map
- Triggers and calming factors
- Life events
- Growth patterns

**Compression:**
Claude compresses sessions weekly, but compressed data stays LOCAL.

## Integration with Claude API

The `claudeAPIService.ts` assembles context from all services:

```typescript
const contextParts = [
  cognitiveProfileContext,  // How they think (from onboarding)
  memoryContext,            // What we know (from memory tiers)
  lifeContext,              // Life situation
  psychContext,             // Psychological patterns
  // ... plus health, calendar, journals, etc.
];
```

Controller directives are injected into the system prompt:
```typescript
systemPrompt = `${baseSystemPrompt}

CONVERSATION STYLE DIRECTIVES:
${controllerModifiers}`;
```

## Gender Note

Architecture is gender-neutral. v1 targets women; men's version requires only prompt/example changes, not architectural changes.

## Key Files

| File | Purpose |
|------|---------|
| `moodPrintService.ts` | **MoodPrint synthesis** - combines all systems |
| `conversationController.ts` | Human-ness rules layer |
| `cognitiveProfileService.ts` | Thinking style detection |
| `humanScoreService.ts` | Response quality scoring |
| `memoryTierService.ts` | Three-tier local memory |
| `claudeAPIService.ts` | Orchestrates everything |

## Future: Local LLM Integration

When ready to add local LLM (Ollama):
1. All services work unchanged
2. Just swap Claude API calls for local LLM calls
3. Memory, scoring, controller all transfer
4. Claude becomes evaluator-only, then optional

## Testing

Score stats show what's working:
```typescript
const stats = await getScoreStats();
// { averageScore: 78, commonIssues: ["too verbose", "generic opening"], ... }
```

Export training data:
```typescript
const data = await exportForTraining();
// JSON with all scored exchanges
```

Check if ready for local scorer:
```typescript
const { ready, claudeExamples } = await canTrainLocalScorer();
// { ready: false, claudeExamples: 247, needed: 500 }
```
