# Mood Leaf System Flow

Visual guide to how all services connect, how data flows, and how the system learns.

---

## Introduction: What Makes Mood Leaf Unique

### The Problem with Current Coaching Apps

Most mental wellness apps treat everyone the same:
- Generic advice that doesn't fit how YOU think
- One-size-fits-all techniques (visualization for everyone, even those who can't visualize)
- Engagement-focused design that creates dependency
- No understanding of neurological differences
- Replacements for human connection instead of bridges to it

### What Mood Leaf Does Differently

**Mood Leaf is an adaptive coaching companion that learns how YOUR mind works and shapes itself around you.**

```
╔═════════════════════════════════════════════════════════════════════════════════╗
║                           WHY MOOD LEAF IS DIFFERENT                             ║
╠═════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║   MOST APPS                          │  MOOD LEAF                                ║
║   ─────────────────────────────────  │  ───────────────────────────────────────  ║
║                                      │                                           ║
║   "Picture yourself on a beach..."   │  Knows you have aphantasia, suggests     ║
║                                      │  body-based grounding instead             ║
║                                      │                                           ║
║   Same tone for everyone             │  Adapts to your cognitive style -         ║
║                                      │  systems thinkers get the "why" first     ║
║                                      │                                           ║
║   Engagement streaks and badges      │  Celebrates when you DON'T need the app   ║
║                                      │  Pushes you toward real human connection  ║
║                                      │                                           ║
║   "How are you feeling?"             │  Knows you process emotions physically,   ║
║                                      │  asks "What's happening in your body?"    ║
║                                      │                                           ║
║   Static responses                   │  Learns from every conversation,          ║
║                                      │  gets better at understanding humans      ║
║                                      │                                           ║
║   Replaces therapy                   │  Knows its limits, actively refers to     ║
║                                      │  therapists, friends, community           ║
║                                      │                                           ║
╚═════════════════════════════════════════════════════════════════════════════════╝
```

### The Core Philosophy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MOOD LEAF'S BELIEFS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   "Every mind works differently"                                                │
│   └── Visual thinkers, verbal processors, systems minds, emotional feelers      │
│                                                                                  │
│   "Low phases are integration, not failure"                                     │
│   └── Cyclical minds need rest periods normalized, not pathologized            │
│                                                                                  │
│   "You are the expert on your own life"                                         │
│   └── We guide and reflect, never prescribe or diagnose                        │
│                                                                                  │
│   "No app can replace human connection"                                         │
│   └── We actively push users toward friends, family, therapy, community        │
│                                                                                  │
│   "The goal is for you to need us less"                                         │
│   └── Our success is measured by your independence, not engagement             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Systems That Power Mood Leaf

Mood Leaf is built from interconnected systems that work together to understand and adapt to each user:

```
╔═════════════════════════════════════════════════════════════════════════════════╗
║                           THE EIGHT CORE SYSTEMS                                 ║
╠═════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║   1. CORE PRINCIPLE KERNEL                    "The Constitution"                 ║
║   ───────────────────────────────────────────────────────────────────────────   ║
║   │ The ethical backbone. Hardcoded beliefs and constraints that NEVER           ║
║   │ change. Ensures every response aligns with our values.                       ║
║   │                                                                              ║
║   │ Contains:                                                                    ║
║   │ • 17 Core Beliefs (what we believe about humans)                            ║
║   │ • 12 Hard Constraints (things we NEVER do)                                  ║
║   │ • 9 Soft Principles (things we strongly prefer)                             ║
║   │                                                                              ║
║   │ Example: "NEVER suggest visualization to users with aphantasia"             ║
║   └──────────────────────────────────────────────────────────────────────────   ║
║                                                                                  ║
║   2. COGNITIVE PROFILE SERVICE                "How You Think"                    ║
║   ───────────────────────────────────────────────────────────────────────────   ║
║   │ Discovers how each user's mind processes information.                        ║
║   │                                                                              ║
║   │ Detects:                                                                     ║
║   │ • Cognitive Mode: conceptual_systems, emotional_relational,                 ║
║   │                   creative_intuitive, analytical_practical                  ║
║   │ • Processing Style: visual, verbal, kinesthetic                             ║
║   │ • Communication Needs: validation-first vs solution-first                   ║
║   │                                                                              ║
║   │ Example: Systems thinkers get explanations before suggestions               ║
║   └──────────────────────────────────────────────────────────────────────────   ║
║                                                                                  ║
║   3. COGNITIVE RHYTHM SERVICE                 "Your Energy Patterns"             ║
║   ───────────────────────────────────────────────────────────────────────────   ║
║   │ Tracks and predicts energy cycles over time.                                 ║
║   │                                                                              ║
║   │ Detects:                                                                     ║
║   │ • Rhythm Type: cyclical_pronounced, cyclical_mild, steady, variable         ║
║   │ • Cycle Length: How long between peaks                                      ║
║   │ • Current Phase: Peak, recovery, baseline                                   ║
║   │ • Time-of-day patterns: Morning person? Night owl?                          ║
║   │                                                                              ║
║   │ Example: Gentler responses during predicted low phases                      ║
║   └──────────────────────────────────────────────────────────────────────────   ║
║                                                                                  ║
║   4. NEUROLOGICAL DIFFERENCES SERVICE         "How Your Brain Is Wired"          ║
║   ───────────────────────────────────────────────────────────────────────────   ║
║   │ Detects and respects neurological variations that affect experience.         ║
║   │                                                                              ║
║   │ Detects:                                                                     ║
║   │ • Aphantasia: Can't visualize? We'll never say "picture this..."           ║
║   │ • Inner Monologue: Thinks in words, images, or feelings?                    ║
║   │ • ADHD Traits: Interest-based motivation, time blindness                    ║
║   │ • Sensory Processing: Over/under-responsive patterns                        ║
║   │                                                                              ║
║   │ Example: For aphantasia, suggest body-based exercises, not imagery          ║
║   └──────────────────────────────────────────────────────────────────────────   ║
║                                                                                  ║
║   5. SOCIAL CONNECTION HEALTH SERVICE         "Your Human Network"               ║
║   ───────────────────────────────────────────────────────────────────────────   ║
║   │ Monitors isolation and encourages human connection.                          ║
║   │                                                                              ║
║   │ Tracks:                                                                      ║
║   │ • Isolation Level: none → mild → moderate → severe                          ║
║   │ • Last mentioned friends/family                                             ║
║   │ • App dependency signals (is this their only support?)                      ║
║   │ • External support presence (therapist, groups)                             ║
║   │                                                                              ║
║   │ Example: If isolation detected, gently nudge toward reaching out            ║
║   └──────────────────────────────────────────────────────────────────────────   ║
║                                                                                  ║
║   6. MEMORY TIER SERVICE                      "Your Story Over Time"             ║
║   ───────────────────────────────────────────────────────────────────────────   ║
║   │ Three-tiered memory system that remembers context.                           ║
║   │                                                                              ║
║   │ Tiers:                                                                       ║
║   │ • Short-term: This session's topics, emotions, threads                      ║
║   │ • Mid-term: This week's patterns, unresolved issues                         ║
║   │ • Long-term: Core identity, triggers, growth patterns                       ║
║   │                                                                              ║
║   │ Example: "Last week you mentioned work stress - how's that going?"          ║
║   └──────────────────────────────────────────────────────────────────────────   ║
║                                                                                  ║
║   7. HUMAN SCORE SERVICE                      "Response Quality Check"           ║
║   ───────────────────────────────────────────────────────────────────────────   ║
║   │ Scores every response for human-ness across 7 dimensions.                    ║
║   │                                                                              ║
║   │ Scores (out of 100):                                                        ║
║   │ • Natural Language (15): Sounds human, not robotic                          ║
║   │ • Emotional Timing (20): Validates before advising                          ║
║   │ • Brevity Control (15): Right length for user's energy                      ║
║   │ • Memory Use (15): References past context appropriately                    ║
║   │ • Imperfection (10): Not too polished, has personality                      ║
║   │ • Personality Consistency (15): Same voice across sessions                  ║
║   │ • Avoided AI Ticks (10): No "As an AI...", no over-enthusiasm              ║
║   │                                                                              ║
║   │ Example: Score of 84 = good human-ness, saved as training data              ║
║   └──────────────────────────────────────────────────────────────────────────   ║
║                                                                                  ║
║   8. TRAINING DATA SERVICE                    "Learning From Every Chat"         ║
║   ───────────────────────────────────────────────────────────────────────────   ║
║   │ Collects data to eventually train a local LLM that "gets" humans.            ║
║   │                                                                              ║
║   │ Collects:                                                                    ║
║   │ • Scored Conversations: What good responses look like                       ║
║   │ • Interview Insights: Learnings about how humans work                       ║
║   │ • Coach Corrections: Bad → good response pairs                              ║
║   │                                                                              ║
║   │ Example: 2000+ examples → fine-tune Mistral 7B → local LLM                  ║
║   └──────────────────────────────────────────────────────────────────────────   ║
║                                                                                  ║
╚═════════════════════════════════════════════════════════════════════════════════╝
```

---

## Creating the MoodPrint: Your Unique Profile

A **MoodPrint** is the complete picture of how YOUR mind works. It's built from all eight systems combining their understanding of you.

```
╔═════════════════════════════════════════════════════════════════════════════════╗
║                           HOW A MOODPRINT IS CREATED                             ║
╠═════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║   USER JOINS APP                                                                 ║
║         │                                                                        ║
║         ▼                                                                        ║
║   ┌───────────────────────────────────────────────────────────────────────────┐ ║
║   │                        ONBOARDING QUESTIONS                                │ ║
║   │                                                                            │ ║
║   │   "When you're learning something new, do you prefer to..."               │ ║
║   │   • See diagrams and visuals                                              │ ║
║   │   • Read explanations                                                     │ ║
║   │   • Try it hands-on                                                       │ ║
║   │                                                                            │ ║
║   │   "Can you easily picture a red apple in your mind?"                      │ ║
║   │   • Yes, vividly → Normal visualization                                   │ ║
║   │   • Somewhat → Mild aphantasia                                            │ ║
║   │   • Not at all → Aphantasia detected                                      │ ║
║   │                                                                            │ ║
║   │   "When you think, do you hear words in your head?"                       │ ║
║   │   • Yes, like a narrator → Strong inner monologue                         │ ║
║   │   • Sometimes → Partial                                                   │ ║
║   │   • No, I think in feelings/images → Non-verbal thinking                  │ ║
║   │                                                                            │ ║
║   └───────────────────────────────────────────────────────────────────────────┘ ║
║         │                                                                        ║
║         ▼                                                                        ║
║   ┌───────────────────────────────────────────────────────────────────────────┐ ║
║   │                     CONVERSATION ANALYSIS                                  │ ║
║   │                                                                            │ ║
║   │   Every message you send teaches us more:                                 │ ║
║   │                                                                            │ ║
║   │   "I've been feeling off but I can't explain it"                          │ ║
║   │   └── Delayed emotional recognition detected                              │ ║
║   │   └── May process emotions somatically (body-first)                       │ ║
║   │                                                                            │ ║
║   │   "Why should I try that? What's the logic?"                              │ ║
║   │   └── Systems thinker confirmed                                           │ ║
║   │   └── Needs "why" before "what"                                           │ ║
║   │                                                                            │ ║
║   │   "Last week was great but now I can't do anything"                       │ ║
║   │   └── Cyclical rhythm pattern detected                                    │ ║
║   │   └── May have burst/crash cycles                                         │ ║
║   │                                                                            │ ║
║   └───────────────────────────────────────────────────────────────────────────┘ ║
║         │                                                                        ║
║         ▼                                                                        ║
║   ┌───────────────────────────────────────────────────────────────────────────┐ ║
║   │                      MOODPRINT ASSEMBLED                                   │ ║
║   │                                                                            │ ║
║   │   ┌───────────────────────────────────────────────────────────────────┐   │ ║
║   │   │                    YOUR UNIQUE MOODPRINT                          │   │ ║
║   │   ├───────────────────────────────────────────────────────────────────┤   │ ║
║   │   │                                                                   │   │ ║
║   │   │   COGNITIVE PROFILE                                               │   │ ║
║   │   │   • Mode: Conceptual Systems Thinker                              │   │ ║
║   │   │   • Processing: Verbal + Analytical                               │   │ ║
║   │   │   • Needs: Explanations before suggestions                        │   │ ║
║   │   │                                                                   │   │ ║
║   │   │   NEUROLOGICAL PROFILE                                            │   │ ║
║   │   │   • Visualization: Mild aphantasia                                │   │ ║
║   │   │   • Inner Monologue: Strong (verbal thinker)                      │   │ ║
║   │   │   • ADHD Traits: Interest-based motivation                        │   │ ║
║   │   │                                                                   │   │ ║
║   │   │   RHYTHM PROFILE                                                  │   │ ║
║   │   │   • Type: Burst/Recovery cycles                                   │   │ ║
║   │   │   • Cycle: ~7-10 days                                            │   │ ║
║   │   │   • Time: More energy in evenings                                 │   │ ║
║   │   │                                                                   │   │ ║
║   │   │   COMMUNICATION PREFERENCES                                       │   │ ║
║   │   │   • Style: Validation-first, then logic                           │   │ ║
║   │   │   • Length: Brief when low energy                                 │   │ ║
║   │   │   • Tone: Warm but direct                                         │   │ ║
║   │   │                                                                   │   │ ║
║   │   │   CONNECTION HEALTH                                               │   │ ║
║   │   │   • Isolation: Mild                                               │   │ ║
║   │   │   • External Support: Has therapist                               │   │ ║
║   │   │   • Social Frequency: Occasional                                  │   │ ║
║   │   │                                                                   │   │ ║
║   │   └───────────────────────────────────────────────────────────────────┘   │ ║
║   │                                                                            │ ║
║   └───────────────────────────────────────────────────────────────────────────┘ ║
║         │                                                                        ║
║         ▼                                                                        ║
║   ┌───────────────────────────────────────────────────────────────────────────┐ ║
║   │                  MOODPRINT SHAPES EVERY RESPONSE                           │ ║
║   │                                                                            │ ║
║   │   User: "I can't focus today"                                             │ ║
║   │                                                                            │ ║
║   │   WITHOUT MoodPrint:                                                      │ ║
║   │   "Try visualizing yourself completing the task. Picture the              │ ║
║   │    satisfaction you'll feel when it's done!"                              │ ║
║   │                                                                            │ ║
║   │   WITH MoodPrint:                                                         │ ║
║   │   "Focus is hard to force. Your energy patterns suggest this might        │ ║
║   │    be a recovery day - which is part of your rhythm, not a failure.       │ ║
║   │    What's the smallest thing you could do that matters?"                  │ ║
║   │                                                                            │ ║
║   │   Why the difference:                                                     │ ║
║   │   ✓ No visualization (aphantasia)                                         │ ║
║   │   ✓ Normalized low phase (cyclical rhythm)                                │ ║
║   │   ✓ Explained the "why" (systems thinker)                                 │ ║
║   │   ✓ Brief response (low energy detected)                                  │ ║
║   │   ✓ Ended with small action (ADHD-friendly)                               │ ║
║   │                                                                            │ ║
║   └───────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                  ║
╚═════════════════════════════════════════════════════════════════════════════════╝
```

### MoodPrint Components Summary

| Component | Source | Updates | Used For |
|-----------|--------|---------|----------|
| **Cognitive Mode** | Onboarding + conversation analysis | Refined over time | Response style, explanations |
| **Neurological Profile** | Specific questions + detection | Rarely changes | Technique filtering |
| **Rhythm Pattern** | Long-term observation | Weekly updates | Timing, tone, expectations |
| **Communication Prefs** | Feedback + implicit signals | Continuous | Response length, style |
| **Connection Health** | Message analysis | Each session | Nudges, referrals |
| **Memory Context** | All conversations | Tiered updates | Continuity, references |

---

## Onboarding Flow: Building the Initial MoodPrint

The onboarding flow is a **4-stage journey** that builds the user's initial MoodPrint. Each stage gathers specific information used throughout the app.

### Complete Onboarding Journey

```
╔═════════════════════════════════════════════════════════════════════════════════╗
║                        ONBOARDING FLOW - COMPLETE JOURNEY                        ║
╠═════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────┐ ║
║   │  STAGE 1        │    │  STAGE 2        │    │  STAGE 3        │    │STAGE4│ ║
║   │  Coach          │───▶│  Cognitive      │───▶│  MoodPrint      │───▶│Guide │ ║
║   │  Personality    │    │  Onboarding     │    │  Reveal         │    │      │ ║
║   └─────────────────┘    └─────────────────┘    └─────────────────┘    └──────┘ ║
║          │                       │                      │                  │     ║
║          ▼                       ▼                      ▼                  ▼     ║
║   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────┐ ║
║   │ • Persona pick  │    │ • How you learn │    │ • "Aha, that's  │    │• App │ ║
║   │ • Chronotype    │    │ • Aphantasia    │    │   me" moment    │    │ tour │ ║
║   │ • Adaptive mode │    │ • Inner voice   │    │ • What we       │    │• Tips│ ║
║   │ • Communication │    │ • Insights      │    │   learned       │    │• FAQ │ ║
║   │   style         │    │ • Frustrations  │    │ • How AI adapts │    │      │ ║
║   └─────────────────┘    └─────────────────┘    └─────────────────┘    └──────┘ ║
║                                                                                  ║
║   TOTAL TIME: ~5 minutes (can skip any stage)                                   ║
║                                                                                  ║
╚═════════════════════════════════════════════════════════════════════════════════╝
```

### Stage 1: Coach Personality Onboarding

**File:** `app/onboarding/index.tsx`
**Service:** `services/coachPersonalityService.ts`

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       STAGE 1: COACH PERSONALITY                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   QUESTIONS ASKED:                                                               │
│   ────────────────                                                               │
│   1. "What kind of support feels most helpful to you?"                          │
│      → Determines base persona (Clover, Spark, Willow, etc.)                    │
│                                                                                  │
│   2. "When you're struggling, what do you usually need first?"                  │
│      → validation_first vs solution_first                                       │
│                                                                                  │
│   3. "What's your natural rhythm?"                                              │
│      → Chronotype: early_bird | normal | night_owl                              │
│                                                                                  │
│   4. "How do you feel about adaptive coaching?"                                 │
│      → Enable/disable adaptive mode                                             │
│                                                                                  │
│   DATA COLLECTED:                                                                │
│   ────────────────                                                               │
│   • selectedPersona: 'clover' | 'spark' | 'willow' | 'luna' | 'ridge' |        │
│                       'flint' | 'fern'                                          │
│   • chronotype: 'early_bird' | 'normal' | 'night_owl'                           │
│   • adaptiveSettings.enabled: boolean                                           │
│   • detailedSettings: warmth, directness, humor levels                          │
│                                                                                  │
│   OUTPUT → Saved to AsyncStorage as coach settings                              │
│   NEXT → /cognitive-onboarding                                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Stage 2: Cognitive Profile Onboarding

**File:** `app/cognitive-onboarding/index.tsx`
**Service:** `services/cognitiveProfileService.ts`

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     STAGE 2: COGNITIVE PROFILE DISCOVERY                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   PURPOSE: Discover HOW someone thinks, not IF they're smart                    │
│                                                                                  │
│   ADAPTIVE QUESTIONS (8-12 based on answers):                                   │
│   ─────────────────────────────────────────────                                 │
│                                                                                  │
│   CORE QUESTIONS:                                                                │
│   ───────────────                                                                │
│   Q: "When learning something new, what feels most natural?"                    │
│   Options:                                                                       │
│   • "Seeing the big picture first" → conceptual_systems                         │
│   • "Being shown clear steps" → procedural_sequential                           │
│   • "Hearing a story or example" → narrative_meaning                            │
│   • "Just trying it out" → embodied_somatic                                     │
│   • "Letting ideas connect freely" → associative_divergent                      │
│                                                                                  │
│   Q: "When someone explains something, what frustrates you most?"               │
│   → Validates/refines cognitive mode                                            │
│                                                                                  │
│   Q: "How do insights usually arrive for you?"                                  │
│   → Confirms processing style                                                   │
│                                                                                  │
│   NEUROLOGICAL DETECTION:                                                        │
│   ─────────────────────────                                                      │
│   Q: "When someone says 'picture a beach', what happens in your mind?"          │
│   Options:                                                                       │
│   • "I see it clearly, like a photo" → hyperphantasia                           │
│   • "I see a vague impression" → typical                                        │
│   • "I know what a beach is but don't see anything" → aphantasia               │
│   • "I feel/hear/sense it more than see" → multi_modal                          │
│                                                                                  │
│   Q: "Do you have a constant inner voice narrating your thoughts?"              │
│   → Detects inner monologue presence                                            │
│                                                                                  │
│   Q: "When someone says 'picture a beach', what happens?"                       │
│   • "I see it clearly, like a photo or video" → hyperphantasia                  │
│   • "I get a vague, fleeting image" → typical                                   │
│   • "I know what a beach is, but I don't see anything" → APHANTASIA            │
│   • "I feel or sense it more than see it" → multi_modal                         │
│                                                                                  │
│   ADAPTATION QUESTIONS (shown based on answers):                                │
│   ─────────────────────────────────────────────────                             │
│   • If aphantasia detected → skip visualization preference questions            │
│   • If systems thinker → ask about structure preferences                        │
│   • If highly sensitive → ask about emotional processing                        │
│                                                                                  │
│   DATA COLLECTED (All Dimensions):                                               │
│   ────────────────────────────────                                               │
│                                                                                  │
│   1. PRIMARY COGNITIVE MODE (how you process):                                   │
│      • conceptual_systems    - Big picture, patterns, why before how            │
│      • emotional_relational  - Feelings first, connection-focused               │
│      • procedural_sequential - Step-by-step, structured                         │
│      • embodied_somatic      - Body-based, learns by doing                      │
│      • associative_divergent - Makes leaps, non-linear                          │
│      • narrative_meaning     - Stories and examples                             │
│      • visual_spatial        - Thinks in images, spatial models                 │
│                                                                                  │
│   2. LEARNING STYLES (how you receive info):                                     │
│      • visual      - Diagrams, images, written text                             │
│      • auditory    - Conversation, explanation                                  │
│      • kinesthetic - Practice, movement, hands-on                               │
│      • reading     - Text, notes, written form                                  │
│      • social      - Discussion, dialogue                                       │
│      • solitary    - Alone time to process                                      │
│      (Inferred from cognitive mode + explicit questions)                        │
│                                                                                  │
│   3. NEUROLOGICAL DIFFERENCES:                                                   │
│      • mentalImagery: hyperphantasia | typical | hypophantasia | aphantasia     │
│      • innerMonologue: constant | frequent | situational | rare | none          │
│      • auditoryImagination: vivid | moderate | weak | none                      │
│                                                                                  │
│   4. EMOTIONAL PROCESSING:                                                       │
│      • feeler_first    - Emotions come first, then logic                        │
│      • thinker_first   - Logic first, emotions after                            │
│      • integrated      - Emotions and logic intertwined                         │
│      • action_oriented - Processes through doing                                │
│      • delayed         - Emotions surface later                                 │
│                                                                                  │
│   5. COMMUNICATION STYLE:                                                        │
│      • direct        - Get to the point                                         │
│      • exploratory   - Think out loud, wander                                   │
│      • reflective    - Need time, prefer writing                                │
│      • collaborative - Build understanding together                             │
│      • metaphorical  - Analogies and images                                     │
│                                                                                  │
│   6. STRUCTURE PREFERENCE:                                                       │
│      • loves_structure   - Plans, lists, clear steps                            │
│      • needs_flexibility - Goes with flow                                       │
│      • structured_start  - Structure to begin, then flows                       │
│      • emergent          - Structure emerges from doing                         │
│                                                                                  │
│   7. SOCIAL ORIENTATION:                                                         │
│      • energized_by_people - Connection is fuel                                 │
│      • drained_by_people   - Needs recovery after                               │
│      • selective           - Deep > many connections                            │
│      • situational         - Depends on context                                 │
│                                                                                  │
│   8. SENSITIVITY LEVEL:                                                          │
│      • highly_sensitive | moderate | low_sensitivity                            │
│                                                                                  │
│   OUTPUT → Stored as cognitive profile                                           │
│   NEXT → /cognitive-onboarding/reveal                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Stage 3: MoodPrint Reveal

**File:** `app/cognitive-onboarding/reveal.tsx`
**Service:** `services/cognitiveProfileService.ts`, `services/moodPrintService.ts`

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STAGE 3: MOODPRINT REVEAL                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   PURPOSE: Create "aha, that's me" recognition moment                           │
│                                                                                  │
│   SHOWS USER:                                                                    │
│   ───────────                                                                    │
│   • Summary of how their mind works                                             │
│   • What coach will/won't do based on their profile                             │
│   • Personalized adaptations                                                    │
│                                                                                  │
│   EXAMPLE OUTPUT:                                                                │
│   ───────────────                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ "You have aphantasia - your mind's eye doesn't create visual images.   │   │
│   │  This isn't a deficiency; it's a different way of thinking. You        │   │
│   │  likely excel at conceptual and abstract thinking.                     │   │
│   │                                                                         │   │
│   │  I will NEVER ask you to 'visualize' or 'picture' anything - that      │   │
│   │  simply doesn't work for you, and that's completely fine.              │   │
│   │                                                                         │   │
│   │  Instead, I'll use:                                                    │   │
│   │  • Conceptual descriptions                                             │   │
│   │  • Body-based techniques                                               │   │
│   │  • Verbal processing                                                   │   │
│   │                                                                         │   │
│   │  Your insights arrive suddenly and fully formed. I'll respect that    │   │
│   │  - I won't ask you to 'show your work' when you already know."        │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ADAPTATIONS SHOWN:                                                             │
│   ──────────────────                                                             │
│   ✓ Using metaphors and analogies                                               │
│   ✓ Showing the big picture first                                               │
│   ✗ Never using visualization techniques                                        │
│   ✓ Giving you time to process                                                  │
│                                                                                  │
│   OUTPUT → User sees their complete MoodPrint                                    │
│   NEXT → /guide                                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Stage 4: App Guide

**File:** `app/guide/index.tsx`

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STAGE 4: APP GUIDE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   PURPOSE: Quick tour of app features                                           │
│                                                                                  │
│   COVERS:                                                                        │
│   ───────                                                                        │
│   • The Tree (visual journal representation)                                    │
│   • The Coach (AI conversations)                                                │
│   • Fireflies (gentle insights)                                                 │
│   • Twigs (quick logs)                                                          │
│   • Skills (grounding techniques)                                               │
│   • Privacy (all data on device)                                                │
│                                                                                  │
│   OUTPUT → User understands app features                                         │
│   NEXT → /(tabs) - Main app                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Onboarding Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ONBOARDING DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   USER ANSWERS                                                                   │
│        │                                                                         │
│        ▼                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    STAGE 1: Coach Personality                           │   │
│   │   "What kind of support feels helpful?"  ──▶  selectedPersona           │   │
│   │   "What's your natural rhythm?"          ──▶  chronotype                │   │
│   │   "How do you feel about adaptive?"      ──▶  adaptiveSettings         │   │
│   └───────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                              │
│                                   ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                   STAGE 2: Cognitive Onboarding                         │   │
│   │   "How do you learn best?"               ──▶  primaryCognitiveMode      │   │
│   │   "Picture a beach - what happens?"      ──▶  mentalImagery            │   │
│   │   "Do you have inner voice?"             ──▶  innerMonologue           │   │
│   │   "What frustrates you?"                 ──▶  communicationStyle       │   │
│   └───────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                              │
│                                   ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      MOODPRINT ASSEMBLED                                │   │
│   │                                                                          │   │
│   │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│   │   │ Coach Settings  │  │ Cognitive       │  │ Neurological    │        │   │
│   │   │ • persona       │  │ Profile         │  │ Profile         │        │   │
│   │   │ • chronotype    │  │ • mode          │  │ • mentalImagery │        │   │
│   │   │ • adaptive      │  │ • processing    │  │ • innerMonologue│        │   │
│   │   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │   │
│   │            │                    │                    │                  │   │
│   │            └────────────────────┼────────────────────┘                  │   │
│   │                                 │                                        │   │
│   │                                 ▼                                        │   │
│   │                    ┌────────────────────────┐                           │   │
│   │                    │     MoodPrint          │                           │   │
│   │                    │  (Complete Profile)    │                           │   │
│   │                    └────────────────────────┘                           │   │
│   │                                 │                                        │   │
│   │                                 ▼                                        │   │
│   │                    ┌────────────────────────┐                           │   │
│   │                    │   Coach Adaptations    │                           │   │
│   │                    │   (Response Rules)     │                           │   │
│   │                    └────────────────────────┘                           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Files Involved in Onboarding

| Stage | File | Service | Storage Key |
|-------|------|---------|-------------|
| 1 | `app/onboarding/index.tsx` | `coachPersonalityService.ts` | `moodleaf_coach_settings` |
| 2 | `app/cognitive-onboarding/index.tsx` | `cognitiveProfileService.ts` | `moodleaf_cognitive_profile` |
| 3 | `app/cognitive-onboarding/reveal.tsx` | `cognitiveProfileService.ts`, `moodPrintService.ts` | Reads existing |
| 4 | `app/guide/index.tsx` | None | None |

### Skipping Onboarding

Users can skip at any stage:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             SKIP BEHAVIOR                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Skip at Stage 1:                                                               │
│   • Uses default persona (Clover)                                               │
│   • Uses default chronotype (normal)                                            │
│   • Adaptive mode enabled                                                        │
│   • Goes to Stage 2                                                              │
│                                                                                  │
│   Skip at Stage 2:                                                               │
│   • Uses neutral cognitive profile                                              │
│   • No aphantasia/inner monologue detection                                     │
│   • System learns from conversations instead                                    │
│   • Goes to Stage 3 (reveal shows what little we know)                          │
│                                                                                  │
│   Skip at Stage 3:                                                               │
│   • Just skips the reveal                                                        │
│   • Goes directly to Stage 4 (guide)                                            │
│                                                                                  │
│   Skip at Stage 4:                                                               │
│   • Goes directly to main app                                                   │
│                                                                                  │
│   RECOVERY: User can always redo onboarding via Settings → "Redo Onboarding"   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### How Onboarding Data is Used

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       HOW ONBOARDING DATA SHAPES THE APP                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   COLLECTED                           USED FOR                                   │
│   ─────────────────────────────────────────────────────────────────────────     │
│                                                                                  │
│   selectedPersona: 'willow'      ──▶  Coach tone, greeting style, emoji use    │
│                                                                                  │
│   chronotype: 'night_owl'        ──▶  Energy modulation (gentle morning,       │
│                                        more energy at night)                    │
│                                                                                  │
│   mentalImagery: 'aphantasia'    ──▶  HARD CONSTRAINT: Never use               │
│                                        "visualize", "picture", "imagine seeing" │
│                                        Use conceptual/body-based instead        │
│                                                                                  │
│   innerMonologue: 'absent'       ──▶  HARD CONSTRAINT: Never ask               │
│                                        "what is your inner voice saying"        │
│                                        Use feelings/sensations instead          │
│                                                                                  │
│   primaryCognitiveMode:          ──▶  Response structure:                       │
│   'conceptual_systems'                • Show big picture first                  │
│                                        • Explain the "why" before the "how"     │
│                                        • Use systems metaphors                  │
│                                                                                  │
│   emotionalProcessing:           ──▶  Validation timing:                        │
│   'feeler_first'                      • Always validate feelings FIRST          │
│                                        • Wait for cue before solutions          │
│                                                                                  │
│   sensitivityLevel:              ──▶  Tone calibration:                         │
│   'highly_sensitive'                  • Gentler language                        │
│                                        • Slower pacing                          │
│                                        • More validation                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Complete Data Funnel: Everything That Feeds Into Chat

Every AI response is shaped by **14 data sources** assembled into context. Here's the complete funnel:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE DATA FUNNEL INTO AI CHAT                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   USER SENDS MESSAGE                                                             │
│         │                                                                        │
│         ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    CONTEXT ASSEMBLY (14 Sources)                        │   │
│   │                                                                          │   │
│   │   1. COGNITIVE PROFILE (cognitiveProfileService.ts)                     │   │
│   │      • Primary cognitive mode (how they think)                          │   │
│   │      • Learning styles (visual, auditory, kinesthetic, etc.)            │   │
│   │      • Communication style (direct, reflective, exploratory)            │   │
│   │      • Emotional processing (feeler_first, thinker_first)               │   │
│   │      • Structure preference (loves_structure, needs_flexibility)        │   │
│   │      • Social orientation (energized_by_people, drained_by_people)      │   │
│   │      • Sensitivity level (highly_sensitive, moderate, low)              │   │
│   │      • NEUROLOGICAL: aphantasia, inner monologue, auditory imagination  │   │
│   │                                                                          │   │
│   │   2. SOCIAL CONNECTION HEALTH (socialConnectionHealthService.ts)        │   │
│   │      • Isolation risk score                                             │   │
│   │      • Connection quality metrics                                       │   │
│   │      • Recent social interactions                                       │   │
│   │      • Referral triggers (when to suggest professional help)            │   │
│   │                                                                          │   │
│   │   3. MEMORY TIERS (memoryService.ts)                                    │   │
│   │      • Short-term: Current session topics, mood, energy                 │   │
│   │      • Mid-term: This week's themes, people mentioned                   │   │
│   │      • Long-term: Core facts, relationships, life events                │   │
│   │                                                                          │   │
│   │   4. LIFE CONTEXT (lifeContextService.ts)                               │   │
│   │      • Lifetime overview (people, events, themes)                       │   │
│   │      • Relationship map (family, friends, work)                         │   │
│   │      • Major life events timeline                                       │   │
│   │                                                                          │   │
│   │   5. PSYCHOLOGICAL PROFILE (psychAnalysisService.ts)                    │   │
│   │      • Cognitive patterns                                               │   │
│   │      • Attachment style                                                 │   │
│   │      • Values and beliefs                                               │   │
│   │      • Defense mechanisms                                               │   │
│   │                                                                          │   │
│   │   6. CHRONOTYPE & TRAVEL (coachPersonalityService.ts)                   │   │
│   │      • Natural rhythm (early_bird, normal, night_owl)                   │   │
│   │      • Current time of day → energy modulation                          │   │
│   │      • Travel/jet lag awareness                                         │   │
│   │                                                                          │   │
│   │   7. CALENDAR EVENTS (calendarService.ts)                               │   │
│   │      • Upcoming meetings, deadlines                                     │   │
│   │      • Travel plans                                                     │   │
│   │      • Important dates                                                  │   │
│   │                                                                          │   │
│   │   8. HEALTH DATA (healthKitService.ts)                                  │   │
│   │      • Heart rate patterns                                              │   │
│   │      • Sleep quality                                                    │   │
│   │      • Activity levels                                                  │   │
│   │      • Step counts                                                      │   │
│   │                                                                          │   │
│   │   9. HEALTH CORRELATIONS (healthInsightService.ts)                      │   │
│   │      • Mood-sleep correlations                                          │   │
│   │      • Activity-mood correlations                                       │   │
│   │      • Pattern insights                                                 │   │
│   │                                                                          │   │
│   │   10. TRACKING LOGS (quickLogsService.ts)                               │   │
│   │       • Exercise logs (with exact counts)                               │   │
│   │       • Habit tracking                                                  │   │
│   │       • Medication tracking                                             │   │
│   │       • Custom twig logs                                                │   │
│   │                                                                          │   │
│   │   11. LIFESTYLE FACTORS (patternService.ts)                             │   │
│   │       • Caffeine intake                                                 │   │
│   │       • Alcohol consumption                                             │   │
│   │       • Outdoor time                                                    │   │
│   │       • Social time                                                     │   │
│   │                                                                          │   │
│   │   12. EXPOSURE PROGRESS (exposureLadderService.ts)                      │   │
│   │       • Social anxiety ladder progress                                  │   │
│   │       • Completed exposure steps                                        │   │
│   │       • Current challenge level                                         │   │
│   │                                                                          │   │
│   │   13. JOURNAL ENTRIES (journalStorage.ts)                               │   │
│   │       • Recent entries (last 7 days)                                    │   │
│   │       • Entry themes and emotions                                       │   │
│   │       • What user actually wrote                                        │   │
│   │                                                                          │   │
│   │   14. USER PREFERENCES (userContextService.ts)                          │   │
│   │       • Mood trends                                                     │   │
│   │       • Preference settings                                             │   │
│   │       • Conversation history                                            │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                        │
│         ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    COACH PERSONALITY LAYER                              │   │
│   │                                                                          │   │
│   │   • Active persona (Clover, Spark, Willow, etc.)                        │   │
│   │   • Time-of-day energy modulation                                       │   │
│   │   • Mood-based persona switching (if adaptive mode on)                  │   │
│   │   • Tone preferences (warm, direct, playful)                            │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                        │
│         ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    COACH MODE ADDITIONS                                 │   │
│   │                                                                          │   │
│   │   • Active skill mode (if coaching specific skill)                      │   │
│   │   • Technique-specific instructions                                     │   │
│   │   • Session goals                                                       │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                        │
│         ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    CONVERSATION CONTROLLER                              │   │
│   │                                                                          │   │
│   │   • Human-ness scoring directives                                       │   │
│   │   • Response style modifiers                                            │   │
│   │   • Anti-pattern detection                                              │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                        │
│         ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    CLAUDE API CALL                                      │   │
│   │                                                                          │   │
│   │   System Prompt = Identity + Context + Directives                       │   │
│   │   Messages = Conversation history + Current message                     │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                        │
│         ▼                                                                        │
│   AI RESPONSE (shaped by all 14 data sources)                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Service Files for Each Data Source

| # | Data Source | Service File | Function Called |
|---|-------------|--------------|-----------------|
| 1 | Cognitive Profile | `cognitiveProfileService.ts` | `getCognitiveProfileContextForLLM()` |
| 2 | Social Connection | `socialConnectionHealthService.ts` | `getConnectionContextForLLM()` |
| 3 | Memory Tiers | `memoryService.ts` | `getMemoryContextForLLM()` |
| 4 | Life Context | `lifeContextService.ts` | `getLifeContextForClaude()` |
| 5 | Psych Profile | `psychAnalysisService.ts` | `getCompressedContext()` |
| 6 | Chronotype | `coachPersonalityService.ts` | `getChronotypeContextForClaude()` |
| 7 | Calendar | `calendarService.ts` | `getCalendarContextForClaude()` |
| 8 | Health Data | `healthKitService.ts` | `getHealthContextForClaude()` |
| 9 | Correlations | `healthInsightService.ts` | `getCorrelationSummaryForClaude()` |
| 10 | Tracking Logs | `quickLogsService.ts` | `getDetailedLogsContextForClaude()` |
| 11 | Lifestyle | `patternService.ts` | `getLifestyleFactorsContextForClaude()` |
| 12 | Exposure | `exposureLadderService.ts` | `getExposureContextForClaude()` |
| 13 | Journals | `journalStorage.ts` | `getRecentJournalContextForClaude()` |
| 14 | Preferences | `userContextService.ts` | `getContextForClaude()` |

### Context Assembly Order

The context is assembled in this specific order (most important first):

```typescript
// In claudeAPIService.ts
const contextParts = [
  cognitiveProfileContext,   // 1. How they think (shapes everything)
  socialConnectionContext,   // 2. Connection health (isolation awareness)
  memoryContext,             // 3. What we know about them
  lifeContext,               // 4. Lifetime overview
  psychContext,              // 5. Psychological profile
  chronotypeContext,         // 6. Time/rhythm awareness
  calendarContext,           // 7. Upcoming events
  healthContext,             // 8. Body data
  correlationContext,        // 9. Health-mood patterns
  logsContext,               // 10. Detailed tracking
  lifestyleContext,          // 11. Lifestyle factors
  exposureContext,           // 12. Exposure progress
  journalContext,            // 13. Recent writings
  richContext,               // 14. Preferences & trends
  conversationContext        // Current conversation
];
```

---

## Table of Contents
1. [Introduction: What Makes Mood Leaf Unique](#introduction-what-makes-mood-leaf-unique)
2. [The Systems That Power Mood Leaf](#the-systems-that-power-mood-leaf)
3. [Creating the MoodPrint](#creating-the-moodprint-your-unique-profile)
4. [Onboarding Flow: Building the Initial MoodPrint](#onboarding-flow-building-the-initial-moodprint)
5. [Complete Data Funnel: Everything That Feeds Into Chat](#complete-data-funnel-everything-that-feeds-into-chat)
6. [System Overview](#system-overview)
7. [Current State (NOW)](#current-state-now)
8. [Future State (GOAL)](#future-state-goal)
9. [Roadmap: How We Get There](#roadmap-how-we-get-there)
10. [Service Interconnections](#service-interconnections)
11. [User Message Flow](#user-message-flow)
12. [Learning & Adaptation Flow](#learning--adaptation-flow)
13. [LLM Input/Output](#llm-inputoutput)
14. [Data Flow Diagram](#data-flow-diagram)
15. [Training Pipeline](#training-pipeline)
16. [What Training Data Trains](#what-training-data-trains)

---

**Last Updated:** January 2025
**Document Version:** 1.1
**Status:** Living Document - Update regularly as milestones are reached

---

## System Overview

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              MOOD LEAF SYSTEM                                  ║
║                                                                                ║
║   "A coaching app that learns how humans work and adapts to each mind"        ║
║                                                                                ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        ║
║   │   USER LAYER    │     │  INTELLIGENCE   │     │    AI LAYER     │        ║
║   │                 │     │     LAYER       │     │                 │        ║
║   │ • UI Components │────▶│ • Services      │────▶│ • Claude API    │        ║
║   │ • Onboarding    │     │ • Kernel        │     │ • Local Scorer  │        ║
║   │ • Journal       │◀────│ • Memory        │◀────│ • (Future LLM)  │        ║
║   │ • Coach Chat    │     │ • Profiles      │     │                 │        ║
║   └─────────────────┘     └─────────────────┘     └─────────────────┘        ║
║                                                                                ║
║                           ┌─────────────────┐                                 ║
║                           │  LEARNING LOOP  │                                 ║
║                           │                 │                                 ║
║                           │ Every interaction                                 │
║                           │ improves the next                                 │
║                           └─────────────────┘                                 ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Current State (NOW)

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                           CURRENT ARCHITECTURE                               ║
║                              (January 2025)                                  ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   USER DEVICE                                           CLOUD                ║
║   ═══════════                                           ═════                ║
║                                                                              ║
║   ┌──────────────────────────────────────────┐    ┌────────────────────┐   ║
║   │                                          │    │                    │   ║
║   │   📱 React Native App                    │    │   🤖 CLAUDE API    │   ║
║   │                                          │    │                    │   ║
║   │   ┌────────────────────────────────┐    │    │   • Conversations  │   ║
║   │   │        Core Principle          │    │    │   • Scoring        │   ║
║   │   │           Kernel               │    │    │   • Compression    │   ║
║   │   │     (The Constitution)         │    │    │                    │   ║
║   │   └────────────────────────────────┘    │    │   100% of AI work  │   ║
║   │              │                          │    │   happens here     │   ║
║   │   ┌──────────┼──────────┐              │    │                    │   ║
║   │   ▼          ▼          ▼              │───▶│                    │   ║
║   │ ┌─────┐  ┌─────────┐  ┌─────────┐     │    │                    │   ║
║   │ │Cog  │  │Neuro    │  │Social   │     │◀───│                    │   ║
║   │ │Profi│  │Diff     │  │Connect  │     │    │                    │   ║
║   │ │Service│ │Service │  │Health   │     │    └────────────────────┘   ║
║   │ └─────┘  └─────────┘  └─────────┘     │                              ║
║   │                                        │                              ║
║   │   ┌────────────────────────────────┐  │                              ║
║   │   │        LOCAL STORAGE           │  │                              ║
║   │   │                                │  │                              ║
║   │   │  • Cognitive Profile           │  │                              ║
║   │   │  • Memory Tiers (all data)     │  │                              ║
║   │   │  • Scored Conversations        │  │                              ║
║   │   │  • Interview Insights          │  │                              ║
║   │   │  • Connection Health           │  │                              ║
║   │   └────────────────────────────────┘  │                              ║
║   │                                        │                              ║
║   └──────────────────────────────────────────┘                              ║
║                                                                              ║
║   CURRENT FLOW:                                                             ║
║   User message ──▶ Local context assembly ──▶ Claude API ──▶ Response      ║
║                                                    │                        ║
║                                                    ▼                        ║
║                                               Score saved                   ║
║                                            (training data)                  ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

**What Works Now:**
- ✅ Cognitive profile onboarding
- ✅ Neurological differences detection
- ✅ Core Principle Kernel (constitutional constraints)
- ✅ Social connection health monitoring
- ✅ Human-ness scoring (local + Claude)
- ✅ Memory tiers (all local)
- ✅ Training data collection

**Dependencies on Claude:**
- 🔴 ALL conversations
- 🔴 Response quality scoring
- 🔴 Memory compression
- 🔴 Crisis detection

---

## Future State (GOAL)

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                           TARGET ARCHITECTURE                                ║
║                           (After Phase 5)                                    ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   USER DEVICE                      PRIVATE SERVER           CLOUD            ║
║   ═══════════                      ══════════════           ═════            ║
║                                                                              ║
║   ┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐   ║
║   │                  │    │                    │    │                  │   ║
║   │  📱 React Native │    │  🖥️ LOCAL LLM     │    │  🤖 CLAUDE API   │   ║
║   │                  │    │                    │    │                  │   ║
║   │  ┌────────────┐ │    │  Mistral 7B        │    │  Specialist      │   ║
║   │  │ Local      │ │    │  Fine-tuned on:    │    │  Use Only:       │   ║
║   │  │ Scorer     │ │    │  • Our data        │    │                  │   ║
║   │  │ (On Device)│ │    │  • Interviews      │    │  • Crisis        │   ║
║   │  └────────────┘ │    │  • Corrections     │    │  • Novel cases   │   ║
║   │                  │    │                    │    │  • Complex       │   ║
║   │  ┌────────────┐ │    │  Handles 90% of    │    │  • Training      │   ║
║   │  │ Principle  │ │    │  conversations     │    │    generation    │   ║
║   │  │ Kernel     │ │    │                    │    │                  │   ║
║   │  │ Checks     │ │    │                    │    │  5-10% of        │   ║
║   │  └────────────┘ │    │                    │    │  API calls       │   ║
║   │                  │    │                    │    │                  │   ║
║   └────────┬─────────┘    └─────────┬──────────┘    └────────┬─────────┘   ║
║            │                        │                        │              ║
║            │         ┌──────────────┼──────────────┐         │              ║
║            │         │              │              │         │              ║
║            ▼         ▼              ▼              ▼         ▼              ║
║   ┌──────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                      │ ║
║   │                          DECISION ROUTER                             │ ║
║   │                                                                      │ ║
║   │   User Message                                                       │ ║
║   │        │                                                             │ ║
║   │        ▼                                                             │ ║
║   │   ┌─────────────┐                                                   │ ║
║   │   │ Crisis?     │───Yes──▶ Claude                                   │ ║
║   │   └──────┬──────┘                                                   │ ║
║   │          │ No                                                        │ ║
║   │          ▼                                                           │ ║
║   │   ┌─────────────┐                                                   │ ║
║   │   │ Novel case? │───Yes──▶ Claude                                   │ ║
║   │   └──────┬──────┘                                                   │ ║
║   │          │ No                                                        │ ║
║   │          ▼                                                           │ ║
║   │   ┌─────────────┐                                                   │ ║
║   │   │ Confident?  │───No───▶ Claude                                   │ ║
║   │   └──────┬──────┘                                                   │ ║
║   │          │ Yes                                                       │ ║
║   │          ▼                                                           │ ║
║   │     LOCAL LLM ──▶ Local Scorer ──▶ Kernel Check ──▶ Response        │ ║
║   │                                                                      │ ║
║   └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

**What Changes:**
- 🟢 90% of conversations handled by local LLM
- 🟢 Local scorer runs on device
- 🟢 Claude only for specialist cases
- 🟢 90% cost reduction
- 🟢 Faster responses
- 🟢 Works offline (basic)

---

## Roadmap: How We Get There

This is the living roadmap from NOW to GOAL. Update this section as milestones are reached.

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                          ROADMAP OVERVIEW                                    ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   NOW                                                                        ║
║    │                                                                         ║
║    │  ┌─────────────────────────────────────────────────────────────────┐   ║
║    ├──│ MILESTONE 1: Foundation Services              ✅ COMPLETE       │   ║
║    │  │ • Core Principle Kernel                                         │   ║
║    │  │ • Cognitive Profile Service                                     │   ║
║    │  │ • Neurological Differences Service                              │   ║
║    │  │ • Social Connection Health Service                              │   ║
║    │  │ • Human Score Service                                           │   ║
║    │  │ • Memory Tier Service                                           │   ║
║    │  └─────────────────────────────────────────────────────────────────┘   ║
║    │                                                                         ║
║    │  ┌─────────────────────────────────────────────────────────────────┐   ║
║    ├──│ MILESTONE 2: Training Infrastructure          ✅ COMPLETE       │   ║
║    │  │ • Training Data Service (interview insights, corrections)       │   ║
║    │  │ • Training Admin UI (import, dashboard, export)                 │   ║
║    │  │ • Human-ness scoring (local + Claude background)               │   ║
║    │  │ • Documentation (TRAINING_MODULE.md, MoodLeafFlow.md)           │   ║
║    │  └─────────────────────────────────────────────────────────────────┘   ║
║    │                                                                         ║
║    │  ┌─────────────────────────────────────────────────────────────────┐   ║
║    ├──│ MILESTONE 3: Data Collection Phase            🔄 IN PROGRESS    │   ║
║    │  │ Requirements:                                                   │   ║
║    │  │   □ 500+ Claude-scored conversations                            │   ║
║    │  │   □ 20+ approved interview insights                             │   ║
║    │  │   □ 10+ cognitive profile variations                            │   ║
║    │  │                                                                 │   ║
║    │  │ What needs to happen:                                           │   ║
║    │  │   • Deploy app to beta users                                    │   ║
║    │  │   • Conduct user interviews → import insights                   │   ║
║    │  │   • Collect and score real conversations                        │   ║
║    │  │   • Validate scoring consistency                                │   ║
║    │  └─────────────────────────────────────────────────────────────────┘   ║
║    │                                                                         ║
║    │  ┌─────────────────────────────────────────────────────────────────┐   ║
║    ├──│ MILESTONE 4: Local Scorer Training            ⬜ PENDING        │   ║
║    │  │ Requirements:                                                   │   ║
║    │  │   □ Complete Milestone 3                                        │   ║
║    │  │   □ Export training data as JSON/JSONL                          │   ║
║    │  │   □ Train DistilBERT/Custom classifier                          │   ║
║    │  │   □ Achieve 85%+ correlation with Claude scores                 │   ║
║    │  │                                                                 │   ║
║    │  │ What needs to happen:                                           │   ║
║    │  │   • Set up ML training environment (Python/PyTorch)             │   ║
║    │  │   • Design scorer architecture (input: msg+response+profile)    │   ║
║    │  │   • Train and validate model                                    │   ║
║    │  │   • Export to CoreML (iOS) / ONNX (cross-platform)              │   ║
║    │  │   • Integrate on-device scorer                                  │   ║
║    │  └─────────────────────────────────────────────────────────────────┘   ║
║    │                                                                         ║
║    │  ┌─────────────────────────────────────────────────────────────────┐   ║
║    ├──│ MILESTONE 5: Response Ranking System          ⬜ PENDING        │   ║
║    │  │ Requirements:                                                   │   ║
║    │  │   □ Complete Milestone 4 (local scorer working)                 │   ║
║    │  │   □ 1000+ Claude-scored conversations                           │   ║
║    │  │                                                                 │   ║
║    │  │ What needs to happen:                                           │   ║
║    │  │   • Generate multiple response candidates                       │   ║
║    │  │   • Score each with local scorer                                │   ║
║    │  │   • Select highest-scoring response                             │   ║
║    │  │   • Validate selection quality vs Claude-only                   │   ║
║    │  └─────────────────────────────────────────────────────────────────┘   ║
║    │                                                                         ║
║    │  ┌─────────────────────────────────────────────────────────────────┐   ║
║    ├──│ MILESTONE 6: Local LLM Fine-tuning            ⬜ PENDING        │   ║
║    │  │ Requirements:                                                   │   ║
║    │  │   □ 2000+ Claude-scored conversations                           │   ║
║    │  │   □ 50+ approved interview insights                             │   ║
║    │  │   □ 100+ coach corrections (bad→good pairs)                     │   ║
║    │  │                                                                 │   ║
║    │  │ What needs to happen:                                           │   ║
║    │  │   • Select base model (Mistral 7B recommended)                  │   ║
║    │  │   • Prepare training dataset (JSONL format)                     │   ║
║    │  │   • Run SFT (Supervised Fine-Tuning) on high-scoring examples   │   ║
║    │  │   • Run DPO (Direct Preference Optimization) on correction pairs │   ║
║    │  │   • Evaluate model quality vs Claude                            │   ║
║    │  │   • Deploy to private server                                    │   ║
║    │  └─────────────────────────────────────────────────────────────────┘   ║
║    │                                                                         ║
║    │  ┌─────────────────────────────────────────────────────────────────┐   ║
║    └──│ MILESTONE 7: Claude as Specialist             ⬜ GOAL           │   ║
║       │                                                                 │   ║
║       │ Final state:                                                    │   ║
║       │   • Local LLM handles 90% of conversations                      │   ║
║       │   • Local scorer validates every response                       │   ║
║       │   • Claude only called for:                                     │   ║
║       │     - Crisis situations                                         │   ║
║       │     - Novel/unusual cases                                       │   ║
║       │     - Low-confidence local responses                            │   ║
║       │     - Training data generation                                  │   ║
║       │                                                                 │   ║
║       │ Success metrics:                                                │   ║
║       │   • 90%+ user satisfaction with local LLM                       │   ║
║       │   • 90%+ cost reduction vs Claude-only                          │   ║
║       │   • <2s average response time                                   │   ║
║       │   • Zero safety incidents                                       │   ║
║       └─────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║   GOAL                                                                       ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

### Current Milestone Details

**Where We Are: Milestone 3 (Data Collection)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MILESTONE 3 STATUS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DATA COLLECTION TARGETS:                                                   │
│                                                                              │
│   Claude-Scored Conversations                                                │
│   ┌────────────────────────────────────────────┐                            │
│   │ Current: ???     Target: 500               │ ░░░░░░░░░░░░░░░░░░░░       │
│   │ Check: Admin Panel → Training → Dashboard  │                            │
│   └────────────────────────────────────────────┘                            │
│                                                                              │
│   Approved Interview Insights                                                │
│   ┌────────────────────────────────────────────┐                            │
│   │ Current: ???     Target: 20                │ ░░░░░░░░░░░░░░░░░░░░       │
│   │ Check: Admin Panel → Training → Insights   │                            │
│   └────────────────────────────────────────────┘                            │
│                                                                              │
│   Unique Cognitive Profiles                                                  │
│   ┌────────────────────────────────────────────┐                            │
│   │ Current: ???     Target: 10                │ ░░░░░░░░░░░░░░░░░░░░       │
│   │ Check: From unique users with diverse modes │                            │
│   └────────────────────────────────────────────┘                            │
│                                                                              │
│   IMMEDIATE NEXT ACTIONS:                                                    │
│                                                                              │
│   1. □ Deploy web/mobile app for beta testing                               │
│   2. □ Recruit 10-20 beta users with diverse backgrounds                    │
│   3. □ Conduct user interviews (30-60 min each)                             │
│   4. □ Import interview insights via Admin Panel                            │
│   5. □ Enable conversation scoring in production                            │
│   6. □ Monitor Training Dashboard for progress                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase Progression Map

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                     PHASE PROGRESSION                                        ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   PHASE 1                PHASE 2              PHASE 3              PHASE 4   ║
║   Data Collection        Local Scorer         Response Ranking     Local LLM ║
║                                                                              ║
║   ┌──────────┐          ┌──────────┐         ┌──────────┐         ┌────────┐║
║   │          │          │          │         │          │         │        │║
║   │  Claude  │──scores──▶ Training │──trains─▶  Local   │──used───▶  Fine- │║
║   │  scores  │          │  data    │         │  scorer  │   by    │  tuned │║
║   │  every   │          │  export  │         │  model   │         │  LLM   │║
║   │  convo   │          │          │         │          │         │        │║
║   │          │          │          │         │          │         │        │║
║   └──────────┘          └──────────┘         └──────────┘         └────────┘║
║        │                                           │                    │    ║
║        │                                           │                    │    ║
║        ▼                                           ▼                    ▼    ║
║   ┌──────────┐                              ┌──────────┐         ┌────────┐ ║
║   │Interview │                              │ Ranking  │         │ Claude │ ║
║   │ insights │                              │ selects  │         │   as   │ ║
║   │ imported │                              │  best    │         │special-│ ║
║   │          │                              │ response │         │  ist   │ ║
║   └──────────┘                              └──────────┘         └────────┘ ║
║                                                                              ║
║   NOW ════════════════════════════════════════════════════════════▶ GOAL    ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

### Tech Stack Evolution

| Phase | AI Stack | Cost per Conversation | Latency |
|-------|----------|----------------------|---------|
| **Now (Phase 1)** | Claude API only | ~$0.005 | 2-4s |
| Phase 2 | Claude + Local Scorer | ~$0.005 | 2-4s |
| Phase 3 | Claude + Ranking | ~$0.010 (2x candidates) | 3-5s |
| **Goal (Phase 4)** | Local LLM + Claude specialist | ~$0.0005 | <2s |

### Interview Data Collection Guide

To reach the training data goals, conduct interviews and import insights:

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                   INTERVIEW → INSIGHT FLOW                                   ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   1. CONDUCT INTERVIEW                                                       ║
║   ────────────────────                                                       ║
║   • 30-60 min call with beta user                                           ║
║   • Record with consent (or take detailed notes)                            ║
║   • Ask about:                                                              ║
║     - How they experience emotions                                          ║
║     - What helps when they're struggling                                    ║
║     - How they prefer to be talked to                                       ║
║     - Their cognitive patterns (visual thinker? verbal?)                    ║
║     - Their energy rhythms (morning person? burst/crash?)                   ║
║                                                                              ║
║   2. EXTRACT INSIGHTS                                                        ║
║   ──────────────────                                                         ║
║   • Listen/read through the interview                                       ║
║   • Identify patterns that apply beyond this one person                     ║
║   • Note direct quotes that capture the insight                             ║
║   • Determine coaching implications                                         ║
║                                                                              ║
║   3. IMPORT VIA ADMIN PANEL                                                  ║
║   ─────────────────────────                                                  ║
║   • Go to Admin → Training → Import                                         ║
║   • Fill out insight form:                                                  ║
║     - Category (cognitive, emotional, communication, etc.)                  ║
║     - Title (short summary)                                                 ║
║     - Insight (the learning)                                                ║
║     - Direct quotes (evidence)                                              ║
║     - Coaching implications (how coach should adapt)                        ║
║     - Confidence level (hypothesis → observed → validated)                  ║
║                                                                              ║
║   4. REVIEW & APPROVE                                                        ║
║   ───────────────────                                                        ║
║   • Insights start as "pending"                                             ║
║   • Review in Insights tab                                                  ║
║   • Approve high-quality, generalizable insights                            ║
║   • Reject duplicates or too-specific insights                              ║
║                                                                              ║
║   5. INSIGHTS IMPROVE COACHING                                               ║
║   ────────────────────────────                                               ║
║   • Approved insights inform:                                               ║
║     - Core Principle Kernel (new constraints/principles)                    ║
║     - Training data for local LLM                                           ║
║     - Response generation guidelines                                        ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

## Service Interconnections

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                        SERVICE DEPENDENCY MAP                                ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║                    ┌────────────────────────────────┐                       ║
║                    │     corePrincipleKernel.ts     │                       ║
║                    │       (THE CONSTITUTION)        │                       ║
║                    │                                 │                       ║
║                    │  • Core Beliefs (17)            │                       ║
║                    │  • Hard Constraints (12)        │                       ║
║                    │  • Soft Principles (9)          │                       ║
║                    │                                 │                       ║
║                    └───────────────┬─────────────────┘                       ║
║                                    │                                         ║
║              EVERY SERVICE CHECKS AGAINST THE KERNEL                        ║
║                                    │                                         ║
║         ┌─────────────────────────┼─────────────────────────┐               ║
║         │                         │                         │               ║
║         ▼                         ▼                         ▼               ║
║ ┌───────────────┐      ┌─────────────────┐      ┌─────────────────┐        ║
║ │ claudeAPI     │      │ conversation    │      │ socialConnection│        ║
║ │ Service       │◀────▶│ Controller      │◀────▶│ HealthService   │        ║
║ │               │      │                 │      │                 │        ║
║ │ • Build       │      │ • Directives    │      │ • Isolation     │        ║
║ │   system      │      │ • Timing        │      │   detection     │        ║
║ │   prompts     │      │ • Validation    │      │ • Nudges        │        ║
║ │ • Send to API │      │ • Scoring       │      │ • Resources     │        ║
║ └───────┬───────┘      └────────┬────────┘      └────────┬────────┘        ║
║         │                       │                        │                  ║
║         │              ┌────────┴────────┐               │                  ║
║         │              │                 │               │                  ║
║         ▼              ▼                 ▼               ▼                  ║
║ ┌───────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐      ║
║ │ humanScore    │ │ cognitive   │ │ neuro       │ │ trainingData    │      ║
║ │ Service       │ │ Profile     │ │ Differences │ │ Service         │      ║
║ │               │ │ Service     │ │ Service     │ │                 │      ║
║ │ • Score       │ │             │ │             │ │ • Insights      │      ║
║ │   responses   │ │ • Profile   │ │ • Aphantasia│ │ • Corrections   │      ║
║ │ • Collect     │ │ • Rhythms   │ │ • Inner     │ │ • Export        │      ║
║ │   training    │ │ • Modes     │ │   monologue │ │                 │      ║
║ │   data        │ │ • Onboard   │ │ • Detection │ │                 │      ║
║ └───────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘      ║
║         │                 │               │               │                 ║
║         │                 │               │               │                 ║
║         └─────────────────┴───────────────┴───────────────┘                 ║
║                                   │                                         ║
║                                   ▼                                         ║
║                    ┌────────────────────────────────┐                       ║
║                    │       memoryTierService.ts     │                       ║
║                    │                                │                       ║
║                    │  Short-term │ Mid-term │ Long  │                       ║
║                    │  (session)  │ (weekly) │ (core)│                       ║
║                    │                                │                       ║
║                    │     ALL DATA STORED LOCALLY    │                       ║
║                    └────────────────────────────────┘                       ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

### Service Communication Table

| Service A | Talks To | What It Gets |
|-----------|----------|--------------|
| claudeAPIService | cognitiveProfileService | Profile context for prompts |
| claudeAPIService | neurologicalDifferencesService | Neuro constraints |
| claudeAPIService | socialConnectionHealthService | Connection context |
| claudeAPIService | corePrincipleKernel | Principle context |
| conversationController | All profile services | Response directives |
| conversationController | humanScoreService | Quality scoring |
| conversationController | corePrincipleKernel | Constraint validation |
| socialConnectionHealthService | corePrincipleKernel | Connection constraints |
| trainingDataService | humanScoreService | Scored conversations |
| trainingDataService | (external) | Interview insights |

---

## User Message Flow

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                    COMPLETE MESSAGE FLOW (CURRENT)                           ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   USER                                                                       ║
║     │                                                                        ║
║     │  "I've been anxious all week and can't focus"                         ║
║     │                                                                        ║
║     ▼                                                                        ║
║ ┌─────────────────────────────────────────────────────────────────────────┐ ║
║ │  1. INPUT ANALYSIS                                                      │ ║
║ │                                                                         │ ║
║ │  inputAnalysisService.ts                                                │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ Threat detection (none found)                                  │ ║
║ │     ├──▶ Crisis detection (none found)                                  │ ║
║ │     ├──▶ Extract mood: "anxious"                                        │ ║
║ │     └──▶ Extract energy: "low" (can't focus)                            │ ║
║ │                                                                         │ ║
║ └─────────────────────────────────────────────────────────────────────────┘ ║
║                              │                                               ║
║                              ▼                                               ║
║ ┌─────────────────────────────────────────────────────────────────────────┐ ║
║ │  2. SOCIAL CONNECTION CHECK                                             │ ║
║ │                                                                         │ ║
║ │  socialConnectionHealthService.ts                                       │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ Scan for social mentions (none)                                │ ║
║ │     ├──▶ Scan for isolation signals (none explicit)                     │ ║
║ │     ├──▶ Update isolation level: unchanged                              │ ║
║ │     └──▶ Should nudge toward connection? Not yet                        │ ║
║ │                                                                         │ ║
║ └─────────────────────────────────────────────────────────────────────────┘ ║
║                              │                                               ║
║                              ▼                                               ║
║ ┌─────────────────────────────────────────────────────────────────────────┐ ║
║ │  3. CONTEXT ASSEMBLY                                                    │ ║
║ │                                                                         │ ║
║ │  claudeAPIService.ts calls:                                             │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ cognitiveProfileService                                        │ ║
║ │     │      └──▶ "User is conceptual_systems thinker"                    │ ║
║ │     │      └──▶ "Has burst_recovery rhythm"                             │ ║
║ │     │      └──▶ "Needs validation first"                                │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ neurologicalDifferencesService                                 │ ║
║ │     │      └──▶ "Has inner monologue: yes"                              │ ║
║ │     │      └──▶ "Mental imagery: typical"                               │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ memoryTierService                                              │ ║
║ │     │      └──▶ "Last session: talked about work stress"                │ ║
║ │     │      └──▶ "Long-term: struggles with anxiety"                     │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ socialConnectionHealthService                                  │ ║
║ │     │      └──▶ "Isolation level: mild"                                 │ ║
║ │     │      └──▶ "Has therapist: no"                                     │ ║
║ │     │                                                                   │ ║
║ │     └──▶ corePrincipleKernel                                            │ ║
║ │            └──▶ "Core beliefs context"                                  │ ║
║ │            └──▶ "Absolute constraints"                                  │ ║
║ │                                                                         │ ║
║ └─────────────────────────────────────────────────────────────────────────┘ ║
║                              │                                               ║
║                              ▼                                               ║
║ ┌─────────────────────────────────────────────────────────────────────────┐ ║
║ │  4. RESPONSE DIRECTIVES                                                 │ ║
║ │                                                                         │ ║
║ │  conversationController.ts generates:                                   │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ artificialDelay: 1500ms (heavy topic)                          │ ║
║ │     ├──▶ maxLength: brief (low energy user)                             │ ║
║ │     ├──▶ tone: gentle                                                   │ ║
║ │     ├──▶ validateFirst: true                                            │ ║
║ │     └──▶ avoidVisualization: false (user can visualize)                 │ ║
║ │                                                                         │ ║
║ └─────────────────────────────────────────────────────────────────────────┘ ║
║                              │                                               ║
║                              ▼                                               ║
║ ┌─────────────────────────────────────────────────────────────────────────┐ ║
║ │  5. CLAUDE API CALL                                                     │ ║
║ │                                                                         │ ║
║ │  SYSTEM PROMPT:                                                         │ ║
║ │  ┌─────────────────────────────────────────────────────────────────┐   │ ║
║ │  │ === CORE PRINCIPLES ===                                         │   │ ║
║ │  │ Every mind works differently...                                 │   │ ║
║ │  │ Low phases are integration, not failure...                      │   │ ║
║ │  │                                                                 │   │ ║
║ │  │ === HUMAN CONNECTION ===                                        │   │ ║
║ │  │ You are ONE tool in a full life...                              │   │ ║
║ │  │                                                                 │   │ ║
║ │  │ === THIS USER ===                                               │   │ ║
║ │  │ Conceptual systems thinker                                      │   │ ║
║ │  │ Burst/recovery rhythm                                           │   │ ║
║ │  │ Needs validation before advice                                  │   │ ║
║ │  │                                                                 │   │ ║
║ │  │ === CONSTRAINTS ===                                             │   │ ║
║ │  │ NEVER diagnose conditions                                       │   │ ║
║ │  │ NEVER dismiss distress                                          │   │ ║
║ │  │                                                                 │   │ ║
║ │  │ === DIRECTIVES ===                                              │   │ ║
║ │  │ Keep response brief (user is low energy)                        │   │ ║
║ │  │ Validate feelings first                                         │   │ ║
║ │  │ Gentle tone                                                     │   │ ║
║ │  └─────────────────────────────────────────────────────────────────┘   │ ║
║ │                                                                         │ ║
║ │  USER: "I've been anxious all week and can't focus"                    │ ║
║ │                                                                         │ ║
║ │  CLAUDE RESPONSE:                                                       │ ║
║ │  "A week of anxiety is exhausting. What's been weighing on you?"       │ ║
║ │                                                                         │ ║
║ └─────────────────────────────────────────────────────────────────────────┘ ║
║                              │                                               ║
║                              ▼                                               ║
║ ┌─────────────────────────────────────────────────────────────────────────┐ ║
║ │  6. RESPONSE VALIDATION                                                 │ ║
║ │                                                                         │ ║
║ │  corePrincipleKernel.validateCoachResponse()                            │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ Check NO_VISUALIZATION_FOR_APHANTASIA: PASS                    │ ║
║ │     ├──▶ Check NO_CRISIS_DISMISSAL: PASS                                │ ║
║ │     ├──▶ Check NO_MEDICAL_DIAGNOSIS: PASS                               │ ║
║ │     ├──▶ Check MUST_REFER_FOR_SEVERE_ISOLATION: N/A (not severe)        │ ║
║ │     ├──▶ Check soft: VALIDATE_BEFORE_ADVISE: PASS (validated first)     │ ║
║ │     └──▶ RESULT: canSend = true                                         │ ║
║ │                                                                         │ ║
║ └─────────────────────────────────────────────────────────────────────────┘ ║
║                              │                                               ║
║                              ▼                                               ║
║ ┌─────────────────────────────────────────────────────────────────────────┐ ║
║ │  7. SCORING & LEARNING                                                  │ ║
║ │                                                                         │ ║
║ │  humanScoreService.ts                                                   │ ║
║ │     │                                                                   │ ║
║ │     ├──▶ LOCAL SCORE (immediate): 81/100                                │ ║
║ │     │      - naturalLanguage: 13/15                                     │ ║
║ │     │      - emotionalTiming: 18/20                                     │ ║
║ │     │      - brevityControl: 14/15                                      │ ║
║ │     │      - memoryUse: 12/15                                           │ ║
║ │     │      - imperfection: 9/10                                         │ ║
║ │     │      - personalityConsistency: 11/15                              │ ║
║ │     │      - avoidedAITicks: 4/10 (could be more unique)                │ ║
║ │     │                                                                   │ ║
║ │     └──▶ CLAUDE SCORE (background): 84/100                              │ ║
║ │            - More detailed breakdown                                    │ ║
║ │            - Saved for training data                                    │ ║
║ │                                                                         │ ║
║ │  TRAINING DATA SAVED:                                                   │ ║
║ │  {                                                                      │ ║
║ │    userMessage: "I've been anxious all week...",                        │ ║
║ │    coachResponse: "A week of anxiety is exhausting...",                 │ ║
║ │    profile: { cognitiveMode: "conceptual_systems", ... },               │ ║
║ │    context: { energy: "low", mood: "anxious", ... },                    │ ║
║ │    scores: { local: 81, claude: 84 }                                    │ ║
║ │  }                                                                      │ ║
║ │                                                                         │ ║
║ └─────────────────────────────────────────────────────────────────────────┘ ║
║                              │                                               ║
║                              ▼                                               ║
║   USER SEES:                                                                 ║
║     "A week of anxiety is exhausting. What's been weighing on you?"         ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

## Learning & Adaptation Flow

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                    HOW THE SYSTEM LEARNS & ADAPTS                            ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║                          IMMEDIATE LEARNING                                  ║
║                         (Same Session)                                       ║
║ ┌────────────────────────────────────────────────────────────────────────┐  ║
║ │                                                                        │  ║
║ │   User sends message                                                   │  ║
║ │          │                                                             │  ║
║ │          ▼                                                             │  ║
║ │   ┌──────────────┐                                                    │  ║
║ │   │ Extract      │──▶ Updates session context:                        │  ║
║ │   │ signals      │    • Current mood                                  │  ║
║ │   └──────────────┘    • Energy level                                  │  ║
║ │                       • Topics discussed                              │  ║
║ │                       • Emotional arc                                 │  ║
║ │                                                                        │  ║
║ │   Next response immediately adapts to new context                     │  ║
║ │                                                                        │  ║
║ └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║                          SHORT-TERM LEARNING                                 ║
║                          (This Week)                                         ║
║ ┌────────────────────────────────────────────────────────────────────────┐  ║
║ │                                                                        │  ║
║ │   Session ends                                                         │  ║
║ │          │                                                             │  ║
║ │          ▼                                                             │  ║
║ │   ┌──────────────┐                                                    │  ║
║ │   │ Memory tier  │──▶ Short-term memory updated:                      │  ║
║ │   │ update       │    • Recent topics                                 │  ║
║ │   └──────────────┘    • What helped                                   │  ║
║ │                       • What didn't                                   │  ║
║ │                       • Unresolved threads                            │  ║
║ │                                                                        │  ║
║ │   Next session knows where we left off                                │  ║
║ │                                                                        │  ║
║ └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║                          MID-TERM LEARNING                                   ║
║                          (Weekly)                                            ║
║ ┌────────────────────────────────────────────────────────────────────────┐  ║
║ │                                                                        │  ║
║ │   Week ends                                                            │  ║
║ │          │                                                             │  ║
║ │          ▼                                                             │  ║
║ │   ┌──────────────┐                                                    │  ║
║ │   │ Claude       │──▶ Compresses week into:                           │  ║
║ │   │ compression  │    • Weekly themes                                 │  ║
║ │   └──────────────┘    • Recurring patterns                            │  ║
║ │                       • Progress notes                                │  ║
║ │                       • Things to monitor                             │  ║
║ │                                                                        │  ║
║ │   Coach has bigger picture of user's journey                          │  ║
║ │                                                                        │  ║
║ └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║                          LONG-TERM LEARNING                                  ║
║                          (Ongoing)                                           ║
║ ┌────────────────────────────────────────────────────────────────────────┐  ║
║ │                                                                        │  ║
║ │   Months of interaction                                                │  ║
║ │          │                                                             │  ║
║ │          ▼                                                             │  ║
║ │   ┌──────────────┐                                                    │  ║
║ │   │ Long-term    │──▶ Core identity builds:                           │  ║
║ │   │ memory       │    • What techniques work for them                 │  ║
║ │   └──────────────┘    • Their triggers                                │  ║
║ │                       • Their strengths                               │  ║
║ │                       • Life context changes                          │  ║
║ │                       • Growth patterns                               │  ║
║ │                                                                        │  ║
║ │   Coach deeply understands this specific person                       │  ║
║ │                                                                        │  ║
║ └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║                          SYSTEM-WIDE LEARNING                                ║
║                          (All Users → Better Model)                          ║
║ ┌────────────────────────────────────────────────────────────────────────┐  ║
║ │                                                                        │  ║
║ │   ┌──────────────────────────────────────────────────────────┐        │  ║
║ │   │                                                          │        │  ║
║ │   │   Every conversation                                     │        │  ║
║ │   │          │                                               │        │  ║
║ │   │          ▼                                               │        │  ║
║ │   │   Score + save as training data                          │        │  ║
║ │   │          │                                               │        │  ║
║ │   │          ▼                                               │        │  ║
║ │   │   When 500+ examples:                                    │        │  ║
║ │   │   └──▶ Train local scorer                                │        │  ║
║ │   │                                                          │        │  ║
║ │   │   When 2000+ examples + insights + corrections:          │        │  ║
║ │   │   └──▶ Fine-tune local LLM                               │        │  ║
║ │   │                                                          │        │  ║
║ │   │   Local LLM becomes smarter for EVERYONE                 │        │  ║
║ │   │                                                          │        │  ║
║ │   └──────────────────────────────────────────────────────────┘        │  ║
║ │                                                                        │  ║
║ │   + Interview insights flow into kernel + training data               │  ║
║ │   + User corrections improve next generation                          │  ║
║ │                                                                        │  ║
║ └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

## LLM Input/Output

### Current: Claude API

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         CLAUDE API INPUT/OUTPUT                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║   INPUT TO CLAUDE:                                                         ║
║   ┌─────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                     │ ║
║   │   {                                                                 │ ║
║   │     "model": "claude-sonnet-4-20250514",                             │ ║
║   │     "max_tokens": 1024,                                             │ ║
║   │     "system": "                                                     │ ║
║   │       === CORE PRINCIPLES ===                                       │ ║
║   │       {getPrincipleContextForLLM()}                                 │ ║
║   │                                                                     │ ║
║   │       === THIS USER ===                                             │ ║
║   │       {getCognitiveProfileContextForLLM()}                          │ ║
║   │       {getNeurologicalContextForLLM()}                              │ ║
║   │       {getConnectionContextForLLM()}                                │ ║
║   │                                                                     │ ║
║   │       === MEMORY ===                                                │ ║
║   │       {getMemoryContext()}                                          │ ║
║   │                                                                     │ ║
║   │       === DIRECTIVES ===                                            │ ║
║   │       {responseDirectives}                                          │ ║
║   │     ",                                                              │ ║
║   │     "messages": [                                                   │ ║
║   │       { "role": "user", "content": userMessage }                    │ ║
║   │     ]                                                               │ ║
║   │   }                                                                 │ ║
║   │                                                                     │ ║
║   └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║   OUTPUT FROM CLAUDE:                                                      ║
║   ┌─────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                     │ ║
║   │   {                                                                 │ ║
║   │     "content": [                                                    │ ║
║   │       {                                                             │ ║
║   │         "type": "text",                                             │ ║
║   │         "text": "A week of anxiety is exhausting..."                │ ║
║   │       }                                                             │ ║
║   │     ],                                                              │ ║
║   │     "stop_reason": "end_turn",                                      │ ║
║   │     "usage": { "input_tokens": 1523, "output_tokens": 47 }          │ ║
║   │   }                                                                 │ ║
║   │                                                                     │ ║
║   └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║   THEN: Output validated against kernel constraints                       ║
║   THEN: Output scored for human-ness                                      ║
║   THEN: Output shown to user                                              ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Future: Local LLM

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                       LOCAL LLM INPUT/OUTPUT (FUTURE)                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║   INPUT TO LOCAL LLM:                                                      ║
║   ┌─────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                     │ ║
║   │   <|im_start|>system                                                │ ║
║   │   You are a Mood Leaf coach. Fine-tuned to understand humans.       │ ║
║   │                                                                     │ ║
║   │   USER PROFILE:                                                     │ ║
║   │   - Cognitive mode: conceptual_systems                              │ ║
║   │   - Rhythm: burst_recovery                                          │ ║
║   │   - Current energy: low                                             │ ║
║   │   - Needs validation before advice                                  │ ║
║   │                                                                     │ ║
║   │   DIRECTIVES:                                                       │ ║
║   │   - Keep brief (low energy user)                                    │ ║
║   │   - Validate first                                                  │ ║
║   │   - Gentle tone                                                     │ ║
║   │   <|im_end|>                                                        │ ║
║   │                                                                     │ ║
║   │   <|im_start|>user                                                  │ ║
║   │   I've been anxious all week and can't focus                        │ ║
║   │   <|im_end|>                                                        │ ║
║   │                                                                     │ ║
║   │   <|im_start|>assistant                                             │ ║
║   │                                                                     │ ║
║   └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║   LOCAL LLM GENERATES:                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                     │ ║
║   │   "A week of that sounds heavy. What's pulling at you?"             │ ║
║   │                                                                     │ ║
║   └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║   THEN: Score with local scorer                                           ║
║   THEN: Validate against kernel                                           ║
║   THEN: If passes, show to user                                           ║
║   THEN: If fails, try again OR escalate to Claude                         ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Data Flow Diagram

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                        COMPLETE DATA FLOW                                    ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║                           DATA SOURCES                                       ║
║   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    ║
║   │ Onboarding  │   │Conversations│   │ Interviews  │   │  Feedback   │    ║
║   │ Questions   │   │             │   │             │   │             │    ║
║   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘    ║
║          │                 │                 │                 │            ║
║          ▼                 ▼                 ▼                 ▼            ║
║   ┌─────────────────────────────────────────────────────────────────────┐  ║
║   │                                                                     │  ║
║   │                    LOCAL STORAGE (AsyncStorage)                     │  ║
║   │                                                                     │  ║
║   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  ║
║   │  │ Cognitive   │  │ Memory      │  │ Training    │  │ Connection│  │  ║
║   │  │ Profile     │  │ Tiers       │  │ Data        │  │ Health    │  │  ║
║   │  │             │  │             │  │             │  │           │  │  ║
║   │  │ • Modes     │  │ • Short     │  │ • Scored    │  │ • Isolation│  │  ║
║   │  │ • Rhythms   │  │ • Mid       │  │   exchanges │  │   level   │  │  ║
║   │  │ • Neuro     │  │ • Long      │  │ • Insights  │  │ • Support │  │  ║
║   │  │ • Prefs     │  │             │  │ • Correct.  │  │   network │  │  ║
║   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │  ║
║   │         │                │                │               │         │  ║
║   └─────────┼────────────────┼────────────────┼───────────────┼─────────┘  ║
║             │                │                │               │            ║
║             ▼                ▼                ▼               ▼            ║
║   ┌─────────────────────────────────────────────────────────────────────┐  ║
║   │                                                                     │  ║
║   │                    CONTEXT ASSEMBLY LAYER                           │  ║
║   │                                                                     │  ║
║   │                claudeAPIService.buildContext()                      │  ║
║   │                                                                     │  ║
║   └─────────────────────────────────┬───────────────────────────────────┘  ║
║                                     │                                      ║
║                                     ▼                                      ║
║   ┌─────────────────────────────────────────────────────────────────────┐  ║
║   │                                                                     │  ║
║   │                          LLM LAYER                                  │  ║
║   │                                                                     │  ║
║   │       ┌───────────────┐           ┌───────────────┐                │  ║
║   │       │  CLAUDE API   │           │  LOCAL LLM    │                │  ║
║   │       │  (Current)    │           │  (Future)     │                │  ║
║   │       └───────┬───────┘           └───────┬───────┘                │  ║
║   │               │                           │                         │  ║
║   │               └───────────┬───────────────┘                         │  ║
║   │                           │                                         │  ║
║   └───────────────────────────┼─────────────────────────────────────────┘  ║
║                               │                                            ║
║                               ▼                                            ║
║   ┌─────────────────────────────────────────────────────────────────────┐  ║
║   │                                                                     │  ║
║   │                    VALIDATION LAYER                                 │  ║
║   │                                                                     │  ║
║   │    ┌──────────────────┐        ┌──────────────────┐                │  ║
║   │    │ Kernel Checks    │        │ Human-ness Score │                │  ║
║   │    │                  │        │                  │                │  ║
║   │    │ Hard constraints │        │ Local scorer     │                │  ║
║   │    │ Soft principles  │        │ (+ Claude bg)    │                │  ║
║   │    └────────┬─────────┘        └────────┬─────────┘                │  ║
║   │             │                           │                          │  ║
║   │             └───────────┬───────────────┘                          │  ║
║   │                         │                                          │  ║
║   └─────────────────────────┼──────────────────────────────────────────┘  ║
║                             │                                              ║
║                             ▼                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐  ║
║   │                                                                     │  ║
║   │                         OUTPUT                                      │  ║
║   │                                                                     │  ║
║   │    Response to User  ◀──────────────▶  Training Data Saved         │  ║
║   │                                                                     │  ║
║   └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

## Training Pipeline

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                       TRAINING PIPELINE                                      ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   PHASE 1: DATA COLLECTION (NOW)                                            ║
║   ─────────────────────────────                                             ║
║                                                                              ║
║   Every conversation                Interview imports                        ║
║         │                                 │                                  ║
║         ▼                                 ▼                                  ║
║   ┌─────────────┐                 ┌─────────────┐                           ║
║   │ Score with  │                 │ Admin       │                           ║
║   │ Claude (bg) │                 │ reviews     │                           ║
║   └──────┬──────┘                 └──────┬──────┘                           ║
║          │                               │                                   ║
║          ▼                               ▼                                   ║
║   ┌─────────────┐                 ┌─────────────┐                           ║
║   │ Save scored │                 │ Save        │                           ║
║   │ exchange    │                 │ insight     │                           ║
║   └──────┬──────┘                 └──────┬──────┘                           ║
║          │                               │                                   ║
║          └───────────────┬───────────────┘                                  ║
║                          │                                                   ║
║                          ▼                                                   ║
║              ┌─────────────────────┐                                        ║
║              │   LOCAL STORAGE     │                                        ║
║              │                     │                                        ║
║              │   Target: 500+      │                                        ║
║              │   Claude examples   │                                        ║
║              └─────────────────────┘                                        ║
║                                                                              ║
║   ═══════════════════════════════════════════════════════════════════════   ║
║                                                                              ║
║   PHASE 2: LOCAL SCORER TRAINING                                            ║
║   ──────────────────────────────                                            ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐  ║
║   │                                                                     │  ║
║   │   500+ Claude-scored examples                                       │  ║
║   │            │                                                        │  ║
║   │            ▼                                                        │  ║
║   │   ┌─────────────────┐                                               │  ║
║   │   │ Export as JSON  │                                               │  ║
║   │   └────────┬────────┘                                               │  ║
║   │            │                                                        │  ║
║   │            ▼                                                        │  ║
║   │   ┌─────────────────┐                                               │  ║
║   │   │ Train small     │  DistilBERT / Custom classifier               │  ║
║   │   │ classifier      │  Input: message + response + profile          │  ║
║   │   │                 │  Output: score (0-100)                        │  ║
║   │   └────────┬────────┘                                               │  ║
║   │            │                                                        │  ║
║   │            ▼                                                        │  ║
║   │   ┌─────────────────┐                                               │  ║
║   │   │ Validate        │  Must correlate 85%+ with Claude              │  ║
║   │   │ accuracy        │                                               │  ║
║   │   └────────┬────────┘                                               │  ║
║   │            │                                                        │  ║
║   │            ▼                                                        │  ║
║   │   ┌─────────────────┐                                               │  ║
║   │   │ Export to       │  CoreML for iOS, ONNX for cross-platform     │  ║
║   │   │ on-device       │                                               │  ║
║   │   └─────────────────┘                                               │  ║
║   │                                                                     │  ║
║   └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║   ═══════════════════════════════════════════════════════════════════════   ║
║                                                                              ║
║   PHASE 4: FINE-TUNE LOCAL LLM                                              ║
║   ────────────────────────────                                              ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐  ║
║   │                                                                     │  ║
║   │   TRAINING DATA ASSEMBLY:                                           │  ║
║   │                                                                     │  ║
║   │   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐        │  ║
║   │   │ Conversations │   │ Insights      │   │ Corrections   │        │  ║
║   │   │ 2000+         │   │ 50+           │   │ 100+          │        │  ║
║   │   │               │   │               │   │               │        │  ║
║   │   │ High-scoring  │   │ Turned into   │   │ Bad→Good      │        │  ║
║   │   │ examples      │   │ examples      │   │ pairs         │        │  ║
║   │   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘        │  ║
║   │           │                   │                   │                 │  ║
║   │           └───────────────────┼───────────────────┘                 │  ║
║   │                               │                                     │  ║
║   │                               ▼                                     │  ║
║   │                   ┌───────────────────────┐                         │  ║
║   │                   │  TRAINING DATASET     │                         │  ║
║   │                   │                       │                         │  ║
║   │                   │  Format: JSONL        │                         │  ║
║   │                   │  { input, output }    │                         │  ║
║   │                   └───────────┬───────────┘                         │  ║
║   │                               │                                     │  ║
║   │                               ▼                                     │  ║
║   │   ┌─────────────────────────────────────────────────────────────┐  │  ║
║   │   │                   FINE-TUNING                               │  │  ║
║   │   │                                                             │  │  ║
║   │   │   Base: Mistral 7B                                          │  │  ║
║   │   │                                                             │  │  ║
║   │   │   Step 1: SFT (Supervised Fine-Tuning)                      │  │  ║
║   │   │   └── Train on high-scoring examples                        │  │  ║
║   │   │                                                             │  │  ║
║   │   │   Step 2: DPO (Direct Preference Optimization)              │  │  ║
║   │   │   └── Train on good/bad pairs                               │  │  ║
║   │   │                                                             │  │  ║
║   │   │   Method: QLoRA (memory efficient)                          │  │  ║
║   │   │   Hardware: A100 GPU (16GB+ VRAM)                           │  │  ║
║   │   │                                                             │  │  ║
║   │   └─────────────────────────────────────────────────────────────┘  │  ║
║   │                               │                                     │  ║
║   │                               ▼                                     │  ║
║   │                   ┌───────────────────────┐                         │  ║
║   │                   │  MOOD LEAF LLM        │                         │  ║
║   │                   │                       │                         │  ║
║   │                   │  Fine-tuned model     │                         │  ║
║   │                   │  that "gets" humans   │                         │  ║
║   │                   └───────────────────────┘                         │  ║
║   │                                                                     │  ║
║   └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

## Quick Reference

### Services by Purpose

| Purpose | Service | Key Functions |
|---------|---------|---------------|
| **User Understanding** | `cognitiveProfileService.ts` | How they think, rhythms, modes |
| | `neurologicalDifferencesService.ts` | Aphantasia, inner monologue |
| | `socialConnectionHealthService.ts` | Isolation, external support |
| **Constitutional** | `corePrincipleKernel.ts` | Beliefs, constraints, validation |
| **Memory** | `memoryTierService.ts` | Short/mid/long term storage |
| **AI** | `claudeAPIService.ts` | Builds prompts, calls Claude |
| | `conversationController.ts` | Response directives, timing |
| | `humanScoreService.ts` | Quality scoring |
| **Training** | `trainingDataService.ts` | Insights, corrections, export |

### Data Storage Locations

| Data | Where | Persistence |
|------|-------|-------------|
| Cognitive profile | AsyncStorage | Local, permanent |
| Memory tiers | AsyncStorage | Local, permanent |
| Connection health | AsyncStorage | Local, permanent |
| Training data | AsyncStorage | Local, exportable |
| Conversation history | AsyncStorage | Local, compressible |
| Principle overrides | AsyncStorage + Backend | Local + sync |

---

---

## What Training Data Trains

Each type of training data teaches the model specific capabilities:

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                    WHAT EACH DATA TYPE TRAINS                                ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   SCORED CONVERSATIONS                                                       ║
║   ════════════════════                                                       ║
║                                                                              ║
║   What it is:                                                                ║
║   • Real user messages + coach responses + human-ness scores                 ║
║   • Context (mood, energy, profile, message number)                          ║
║   • Scores across 7 dimensions (0-100 total)                                 ║
║                                                                              ║
║   What it trains:                                                            ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │ ASPECT                    │ HOW IT IMPROVES THE MODEL               │   ║
║   ├───────────────────────────┼─────────────────────────────────────────┤   ║
║   │ Response Tone             │ Natural, warm, human-like phrasing      │   ║
║   │ Emotional Timing          │ When to validate vs. when to advise     │   ║
║   │ Brevity Control           │ Short for low energy, longer when OK    │   ║
║   │ Profile Adaptation        │ Different styles for different minds    │   ║
║   │ Context Awareness         │ Using memory, referring to past topics  │   ║
║   │ Avoiding AI-isms          │ No "As an AI...", no over-enthusiasm    │   ║
║   │ Consistency               │ Same personality across conversations   │   ║
║   └───────────────────────────┴─────────────────────────────────────────┘   ║
║                                                                              ║
║   High-scoring examples teach the model:                                     ║
║   "When a low-energy user shares anxiety, respond briefly with              ║
║    validation first, then a gentle question."                               ║
║                                                                              ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   INTERVIEW INSIGHTS                                                         ║
║   ══════════════════                                                         ║
║                                                                              ║
║   What it is:                                                                ║
║   • Learnings from user research and interviews                              ║
║   • Direct quotes capturing how humans think/feel                            ║
║   • Coaching implications (how to adapt)                                     ║
║   • Categorized by aspect of human experience                                ║
║                                                                              ║
║   What it trains:                                                            ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │ CATEGORY                  │ WHAT THE MODEL LEARNS                   │   ║
║   ├───────────────────────────┼─────────────────────────────────────────┤   ║
║   │ cognitive_patterns        │ How different minds process information │   ║
║   │                           │ → Visual vs verbal thinkers             │   ║
║   │                           │ → Systems vs experiential processing    │   ║
║   │                           │                                         │   ║
║   │ emotional_processing      │ How people experience emotions          │   ║
║   │                           │ → Delayed emotional recognition         │   ║
║   │                           │ → Somatic vs cognitive feelings         │   ║
║   │                           │                                         │   ║
║   │ neurological_differences  │ How brains differ                       │   ║
║   │                           │ → Aphantasia (no mental imagery)        │   ║
║   │                           │ → ADHD patterns                         │   ║
║   │                           │ → Inner monologue presence/absence      │   ║
║   │                           │                                         │   ║
║   │ communication_needs       │ How people want to be talked to         │   ║
║   │                           │ → Validation-first vs solution-first    │   ║
║   │                           │ → Direct vs gentle approaches           │   ║
║   │                           │                                         │   ║
║   │ motivation_patterns       │ What moves people to action             │   ║
║   │                           │ → Interest-based vs importance-based    │   ║
║   │                           │ → Body doubling, accountability styles  │   ║
║   │                           │                                         │   ║
║   │ relationship_with_self    │ Self-perception and inner dialogue      │   ║
║   │                           │ → Self-compassion levels                │   ║
║   │                           │ → Inner critic patterns                 │   ║
║   │                           │                                         │   ║
║   │ crisis_patterns           │ What crisis looks/feels like            │   ║
║   │                           │ → Warning signs specific to types       │   ║
║   │                           │ → What helps vs. what makes it worse    │   ║
║   │                           │                                         │   ║
║   │ recovery_patterns         │ What healing looks like                 │   ║
║   │                           │ → Non-linear progress                   │   ║
║   │                           │ → Different paths for different people  │   ║
║   │                           │                                         │   ║
║   │ daily_rhythms             │ Energy and mood patterns                │   ║
║   │                           │ → Morning people vs night owls          │   ║
║   │                           │ → Burst/crash cycles                    │   ║
║   │                           │                                         │   ║
║   │ social_dynamics           │ How connection affects wellbeing        │   ║
║   │                           │ → Introvert recharge patterns           │   ║
║   │                           │ → Isolation warning signs               │   ║
║   └───────────────────────────┴─────────────────────────────────────────┘   ║
║                                                                              ║
║   Insights teach the model:                                                  ║
║   "People with aphantasia can't do visualization exercises. Never           ║
║    say 'picture yourself...' or 'imagine the scene...' to them."            ║
║                                                                              ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   COACH CORRECTIONS                                                          ║
║   ═════════════════                                                          ║
║                                                                              ║
║   What it is:                                                                ║
║   • Bad response → Good response pairs                                       ║
║   • What was wrong with the original                                         ║
║   • Context of when the mistake happened                                     ║
║                                                                              ║
║   What it trains:                                                            ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │ CORRECTION TYPE           │ WHAT THE MODEL LEARNS                   │   ║
║   ├───────────────────────────┼─────────────────────────────────────────┤   ║
║   │ Tone corrections          │ "Too clinical" → warm, human language   │   ║
║   │ Timing corrections        │ "Advice too early" → validate first     │   ║
║   │ Length corrections        │ "Too long for low energy" → be brief    │   ║
║   │ Assumption corrections    │ "Assumed wrong" → ask, don't assume     │   ║
║   │ Safety corrections        │ "Missed crisis" → recognize signs       │   ║
║   │ Profile mismatches        │ "Wrong for this brain" → adapt style    │   ║
║   │ Boundary violations       │ "Acted like therapist" → stay in role   │   ║
║   └───────────────────────────┴─────────────────────────────────────────┘   ║
║                                                                              ║
║   Used in DPO (Direct Preference Optimization):                              ║
║   "Given this input, prefer this response over that response"               ║
║                                                                              ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   TRAINING OUTCOME: A MODEL THAT...                                          ║
║   ═══════════════════════════════                                            ║
║                                                                              ║
║   ✓ Sounds human, not robotic                                               ║
║   ✓ Adapts to different cognitive profiles                                  ║
║   ✓ Knows when to validate vs. when to advise                               ║
║   ✓ Respects neurological differences                                       ║
║   ✓ Recognizes crisis without over-reacting                                 ║
║   ✓ Encourages human connection, not app dependency                         ║
║   ✓ Maintains consistent personality                                        ║
║   ✓ Uses memory appropriately                                               ║
║   ✓ Stays within ethical boundaries                                         ║
║   ✓ Gets better with each conversation                                      ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

### Training Data Sources

| Source | Collection Method | Used For |
|--------|------------------|----------|
| **Conversations** | Automatic (every chat with consent) | Response quality, tone, timing |
| **Interviews** | Manual (admin imports insights) | Human understanding, patterns |
| **Corrections** | Manual (admin reviews flagged responses) | Error correction, preferences |
| **Research** | Manual (admin imports from papers) | Evidence-based practices |
| **User Feedback** | Automatic (ratings, corrections) | Real-world validation |

### Batch Import for Interview Links

For importing multiple interview insights at once (e.g., from research sessions), use the batch import feature:

1. Prepare a JSON file with your insights
2. Go to Admin → Training → Import → Batch Import
3. Upload or paste the JSON
4. Review and approve each insight

**Batch Import JSON Format:**
```json
{
  "source": "Q1 2025 User Research",
  "insights": [
    {
      "category": "cognitive_patterns",
      "title": "Systems thinkers need the 'why' first",
      "insight": "Users who think in systems won't accept advice until they understand the underlying logic.",
      "quotes": ["I can't just do something because you said so. I need to understand why it works."],
      "coachingImplication": "Always explain the reasoning before suggesting an action.",
      "confidenceLevel": "validated"
    },
    {
      "category": "emotional_processing",
      "title": "Body signals precede conscious emotion",
      "insight": "Many users notice physical sensations (tight chest, tension) before recognizing the emotion.",
      "quotes": ["I didn't realize I was anxious until I noticed my shoulders were up by my ears."],
      "coachingImplication": "Ask about body sensations, not just 'how do you feel?'",
      "confidenceLevel": "observed"
    }
  ]
}
```

**Interview Links Import:**
For importing from interview recordings/notes stored externally:

```json
{
  "source": "Interview Session Links",
  "interviewLinks": [
    {
      "interviewId": "INT-001",
      "participantId": "P12",
      "date": "2025-01-15",
      "link": "https://notion.so/interviews/p12-session",
      "insights": [
        {
          "category": "communication_needs",
          "title": "Direct questions feel invasive",
          "insight": "This participant prefers oblique check-ins over direct 'how are you feeling?'",
          "quotes": ["When you ask me directly, I freeze up."],
          "coachingImplication": "Offer observation-based openings like 'You seem a bit quiet today'",
          "confidenceLevel": "observed"
        }
      ]
    }
  ]
}
```

---

This document should give you a complete picture of how Mood Leaf works, where we are now, and where we're headed. Every conversation teaches the system something new, and eventually that learning compounds into a local model that deeply understands how humans work.

---

**Document Maintenance:**
- Update milestone status as progress is made
- Add new insights to "What Training Data Trains" as categories emerge
- Revise tech stack evolution as costs/latency change
- Keep this as the single source of truth for system architecture
