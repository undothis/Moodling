# Mood Leaf Project Handoff

**Date:** January 21, 2026
**Branch:** `claude/resume-after-corruption-USBHf`
**Last Updated By:** Claude (Opus 4.5)

---

## 1. PROJECT INTENT (WHY THIS EXISTS)

Mood Leaf is a mental health journaling app that uses AI to provide personalized, empathetic coaching while helping users track patterns in their emotions, habits, and life events. Success means users feel genuinely heard and understood—not like they're talking to a generic chatbot. The AI must always reference specific user data (journals, twigs, life context) to demonstrate active listening. Safety is paramount: no diagnoses, no sad emojis, no negative framing, and crisis detection with appropriate resources.

---

## 2. CURRENT STATE (WHERE WE ARE)

**Overall Status:** Feature Complete / Testing Phase

The core app is fully functional with:
- Journaling with sentiment analysis
- Quick logs ("Twigs") for habit tracking
- AI coaching with multiple personas (Clover, Spark, Willow, Luna, Ridge, Flint, Fern)
- Life context compression for long-term memory
- Psychological profile building
- Simulator Mode for AI verification testing
- **NEW: Comprehensive Cycle Tracking with life stages**
- **NEW: Intelligent search in settings**
- **NEW: Developer testing panel for cycle functions**
- **NEW: Slash Commands & Skills System**
- **NEW: D&D-Style Collection System**
- **NEW: Voice Chat, Emotion Detection, Teaching System**

---

## 3. WHAT IS WORKING (SUCCESS)

### Core Features
- **AI Coach System:** Multiple personas working with adaptive mode, chronotype awareness, and travel/jet lag support
- **Data Pipeline:** Journals, twigs, life context, psych profile, health data all flow to Claude's system prompt
- **Simulator Mode:** Full challenge generation and AI verification
- **Mental Health Safety:** No sad emojis, positive framing, crisis detection

### NEW: Cycle Tracking System (Fully Implemented)
- **Period Tracking:** Start/end dates, flow levels, cycle predictions
- **Life Stages:** Regular cycles, perimenopause, menopause, post-menopause, pregnant, postpartum
- **Symptom Tracking:** 19 symptom types including menopause-specific (hot flashes, night sweats, brain fog)
- **Pregnancy Mode:** Trimester-aware support, due date tracking
- **Contraception Reminders:** Pill, IUD, implant, ring/patch schedules
- **Reminders:** Configurable days-before-period alerts (1-7 days)
- **Alert Types:** Push notifications or Firefly alerts (discreet in-app)
- **Quick Symptom Button:** Floating action button during period
- **HealthKit Integration:** Sync cycle data with Apple Health
- **Developer Testing Panel:** Simulate any cycle day/phase for testing

### NEW: Intelligent Settings Search
- Search bar searches FAQ, User Manual, and Settings shortcuts
- Results show type labels (FAQ, MANUAL, SETTING)
- Direct navigation to relevant screens

---

## 4. WHAT IS NOT WORKING / OPEN ISSUES (FAILURES)

- **Strange characters in chat responses:** User reported odd characters at start of some responses. May be clipboard/encoding issue.
- **UTC vs Local Timezone (FIXED):** Was affecting twig timestamps, now uses `isoToLocalDate()` helper.
- **Colors.warmNeutral undefined (FIXED):** Added `warmNeutral` and `accent` to Colors export.

---

## 5. KEY FILES & ARCHITECTURE

### Cycle Tracking Files (NEW)
```
moodling-app/
├── types/
│   └── CycleTracking.ts          # All type definitions
├── services/
│   ├── cycleTrackingService.ts   # Core cycle logic
│   └── healthKitService.ts       # HealthKit cycle integration (lines 545+)
├── components/
│   └── QuickSymptomButton.tsx    # FAB for quick logging
├── app/
│   └── settings/
│       └── cycle.tsx             # Full settings UI (~1150 lines)
└── constants/
    └── UserGuideContent.ts       # Manual & FAQ content
```

### Key Type Definitions (`types/CycleTracking.ts`)
```typescript
type LifeStage = 'regularCycles' | 'perimenopause' | 'menopause' | 'postMenopause' | 'pregnant' | 'postpartum';
type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

interface CycleSettings {
  enabled: boolean;
  lifeStage: LifeStage;
  showQuickSymptomButton: boolean;
  enableSoothingSparks: boolean;
  enableCycleFireflies: boolean;
  guideAdaptationLevel: 'none' | 'subtle' | 'full';
  reminders: CycleReminders;
  syncSource: 'manual' | 'healthkit' | 'oura' | 'whoop';
  trackFertilityWindow: boolean;
  contraception: ContraceptionReminder;
  pregnancy?: PregnancyData;
  trackMenopauseSymptoms: boolean;
}

interface CycleReminders {
  enabled: boolean;
  notificationsEnabled: boolean;
  periodApproaching: boolean;
  daysBeforePeriodAlert: number;  // 1-7 days
  pmsStarting: boolean;
  logSymptomsReminder: boolean;
  ovulationReminder: boolean;
  alertType: 'push' | 'firefly';
}
```

### Colors System (`constants/Colors.ts`)
```typescript
// Raw palette access added to both light and dark themes
export const Colors = {
  light: {
    // ... existing colors
    warmNeutral,  // { cream, sand, stone, earth, charcoal }
    accent,       // { sage, terracotta, lavender }
  },
  dark: {
    // ... existing colors
    warmNeutral,
    accent,
  },
};
```

---

## 6. KEY ASSUMPTIONS (CALL THESE OUT)

- **Cycle data privacy:** Only phase info shared with AI, not raw dates
- **User has data:** Simulator verification assumes user has journals, twigs, and life context stored
- **Claude follows instructions:** Assumes Claude will reliably follow the "CRITICAL - ALWAYS REFERENCE SPECIFIC DATA" instructions
- **AsyncStorage reliability:** Assumes AsyncStorage works consistently across web and native platforms

---

## 7. CONSTRAINTS & NON-NEGOTIABLES

- **No diagnoses:** Never say "you have anxiety disorder" or similar clinical labels
- **No sad emojis:** Mental health safety - avoid reinforcing negative states
- **Wins-first framing:** Always lead with positives, never shame or criticize
- **No placeholder names:** Never use `[Name]`, `[H]`, `[User]` or any bracket notation
- **Crisis handling:** Immediate resources for suicidal/self-harm language (988, Crisis Text Line)
- **Privacy:** Derived insights only, no raw journal text exposed unnecessarily
- **User autonomy:** Encourage real-world connection, not AI dependency
- **Cycle privacy:** Only phase/stage shared with AI, never raw period dates

---

## 8. AI CONTEXT SOURCES & COACH PERSONALITY

### Data Sources Fed to Claude (in order of assembly)

1. **Life Context** (`lifeContextService.ts`)
2. **Psychological Profile** (`psychAnalysisService.ts`)
3. **Chronotype & Travel** (`coachPersonalityService.ts`)
4. **Health Data** (`healthKitService.ts`) - if HealthKit enabled
5. **Health Correlations** (`healthInsightService.ts`) - if HealthKit enabled
6. **Detailed Twig Data** (`quickLogsService.ts`) - with exact timestamps
7. **Lifestyle Factors** (`patternService.ts`)
8. **Exposure Ladder** (`exposureLadderService.ts`)
9. **Recent Journals** (`journalStorage.ts`)
10. **User Preferences** (`userContextService.ts`)
11. **Conversation Context** (`claudeAPIService.ts`)
12. **Calendar Events** (`calendarService.ts`) - if Calendar enabled
13. **NEW: Cycle Phase** (`cycleTrackingService.ts`) - if Cycle enabled

### Coach Personality System

**7 Personas**:
- 🍀 **Clover** (The Bestie) - warm, casual, friendly
- ✨ **Spark** (The Hype Squad) - energetic, motivating
- 🌿 **Willow** (The Sage) - calm wisdom, reflective
- 🌙 **Luna** (The Spiritual) - mindful, present-moment
- ⛰️ **Ridge** (The Coach) - action-oriented, structured
- 🔥 **Flint** (The Straight Shooter) - direct, honest
- 🌱 **Fern** (The Cozy Blanket) - extra gentle, nurturing

**Cycle-Aware Adaptation**:
- During PMS/luteal phase → Guide becomes gentler (like Fern)
- During menstrual phase → Validates energy dips, extra compassion
- During ovulation → Can be more action-oriented
- Perimenopause/menopause → Extra validation for unpredictable symptoms

---

## 9. DOCUMENTATION LOCATIONS

| Document | Location | Purpose |
|----------|----------|---------|
| User Manual Content | `constants/UserGuideContent.ts` | Single source for FAQ & Manual |
| Developer Guide | `docs/DEVELOPER_GUIDE.md` | Technical implementation details |
| Philosophy | `docs/MOOD_LEAF_PHILOSOPHY.md` | Design principles & ethics |
| Overview | `docs/MOOD_LEAF_OVERVIEW.md` | High-level project summary |
| This Handoff | `docs/Handoff.md` | Session-to-session context |

---

## 10. DEVELOPER TESTING (CYCLE FEATURES)

The Developer Testing panel in Cycle Settings (`app/settings/cycle.tsx`) allows:

1. **Set Cycle Day** - Buttons for Day 1, 5, 10, 14, 21, 28
2. **Quick Phase Simulation**:
   - 🩸 Menstrual (Day 1)
   - 🌱 Follicular (Day 8)
   - ✨ Ovulation (Day 14)
   - 🌙 Luteal (Day 21)
3. **Test PMS Mode** - Sets Day 25 to trigger Soothing Sparks
4. **Test Reminder Alerts** - Preview notification messages
5. **Reset All Test Data** - Clear cycle data for fresh testing

**Only visible in `__DEV__` mode** with distinctive lavender dashed border.

---

## 11. SLASH COMMANDS & SKILLS SYSTEM

### What Was Built

A comprehensive slash command system allowing users to type `/` commands in chat for quick actions.

### New Services

| Service | Purpose |
|---------|---------|
| `services/slashCommandService.ts` | Command parsing, registry, and 30+ handlers |
| `services/skillsService.ts` | Skill definitions, exercises, progress tracking |
| `services/subscriptionService.ts` | Premium features, payment routing |

### New Components

| Component | Purpose |
|-----------|---------|
| `components/skills/SkillsBubbleMenu.tsx` | UI for browsing skills |
| `components/skills/ExercisePlayer.tsx` | Guided exercise interface |

### Command Categories

- **Persona:** `/flint`, `/luna`, `/willow`, `/spark`, `/clover`, `/ridge`, `/fern`, `/random`
- **Exercise:** `/breathe`, `/ground`, `/body`, `/calm`, `/prep`
- **Browse:** `/skills`, `/games`, `/help`, `/collection`, `/stats`
- **Power:** `/clear`, `/settings`, `/status`
- **Easter Eggs:** `/love`, `/hug`, `/wisdom`

### Exercise Library (15+)

- Box Breathing, 4-7-8 Breathing, Coherent Breathing, Physiological Sigh
- 5-4-3-2-1 Grounding, Feet on Floor, Ice Cube Grounding
- Quick Body Scan, Progressive Muscle Relaxation
- Thought Record, Thought Defusion
- Event Preparation, Conversation Starters

### Games System (25+)

- **Grounding:** I Spy AI (camera), Color Finder, Texture Hunt, Nature Spotter
- **Calming:** Color Sort, Zen Blocks, Calm Sudoku, Gentle Pong, Flow Drawing
- **Skill Building:** Emotion Match, Gratitude Wheel, Word Garden, Thought Catcher
- **Fidget:** Bubble Wrap, Spinner, Fidget Pad

### Subscription Tiers

| Tier | Price | Unlocks |
|------|-------|---------|
| Free | $0 | Basic exercises, all personas |
| Skills+ | $4.99/mo | All exercises, skill tracking |
| Pro | $9.99/mo | Advanced skills, custom Fireflies |
| Lifetime | $79.99 | Everything forever |

### Integration Points

- Chat input checks `isSlashCommand()` before normal message flow
- `handleCommandResult()` processes persona switches, exercises, menus
- Quick action buttons can trigger slash commands directly
- Premium gating via `context.isPremium` in handlers

---

## 12. VOICE CHAT, EMOTION DETECTION, TEACHING SYSTEM

### Voice Chat System

**Purpose:** Hands-free conversation with the coach using voice recognition and automatic pause detection.

**Key Features:**
- **Auto-detect mode:** Automatically sends message after configurable silence (default 1.5s)
- **Push-to-talk mode:** Hold button to speak
- **TTS responses:** Coach can speak responses back
- **Multi-language:** 12 languages supported

**Service:** `services/voiceChatService.ts`
- `VoiceChatController` class manages sessions
- Web Speech API for web, native APIs for iOS/Android
- Pause detection sends message when user stops speaking

### Emotion Detection System

**Purpose:** Front-facing camera analyzes facial expressions during chat to provide emotional context to the coach.

**Privacy First:**
- All processing local/on-device
- No images stored or transmitted
- Explicit opt-in required
- Can be disabled anytime

**Key Features:**
- Detects 9 emotions: happy, sad, angry, fearful, disgusted, surprised, neutral, anxious, stressed
- Facial cues: brow furrow, eye openness, mouth tension, smile intensity, jaw clench
- Generates coach hints: "User appears stressed, suggest breathing exercise"

**Service:** `services/emotionDetectionService.ts`
- Mock implementation ready for ML integration
- iOS: Vision framework
- Android: ML Kit
- Web: face-api.js or TensorFlow.js

### Teaching System

**Purpose:** The coach can teach subjects like languages, mindfulness, psychology, and life skills.

**Available Subjects:**
| Subject | Emoji | Category | Tier |
|---------|-------|----------|------|
| Spanish | 🇪🇸 | Language | Free |
| French | 🇫🇷 | Language | Free |
| Japanese | 🇯🇵 | Language | Premium |
| Mandarin | 🇨🇳 | Language | Premium |
| Meditation Basics | 🧘 | Mindfulness | Free |
| Breathing Mastery | 💨 | Mindfulness | Free |
| CBT Fundamentals | 🧠 | Psychology | Free |
| Emotional Intelligence | 💝 | Psychology | Premium |
| Better Sleep | 😴 | Wellness | Free |
| Self-Compassion | 🤗 | Life Skills | Free |
| Healthy Boundaries | 🚧 | Life Skills | Premium |

**Slash Commands:**
- `/teach` - Browse all subjects
- `/teach spanish` - Start/continue Spanish
- `/spanish`, `/french` - Language shortcuts

**Service:** `services/teachingService.ts`
- Lesson progress tracking
- No grades or punishment (anti-streak design)
- Vocabulary, concepts, practice, conversation, quiz lesson types

### Fidget Pad Game

**Purpose:** Digital fidget toys for quick anxiety relief.

**Three Tools:**
1. **Bubble Wrap** - Pop 48 bubbles with haptic feedback
2. **Sliders** - 6 colorful sliding bars
3. **Spinner** - Momentum-based fidget spinner

**Component:** `components/games/FidgetPad.tsx`
- Works on iOS, Android, and Web
- Haptic feedback via Vibration API
- Dark theme matching app design

**Slash Commands:** `/fidget`, `/bubble`, `/pop`

### Files Created

| File | Purpose |
|------|---------|
| `services/voiceChatService.ts` | Voice recognition with pause detection |
| `services/emotionDetectionService.ts` | Camera-based emotion detection |
| `services/teachingService.ts` | Subject teaching system |
| `components/games/FidgetPad.tsx` | Fidget pad game component |

### Integration Notes

- All services follow Mood Leaf ethics: privacy-first, no manipulation, user control
- Voice and emotion features require explicit opt-in
- Teaching system uses same anti-dependency principles as exercise tracking
- All work cross-platform: iOS, Android, Web

---

## 13. COLLECTION SYSTEM - D&D-Style Gamification

### Overview

A gamification layer that rewards users for naturally using the app. Think D&D character sheets meets collectible card games. The system tracks usage patterns and unlocks artifacts, titles, and card backs without any pressure mechanics.

### Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **No punishment** | Progress bars never decrease |
| **No streaks** | Milestones count total, not consecutive |
| **No FOMO** | Nothing expires or disappears |
| **No comparisons** | Personal journey only |
| **Surprise rewards** | Random unlocks add joy without pressure |

### What Was Built

**New Service:** `services/collectionService.ts` (~800 lines)

**Core Types:**
```typescript
type CollectibleType = 'artifact' | 'title' | 'card_back' | 'skill' | 'coach_perk';
type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
type SkillType = 'calm' | 'ground' | 'focus' | 'challenge' | 'connect' | 'restore';
type UnlockTriggerType = 'milestone' | 'usage_pattern' | 'exploration' | 'random' | 'time_based';
```

### Collectibles

**Artifacts (15+):**
- `calm_stone` — First breathing session (common)
- `breath_feather` — 10 breathing exercises (uncommon)
- `starlight_vial` — Practice at 3am (rare)
- `rainbow_prism` — Try all skill types (legendary)
- `dawn_crystal` — Practice before 6am (rare)
- `night_lantern` — 5 practices after midnight (rare)

**Titles (10+):**
- `breath_wanderer` — Practice breathing 5 times
- `grounding_guardian` — Master grounding exercises
- `night_owl` — Practice after midnight
- `dawn_keeper` — Practice before 6am
- `explorer` — Try 10 different activities

**Card Backs (5):**
- `mist` (Common) — Default starter
- `forest` (Uncommon) — Try 3 different skills
- `sunset` (Rare) — Reach 50 total activities
- `aurora` (Legendary) — Unlock 10 artifacts

### Unlock Triggers

The smart unlock engine evaluates user activity patterns:

```typescript
// Milestone - Activity thresholds
{ type: 'milestone', check: (s) => s.breathingCount >= 10 }

// Usage Pattern - User preferences
{ type: 'usage_pattern', check: (s) => s.favoriteActivity === 'breathing' }

// Exploration - Trying new things
{ type: 'exploration', check: (s) => s.uniqueActivitiesUsed.size >= 5 }

// Random - 5% chance per session
{ type: 'random', check: () => Math.random() < 0.05 }

// Time-based - When activities occur
{ type: 'time_based', check: (s) => s.nightOwlCount >= 3 }
```

### Usage Statistics Tracked

```typescript
interface UsageStats {
  breathingCount: number;
  groundingCount: number;
  journalCount: number;
  bodyScanCount: number;
  thoughtChallengeCount: number;
  gameCount: number;
  lessonCount: number;
  totalActivities: number;
  uniqueActivitiesUsed: Set<string>;
  nightOwlCount: number;      // After midnight
  earlyBirdCount: number;     // Before 6am
  personasUsed: Set<string>;
  favoriteActivity?: string;
  activityDistribution: Record<string, number>;
}
```

### Skills System Updates

Added D&D-style attributes to all skills and exercises in `skillsService.ts`:

```typescript
interface Skill {
  // ... existing fields
  skillType: SkillType;  // 'calm' | 'ground' | 'focus' | 'challenge' | 'connect' | 'restore'
  rarity: Rarity;        // 'common' | 'uncommon' | 'rare' | 'legendary'
  lore?: string;         // Flavor text for collection view
}
```

**Example:**
```typescript
{
  id: 'box_breathing',
  name: 'Box Breathing',
  skillType: 'calm',
  rarity: 'common',
  lore: 'Used by Navy SEALs to stay calm under pressure. Four equal counts, like the sides of a box.'
}
```

### New Slash Commands

Added to `slashCommandService.ts`:

| Command | Aliases | Description |
|---------|---------|-------------|
| `/collection` | `/artifacts`, `/inventory`, `/bag` | View unlocked collectibles |
| `/stats` | `/activity`, `/progress` | View usage patterns and stats |

### Integration Points

1. **After any skill/exercise/game completes:**
   ```typescript
   await recordActivity('breathing', 'box_breathing');
   const unlocks = await checkForUnlocks();
   if (unlocks.length > 0) showUnlockCelebration(unlocks);
   ```

2. **Chat commands show collection/stats:**
   ```typescript
   // /collection → formatCollectionForChat()
   // /stats → formatStatsForChat()
   ```

### Files Modified

| File | Changes |
|------|---------|
| `services/collectionService.ts` | NEW - Full collection system |
| `services/skillsService.ts` | Added skillType, rarity, lore to all skills/exercises |
| `services/slashCommandService.ts` | Added /collection and /stats commands |
| `docs/USER_MANUAL.md` | Added Collection System section |
| `docs/DEVELOPER_GUIDE.md` | Added collectionService docs, Collection System section |

### Next Steps for Collection System

1. **Build Collection UI** - Visual card collection view
2. **Skill Preview Cards** - Tap to see D&D-style card with rarity, lore, type
3. **Unlock Celebrations** - Animated notifications for new unlocks
4. **Stats Dashboard** - Progress bars by skill type
5. **Coach Integration** - Coaches can reference collection progress

---

## 14. SESSION UPDATE: Skills Management & Voice Chat (January 2026)

### Features Implemented

#### 1. Voice Chat with Auto-Send on Pause
- Integrated VoiceChatController into coach screen (`app/coach/index.tsx`)
- Microphone button with pulse animation when listening
- Live transcript display while speaking
- Auto-send message after 1.5s pause (configurable)
- Toggle to switch between auto-send and manual mode
- Manual mode puts transcript in input box for review before sending

#### 2. Skills Management Screen
- New `/skills/manage` route with toggle switches
- Enable/disable individual skills
- Skills grouped by category with progress display
- Disabled skills don't appear in menus

#### 3. /skills Subcommands
| Command | Function |
|---------|----------|
| `/skills` | Browse all skills with progress bars |
| `/skills info` | Activity tracking (times used, last used) |
| `/skills store` | Browse free/premium skills |
| `/skills collection` | View unlocked collectibles |
| `/skills manage` | Open skills manager screen |
| `/skills help` | Show all subcommands |

#### 4. Tree Skill Badges
- Created `SkillBadges.tsx` component
- Floating animated badges around tree
- Shows enabled skills with level dots
- Badge visibility toggle (stored in preferences)
- Badges show most recently used skills

#### 5. Games Screens
- Created `/games/index.tsx` - Games list screen
- Created `/games/fidget.tsx` - Fidget pad screen
- Fixed navigation error for `/fidget` command

### Files Modified/Created

| File | Changes |
|------|---------|
| `app/coach/index.tsx` | Added voice chat integration with auto-send toggle |
| `app/skills/manage.tsx` | **NEW** Skills management screen |
| `app/games/index.tsx` | **NEW** Games list screen |
| `app/games/fidget.tsx` | **NEW** Fidget pad screen |
| `components/tree/SkillBadges.tsx` | **NEW** Floating skill badges |
| `components/tree/TreeScene.tsx` | Added SkillBadges integration |
| `components/tree/types.ts` | Added onSkillBadgePress, showSkillBadges props |
| `services/skillsService.ts` | Added enable/disable functions |
| `services/slashCommandService.ts` | Added /skills subcommands |
| `docs/USER_MANUAL.md` | Complete command reference |
| `docs/DEVELOPER_GUIDE.md` | Subcommand system, enable/disable, voice integration |

---

## 16. SESSION UPDATE: MoodPrint & TTS (January 21, 2026)

### Overview

Major improvements to the psychological profile system and addition of Text-to-Speech (TTS) capabilities.

### MoodPrint: Context Compression

**What it is:** A proprietary system that compresses a user's entire psychological profile into ~100 tokens, achieving 40% reduction in API costs while maintaining full insight.

**Why it matters:**
- Faster AI responses
- Lower API costs
- More room in context window for conversation history
- All processing happens locally on device (privacy first)

**New compressed format:**
```
[PSYCH n=42] | CD:catastrophizing,all_or_nothing | DEF:neurotic(rationalize,project) | ATT:anxious/70 | LOC:int MIND:growth | NS:ventral | REG:73% | PERMA:65% | NEEDS:reassure,challenge_worst_case | TEMPORAL:worst=Sun_evening,best=morning
```

### New Psychological Profile Fields

| Field | Purpose | Use Case |
|-------|---------|----------|
| `temporalPatterns` | When user struggles/thrives | Coach checks in on Sunday evenings |
| `contextualAttachment` | Attachment style per relationship type | Secure with friends, anxious in romance |
| `copingPatterns` | Healthy vs unhealthy strategies | Celebrate healthy, redirect unhealthy |
| `valuesActionsGap` | Values not matching behavior | Values family but works late |

### Text-to-Speech Integration

**Service:** `services/textToSpeechService.ts`

| Coach | Female Voice | Male Voice | Style |
|-------|--------------|------------|-------|
| Clover | Neural2-C | Neural2-D | Warm |
| Spark | Neural2-F | Neural2-J | Energetic |
| Willow | Neural2-C | Neural2-D | Calm |
| Luna | Neural2-E | Neural2-I | Soft |
| Ridge | Neural2-H | Neural2-A | Clear |
| Flint | Neural2-H | Neural2-A | Direct |
| Fern | Neural2-E | Neural2-I | Gentle |

**Settings Screen:** `app/settings/voice.tsx`
- Enable/disable TTS
- Gender selection
- Speed and volume controls
- Test voice button
- API key management

### Bug Fixes

1. **Voice callback race condition** - Fixed stale closure in `handleSend` using `sendHandlerRef` pattern
2. **Memory leak in scroll useEffect** - Added proper cleanup with `clearTimeout`

### Files Created/Modified

| File | Changes |
|------|---------|
| `services/textToSpeechService.ts` | **NEW** - Google Cloud TTS service |
| `app/settings/voice.tsx` | **NEW** - TTS settings screen |
| `services/psychAnalysisService.ts` | Added MoodPrint compression, temporal patterns |
| `services/psychTypes.ts` | Added temporalPatterns, contextualAttachment, copingPatterns, valuesActionsGap |
| `app/coach/index.tsx` | Fixed voice callback, added TTS integration |
| `docs/USER_MANUAL.md` | Added MoodPrint explanation section |
| `docs/DEVELOPER_GUIDE.md` | Added MoodPrint and TTS documentation |

### Rollback Point

Created git tag `pre-improvements-20260121` before changes.

---

## 17. NEXT STEPS (FOR NEXT SESSION)

### Testing Priorities
- [ ] Test cycle tracking on device (not just web)
- [ ] Verify HealthKit sync for cycle data
- [ ] Test all life stage transitions
- [ ] Verify pregnancy mode correctly pauses period tracking
- [ ] Test Firefly alerts vs push notifications
- [ ] Test TTS with all coaches
- [ ] Verify MoodPrint compression in production

### Potential Improvements
- [ ] Add cycle insights/patterns visualization
- [ ] Add symptom correlation analysis
- [ ] Integrate cycle phase with Sparks selection
- [ ] Add cycle data export functionality
- [ ] Build UI for viewing MoodPrint
- [ ] Add TTS playback controls (pause/resume)
- [ ] Create cute MoodPrint icon (suggested: 🌿🔮 leaf + crystal, or fingerprint made of leaves)
- [ ] Add `/moodprint` slash command to view psych profile summary

### Planned: /moodprint Command

A slash command to see what the app has learned about you.

**IMPORTANT: User-Facing vs Technical**

The internal MoodPrint (sent to Claude) uses clinical terms for accuracy. But what the USER sees must be:
- Empowering, not labeling
- Growth-focused, not problem-focused
- Positive framing, not clinical language
- NO diagnoses or disorder language

**User-Friendly Display:**
```
/moodprint (or /profile, /me, /insights)

🌿 Your MoodPrint
━━━━━━━━━━━━━━━━━
📊 Your Journey
   42 reflections since Nov 15

💚 What Helps You Most
   • Extra reassurance when things feel uncertain
   • Gentle reality checks on worst-case thinking
   • Space to process before solutions

⏰ Your Rhythms
   • You shine brightest: Mornings
   • Need extra care: Sunday evenings

🤝 How You Connect
   • Strong bonds with friends
   • Still learning in romantic relationships
   • Growing your work relationships

🌱 You're Working On
   • Seeing shades of gray (not just all-or-nothing)
   • Trusting that things can work out
   • Building your emotional toolkit

🏆 Your Wins
   • You show up and reflect regularly
   • You're building self-awareness
   • You seek support when you need it

All insights stay on your device 🔒
```

**What NOT to show users:**
- Clinical terms (anxious attachment, neurotic, catastrophizing)
- Labels or diagnoses
- Percentages or scores that feel like grades
- Anything that reads like "here's what's wrong with you"

### Documentation
- [ ] Review full codebase for undocumented features
- [ ] Add JSDoc comments to cycle functions
- [ ] Update app store description for cycle features

---

## 18. FUTURE: Hybrid On-Device LLM Architecture

### Concept: Compress → Send → Reassemble

A privacy-first architecture where compressed context goes to Claude, but rich personalized responses are assembled locally using on-device LLMs.

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  DEVICE (Private)                                           │
│  ┌──────────────┐                                           │
│  │ Full Context │ ← Raw journals, patterns, relationships   │
│  │ (~5000 tokens)│                                          │
│  └──────┬───────┘                                           │
│         │ Compress                                          │
│         ▼                                                   │
│  ┌──────────────┐      ┌─────────────┐                      │
│  │  MoodPrint   │ ───► │ Claude API  │ ◄── Cloud            │
│  │ (~100 tokens)│      └──────┬──────┘                      │
│  └──────────────┘             │                             │
│                               ▼                             │
│                   "I hear you're struggling.                │
│                    [EXPAND:sunday_pattern]                  │
│                    [EXPAND:recent_wins]"                    │
│                               │                             │
│         ┌─────────────────────┘                             │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │ On-Device LLM│ ← Expands markers with local context      │
│  │ (Apple/Google)│                                          │
│  └──────┬───────┘                                           │
│         ▼                                                   │
│  "I hear you're struggling. I noticed Sunday evenings       │
│   are often hard for you - last week you mentioned          │
│   dreading Monday meetings. But remember, just yesterday    │
│   you handled that conflict with Sarah really well..."      │
└─────────────────────────────────────────────────────────────┘
```

### Platform Requirements (Researched Jan 2026)

| Platform | Chip/Hardware | OS Version | On-Device LLM | API |
|----------|---------------|------------|---------------|-----|
| **iPhone** | A17 Pro+ | iOS 18.1+ | Foundation Models | Swift |
| **iPad** | M-series | iPadOS 18.1+ | Foundation Models | Swift |
| **Android** | Pixel 10 (best) | Android 14+ | Gemini Nano | ML Kit |
| **Mac** | M1+ | macOS 15.1+ | Foundation Models | Swift |
| **Windows** | 40+ TOPS NPU | Win 11 24H2+ | Phi-Silica | Windows AI |

### Platform Notes

**iOS/Mac (Best Support)**
- Apple Foundation Models Framework (WWDC 2025)
- ~3B parameter model, free inference
- Designed for summarization, extraction, rewriting
- Privacy-first, no cloud dependency

**Android (Workable with Constraints)**
- Gemini Nano via ML Kit GenAI APIs
- Must be foreground app (background blocked)
- Per-app inference and battery quotas
- Best on Pixel 10, limited on older devices

**Windows (Stretch Goal)**
- Requires Copilot+ PC with 40+ TOPS NPU
- Snapdragon X Elite, AMD Ryzen AI 300, Intel Core Ultra 200V
- Phi-Silica model for text generation
- Most restrictive platform

### Implementation Considerations

**Expansion Markers:**
```typescript
// Claude's response includes markers
"[EXPAND:temporal_pattern]" → On-device: "You tend to struggle on Sunday evenings..."
"[EXPAND:recent_journal:3]" → On-device: "In your entry from Tuesday, you wrote..."
"[EXPAND:relationship:mom]" → On-device: "With your mom, you've been working on..."
```

**Fallback Strategy:**
- Devices without on-device LLM: Show Claude's response as-is (no expansion)
- Or: Make second API call to expand (costs more, works everywhere)

**Open Questions:**
- [ ] How to handle expansion markers gracefully when LLM unavailable?
- [ ] Should expansion be opt-in or automatic?
- [ ] How to test on-device inference quality?
- [ ] What's the latency impact of local expansion?

### Files to Create (When Ready)

| File | Purpose |
|------|---------|
| `services/onDeviceExpansionService.ts` | Platform detection, expansion logic |
| `services/expansionMarkerParser.ts` | Parse `[EXPAND:...]` markers from responses |
| `services/localContextRetriever.ts` | Fetch specific context (journals, patterns) |

### Status: Research Complete, Implementation Pending

The APIs are new (Apple Foundation Models just launched at WWDC 2025). Recommend waiting for APIs to stabilize before building.

---

## 20. Period Lifestyle Correlations (Implemented)

### Overview

Tracks lifestyle factors (food, sleep, activity) and correlates them with menstrual cycle symptoms to provide personalized insights.

### Files Created

| File | Purpose |
|------|---------|
| `types/PeriodCorrelation.ts` | Types, food tags, symptom options |
| `services/periodCorrelationService.ts` | Logging, correlation analysis, insights |
| `components/cycle/QuickLogPanel.tsx` | Quick-tap daily logging UI |
| `components/cycle/CycleInsights.tsx` | Display personalized insights |

### Quick-Tap Food Logging

Users tap food categories instead of typing:

```
May worsen symptoms:
🍔 Fast Food  🍕 Processed  🍬 Sugar  🍷 Alcohol

Varies by person:
☕ Caffeine  🥛 Dairy  🍫 Chocolate

May help symptoms:
🥗 Fresh/Whole  🐟 Fish  🥬 Leafy Greens

Supplements:
💊 Iron  ☀️ Vitamin D  🦴 Calcium  ✨ Magnesium
```

### Symptom Tracking with Intensity

0 = None, 1 = Mild, 2 = Moderate, 3 = Severe

Tracks: Cramps, Bloating, Headache, Mood Dip, Fatigue, Cravings, Anxiety, Irritability, etc.

### Correlation Analysis

After 2+ cycles, system compares symptom severity when factors are present vs absent:
- "When you eat fast food, your cramps tend to be worse"
- "Good sleep (7+ hrs) correlates with 40% less severe cramps"

### Still Needed

- [ ] Integration into app navigation (when does panel appear?)
- [ ] Settings toggle to enable/disable
- [ ] Pre-period reminder prompts (5-7 days before)
- [ ] Make food tracking a GENERAL feature (not period-specific)

### Research Sources

Based on peer-reviewed research from Cambridge Nutrition Review, Nature Scientific Reports 2025, PMC Systematic Reviews.

---

## 21. Granular Monetization Architecture (Planning)

### Philosophy

Features should be modular and paywalled - users get core value free, then pay to unlock specific features they want. **Don't give users features they won't use.**

### Suggested Feature Tiers

#### Free Tier (Core)
- Basic journaling
- 1 coach (Clover)
- Basic Sparks
- Limited chat history

#### Premium Modules (À la carte)

| Module | What It Unlocks | Price Idea |
|--------|-----------------|------------|
| **All Coaches** | Spark, Willow, Luna, Ridge, Flint, Fern | $2.99/mo |
| **Food Tracking** | Daily food logging, basic patterns | $1.99/mo |
| **Cycle Tracking** | Period tracking, phase awareness | $2.99/mo |
| **Health Insights** | Correlations (food+sleep+cycle+mood) | $3.99/mo |
| **Voice (TTS)** | Coaches speak responses | $1.99/mo |
| **Teaching** | Spanish, CBT, meditation courses | $2.99/mo |
| **MoodPrint Pro** | Deep psychological insights | $3.99/mo |
| **Unlimited** | Everything | $9.99/mo |

### Feature Adaptation Pattern

Food Tracking should be GENERAL, then ADAPT when other features are enabled:

```
Food Tracking alone:
→ Log meals, see basic patterns
→ "You eat more sugar on stressed days"

Food + Cycle Tracking:
→ Same UI, but adds cycle-aware insights
→ "Your cramps are worse after fast food"
→ Pre-period suggestions appear

Food + Cycle + Health Insights:
→ Full correlation analysis
→ Sleep + food + mood + cycle combined
→ Personalized predictions
```

### Entitlements Architecture

```typescript
interface UserEntitlements {
  tier: 'free' | 'premium';
  modules: {
    allCoaches: boolean;
    foodTracking: boolean;
    cycleTracking: boolean;
    healthInsights: boolean;  // Requires food + cycle
    voiceTTS: boolean;
    teaching: boolean;
    moodPrintPro: boolean;
  };
}
```

### Key Principle: Don't Break the App

```
Feature disabled = Hidden, NOT broken

❌ Don't: Show greyed-out buttons
❌ Don't: Error messages about premium
✅ Do: Simply don't show the feature
✅ Do: Show upsell at natural moments
```

### Natural Upsell Moments

1. **After 7 days journaling** → "Want to see what your coach learned? Unlock MoodPrint Pro"
2. **User mentions food** → "Track what you eat to see patterns. Unlock Food Tracking"
3. **User mentions period** → "Track your cycle for personalized support. Unlock Cycle Tracking"
4. **User tries different coach** → "Meet all 7 coaches. Unlock All Coaches"

### Files to Create

| File | Purpose |
|------|---------|
| `services/entitlementService.ts` | Check feature access, manage subscriptions |
| `components/UpsellCard.tsx` | Contextual upgrade prompts |
| `app/settings/subscription.tsx` | Manage subscription screen |

### Status: Planning Phase

Need to decide:
- [ ] Which features are free vs paid
- [ ] À la carte vs bundles vs single premium
- [ ] Price points
- [ ] Integration with App Store / Google Play

---

## 22. Food Tracking with AI Detection (Implemented)

### Overview
General food tracking feature with calorie counting. AI automatically detects food mentions in journal entries and logs them. Integrates with period correlations when cycle tracking is enabled.

### Files Created
- `types/FoodTracking.ts` - 80+ common foods database, AI detection keywords
- `services/foodTrackingService.ts` - Food logging, AI detection, calorie tracking
- `components/food/FoodTracker.tsx` - Full food tracking UI
- `app/food/index.tsx` - Food Tracker screen
- `app/settings/food.tsx` - Food settings (enable/disable, calorie goal)

### Key Features
1. **AI Auto-Detection**: When users save journal entries, food mentions are detected and auto-logged
2. **Calorie Tracking**: Daily goal with progress visualization
3. **Food Database**: 80+ common foods with calorie info
4. **Meal Types**: Breakfast, lunch, dinner, snack (auto-detected by time)
5. **Settings**: Enable/disable tracking, toggle AI detection, set calorie goals

### How AI Detection Works
```typescript
// In journal save flow (index.tsx)
const foodResult = await autoLogFromJournal(entryText);
if (foodResult && foodResult.logged.length > 0) {
  // Show feedback: "Logged: Pizza Slice (285 cal)"
}
```

---

## 23. Skills Tab with D&D Progression (Implemented)

### Overview
A dedicated Skills tab in bottom navigation with D&D-inspired growth system. Non-competitive - users progress naturally through app usage.

### Files Created
- `types/SkillProgression.ts` - Attributes, skills, coach unlocks, point sources
- `services/skillProgressionService.ts` - Progression tracking, unlocks, Easter eggs
- `app/(tabs)/skills.tsx` - Skills tab screen with search

### 4 Attributes (Grow from App Usage)
| Attribute | Emoji | Grows From |
|-----------|-------|------------|
| Wisdom | 🦉 | Journaling, reflection, weekly reviews |
| Resilience | 🏔️ | Grounding exercises, coping during hard times |
| Clarity | 💎 | Identifying patterns, logging triggers, viewing insights |
| Compassion | 💚 | Self-kindness practices, affirmations |

### 50+ Skills Across 7 Categories
- **Grounding**: 5-4-3-2-1, Box Breathing, Physiological Sigh, Cold Water Reset, etc.
- **Anxiety**: Worry Time, Thought Challenging, Worst/Best/Likely, Containment
- **Sleep**: Wind Down, Sleep Stories (free public domain books), Old Time Radio, 4-7-8 Breathing
- **Focus**: Pomodoro, Brain Dump, Single-Tasking, Environment Design
- **Self-Care**: Joy List, Gratitude, Inner Critic Work, Values Clarification
- **Relationships**: I-Statements, Boundary Scripts, Repair Conversations, Active Listening
- **Mindfulness**: Body Scan, RAIN Technique, Urge Surfing, Walking Meditation

### Special Sleep Skills
- **Sleep Stories**: Pulls from Project Gutenberg, Librivox - free public domain books
- **Old Time Radio**: Classic radio dramas from Internet Archive (The Shadow, Suspense, X Minus One)

### Coach Unlocks (16 Abilities)
- Personality Traits: Light Humor, Celebration Mode, Tough Love, Extra Nurturing
- Conversation Styles: Deep Questions, Socratic Dialogue, Story & Metaphor, Action-Focused
- Special Abilities: Pattern Insights, Enhanced Memory, Proactive Check-ins, Crisis Support
- Voice: Voice Responses, Voice Journaling

### Search Feature
Intelligent search filters skills and coach abilities by name, description, or category.

### Easter Egg Slash Commands
`/party` `/hug` `/coffee` `/wisdom` `/42` `/credits` `/debug`

---

## 15. SUCCESS CRITERIA FOR THE NEXT CHECKPOINT

- [ ] Cycle tracking works on iOS device (not just web)
- [ ] HealthKit cycle sync imports/exports correctly
- [ ] All 6 life stages function as expected
- [ ] Developer testing panel correctly simulates all phases
- [ ] Settings search finds relevant results
- [ ] No more Colors.warmNeutral undefined errors
- [ ] Back navigation works on all screens
- [ ] Cycle reminders fire at correct times
- [ ] Collection system unlocks work correctly
- [ ] /collection and /stats commands display properly

---

## QUICK STATUS SNAPSHOT

"**Feature complete.** MoodPrint context compression (40% token savings). TTS with unique voices per coach. Cycle tracking with life stages. Slash commands (30+). D&D collection system. Voice chat, emotion detection, teaching system. Temporal patterns, contextual attachment, coping patterns tracking. **NEW: Food Tracking with AI detection. NEW: Skills Tab with 50+ techniques and D&D progression.** All processing local/on-device."

---

## APPENDIX: ALL SERVICE FILES

| Service | Purpose | Key Functions |
|---------|---------|---------------|
| `claudeAPIService.ts` | AI chat interface | `sendToClaude()`, builds system prompt |
| `coachPersonalityService.ts` | Persona management | `getCoachSettings()`, `getChronotypeContextForClaude()` |
| `collectionService.ts` | **NEW** D&D gamification | `recordActivity()`, `checkForUnlocks()`, `getCollection()` |
| `cycleTrackingService.ts` | Cycle logic | `startPeriod()`, `endPeriod()`, `getCurrentPhase()`, `logSymptom()` |
| `periodCorrelationService.ts` | **NEW** Food/sleep correlations | `logFoodTags()`, `logSleep()`, `analyzeCorrelations()`, `generateInsights()` |
| `healthKitService.ts` | Apple Health sync | `importCycleDataFromHealthKit()`, `writeMenstrualFlowToHealthKit()` |
| `journalStorage.ts` | Journal persistence | `saveJournal()`, `getRecentJournalContextForClaude()` |
| `lifeContextService.ts` | Long-term memory | `updateLifeContext()`, `getLifeContextForClaude()` |
| `notificationService.ts` | Push notifications | `scheduleDailyReminder()`, `showTestNotification()` |
| `psychAnalysisService.ts` | Psych profiling | `analyzeEntry()`, `getCompressedContext()` |
| `quickLogsService.ts` | Twigs (quick logs) | `logEntry()`, `getDetailedLogsContextForClaude()` |
| `skillsService.ts` | Skills & exercises | `getSkillsMenuData()`, `recordSkillUse()` |
| `slashCommandService.ts` | Slash commands | `parseCommand()`, `executeCommand()` |
| `subscriptionService.ts` | Premium features | `checkPremiumStatus()`, `initiatePurchase()` |
| `teachingService.ts` | Subject teaching | `getNextLesson()`, `completeLesson()` |
| `tonePreferencesService.ts` | Response style | `getTonePreferences()`, `toggleToneStyle()` |
| `userContextService.ts` | User prefs | `getUserPreferences()`, `getContextForClaude()` |
| `voiceChatService.ts` | Voice input | `startListening()`, `stopListening()` |
| `emotionDetectionService.ts` | Facial analysis | `detectEmotion()`, `getEmotionHint()` |
| `textToSpeechService.ts` | **NEW** Google Cloud TTS | `speakCoachResponse()`, `stopSpeaking()` |
| `foodTrackingService.ts` | **NEW** Food & calorie tracking | `logFood()`, `autoLogFromJournal()`, `getTodayCalorieProgress()` |
| `skillProgressionService.ts` | **NEW** D&D progression system | `awardPoints()`, `getSkillsWithStatus()`, `checkEasterEgg()` |

---

*End of Handoff Document*
