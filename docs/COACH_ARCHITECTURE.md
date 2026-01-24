# Coach Architecture & Integration

This document explains how the Coach system integrates throughout Mood Leaf, including adaptive behavior, context compression, and data flow.

---

## ⚠️ CRITICAL: Claude → LLaMA Transition

**Claude is TEMPORARY. LLaMA is the target production model.**

We are actively training a local LLaMA model to replace Claude. This has major implications:

### Development Rules

1. **Any service changes to Claude MUST be mirrored to LLaMA**
   - If you add a service import to `claudeAPIService.ts`, add it to `llamaIntegrationService.ts`
   - If you add context gathering, add it to both
   - If you add style rules, add them to both

2. **Service Parity Checklist** (update when adding new integrations):
   | Service | Claude | LLaMA | Notes |
   |---------|--------|-------|-------|
   | `corePrincipleKernel` | ✅ | ✅ | Safety tenets |
   | `coachStyleService` | ✅ | ✅ | Communication style |
   | `coachPersonalityService` | ✅ | ❌ | Personas, adaptive mode |
   | `memoryTierService` | ✅ | ❌ | Conversation memory |
   | `userContextService` | ✅ | ❌ | User profile |
   | `lifeContextService` | ✅ | ❌ | Life situation |
   | `quickLogsService` | ✅ | ❌ | Twigs data |
   | `healthKitService` | ✅ | ❌ | Health data |
   | `calendarService` | ✅ | ❌ | Calendar events |
   | `drinkPacingService` | ✅ | ❌ | Drink tracking |
   | `habitTimerService` | ✅ | ❌ | Custom habit pacing |
   | `skillRecommendationService` | ✅ | ❌ | Skill suggestions based on context |
   | `coachModeService` | ✅ | ❌ | Skill modes |
   | `safeguardService` | ✅ | ❌ | Safety checks |
   | `cognitiveProfileService` | ✅ | ✅ | Cognitive patterns (aphantasia, mental imagery) |
   | `socialConnectionHealthService` | ✅ | ❌ | Social context |
   | `exposureLadderService` | ✅ | ❌ | Anxiety exposure |
   | `patternService` | ✅ | ❌ | Lifestyle factors |
   | `tonePreferencesService` | ✅ | ❌ | Tone settings |

3. **Training Data Quality**
   - All training outputs are cleaned with `cleanStyleViolations()`
   - This prevents LLaMA from learning bad patterns (roleplay markers, robotic phrases)
   - YouTube insights + interview data feed into LLaMA fine-tuning

### Architecture Files

- **`claudeAPIService.ts`** - Current production (temporary)
- **`llamaIntegrationService.ts`** - Future production (target)
- **`llmProviderService.ts`** - Provider abstraction (for switching)

### Migration Path

1. ✅ Train LLaMA on curated YouTube/interview insights
2. ⏳ Add service parity to `llamaIntegrationService.ts`
3. ⏳ Implement actual inference (requires llama.cpp bindings)
4. ⏳ A/B test Claude vs LLaMA responses
5. ⏳ Full cutover to local LLaMA

---

## Overview

The Coach is the central conversational AI component of Mood Leaf. It connects to virtually every part of the app to provide personalized, context-aware responses.

```
+------------------+
|    User Input    |
|  (text/voice)    |
+--------+---------+
         |
         v
+------------------+     +-----------------------+
|   Coach Screen   |<----|  Voice Enabled TabBar |
|   (coach.tsx)    |     |  (hold to speak)      |
+--------+---------+     +-----------------------+
         |
         v
+------------------+
| claudeAPIService |  <-- Main integration hub
+--------+---------+
         |
    +----+----+
    |         |
    v         v
+-------+  +----------+
|Context|  |Safeguards|
|Gather |  | Check    |
+-------+  +----------+
    |
    v
+------------------+
| CLAUDE API CALL  |
+------------------+
```

## Context Gathering Architecture

The Coach assembles rich context from multiple sources before each message. This is what makes it feel like it "knows" the user.

```
                    +---------------------------+
                    |    FULL CONTEXT PROMPT    |
                    +---------------------------+
                               |
         +---------------------+---------------------+
         |         |          |          |          |
         v         v          v          v          v
    +--------+ +--------+ +--------+ +--------+ +--------+
    | User   | | Life   | | Health | | Memory | | Coach  |
    | Context| | Context| | Context| | Tiers  | | Mode   |
    +--------+ +--------+ +--------+ +--------+ +--------+
         |         |          |          |          |
         v         v          v          v          v
    +--------+ +--------+ +--------+ +--------+ +--------+
    |Recent  | |People  | |HealthKit| |Short   | |Skill   |
    |Journals| |Events  | |Sleep   | |Term    | |Modes   |
    |Moods   | |Themes  | |Activity| |Mid Term| |(breath |
    |Twigs   | |        | |Heart   | |Long    | | ground)|
    +--------+ +--------+ +--------+ +--------+ +--------+
```

### Context Sources (in order of assembly)

1. **User Name Context** - For personalized address
2. **Achievement Context** - Celebrations to share (insights, skill completions)
3. **Cognitive Profile** - How this person thinks/learns (from onboarding)
4. **Social Connection Health** - Isolation risk, connection quality
5. **Memory Context** - Tiered memory (short/mid/long term)
6. **Life Context** - Lifetime overview (people, events, themes)
7. **Psych Context** - Psychological profile (cognitive patterns, attachment)
8. **Chronotype Context** - Chronotype and travel awareness
9. **Calendar Context** - Upcoming meetings, travel, deadlines
10. **Health Context** - HealthKit data (heart rate, sleep, activity)
11. **Correlation Context** - Health-mood correlations
12. **Logs Context** - DETAILED tracking data (twigs, habits, meds)
13. **Lifestyle Context** - Lifestyle factors (caffeine, alcohol, outdoor time)
14. **Exposure Context** - Social exposure ladder progress
15. **Journal Context** - Recent journal entries (what user wrote)
16. **Accountability Context** - Limits and tracking (drink pacing, etc.)
17. **Conversation Context** - Current conversation state

## Compression Architecture

Raw data never goes directly to the AI. Everything is compressed to protect privacy and reduce token usage.

```
+----------------+     +------------------+     +----------------+
|  RAW DATA      | --> |  COMPRESSION     | --> |  CONTEXT FOR   |
|  (on device)   |     |  LAYER           |     |  CLAUDE        |
+----------------+     +------------------+     +----------------+

Example: Journal Entry
+------------------------+     +------------------------+
| "Today I had a huge    | --> | "Recent journal:       |
|  fight with Sarah      |     |  conflict w/partner,   |
|  about money again.    |     |  recurring theme of    |
|  She doesn't under-    |     |  financial stress,     |
|  stand how stressed    |     |  feeling unheard"      |
|  I am about bills..."  |     |                        |
| (500 words)            |     | (25 words)             |
+------------------------+     +------------------------+
```

### Compression Stages

```
Stage 1: On-Device Summarization
+------------------+
|  journalStorage  |  --> Extracts themes, emotions, key topics
|  patternService  |  --> Identifies lifestyle factors
|  quickLogsService|  --> Aggregates twig data
+------------------+

Stage 2: Context Building
+------------------+
| getXXXForClaude()|  --> Each service exposes compressed summary
+------------------+

Stage 3: Token Optimization
+------------------+
| conversationController |  --> Trims to fit context window
+------------------+
```

### What Gets Compressed

| Data Type | Raw | Compressed |
|-----------|-----|------------|
| Journal Entry | Full text | Theme + emotion + topics |
| Twig Logs | Every tap | Daily totals + patterns |
| Conversations | Full transcript | Topic summary + mood arc |
| Health Data | Minute-by-minute | Daily averages + anomalies |
| Life Events | Full descriptions | Key facts + relationships |

## Adaptive Persona System

The Coach adapts its personality based on context. This happens automatically through the Adaptive Mode system.

```
+------------------+
|  User Message    |
+--------+---------+
         |
         v
+------------------+
|  Detect Mood     |  "I'm so anxious" -> anxious
|  Detect Time     |  11pm -> night
+--------+---------+
         |
         v
+------------------+
|  Select Persona  |
+------------------+
         |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v
  Luna Willow Fern Spark etc.
(mindful)(wise)(nurturing)(energetic)

Selection Logic:
- Anxious mood -> Luna (calming, mindful)
- Sad mood -> Fern (nurturing, gentle)
- Night time -> Luna (sleep-aware)
- Morning -> Spark (energizing)
- Happy mood -> Clover (celebrating)
```

### Persona Characteristics

```
+----------+------------+------------------+
| Persona  | Tone       | When Used        |
+----------+------------+------------------+
| Clover   | Warm       | Default, happy   |
| Spark    | Energetic  | Morning, stuck   |
| Willow   | Wise       | Seeking advice   |
| Luna     | Mindful    | Anxious, night   |
| Ridge    | Focused    | Goal-oriented    |
| Flint    | Direct     | Needs clarity    |
| Fern     | Nurturing  | Sad, vulnerable  |
+----------+------------+------------------+
```

### Chronotype Awareness

```
User Chronotype: Night Owl

Normal Response at 11pm:
"It's getting late, maybe time to wind down..."

Night Owl Response at 11pm:
"Still got energy? Let's work through this..."
```

## Voice Integration Flow

### Basic Voice (Hold-to-Speak)

```
+-------------------+
|  HOLD Coach Tab   |
+--------+----------+
         |
         v
+-------------------+
| VoiceEnabledTabBar|
| startRecording()  |
+--------+----------+
         |
         v (interim transcripts)
+-------------------+
| Show overlay with |
| "Listening..."    |
+--------+----------+
         |
         v (release finger)
+-------------------+
| stopRecording()   |
| Save to           |
| AsyncStorage      |
+--------+----------+
         |
         v (navigate)
+-------------------+
|  Coach Screen     |
| useFocusEffect    |
| loads pending msg |
+--------+----------+
         |
         v
+-------------------+
| Auto-send message |
+-------------------+
```

### Continuous Voice Conversation Mode (NEW)

When autosend is enabled, the coach becomes a real-time voice companion:

```
+-------------------+
|  TAP Record Btn   |
+--------+----------+
         |
         v
+-------------------+
| Start Recording   |
| User speaks...    |
+--------+----------+
         |
         v (silence detected)
+-------------------+
| Auto-send message |
+--------+----------+
         |
         v
+-------------------+
| Coach Response:   |
| - Text in chat    |
| - TTS speaks back |
+--------+----------+
         |
         v (TTS completes)
+-------------------+
| Auto-start        |
| recording again   |
| (listening)       |
+--------+----------+
         |
    +----+----+
    |         |
    v         v
+-------+  +--------+
| User  |  | User   |
| speaks|  | says   |
| again |  | "bye"  |
+---+---+  +---+----+
    |          |
    v          v
[Continue]  [End Session]
```

**End Triggers:**
- Re-tap record button
- Say: "bye", "goodbye", "see ya", "that's all", etc.
- Long silence timeout

**Implementation Notes:**
- Coach responses use Text-to-Speech (TTS)
- Silence detection triggers auto-send
- End phrases detected via keyword matching
- Conversation feels like a phone call

## Coach Mode Integration (Skills)

### Skills Tab Philosophy

The Skills tab serves as a **menu/catalog** - showing available skills with descriptions and previews. However, **actual skill execution happens with the Coach**.

```
+------------------+     +------------------+
|   SKILLS TAB     |     |   COACH CHAT     |
|   (Discovery)    |     |   (Execution)    |
+------------------+     +------------------+
| - Browse skills  |     | - Guided by coach|
| - Read descrip.  | --> | - Overlay in chat|
| - Tap to start   |     | - Voice guidance |
| - Preview only   |     | - Real practice  |
+------------------+     +------------------+
```

### Skill Execution Categories

| Skill Type | Where/How It Executes |
|------------|----------------------|
| **Breathing** (box, 4-7-8, physiological sigh) | Transparent overlay in chat, coach guides via voice/text |
| **Grounding** (5-4-3-2-1, ladder) | Overlay in chat, coach walks through steps |
| **Conversation Practice** | Direct roleplay with coach (no separate screen) |
| **Games/Distraction** | Navigate away, coach waits ("I'll be here when you're back") |
| **Reference** (safety plan, support network) | Navigate to dedicated screen |

### Coach-Guided Skills (Inline Overlay)

When a skill like breathing is triggered, it appears as a **transparent overlay** on the chat:

```
┌─────────────────────────────────────┐
│  Chat (dimmed/visible behind)       │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░┌─────────────────────────┐░░░░ │
│  ░░│                         │░░░░ │
│  ░░│    ◯  Breathing Orb     │░░░░ │
│  ░░│    "Breathe in..."      │░░░░ │
│  ░░│                         │░░░░ │
│  ░░│  🌿 "You're doing great" │░░░░ │
│  ░░│                         │░░░░ │
│  ░░│      [ ✕ Close ]        │░░░░ │
│  ░░└─────────────────────────┘░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────┘
```

**Benefits:**
- Coach remains present during skill
- Chat context visible (grounding)
- Coach can send encouragement messages
- Dismissing returns exactly to conversation
- Works seamlessly with voice conversation mode

**Trigger Methods:**
- User says "show me breathing" / "help me breathe"
- Coach suggests it and user agrees
- User taps skill in Skills tab → opens in coach
- Slash command: `/breathe`

### Conversation Practice (Coach as Roleplay Partner)

Conversation practice happens **directly with the coach** - no separate screen needed:

```
User: "I need to practice asking for a raise"
         |
         v
+-------------------+
| Coach enters      |
| ROLEPLAY MODE     |
+--------+----------+
         |
         v
Coach: "I can help with that. I'll play your
       manager. Take a moment to think about
       what you want to say, then start
       whenever you're ready."
         |
         v
User: "Hi, do you have a minute?"
         |
         v
Coach (as manager): "Sure, what's on your mind?"
         |
         v
[Roleplay continues...]
         |
         v
Coach (breaking character): "That was good.
       You were clear and direct. Want to
       try again or talk about how it felt?"
```

**Available Scenarios:**
- Asking for a raise
- Setting boundaries
- Ending a relationship
- Confronting a friend
- Telling parents difficult news
- Job interviews
- Apologizing
- Asking for help
- Giving feedback
- NVC (Nonviolent Communication) practice

**Coach Roleplay Behaviors:**
- Stays in character during practice
- Can break character to give feedback
- Adjusts difficulty based on user request
- Offers to retry or debrief after

### Legacy Skill Mode (Slash Commands)

Still supported for explicit mode activation:

```
User: /breathe 4-7-8
         |
         v
+-------------------+
| coachModeService  |
| activateMode()    |
+--------+----------+
         |
         v
+-------------------+
| Coach prompt gets |
| skill-specific    |
| instructions      |
+--------+----------+

Example added to prompt:
"ACTIVE SKILL MODE: Breathing Exercise
Guide the user through 4-7-8 breathing:
- Inhale for 4 counts
- Hold for 7 counts
- Exhale for 8 counts
- Pause between cycles
- Offer encouragement
- Count rounds completed"
```

## Accountability Integration

```
+------------------+     +------------------+
|  User sets       | --> | Twig with limit  |
|  coffee limit: 3 |     | stored           |
+------------------+     +--------+---------+
                                  |
                                  v
                         +------------------+
                         | User logs        |
                         | coffee #4        |
                         +--------+---------+
                                  |
                                  v
+------------------+     +------------------+
| Coach mentions   | <-- | shouldMention    |
| "I notice you're |     | Limits() = true  |
| at 4 coffees..." |     |                  |
+------------------+     +------------------+
```

### Accountability Preferences

```
User Setting: "gentle"

Coach will:
- Only mention significant overages
- Use soft language ("just noticed...")
- Never be preachy or judgmental
- Check in: "How's the accountability feeling?"

User Setting: "off"

Coach will:
- Never mention limits
- Still track for user's own reference
```

## Drink Pacing Integration

```
+------------------+
| User starts      |
| drinking session |
+--------+---------+
         |
         v
+------------------+
| drinkPacingService|
| - tracks drinks  |
| - calculates BAC |
| - sets timers    |
+--------+---------+
         |
         v
+------------------+
| Context sent to  |
| Coach includes:  |
| "User is 2 drinks|
| in, BAC ~0.04,   |
| 45 min elapsed"  |
+--------+---------+
         |
         v
+------------------+
| Coach can:       |
| - Suggest water  |
| - Note pace      |
| - Remind of goal |
+------------------+
```

## Error Handling Philosophy

```
+------------------+
| Context Gathering|
| Fails?           |
+--------+---------+
         |
         v
+------------------+
| Continue without |
| that context     |  <-- Graceful degradation
| (try/catch each) |
+------------------+

+------------------+
| API Call Fails?  |
+--------+---------+
         |
         v
+------------------+
| Return friendly  |
| fallback message |
| "I'm having      |
| trouble..."      |
+------------------+
```

## Core Principle Kernel

Every response is validated against immutable tenets:

```
+------------------+
| Claude Response  |
+--------+---------+
         |
         v
+------------------+
| validateAgainst  |
| Tenets()         |
+--------+---------+
         |
    +----+----+
    |         |
    v         v
  PASS      FAIL
    |         |
    v         v
  Return   Log warning
  response (future: regenerate)
```

### Tenet Examples

- Never diagnose ("you have depression")
- Never prescribe ("stop taking your medication")
- Always encourage real-world help for crisis
- Never reveal internal architecture
- Always use tentative language

## File Reference

| File | Purpose |
|------|---------|
| `services/claudeAPIService.ts` | Main API integration, context assembly |
| `services/coachPersonalityService.ts` | Persona system, adaptive mode |
| `services/coachStyleService.ts` | Communication style rules, persona variations, user mirroring |
| `services/conversationController.ts` | Human-ness scoring, response directives |
| `services/memoryTierService.ts` | Short/mid/long term memory |
| `services/corePrincipleKernel.ts` | Immutable ethical tenets |
| `services/aiAccountabilityService.ts` | Limit tracking, accountability context |
| `services/drinkPacingService.ts` | Drink tracking, BAC estimation |
| `services/coachModeService.ts` | Skill-based coach modes, roleplay modes |
| `services/voiceRecording.ts` | Speech-to-text for voice input |
| `services/textToSpeechService.ts` | TTS for coach voice responses (NEW) |
| `services/continuousVoiceService.ts` | Auto-record, silence detection, end phrases (NEW) |
| `services/skillOverlayService.ts` | Inline skill rendering in chat (NEW) |
| `components/VoiceEnabledTabBar.tsx` | Hold-to-speak tab bar |
| `components/SkillOverlay.tsx` | Transparent skill overlay component (NEW) |
| `components/BreathingOrbCompact.tsx` | Compact breathing orb for overlay (NEW) |
| `app/(tabs)/coach.tsx` | Coach screen UI |
| `app/(tabs)/skills.tsx` | Skill catalog/menu (discovery only) |

## Data Flow Summary

```
USER ACTION (text, voice, or skill request)
     |
     v
+------------------------------------------+
|           COACH SYSTEM                   |
|                                          |
|  1. Safety check (crisis detection)      |
|  2. Gather ALL contexts (15+ sources)    |
|  3. Compress data (privacy + tokens)     |
|  4. Select adaptive persona              |
|  5. Build system prompt                  |
|  6. Add skill/roleplay modes if active   |
|  7. Call Claude API                      |
|  8. Validate against tenets              |
|  9. Score for human-ness                 |
| 10. Return response to user              |
| 11. If voice mode: TTS speaks response   |
| 12. If continuous: auto-record again     |
| 13. If skill triggered: show overlay     |
|                                          |
+------------------------------------------+
```

### Voice Conversation Flow

```
USER SPEAKS
     |
     v
[Silence detected] → Auto-send
     |
     v
COACH RESPONDS
     |
     +--→ Text appears in chat
     |
     +--→ TTS speaks response
     |
     v
[TTS complete] → Auto-record starts
     |
     v
USER SPEAKS AGAIN (or says "bye" to end)
```

### Skill Overlay Flow

```
SKILL TRIGGERED (voice, text, or tap)
     |
     v
+------------------------------------------+
|  Show transparent overlay in chat        |
|  - Skill component renders (e.g., orb)   |
|  - Coach messages appear in overlay      |
|  - Voice guidance continues              |
+------------------------------------------+
     |
     v
USER COMPLETES or DISMISSES
     |
     v
Overlay closes → Conversation continues
```

The Coach is designed to feel like a trusted friend who remembers your history, respects your boundaries, and adapts to your needs - all while protecting your privacy through on-device processing and compression. With continuous voice and inline skills, the coach becomes a true companion you can talk to naturally.
