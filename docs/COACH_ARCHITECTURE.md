# Coach Architecture & Integration

This document explains how the Coach system integrates throughout Mood Leaf, including adaptive behavior, context compression, and data flow.

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

## Coach Mode Integration (Skills)

When a user starts a skill exercise, Coach enters a specialized mode:

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
| `services/conversationController.ts` | Human-ness scoring, response directives |
| `services/memoryTierService.ts` | Short/mid/long term memory |
| `services/corePrincipleKernel.ts` | Immutable ethical tenets |
| `services/aiAccountabilityService.ts` | Limit tracking, accountability context |
| `services/drinkPacingService.ts` | Drink tracking, BAC estimation |
| `services/coachModeService.ts` | Skill-based coach modes |
| `services/voiceRecording.ts` | Speech-to-text for voice input |
| `components/VoiceEnabledTabBar.tsx` | Hold-to-speak tab bar |
| `app/(tabs)/coach.tsx` | Coach screen UI |

## Data Flow Summary

```
USER ACTION
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
|  6. Add skill modes if active            |
|  7. Call Claude API                      |
|  8. Validate against tenets              |
|  9. Score for human-ness                 |
| 10. Return response to user              |
|                                          |
+------------------------------------------+
```

The Coach is designed to feel like a trusted friend who remembers your history, respects your boundaries, and adapts to your needs - all while protecting your privacy through on-device processing and compression.
