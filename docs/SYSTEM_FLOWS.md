# Mood Leaf - System Flows

## Overview

This document maps the complete flow of information through Mood Leaf:
- **INPUTS**: What we receive from the user
- **PROCESSING**: How we interpret and transform data
- **OUTPUTS**: What we send back to the user

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER                                          │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐│
│  │   Voice    │  │   Camera   │  │   Text     │  │   Behavior         ││
│  │   Input    │  │   Input    │  │   Input    │  │   (timing, etc.)   ││
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘│
│        │               │               │                    │           │
└────────┼───────────────┼───────────────┼────────────────────┼───────────┘
         │               │               │                    │
         ▼               ▼               ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INPUT PROCESSING                                  │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │   Biometric     │  │   Signal        │  │   Content               │ │
│  │   Security      │  │   Analysis      │  │   Analysis              │ │
│  │                 │  │                 │  │                         │ │
│  │ • Voice print   │  │ • Speech speed  │  │ • Message meaning       │ │
│  │ • Face ID       │  │ • Pitch change  │  │ • Emotional content     │ │
│  │ • Anomalies     │  │ • Slurring      │  │ • Intent detection      │ │
│  │ • Auth check    │  │ • Facial cues   │  │ • Topic extraction      │ │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘ │
│           │                    │                        │              │
│           ▼                    ▼                        ▼              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              INFERRED USER STATE                                 │   │
│  │  • Emotional state (anxious, calm, sad, etc.)                   │   │
│  │  • Energy level (depleted, low, moderate, high, agitated)       │   │
│  │  • Cognitive load (low, normal, high, overwhelmed)              │   │
│  │  • Engagement (disengaged, passive, engaged)                    │   │
│  │  • Alerts (slurring, distress, speech changes)                  │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONTEXT SYNTHESIS                                    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      MOODPRINT                                   │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  Cognitive   │  │  Neurological │  │  Memory              │  │   │
│  │  │  Profile     │  │  Differences  │  │  Tiers               │  │   │
│  │  │              │  │               │  │                      │  │   │
│  │  │ • How they   │  │ • Aphantasia  │  │ • Short-term         │  │   │
│  │  │   think      │  │ • No inner    │  │   (session)          │  │   │
│  │  │ • Learning   │  │   voice       │  │ • Mid-term           │  │   │
│  │  │   style      │  │ • Time blind  │  │   (weekly)           │  │   │
│  │  │ • Emotional  │  │ • Sensory     │  │ • Long-term          │  │   │
│  │  │   processing │  │   sensitivity │  │   (core identity)    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│  ┌──────────────────────────────┴──────────────────────────────────┐   │
│  │              CONVERSATION CONTROLLER                             │   │
│  │                                                                  │   │
│  │  Generates Response Directives:                                  │   │
│  │  • Tone (gentle, warm, energetic, direct)                       │   │
│  │  • Length (brief, moderate, detailed)                           │   │
│  │  • Timing (pause before responding, give space)                 │   │
│  │  • Technique constraints (NO visualization, etc.)               │   │
│  │  • Question frequency and type                                  │   │
│  │  • Emotional approach (validate first, mirror, etc.)            │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     RESPONSE GENERATION                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    LLM (Claude)                                  │   │
│  │                                                                  │   │
│  │  Receives:                                                       │   │
│  │  • User message                                                  │   │
│  │  • MoodPrint context (cognitive profile, neurological, memory)   │   │
│  │  • Current inferred state (emotions, energy, load)              │   │
│  │  • Response directives (tone, length, constraints)              │   │
│  │  • Coach persona                                                 │   │
│  │  • Active skill mode (if any)                                   │   │
│  │                                                                  │   │
│  │  Generates:                                                      │   │
│  │  • Adapted response respecting all constraints                  │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     OUTPUT PROCESSING                                    │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │   Human Score   │  │   Memory        │  │   Output                │ │
│  │   Service       │  │   Update        │  │   Formatting            │ │
│  │                 │  │                 │  │                         │ │
│  │ • Score 1-100   │  │ • Track in      │  │ • Text formatting       │ │
│  │ • Natural?      │  │   session       │  │ • TTS conversion        │ │
│  │ • Appropriate?  │  │ • Update topics │  │ • Visual components     │ │
│  │ • Train data    │  │ • Emotional arc │  │   (BreathingBall, etc.) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER                                          │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐│
│  │   Voice    │  │   Visual   │  │   Text     │  │   UI Components    ││
│  │   Output   │  │   Output   │  │   Output   │  │   (animations)     ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Input Processing Pipeline

### 1. Raw Inputs

| Input Type | Source | Data |
|------------|--------|------|
| **Text** | Keyboard | Message content, typing patterns |
| **Voice** | Microphone | Audio waveform, speech patterns |
| **Visual** | Camera | Face images, expressions |
| **Behavioral** | System | Timing, session patterns |

### 2. Input Analysis Services

#### `biometricSecurityService.ts` (Security Layer)
```
Voice/Face Input
     │
     ▼
┌─────────────────────────────────┐
│   Authentication Check          │
│                                 │
│   • Voice print matching        │
│   • Face recognition            │
│   • Is this the owner?          │
│   • Is this an authorized user? │
│   • Is this an unknown person?  │
└────────────────┬────────────────┘
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
   OWNER    AUTHORIZED    BLOCKED
```

#### `userSignalAnalysisService.ts` (Emotional Detection)
```
Text/Voice/Visual Input
     │
     ▼
┌─────────────────────────────────┐
│   Signal Analysis               │
│                                 │
│   Text Signals:                 │
│   • Word count, length          │
│   • Negative/positive words     │
│   • Uncertainty markers         │
│   • Hedging phrases             │
│                                 │
│   Voice Signals:                │
│   • Speed (faster = anxiety?)   │
│   • Speed (slower = depression?)│
│   • Slurring (intoxication?)    │
│   • Pitch changes (stress?)     │
│   • Tremor (fear?)              │
│                                 │
│   Visual Signals:               │
│   • Expression detection        │
│   • Distress indicators         │
│   • Crying detection            │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Inferred State                │
│                                 │
│   • primaryState: "anxious"     │
│   • energy: "agitated"          │
│   • cognitiveLoad: "high"       │
│   • alerts: ["speech_speeding"] │
└─────────────────────────────────┘
```

---

## Context Synthesis

### MoodPrint Assembly

```
┌─────────────────────────────────────────────────────────────────┐
│                      getMoodPrint()                              │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ getCognitiveProfile()                                        │
│  │                                                               │
│  │ • primaryCognitiveMode: "conceptual_systems"                 │
│  │ • emotionalProcessing: "feeler_first"                        │
│  │ • communicationStyle: "metaphorical"                         │
│  └──────────────────┘                                           │
│           +                                                      │
│  ┌──────────────────┐                                           │
│  │ getNeurologicalProfile()                                     │
│  │                                                               │
│  │ • mentalImagery: "aphantasia" (CAN'T VISUALIZE)             │
│  │ • internalMonologue: "none" (NO INNER VOICE)                │
│  │ • timePerception: "time_blind"                               │
│  └──────────────────┘                                           │
│           +                                                      │
│  ┌──────────────────┐                                           │
│  │ getMemoryContext()                                           │
│  │                                                               │
│  │ • Preferred name                                              │
│  │ • Key relationships                                           │
│  │ • Recent topics                                               │
│  │ • Emotional patterns                                          │
│  └──────────────────┘                                           │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ MoodPrint Summary:                                        │   │
│  │ "Someone who sees patterns, where emotions come first.    │   │
│  │  Cannot visualize. No inner voice. Use conceptual         │   │
│  │  approaches, validate first, use metaphors."              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output Processing Pipeline

### Response Generation → Scoring → Delivery

```
LLM Response
     │
     ▼
┌─────────────────────────────────┐
│   Human Score Service           │
│                                 │
│   Scores 1-100:                 │
│   • Natural language? (15 pts) │
│   • Emotional timing? (20 pts) │
│   • Brevity appropriate? (15)   │
│   • Memory use good? (15 pts)   │
│   • Avoided AI-isms? (10 pts)   │
│   • Personality? (15 pts)       │
│   • Imperfection? (10 pts)      │
│                                 │
│   Saves for training data       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Memory Update                 │
│                                 │
│   • Add to session messages     │
│   • Update emotional arc        │
│   • Track topics discussed      │
│   • Note significant moments    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Output Formatting             │
│                                 │
│   Text: markdown formatting     │
│   Voice: TTS synthesis          │
│   Visual: UI components         │
│   Components: BreathingBall     │
└─────────────────────────────────┘
```

---

## Service Map

### Input Services (Analyzing USER output)

| Service | Purpose | Input | Output |
|---------|---------|-------|--------|
| `biometricSecurityService.ts` | Auth & anomaly detection | Voice, face | Auth result, anomalies |
| `userSignalAnalysisService.ts` | Emotional state detection | Text, voice, visual | Inferred state, alerts |

### Context Services (Understanding the user)

| Service | Purpose | Stores |
|---------|---------|--------|
| `cognitiveProfileService.ts` | How they think | Cognitive modes, learning style |
| `neurologicalDifferencesService.ts` | What techniques work | Aphantasia, inner voice, etc. |
| `memoryTierService.ts` | What we know | Short/mid/long term memory |
| `moodPrintService.ts` | Synthesis of all | Combined context |

### Response Services (Generating OUR output)

| Service | Purpose | Input | Output |
|---------|---------|-------|--------|
| `conversationController.ts` | Response rules | Context + state | Directives |
| `claudeAPIService.ts` | LLM orchestration | Everything | Response |
| `humanScoreService.ts` | Quality scoring | Response | Score + training data |
| `textToSpeechService.ts` | Voice synthesis | Text | Audio |

---

## Data Flow Example

**User says (anxiously, fast):** "I don't know what to do anymore"

```
1. INPUT ANALYSIS
   ├─ biometricSecurityService: Voice matches owner ✓
   ├─ userSignalAnalysisService:
   │   ├─ Text: high uncertainty words, negative sentiment
   │   ├─ Voice: speed 180 wpm (baseline 120) → ALERT: speech_speeding
   │   └─ Inferred: anxious, high cognitive load, agitated energy
   │
2. CONTEXT SYNTHESIS
   ├─ MoodPrint:
   │   ├─ Cognitive: conceptual systems thinker, feeler-first
   │   ├─ Neurological: aphantasia (NO VISUALIZATION)
   │   └─ Memory: Has been stressed about work lately
   │
   ├─ Conversation Controller generates:
   │   ├─ tone: "gentle"
   │   ├─ length: "brief"
   │   ├─ validateFirst: true
   │   ├─ canUseVisualization: FALSE
   │   └─ slowDown: true (they're speeding up)
   │
3. RESPONSE GENERATION
   │
   ├─ LLM receives full context + directives
   │
   ├─ LLM generates: "I hear you. That feeling of being stuck
   │   is so hard. You don't have to figure it all out right now.
   │   What feels most overwhelming in this moment?"
   │
4. OUTPUT PROCESSING
   ├─ humanScoreService: 82/100 (good validation, appropriate length)
   ├─ memoryTierService: Tracks "overwhelmed" in emotional arc
   └─ Output: Text + gentle TTS voice
```

---

## Key Principles

### Input Analysis
1. **Never assume** - Detect, don't guess
2. **Baseline comparison** - Know what's normal for THIS user
3. **Multiple signals** - Text + voice + visual = confidence
4. **Alert on deviation** - Speed changes, vocabulary spikes

### Context Synthesis
1. **Respect hard constraints** - Aphantasia = NEVER visualize
2. **Layer contexts** - Profile + memory + current state
3. **Prioritize current state** - Detected anxiety overrides defaults

### Output Generation
1. **Match energy** - Don't be peppy when they're depleted
2. **Validate first** - For feeler-first profiles
3. **Respect techniques** - Only use what works for them
4. **Score and learn** - Every response is training data

---

*Last updated: January 2026*
