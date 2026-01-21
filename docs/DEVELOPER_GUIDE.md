# Mood Leaf Developer Guide

Complete technical documentation for the Mood Leaf codebase.

---

## Table of Contents

1. [Documentation Architecture & Sync](#documentation-architecture--sync)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Services](#services)
5. [Data Models](#data-models)
6. [The Mega Prompt System](#the-mega-prompt-system)
7. [Life Context System](#life-context-system)
8. [HealthKit Integration](#healthkit-integration)
9. [Health Insights & Correlations](#health-insights--correlations)
10. [Keyword Detection System](#keyword-detection-system)
11. [Crisis Handling](#crisis-handling)
12. [Storage & Persistence](#storage--persistence)
13. [API Integration](#api-integration)
14. [Ethics Implementation](#ethics-implementation)
15. [Testing](#testing)
16. [Psychological Analysis System](#psychological-analysis-system)
17. [AI Coach Adaptive System](#ai-coach-adaptive-system)
18. [AI Data Integration & Learning](#ai-data-integration--learning)
19. [AI Adaptation Verification System](#ai-adaptation-verification-system)
20. [Cycle Tracking System](#cycle-tracking-system)
21. [Future Enhancements](#future-enhancements)

---

## Documentation Architecture & Sync

### Source of Truth

Mood Leaf documentation exists in two places that must stay in sync:

| Location | Purpose | Updates |
|----------|---------|---------|
| `moodling-app/constants/UserGuideContent.ts` | **Primary source** - Powers in-app FAQ and Manual | Edit here first |
| `docs/*.md` files | External docs, detailed reference, onboarding | Mirror key content |

### The Sync Rule

**`UserGuideContent.ts` is the source of truth for user-facing content.**

When you add a new feature or change terminology:
1. Update `UserGuideContent.ts` FIRST (this is what users see in the app)
2. Then update relevant `docs/*.md` files for consistency

### File Structure

```typescript
// FAQ_CONTENT - Quick Q&A shown in Help screen
export const FAQ_CONTENT: FAQItem[] = [
  {
    category: 'basics' | 'guide' | 'privacy' | 'features',
    question: 'What is X?',
    answer: 'X is...',
  },
];

// USER_MANUAL_CONTENT - Full manual sections
export const USER_MANUAL_CONTENT: ManualSection[] = [
  {
    id: 'unique-id',
    emoji: '🌳',
    title: 'Section Title',
    content: 'Main description...',
    subsections: [
      { title: 'Subsection', content: 'Details...' },
    ],
  },
];
```

### Adding New Features Checklist

When adding a new feature (e.g., Calendar Integration):

- [ ] **Code** - Implement in `services/` or `app/`
- [ ] **UserGuideContent.ts** - Add FAQ items and/or Manual section
- [ ] **MOOD_LEAF_OVERVIEW.md** - Add detailed documentation
- [ ] **Handoff.md** - Update if it affects AI context sources
- [ ] **package.json** - Add dependencies if needed

### Terminology Reference

Keep these consistent across all docs:

| Term | Definition | NOT |
|------|------------|-----|
| **Sparks** | Universal wisdom (pre-written prompts) | Oblique Strategies |
| **Fireflies** | Personal wisdom (AI-generated) | Wisdoms, Insights |
| **Twigs** | Quick logs/tracking | Branches, Logs |
| **Guide** | AI coach/companion | Bot, Assistant |
| **Personas** | 7 nature-themed personalities | Characters, Modes |
| **Adaptive Mode** | Always-on adaptation | Toggle, Setting |

### Universal vs Personal (Key Distinction)

- **Sparks = Universal** (pre-written, for everyone, selection adapts)
- **Fireflies = Personal** (AI-generated, just for you, content adapts)

Use the analogy:
- Sparks = Book of quotes (timeless, you find the right one)
- Fireflies = Friend's note (written knowing your situation)

---

## Architecture Overview

### Tech Stack

- **Framework**: Expo / React Native
- **Language**: TypeScript
- **Storage**: AsyncStorage (local only)
- **AI**: Claude API (Anthropic)
- **Health**: Apple HealthKit (iOS)
- **State**: React Context + Hooks

### Design Principles

1. **Privacy-first**: All data stored locally, minimal data sent to API
2. **Anti-dependency**: Features designed to empower user independence
3. **Non-diagnostic**: Descriptive language only, no clinical labels
4. **Graceful degradation**: App works without API key or HealthKit

---

## Project Structure

```
moodling-app/
├── app/                    # Expo Router screens
├── components/             # Reusable UI components
├── services/               # Business logic services
│   ├── claudeAPIService.ts       # AI chat integration
│   ├── journalStorage.ts         # Journal entry CRUD
│   ├── lifeContextService.ts     # Long-term memory system
│   ├── userContextService.ts     # User context & keywords
│   ├── healthKitService.ts       # Apple HealthKit integration
│   ├── healthInsightService.ts   # Correlation & insights
│   ├── obliqueStrategiesService.ts # Oblique strategies cards
│   ├── secureDeleteService.ts    # Secure data deletion
│   ├── quickLogsService.ts       # Customizable tracking buttons (Branches)
│   ├── tonePreferencesService.ts # Communication style
│   ├── sentimentAnalysis.ts      # Mood detection
│   ├── patternService.ts         # Pattern detection
│   ├── correlationService.ts     # Data correlations
│   ├── reflectionService.ts      # Guided reflections
│   ├── notificationService.ts    # Push notifications
│   ├── usageTrackingService.ts   # API cost tracking
│   ├── exposureLadderService.ts  # Exposure therapy support
│   └── voiceRecording.ts         # Voice-to-text
├── types/                  # TypeScript type definitions
├── hooks/                  # Custom React hooks
├── constants/              # App constants & config
└── assets/                 # Images, fonts, etc.
```

---

## Services

### claudeAPIService.ts

**Purpose**: Handles all AI chat functionality including the mega prompt system.

**Key Exports**:
```typescript
// Send message and get AI response
sendMessage(message: string, context: ConversationContext): Promise<AIResponse>

// API key management
setAPIKey(key: string): Promise<void>
getAPIKey(): Promise<string | null>
hasAPIKey(): Promise<boolean>
removeAPIKey(): Promise<void>

// Cost tracking
getCostData(): Promise<{ totalCost, monthlyCost, ... }>
```

**Key Functions**:
- `buildSystemPrompt()` - Constructs the mega prompt with all context
- `buildMessages()` - Formats conversation history for API
- `detectCrisis()` - Checks for crisis keywords before API call
- `calculateCost()` - Computes API usage cost from tokens

---

### lifeContextService.ts

**Purpose**: Long-term memory system that extracts and stores user's life context from journal entries.

**Key Exports**:
```typescript
interface LifeContext {
  topics: LifeTopic[];
  milestones: LifeMilestone[];
  entities: ExtractedEntity[];
  copingPatterns: CopingPattern[];
  temporalPatterns: TemporalPattern[];
  recentSeverity: SeveritySnapshot[];
  journeyStartDate: string;
  totalEntriesProcessed: number;
  lastUpdated: string;
}

// Main functions
getLifeContext(): Promise<LifeContext | null>
buildLifeContext(): Promise<LifeContext>
getLifeContextForClaude(): Promise<string>
refreshLifeContext(): Promise<void>
```

**Data Structures**:

```typescript
interface LifeTopic {
  name: string;
  category: 'person' | 'activity' | 'place' | 'event' | 'health' |
            'work' | 'relationship' | 'pet' | 'financial' | 'education' |
            'profession' | 'identity' | 'coping' | 'temporal';
  firstMentioned: string;
  lastMentioned: string;
  mentionCount: number;
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  notes: string[];
}

interface ExtractedEntity {
  type: 'person' | 'age' | 'location' | 'medication' | 'duration' | 'sobriety';
  value: string;
  detail?: string;
  firstMentioned: string;
  lastMentioned: string;
  mentionCount: number;
}

interface SeveritySnapshot {
  date: string;
  level: 'crisis' | 'high' | 'moderate' | 'low' | 'positive';
  indicators: string[];
}
```

---

### healthKitService.ts

**Purpose**: Apple HealthKit integration for health data context.

**Key Exports**:
```typescript
interface HealthSnapshot {
  currentHeartRate?: number;
  restingHeartRate?: number;
  heartRateVariability?: number;
  recentHeartRates: HeartRateReading[];
  heartRateBaseline: number;
  lastNightSleep?: SleepData;
  weeklyAverageSleep?: number;
  sleepTrend?: 'improving' | 'declining' | 'stable';
  todayActivity?: ActivityData;
  weeklyAverageSteps?: number;
  activityTrend?: 'more_active' | 'less_active' | 'stable';
  isHeartRateElevated: boolean;
  isHeartRateSpiking: boolean;
  potentialStressIndicators: string[];
  lastUpdated: string;
}

// Main functions
isHealthKitAvailable(): boolean
isHealthKitEnabled(): Promise<boolean>
setHealthKitEnabled(enabled: boolean): Promise<boolean>
fetchHealthSnapshot(): Promise<HealthSnapshot>
getHealthContextForClaude(): Promise<string>
handleHeartRateSpike(currentHR: number): Promise<{shouldNotify, title, body, spikeEvent}>
detectHeartRateSpike(currentHR: number): Promise<{isSpiking, percentAboveBaseline, baseline}>
```

**Heart Rate Spike Detection**:
```typescript
// Detection algorithm
const baseline = await getHeartRateBaseline();  // Personalized over time
const threshold = await getSpikeThreshold();     // Default 30%
const percentAbove = ((currentHR - baseline) / baseline) * 100;
const isSpiking = percentAbove >= threshold;
```

---

### healthInsightService.ts

**Purpose**: Generates insights and suggestions by correlating journal data with health metrics.

**Key Exports**:
```typescript
interface HealthInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: 'journal' | 'activity' | 'breathe' | 'reflect' | 'chat';
  priority: 'low' | 'medium' | 'high';
  expiresAt: string;
  createdAt: string;
  correlationData?: { metric1, metric2, correlation };
}

interface CorrelationRecord {
  date: string;
  mood: string;
  moodScore: number;
  sleepHours?: number;
  steps?: number;
  heartRateAvg?: number;
  exerciseMinutes?: number;
  journalLength?: number;
  entryCount?: number;
}

// Main functions
generateHealthInsights(): Promise<HealthInsight[]>
getTopInsight(): Promise<HealthInsight | null>
recordCorrelationData(mood, health, entries): Promise<void>
getCorrelationHistory(): Promise<CorrelationRecord[]>
getCorrelationSummaryForClaude(): Promise<string>
```

**Correlation Analysis**:
```typescript
// Sleep-mood correlation
function analyzeSleepMoodCorrelation(history: CorrelationRecord[]): string | null {
  // Compares mood scores on good sleep (7+ hrs) vs poor sleep (<6 hrs)
  // Returns 'positive' if better mood correlates with better sleep
}

// Activity-mood correlation
function analyzeActivityMoodCorrelation(history: CorrelationRecord[]): string | null {
  // Compares mood scores on active vs inactive days
  // Returns 'positive' if movement correlates with better mood
}
```

---

### userContextService.ts

**Purpose**: Rich user context and significant keyword detection.

**Key Features**:
- 600+ keywords across 30+ categories
- Significant entry detection
- Context formatting for Claude

**Keyword Categories**:
```typescript
const SIGNIFICANT_KEYWORDS = [
  // IDENTITY
  'ADHD', 'autism', 'non-binary', 'transgender', ...

  // RELATIONSHIPS
  'partner', 'husband', 'wife', 'boyfriend', 'girlfriend', ...

  // MENTAL HEALTH
  'therapy', 'therapist', 'depression', 'anxiety', ...

  // MEDICATIONS
  'Lexapro', 'Zoloft', 'Prozac', 'Wellbutrin', ...

  // WORK & CAREER
  'job', 'promotion', 'fired', 'burnout', ...

  // HEALTH
  'diagnosis', 'surgery', 'chronic pain', ...

  // TEMPORAL PATTERNS
  'Sunday scaries', 'every morning', 'seasonal', ...

  // COPING - HEALTHY
  'therapy', 'journaling', 'meditation', 'exercise', ...

  // COPING - UNHEALTHY
  'avoiding', 'numbing', 'doom scrolling', 'stress eating', ...

  // SEVERITY MARKERS
  'crisis', 'falling apart', 'hopeless', 'struggling', ...

  // PROFESSIONS
  'nurse', 'software engineer', 'teacher', 'lawyer', ...
];
```

---

### tonePreferencesService.ts

**Purpose**: Manages communication style preferences.

**Available Tones**:
```typescript
type ToneStyle = 'warm' | 'direct' | 'thoughtful' | 'encouraging';

interface TonePreferences {
  selectedStyles: ToneStyle[];
  customInstructions?: string;
}

// Tone instruction generation
getToneInstruction(styles: ToneStyle[]): string
// Returns combined instruction like:
// "Warm and nurturing while also being direct and practical"
```

---

## Data Models

### JournalEntry

```typescript
interface JournalEntry {
  id: string;
  text: string;
  createdAt: string;      // ISO date
  updatedAt: string;      // ISO date
  sentiment?: {
    mood: string;         // 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
    confidence: number;   // 0-1
    keywords: string[];   // Detected emotion words
  };
  isSignificant?: boolean;
  topics?: string[];
  voiceRecording?: string;  // Audio file path
}
```

### ChatMessage

```typescript
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### ConversationContext

```typescript
interface ConversationContext {
  recentMood?: { emoji: string; description: string };
  upcomingEvent?: { title: string; time: Date };
  relevantPatterns?: { shortDescription: string }[];
  lastNightSleep?: number;
  recentMessages: ChatMessage[];
  toneStyles?: ToneStyle[];
}
```

---

## The Mega Prompt System

### Structure

The system prompt is built from multiple components:

```typescript
function buildSystemPrompt(userContext: string, toneInstruction: string): string {
  return `You are the Sprout, a warm and compassionate companion...

YOUR ROLE:
- Listen with empathy and without judgment
- Help users process emotions
- Encourage real-world connection
- Support building skills and habits

YOU NEVER:
- Diagnose mental health conditions
- Suggest medication changes
- Claim to be a therapist
- Use clinical labels
- Encourage dependence

YOUR TONE:
- ${toneInstruction}
- Tentative language
- Grounded and honest
- Encouraging autonomy

CONVERSATION APPROACH:
1. VALIDATE first
2. EXPLORE gently
3. SUPPORT
4. EMPOWER

HEALTH DATA AWARENESS:
- Notice patterns between feelings and body signals
- Never diagnose from health data
- Help users see correlations
- Empower self-awareness

CORRELATION INSIGHTS:
- Help connect: journal entries + mood + health metrics
- Point out patterns
- Build self-knowledge
- Celebrate self-discovery

CONTEXT ABOUT THIS USER:
${userContext}

RESPONSE GUIDELINES:
- 2-4 sentences usually
- One question max per response
- Focus on immediate experience
- Avoid "you should" language`;
}
```

### Context Assembly

Context is assembled in layers:

```typescript
// In sendMessage():
const lifeContext = await getLifeContextForClaude();        // Long-term memory (topics, milestones, people)
const psychContext = await psychAnalysisService.getCompressedContext(); // Psychological profile
const chronotypeContext = await getChronotypeContextForClaude(); // Sleep rhythm, travel, jet lag
const healthContext = await getHealthContextForClaude();    // Current health data (if HealthKit enabled)
const correlationContext = await getCorrelationSummaryForClaude(); // Health-mood patterns
const logsContext = await getLogsContextForClaude();        // Habit tracking, medications, symptoms
const richContext = await getContextForClaude();            // Recent journal context
const conversationContext = buildConversationContext(ctx);  // Immediate conversation context

const contextParts = [
  lifeContext,
  psychContext,
  chronotypeContext,
  healthContext,
  correlationContext,
  logsContext,
  richContext,
  conversationContext
].filter(Boolean);

const fullContext = contextParts.join('\n\n');
```

### Context Compression

Life context is compressed to avoid token bloat:

```typescript
// formatLifeContextForPrompt output example:
`Journaling journey: 8 months (156 entries)
Profession: Software engineer
Identity: ADHD, bisexual
Key people: Sarah (partner, 6mo), Mike (therapist, 3mo)
Pets: Luna (dog, 2mo)
Health journey: anxiety, depression
Recent milestones:
  • 2 weeks ago: Started new job
  • 1 month ago: Moved to Austin
Ongoing themes (tracked over months):
  • work stress: 5 months, 23 mentions (mixed)
Named people: Sarah (partner), Dr. Chen (therapist)
Location: Austin
Age: 34
Medications: Lexapro (20mg)
Recovery: 6 months sober
Healthy coping: therapy, meditation, exercise
Coping challenges: doom scrolling, isolating
Recent emotional state: Struggling (high distress)`
```

---

## Life Context System

### Processing Pipeline

```
Journal Entry Saved
        ↓
extractTopicsFromText() → Topics
        ↓
detectMilestone() → Milestones
        ↓
extractEntities() → Named entities
        ↓
extractCopingMechanisms() → Coping patterns
        ↓
detectSeverity() → Severity tracking
        ↓
processEntry() → Update LifeContext
        ↓
saveLifeContext() → AsyncStorage
```

### Extraction Patterns

```typescript
const EXTRACTION_PATTERNS = {
  person: [
    /\b(?:my|our)\s+(mom|dad|partner|therapist|...)\b/gi,
    /\b([A-Z][a-z]+)\s+(?:and I|told me|said|...)/g,
  ],
  activity: [
    /\b(?:started|practicing|learning)\s+(yoga|meditation|...)/gi,
  ],
  health: [
    /\b(?:diagnosed with|taking|prescribed)\s+(...)/gi,
    /\b(panic attack|breakdown|therapy|recovery|...)/gi,
  ],
  // ... more categories
};

const ENTITY_PATTERNS = {
  namedPerson: /\b(?:my\s+)?(partner|therapist|...)\s+([A-Z][a-z]+)/gi,
  age: /\b(?:i'm|i am|turned)\s+(\d{1,2})\b/gi,
  medicationDosage: /\b(\d+)\s*mg\s+(?:of\s+)?([A-Za-z]+)/gi,
  location: /\b(?:live in|moved to)\s+([A-Z][a-z]+...)/gi,
  sobrietyDuration: /\b(\d+)\s+(days?|months?|years?)\s+(sober|clean)/gi,
};
```

### Severity Detection

```typescript
const SEVERITY_MARKERS = {
  crisis: ['crisis', 'suicidal', 'can\'t cope', 'want to die', ...],
  high: ['desperate', 'hopeless', 'paralyzed', 'breakdown', ...],
  moderate: ['struggling', 'overwhelmed', 'stressed', 'anxious', ...],
  low: ['bit stressed', 'manageable', 'okay', 'getting by', ...],
  positive: ['happy', 'excited', 'proud', 'grateful', 'hopeful', ...],
};

function detectSeverity(text: string): SeverityLevel | null {
  const lower = text.toLowerCase();
  // Check in order: crisis → high → positive → moderate → low
  // Returns first match
}
```

---

## HealthKit Integration

### Data Flow

```
HealthKit (iOS)
      ↓
processHeartRateSample() / processSleepData() / processActivityData()
      ↓
HealthSnapshot (in-memory)
      ↓
saveHealthSnapshot() → AsyncStorage
      ↓
formatHealthForPrompt() → Claude context
      ↓
handleHeartRateSpike() → Notification
```

### Heart Rate Spike Handling

```typescript
async function handleHeartRateSpike(currentHR: number) {
  // 1. Detect spike
  const { isSpiking, percentAboveBaseline, baseline } =
    await detectHeartRateSpike(currentHR);

  if (!isSpiking) return null;

  // 2. Rate limit (max 1 per 30 min)
  const shouldNotify = await shouldSendSpikeNotification();
  if (!shouldNotify) return null;

  // 3. Generate notification
  await recordSpikeNotification();

  return {
    shouldNotify: true,
    title: percentAboveBaseline >= 50
      ? "Your heart rate is quite elevated"
      : "Noticing your heart rate is up",
    body: "Would you like to share what's going on?",
    spikeEvent: { timestamp, heartRate, baseline, percentAboveBaseline }
  };
}
```

### Health Context for Claude

```typescript
function formatHealthForPrompt(snapshot: HealthSnapshot): string {
  // Returns something like:
  `HEALTH CONTEXT (from HealthKit):
  Current heart rate: 92 BPM (elevated)
  Resting heart rate: 68 BPM
  Heart rate variability: 18ms (low - may indicate stress)
  Last night's sleep: 5.2 hours (fair)
    Woke up 4 times
  Weekly average sleep: 6.8 hours
  Sleep trend: declining
  Today's steps: 2,340
  Activity trend: less active than usual
  Body signals: elevated heart rate, limited sleep last night`
}
```

---

## Health Insights & Correlations

### Correlation Recording

Daily, record mood + health metrics:

```typescript
interface CorrelationRecord {
  date: string;
  mood: string;
  moodScore: number;  // 1-5
  sleepHours?: number;
  steps?: number;
  heartRateAvg?: number;
  exerciseMinutes?: number;
}

// Called when user completes journaling for the day
await recordCorrelationData(mood, healthSnapshot, todayEntries);
```

### Correlation Analysis

```typescript
// Sleep-mood: Compare mood on good (7+) vs poor (<6 hr) sleep
function analyzeSleepMoodCorrelation(history: CorrelationRecord[]): string | null {
  if (history.length < 7) return null;  // Need a week of data

  const goodSleepMood = avgMood(history.filter(r => r.sleepHours >= 7));
  const poorSleepMood = avgMood(history.filter(r => r.sleepHours < 6));

  if (goodSleepMood - poorSleepMood > 0.5) {
    return 'positive';  // Better mood with better sleep
  }
  return null;
}

// Activity-mood: Compare mood on active vs sedentary days
function analyzeActivityMoodCorrelation(history: CorrelationRecord[]): string | null {
  // Similar logic comparing steps above/below median
}
```

### Insight Generation

```typescript
async function generateHealthInsights(): Promise<HealthInsight[]> {
  const insights = [];
  const health = await fetchHealthSnapshot();
  const history = await getCorrelationHistory();

  // Heart rate spike check-in
  if (health.isHeartRateSpiking && !recentlyShown('heart_rate_anxiety')) {
    insights.push({
      type: 'heart_rate_anxiety',
      title: "Your heart rate is elevated",
      message: "Want to share what's going on?",
      priority: 'high',
    });
  }

  // Poor sleep acknowledgment
  if (health.lastNightSleep?.totalSleepHours < 5 && !recentlyShown('poor_sleep')) {
    insights.push({
      type: 'poor_sleep_check_in',
      title: "Rough night?",
      message: `Only ${hrs} hours of sleep. Be gentle with yourself.`,
      priority: 'medium',
    });
  }

  // Pattern insights
  if (analyzeSleepMoodCorrelation(history) === 'positive' && !recentlyShown('sleep_mood')) {
    insights.push({
      type: 'sleep_mood_correlation',
      title: "Pattern noticed: Sleep & Mood",
      message: "You tend to feel better after good sleep. Your body knows!",
      priority: 'low',
    });
  }

  return insights;
}
```

---

## Keyword Detection System

### Architecture

```
Entry Text
     ↓
isSignificantEntry() → Check against SIGNIFICANT_KEYWORDS (600+)
     ↓
extractTopicsFromText() → Use EXTRACTION_PATTERNS
     ↓
[Topics, IsSignificant] → Store in LifeContext
```

### Category Coverage

| Category | Examples | Count |
|----------|----------|-------|
| Identity | ADHD, autism, non-binary, transgender | 50+ |
| Relationships | partner, husband, ex, dating | 40+ |
| Family | mom, dad, sibling, in-laws | 60+ |
| Mental Health | therapy, depression, anxiety, PTSD | 80+ |
| Medications | Lexapro, Zoloft, Adderall (with dosage detection) | 60+ |
| Work/Career | job, promotion, burnout, layoff | 50+ |
| Health | diagnosis, surgery, chronic, disability | 70+ |
| Coping (healthy) | meditation, exercise, boundaries | 30+ |
| Coping (unhealthy) | avoiding, numbing, doom scrolling | 25+ |
| Severity | crisis, hopeless, struggling, happy | 40+ |
| Professions | nurse, engineer, teacher, lawyer | 80+ |
| Temporal | Sunday scaries, seasonal, recurring | 20+ |
| **Total** | | **600+** |

### Adding New Keywords

To add keywords, update `userContextService.ts`:

```typescript
const SIGNIFICANT_KEYWORDS = [
  // Add to appropriate section:

  // CATEGORY NAME
  'new keyword 1', 'new keyword 2',
];
```

And update extraction patterns in `lifeContextService.ts`:

```typescript
const EXTRACTION_PATTERNS = {
  category_name: [
    /\bpattern here\b/gi,
  ],
};
```

---

## Crisis Handling

### Detection

```typescript
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'hurt myself', 'self-harm', 'self harm', 'cutting myself',
  'don\'t want to live', 'better off dead', 'no reason to live',
];

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
}
```

### Response

Crisis detection happens BEFORE API call:

```typescript
async function sendMessage(message: string, context: ConversationContext) {
  // First thing - check for crisis
  if (detectCrisis(message)) {
    return CRISIS_RESPONSE;  // Immediate, no API call
  }

  // ... rest of normal flow
}

const CRISIS_RESPONSE = {
  text: `I hear that you're going through something really difficult...

If you're in crisis, please reach out:
• 988 Suicide & Crisis Lifeline: Call or text 988
• Crisis Text Line: Text HOME to 741741
• International: https://www.iasp.info/resources/Crisis_Centres/

You don't have to face this alone.`,
  source: 'crisis',
  cost: 0,
};
```

---

---

### obliqueStrategiesService.ts

**Purpose**: Provides Oblique Strategies-style cards for creative and emotional unblocking.

**Categories**:
- `depression` - Gentle nudges when everything feels heavy (30 cards)
- `anxiety` - Grounding prompts when mind is racing (30 cards)
- `walking` - Contemplations for motion (30 cards)
- `artists` - Creative unblocking for visual creators (30 cards)
- `musicians` - Prompts for sonic exploration (30 cards)
- `funny` - Absurdist humor to break the spell (30 cards)
- `strange` - Weird perspectives to jar you loose (30 cards)
- `random` - Pull from any category

**Key Exports**:
```typescript
interface Strategy {
  id: string;
  text: string;
  category: StrategyCategory;
  author?: string;
}

// Get a random strategy
getRandomStrategy(category: StrategyCategory): Strategy

// Get multiple unique strategies
getStrategies(category: StrategyCategory, count: number): Strategy[]

// Favorites management
saveToFavorites(strategy: Strategy): Promise<void>
removeFromFavorites(strategyId: string): Promise<void>
getFavorites(): Promise<Strategy[]>

// Get strategy based on detected mood
getStrategyForMood(mood: string): Strategy

// Search strategies
searchStrategies(query: string): Strategy[]
```

**Example strategies**:
```typescript
// Depression
"Your brain is lying to you. It's very convincing, but it's still lying."

// Anxiety
"Name five things you can see. You're here, not there."

// Walking
"Find something beautiful that no one else has noticed today."

// Artists
"Make the mistake on purpose."

// Musicians
"What's the note you're afraid to play?"

// Funny
"What if this problem belongs to someone else and you just found it?"

// Strange
"You are a ghost who forgot they died. What unfinished business brought you here?"
```

---

### secureDeleteService.ts

**Purpose**: Secure, comprehensive data deletion with verification.

**Key Exports**:
```typescript
interface SecureDeleteResult {
  success: boolean;
  keysDeleted: number;
  keysVerified: number;
  errors: string[];
  timestamp: string;
}

// Secure delete all data (3-pass overwrite)
secureDeleteAllData(passes?: number): Promise<SecureDeleteResult>

// Delete specific category
secureDeleteCategory(category: 'journal' | 'chat' | 'health' | 'context' | 'strategies' | 'settings'): Promise<SecureDeleteResult>

// Quick delete (no overwrite, faster)
quickDeleteAllData(): Promise<SecureDeleteResult>

// Get storage statistics
getStorageStats(): Promise<{ totalKeys, moodlingKeys, estimatedSize, keyDetails }>

// Export before delete (safety net)
exportBeforeDelete(): Promise<Record<string, unknown>>

// Deletion confirmation
generateDeletionCode(): string
verifyDeletionCode(input: string, code: string): boolean
```

**Secure deletion process**:
```typescript
async function secureDeleteKey(key: string, passes: number = 3) {
  // 1. Overwrite with random garbage data (multiple passes)
  for (let i = 0; i < passes; i++) {
    const garbage = generateRandomGarbage();
    await AsyncStorage.setItem(key, garbage);
  }

  // 2. Delete the key
  await AsyncStorage.removeItem(key);

  // 3. Verify deletion
  const value = await AsyncStorage.getItem(key);
  return value === null;
}
```

**All tracked storage keys**:
```typescript
const ALL_STORAGE_KEYS = [
  // Journal
  'moodling_journal_entries',
  'moodling_journal_drafts',
  // Life Context
  'moodling_life_context',
  // ... 30+ keys total
];
```

---

### quickLogsService.ts

**Purpose**: Customizable tracking buttons for habits, goals, medications, symptoms, or anything users want to track. Called "Branches" in Mood Leaf terminology.

**Key Exports**:
```typescript
interface QuickLog {
  id: string;
  name: string;                    // "Took meds", "Walked", etc.
  emoji: string;                   // Visual icon
  type: QuickLogType;              // habit_build, habit_break, goal, symptom, medication, custom
  frequency: LogFrequency;         // daily, multiple_daily, weekly, as_needed
  targetPerDay?: number;
  targetPerWeek?: number;
  reminderEnabled: boolean;
  reminderTimes?: string[];
  isActive: boolean;
  position: number;
  invertedTracking?: boolean;      // For habit breaking
}

interface LogEntry {
  id: string;
  logId: string;
  timestamp: string;
  note?: string;
  value?: number;
  mood?: string;
}

interface LogStreak {
  logId: string;
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string;
  totalLogs: number;
  weeklyAverage: number;
}

// CRUD for quick logs
createQuickLog(name, emoji, type, options): Promise<QuickLog>
updateQuickLog(id, updates): Promise<QuickLog | null>
deleteQuickLog(id): Promise<void>
getQuickLogs(): Promise<QuickLog[]>

// Logging entries
logEntry(logId, options): Promise<LogEntry>
undoLastEntry(logId): Promise<boolean>
getTodayCount(logId): Promise<number>
isCompletedToday(logId): Promise<boolean>

// Streaks
getStreak(logId): Promise<LogStreak | null>

// For Claude context
getLogsContextForClaude(): Promise<string>

// Presets
createFromPreset(presetName, options): Promise<QuickLog | null>
LOG_PRESETS: Array<{ name, emoji, type, frequency, category }>
```

**Log Types**:
```typescript
type QuickLogType =
  | 'habit_build'    // Building a habit (want MORE)
  | 'habit_break'    // Breaking a habit (want LESS)
  | 'goal'           // One-time or milestone
  | 'symptom'        // Tracking symptoms/feelings
  | 'medication'     // Med tracking
  | 'custom';        // Anything else
```

**Preset Categories**:
- Health (meds, water, sleep)
- Wellness (meditation, exercise, journaling)
- Self-care (shower, brushed teeth)
- Connection (called someone)
- Habit Breaking (no smoking, no alcohol)
- Tracking (anxious, headache, good energy)

**Context for Claude**:
```typescript
// Example output from getLogsContextForClaude()
`QUICK LOGS (user-defined tracking):
  💊 Morning meds: taken today
  🧘 Meditated: 5 day streak
  🚭 No smoking: 12 days strong
  😰 Anxious: 3 total`
```

---

## Storage & Persistence

### Storage Keys

```typescript
// Journal
const ENTRIES_KEY = 'moodling_journal_entries';

// Life Context
const LIFE_CONTEXT_KEY = 'moodling_life_context';
const LAST_PROCESSED_KEY = 'moodling_life_context_last_processed';

// User Context
const USER_CONTEXT_KEY = 'moodling_user_context';
const PERSONALIZATION_KEY = 'moodling_personalization';
const HISTORY_KEY = 'moodling_entry_history';

// API
const API_KEY_STORAGE = 'moodling_claude_api_key';
const COST_TOTAL_KEY = 'moodling_api_cost_total';
const COST_MONTHLY_KEY = 'moodling_api_cost_monthly';

// HealthKit
const HEALTHKIT_ENABLED_KEY = 'moodling_healthkit_enabled';
const HEALTHKIT_DATA_KEY = 'moodling_healthkit_data';
const HR_BASELINE_KEY = 'moodling_hr_baseline';

// Insights
const INSIGHTS_KEY = 'moodling_health_insights';
const SHOWN_INSIGHTS_KEY = 'moodling_shown_insights';
const CORRELATION_DATA_KEY = 'moodling_correlations';

// Tone
const TONE_PREFERENCES_KEY = 'moodling_tone_preferences';
```

### Data Export

```typescript
async function exportAllData() {
  return {
    entries: await AsyncStorage.getItem(ENTRIES_KEY),
    lifeContext: await AsyncStorage.getItem(LIFE_CONTEXT_KEY),
    userContext: await AsyncStorage.getItem(USER_CONTEXT_KEY),
    tonePreferences: await AsyncStorage.getItem(TONE_PREFERENCES_KEY),
    healthData: await AsyncStorage.getItem(HEALTHKIT_DATA_KEY),
    correlations: await AsyncStorage.getItem(CORRELATION_DATA_KEY),
    // Note: API key intentionally excluded
  };
}
```

---

## API Integration

### Configuration

```typescript
const CLAUDE_CONFIG = {
  baseURL: 'https://api.anthropic.com/v1/messages',
  developmentModel: 'claude-3-haiku-20240307',
  productionModel: 'claude-sonnet-4-20250514',
  model: 'claude-3-haiku-20240307',  // Current
  maxTokens: 300,  // Keep responses concise
  apiVersion: '2023-06-01',
};
```

### Request Format

```typescript
const request = {
  model: CLAUDE_CONFIG.model,
  max_tokens: CLAUDE_CONFIG.maxTokens,
  system: systemPrompt,  // The mega prompt
  messages: [
    { role: 'user', content: '...' },
    { role: 'assistant', content: '...' },
    // ... last 6 messages + current
  ],
};
```

### Cost Tracking

```typescript
const PRICING = {
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
};

function calculateCost(inputTokens: number, outputTokens: number, model: string) {
  const price = PRICING[model];
  return (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output;
}
```

---

## Ethics Implementation

### Non-Diagnostic Language

The mega prompt enforces:
```
YOU NEVER:
- Diagnose mental health conditions
- Suggest medication changes
- Claim to be a therapist or replacement
- Use clinical labels like "you have anxiety disorder"
```

### Anti-Dependency Features

1. **Encourages stepping away**:
   - Prompt includes: "Sometimes suggest stepping away"

2. **Celebrates independence**:
   - "Celebrate when they mention real-world support"

3. **Asks what THEY think**:
   - "What does your gut say?" is often the best question"

4. **Health insights build self-knowledge**:
   - Shows patterns so users understand themselves
   - Goal: "so they eventually don't need the app"

### Privacy By Design

1. **Local storage only** - No cloud sync
2. **Minimal API data** - Compressed context, not full entries
3. **User controls** - Export, delete, disable features
4. **No telemetry** - We don't track usage

---

## Testing

### Unit Tests

```typescript
// Test crisis detection
describe('detectCrisis', () => {
  it('detects suicide keywords', () => {
    expect(detectCrisis('I want to kill myself')).toBe(true);
  });

  it('does not false positive', () => {
    expect(detectCrisis('I had a killer workout')).toBe(false);
  });
});

// Test severity detection
describe('detectSeverity', () => {
  it('detects crisis level', () => {
    expect(detectSeverity('I\'m in crisis')).toBe('crisis');
  });

  it('detects positive', () => {
    expect(detectSeverity('Feeling so grateful today')).toBe('positive');
  });
});
```

### Integration Tests

```typescript
// Test life context building
describe('buildLifeContext', () => {
  it('extracts people from entries', async () => {
    await saveEntry({ text: 'Talked to my therapist Sarah today' });
    const context = await buildLifeContext();
    expect(context.entities).toContainEqual(
      expect.objectContaining({ type: 'person', value: 'Sarah' })
    );
  });
});
```

---

## Psychological Analysis System

### Overview

The psychological analysis system adds a "WHY" layer to Mood Leaf. While the Life Context system tracks *what* happens (facts, events, people), the psychological analysis system understands *why* patterns emerge and *how* to help.

**Key Principle**: Never label, always offer. The system detects patterns but expresses them as gentle suggestions, not clinical diagnoses.

### Architecture

```
Journal Entry
    ↓
Life Context Service ─────→ WHAT (facts, events, people)
    ↓
Psych Analysis Service ───→ WHY (patterns, tendencies, style)
    ↓
Compressed Profile
    ↓
Claude API Context ───────→ Personalized, psychologically-informed responses
```

### Files

```
services/
├── psychTypes.ts           # 450+ detection patterns, types
└── psychAnalysisService.ts # Analysis engine, profile management
```

### 30 Psychological Categories

Based on validated clinical and research frameworks:

| Category | Framework | What It Detects |
|----------|-----------|-----------------|
| Cognitive Distortions | CBT | all-or-nothing, catastrophizing, mind-reading, etc. |
| Defense Mechanisms | Vaillant | mature vs. immature coping styles |
| Attachment Style | Bowlby/Ainsworth | secure, anxious, avoidant, disorganized |
| Locus of Control | Rotter | internal vs. external attribution |
| Emotion Regulation | Gross | suppression, rumination, reappraisal, etc. |
| Polyvagal State | Porges | ventral (safe), sympathetic (fight/flight), dorsal (shutdown) |
| Mindset | Dweck | fixed vs. growth |
| Values | Schwartz | 10 core values (security, benevolence, achievement, etc.) |
| Well-being | Seligman PERMA | positive emotion, engagement, relationships, meaning, accomplishment |
| Grief Style | Doka/Martin | intuitive vs. instrumental |
| Money Psychology | Klontz | avoidance, worship, status, vigilance |
| Relationship Patterns | Gottman | Four Horsemen (criticism, contempt, defensiveness, stonewalling) |

### Usage

```typescript
import { psychAnalysisService } from '@/services/psychAnalysisService';

// Analyze a journal entry
const analysis = await psychAnalysisService.analyzeAndUpdateProfile(
  entryText,
  entryId
);

// Access detected patterns
analysis.cognitiveDistortions    // Thinking pattern signals
analysis.defenseMechanisms       // Coping style signals
analysis.attachmentSignals       // Relationship pattern signals
analysis.polyvagalState          // Nervous system state
analysis.alerts                  // Gentle suggestions (NOT labels)

// Get compressed context for Claude API
const psychContext = await psychAnalysisService.getCompressedContext();
// Returns something like:
// "THINKING PATTERNS:
//  - Tends toward catastrophizing (seen 5x)
//  - Tends toward all or nothing (seen 3x)
//
//  COPING STYLE: neurotic defenses
//  ATTACHMENT: anxious style (70% confidence)
//  AGENCY: Leans external locus of control
//  MINDSET: Leans fixed
//  CORE VALUES: security, benevolence
//
//  COMMUNICATION RECOMMENDATIONS:
//  - Gently challenge worst-case thinking
//  - Provide extra reassurance and validation"
```

### Gentle Suggestions (NOT Labels)

The system generates suggestions that offer, not label:

**Wrong** (clinical, labeling):
- "I notice you're catastrophizing"
- "You're showing signs of anxious attachment"
- "That's a cognitive distortion"

**Right** (gentle, offering):
- "It sounds like this feels really big right now. What would you tell a friend in this situation?"
- "Waiting for connection can feel so uncertain. You're not alone in that."
- "Your body might be running a bit hot right now. Sometimes a few slow breaths can help things settle."

### AI Integration

The psychological context is included in Claude API calls:

```typescript
// In claudeAPIService.ts sendMessage():
const lifeContext = await getLifeContextForClaude();        // Facts
const psychContext = await psychAnalysisService.getCompressedContext(); // Patterns
const healthContext = await getHealthContextForClaude();    // Health

const fullContext = [lifeContext, psychContext, healthContext].join('\n\n');
```

Claude then receives communication recommendations like:
- "Gently challenge worst-case thinking"
- "Provide extra reassurance and validation"
- "Respect need for space, don't push for closeness"
- "Frame challenges as learning opportunities"

### Profile Persistence

The psychological profile is built incrementally and persisted:

```typescript
// Stored in AsyncStorage
const STORAGE_KEY = 'moodleaf_psychological_profile';

// Profile includes:
interface PsychologicalProfile {
  entryCount: number;
  cognitiveDistortions: { pattern, frequency, lastSeen, examples }[];
  defenseMechanisms: { mechanism, frequency, lastSeen }[];
  defenseLevel: 'mature' | 'neurotic' | 'immature';
  attachmentStyle: AttachmentStyle;
  attachmentConfidence: number;
  locusOfControl: { internal: number; external: number };
  // ... 20+ more fields
}
```

### Pattern Detection Example

```typescript
// Input: "I always fail at everything. Nothing ever works out for me."

// Detection:
cognitiveDistortions: [
  { distortion: 'all_or_nothing', matches: ['always', 'everything', 'nothing ever'], confidence: 1.0 }
]

// Gentle suggestion generated:
"Sometimes our minds jump to extremes. What might a middle ground look like here?"

// Profile update:
profile.cognitiveDistortions[0].frequency++ // Increment counter
profile.cognitiveDistortions[0].lastSeen = now
```

### Ethics Considerations

1. **No diagnosis**: The system detects patterns, never diagnoses conditions
2. **Warm language**: All suggestions use tentative, gentle phrasing
3. **User agency**: Suggestions are offered, not imposed
4. **Privacy**: All analysis is local, only compressed summary sent to API
5. **Anti-dependency**: System celebrates user self-awareness, not app usage

---

## AI Coach Adaptive System

### Overview

The AI Coach Adaptive System creates a personalized, responsive AI companion that adapts to the user in multiple dimensions:

1. **Persona Selection** - 7 nature-themed personalities with distinct traits
2. **Mood-to-Persona Switches** - Automatically shifts personality based on detected mood
3. **Time-of-Day Energy Modulation** - Subtly adjusts energy throughout the day
4. **Chronotype Awareness** - Respects user's natural sleep/wake rhythm
5. **Psychological Context** - Incorporates cognitive patterns and attachment style

**Key Principle**: Adaptation happens invisibly. The user experiences a guide that "just gets them" without seeing the mechanics.

### Architecture

```
User Message
    ↓
Mood Detection ────────────→ Mood-to-Persona Switch
    ↓
Time-of-Day Check ─────────→ Energy Modulation
    ↓
Chronotype Check ──────────→ Rhythm Adjustment
    ↓
Psych Context ─────────────→ Pattern-Aware Responses
    ↓
Active Persona + Settings
    ↓
Personality Prompt for Claude
```

### Service: coachPersonalityService.ts

**Key Types**:
```typescript
// 7 nature-themed personas
type CoachPersona = 'clover' | 'spark' | 'willow' | 'luna' | 'ridge' | 'flint' | 'fern';

// User's natural rhythm
type Chronotype = 'early_bird' | 'normal' | 'night_owl';

interface CoachSettings {
  selectedPersona: CoachPersona;
  customName?: string;
  chronotype?: Chronotype;
  adaptiveSettings: AdaptiveSettings;
  detailedSettings: DetailedSettings;
  onboardingAnswers: Record<string, string | string[]>;
}

interface AdaptiveSettings {
  enabled: boolean;
  triggers: ('mood_detected' | 'time_of_day' | 'content_type')[];
  basePersona: CoachPersona;
  moodMappings: Record<string, CoachPersona>;  // Personalized per user
}
```

### Persona Definitions

Each persona has distinct traits:

| Persona | Emoji | Tagline | Traits |
|---------|-------|---------|--------|
| Clover | 🍀 | Your lucky friend | warm, casual, relatable |
| Spark | ✨ | Your cheerleader | energetic, motivating, uplifting |
| Willow | 🌿 | The sage | calm, wise, reflective |
| Luna | 🌙 | The mystic | mindful, grounding, present |
| Ridge | ⛰️ | The coach | focused, goal-oriented, practical |
| Flint | 🔥 | The straight shooter | direct, honest, no-nonsense |
| Fern | 🌱 | The nurturer | gentle, soft, nurturing |

### Mood-to-Persona Switches

When adaptive mode is enabled, the coach automatically switches personas based on detected mood:

```typescript
// Mood detection from message content
function detectMoodFromMessage(message: string): 'anxious' | 'sad' | 'angry' | 'happy' | 'neutral' | undefined {
  // Keywords + somatic compression (body awareness signals)
  // Examples: "chest tight" → anxious, "weight on shoulders" → sad
}

// Personalized mappings generated from onboarding answers
function generateMoodMappings(answers, basePersona): Record<string, CoachPersona> {
  // support_style: 'solutions' → Ridge for action
  // support_style: 'validation' → Fern for nurturing
  // communication_preference: 'direct' → Flint even in tough moments
  // energy_preference: 'calm' → avoid Spark, prefer Luna
}

// Default mappings (personalized during onboarding):
const defaultMappings = {
  anxious: 'luna',    // Calm, grounding presence
  sad: 'fern',        // Gentle nurturing
  angry: 'flint',     // Direct acknowledgment
  happy: 'spark',     // Match their energy
  neutral: basePersona
};
```

### Time-of-Day Energy Modulation

The coach subtly adjusts energy throughout the day without the user noticing:

```typescript
function getTimeEnergyInstruction(timeOfDay: TimeOfDay, chronotype?: Chronotype): string {
  // Morning: gentle awakening energy
  // Afternoon: steady, supportive energy
  // Evening: softening, wind-down energy
  // Night: calm, soothing, prep for rest
}
```

| Time | Standard | Early Bird | Night Owl |
|------|----------|------------|-----------|
| Morning | Gentle awakening | Full energy, engaged | Low-key, no pressure |
| Afternoon | Steady support | Steady support | Steady support |
| Evening | Start softening | Wind-down mode | Still engaged |
| Night | Calm, prep for rest | Deep rest mode | Gently encourage wind-down |

### Chronotype Awareness

Users set their natural rhythm during onboarding:

```typescript
// Onboarding question
{
  id: 'schedule_preference',
  question: "When are you most yourself?",
  options: [
    { id: 'early_bird', label: 'Early bird', description: 'I come alive in the morning' },
    { id: 'normal', label: 'Daytime person', description: 'Pretty standard schedule' },
    { id: 'night_owl', label: 'Night owl', description: 'I do my best thinking late' },
  ],
}
```

**Why it matters**:
- Night owls shouldn't get "wind down" pressure at 9pm if that's their productive time
- Early birds need calmer energy earlier in the evening
- The coach matches their natural rhythm, not a one-size-fits-all schedule

### Travel Awareness & Jet Lag Support

The system can detect travel and timezone changes to help users adjust:

**Data Sources**:
```typescript
// Phone timezone detection
const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const previousTimezone = await AsyncStorage.getItem('last_known_timezone');

// Calendar integration (with permission)
const upcomingTravel = await getCalendarEventsWithTimezoneChanges();
const vacationEvents = await getCalendarEventsMatching(['vacation', 'trip', 'travel']);
```

**Travel Detection Triggers**:
1. **Timezone change** - Phone reports different timezone than stored
2. **Calendar vacation** - Upcoming or active vacation events
3. **Calendar timezone** - Events in different timezones
4. **Sleep pattern disruption** - HealthKit shows irregular sleep

**Adaptation Behavior**:
```typescript
interface TravelState {
  isInTransit: boolean;
  originTimezone: string;
  currentTimezone: string;
  hoursDifference: number;
  daysSinceTravel: number;
  adjustmentPhase: 'acute' | 'adjusting' | 'adjusted';
}

function getTravelAwareEnergyInstruction(travelState: TravelState): string {
  if (travelState.adjustmentPhase === 'acute') {
    return 'The user recently traveled across time zones. Be extra gentle about energy expectations. Don\'t pressure alertness or wind-down based on local time—their body is still adjusting.';
  }
  if (travelState.adjustmentPhase === 'adjusting') {
    return `The user is ${travelState.daysSinceTravel} days into adjusting to a new timezone. Gently encourage alignment with local time while being patient with fatigue.`;
  }
  return ''; // Fully adjusted
}
```

**Jet Lag Tips Generation**:
- Offers gradual adjustment suggestions
- Recommends light exposure timing
- Suggests meal timing adjustments
- Celebrates small wins in adjustment
- Doesn't pressure when user is exhausted

**Chronotype Transition Support**:
If a user wants to shift their chronotype (e.g., night owl → early bird):
```typescript
interface ChronotypeGoal {
  currentChronotype: Chronotype;
  goalChronotype: Chronotype;
  transitionStartDate: string;
  targetShiftMinutesPerWeek: number;
}
```
- Tracks gradual progress
- Adjusts wind-down encouragement timing
- Celebrates morning check-ins
- Supports setbacks without judgment

### Chronotype & Travel Context Compression

The `getChronotypeContextForClaude()` function generates compressed context for the AI:

```typescript
// Example output from getChronotypeContextForClaude()
`CHRONOTYPE: night owl (evening person)

RHYTHM TRANSITION:
- Currently: night_owl → Goal: early_bird
- Started: 12 days ago
- Recent progress: Successfully woke at 7am twice this week
- Support: Encourage earlier wind-downs, celebrate morning check-ins, patience with setbacks

TRAVEL & TIMEZONE:
- Travel frequency: frequently
- Home timezone: America/New_York
- Recent travel: east (6h shift)
- Days since travel: 5
- Status: Adjusting - sleep may still be off, be patient`
```

**Data Stored in CoachSettings**:
```typescript
interface ChronotypeTransition {
  isTransitioning: boolean;
  currentType: Chronotype;
  targetType?: Chronotype;
  startedAt?: string;
  progressNotes?: string[];
}

interface TravelSettings {
  frequency: 'rarely' | 'occasionally' | 'frequently';
  recentTravel?: {
    date: string;
    timezoneShift: number;
    direction: 'east' | 'west';
  };
  homeTimezone?: string;
}
```

**Compression Strategy**:
- Only includes relevant data (no empty sections)
- Jet lag context expires after ~3 weeks
- Progress notes limited to most recent
- Provides actionable support instructions for AI

### Generating the Personality Prompt

```typescript
function generatePersonalityPrompt(settings: CoachSettings, timeOfDay?: TimeOfDay): string {
  const parts: string[] = [];

  // Identity (stays consistent)
  parts.push(`You are ${displayName}, the user's AI companion in the Mood Leaf journaling app.`);
  parts.push(`YOUR NAME IS ${displayName.toUpperCase()}. When asked your name, always say "${displayName}".`);
  parts.push(`Stay in character as ${displayName}. Do not mention being an AI assistant, Claude, or Anthropic.`);

  // Personality traits
  parts.push(`Your personality: ${persona.description}`);
  parts.push(`Core traits: ${persona.traits.join(', ')}.`);
  parts.push(`Examples of how you speak: "${persona.samplePhrases.join('" | "')}"`);

  // Time-aware energy (invisible to user)
  parts.push(getTimeEnergyInstruction(timeOfDay, settings.chronotype));

  // Communication style from detailed settings
  // ... directness, validation, response length, etc.

  return parts.join('\n');
}
```

### Integration with Claude API

In `claudeAPIService.ts`:

```typescript
async function sendMessage(message: string, context: ConversationContext) {
  // 1. Get coach settings
  const coachSettings = await getCoachSettings();

  // 2. Detect mood and time
  const timeOfDay = getCurrentTimeOfDay();
  const detectedMood = detectMoodFromMessage(message);

  // 3. Get adaptive persona (may switch based on mood)
  const activePersona = getAdaptivePersona(coachSettings, {
    timeOfDay,
    detectedMood,
    userMessage: message,
  });

  // 4. Generate personality prompt with time awareness
  const personalityPrompt = generatePersonalityPrompt(
    { ...coachSettings, selectedPersona: activePersona },
    timeOfDay
  );

  // 5. Get psychological context
  const psychContext = await psychAnalysisService.getCompressedContext();

  // 6. Get chronotype and travel context
  const chronotypeContext = await getChronotypeContextForClaude();

  // 7. Build full context and send to Claude
  const contextParts = [lifeContext, psychContext, chronotypeContext, healthContext, ...];
  const systemPrompt = buildSystemPrompt(fullContext, toneInstruction, personalityPrompt);
}
```

### Context Flow to Claude

The AI receives a rich, personalized context:

```
SYSTEM PROMPT:
├── Personality Prompt (persona identity, traits, time-aware energy)
├── Role & Boundaries (Mood Leaf Ethics)
├── Conversation Approach (validate → explore → support → empower)
└── User Context:
    ├── Life Context (facts, events, people)
    ├── Psychological Profile (cognitive patterns, attachment style)
    ├── Chronotype & Travel (rhythm, transitions, jet lag)
    ├── Health Context (sleep, activity, heart rate)
    └── Current Conversation Context (recent mood, upcoming events)
```

### Onboarding Flow

1. **"What brings you to Mood Leaf?"** - Multi-select challenges
2. **"When you're struggling, what helps most?"** - Support style (affects mood mappings)
3. **"How do you prefer to be spoken to?"** - Communication preference
4. **"What energy level do you prefer?"** - Calm ↔ Energetic slider
5. **"When are you most yourself?"** - Chronotype selection
6. **"Are you trying to change your sleep schedule?"** - Chronotype transition (earlier/later/flexible)
7. **"Do you travel across time zones?"** - Travel frequency (rarely/occasionally/frequently)
8. **"Which approaches interest you?"** - Mindfulness, CBT, Somatic, etc.
9. **"Meet your guides"** - Initial persona selection

All answers influence:
- Recommended persona
- Personalized mood-to-persona mappings
- Detailed communication settings
- Chronotype awareness

### Testing Adaptation

```typescript
// Test mood-to-persona switching
describe('getAdaptivePersona', () => {
  it('switches to Luna for anxious mood', () => {
    const persona = getAdaptivePersona(settings, { detectedMood: 'anxious' });
    expect(persona).toBe('luna');
  });

  it('respects user preference for direct support', () => {
    // User who prefers solutions gets Ridge even when anxious
    const settings = { moodMappings: { anxious: 'ridge' } };
    const persona = getAdaptivePersona(settings, { detectedMood: 'anxious' });
    expect(persona).toBe('ridge');
  });
});

// Test time-aware energy
describe('getTimeEnergyInstruction', () => {
  it('gives night owl flexibility in evening', () => {
    const instruction = getTimeEnergyInstruction('evening', 'night_owl');
    expect(instruction).toContain('still engaged');
  });
});
```

---

## AI Data Integration & Learning

### Overview

The AI in Mood Leaf acts like a "friend who knows everything about you." This is achieved through comprehensive data integration that gives Claude access to ALL user data across 11 distinct sources.

**Key Principles**:
1. **Traceable Truth** - Every claim must reference actual user data. If data doesn't exist, say so explicitly.
2. **Universal Data Referencing** - AI can access immediate (today), recent (week), and historical (months/years) data.
3. **Twigs vs Insights** - Raw atomic facts ("exercised 3 times") are separate from derived interpretations ("exercise helps your mood").

### Architecture

```
User Question ("How many times did I exercise?")
    ↓
claudeAPIService.ts → sendMessage()
    ↓
┌───────────────────────────────────────────────────────────┐
│                    CONTEXT ASSEMBLY                        │
├───────────────────────────────────────────────────────────┤
│  1. lifeContext         → getLifeContextForClaude()       │
│  2. psychContext        → psychAnalysisService.getCompressedContext() │
│  3. chronotypeContext   → getChronotypeContextForClaude() │
│  4. healthContext       → getHealthContextForClaude()     │
│  5. correlationContext  → getCorrelationSummaryForClaude()│
│  6. logsContext         → getDetailedLogsContextForClaude() ← DETAILED │
│  7. lifestyleContext    → getLifestyleFactorsContextForClaude() │
│  8. exposureContext     → getExposureContextForClaude()   │
│  9. journalContext      → getRecentJournalContextForClaude() │
│ 10. richContext         → getContextForClaude()           │
│ 11. conversationContext → buildConversationContext()      │
└───────────────────────────────────────────────────────────┘
    ↓
Claude API (with full context)
    ↓
Response: "You've exercised 47 times total - 8 times this week..."
```

### The 11 Data Sources

| # | Source | Service | What Claude Sees |
|---|--------|---------|------------------|
| 1 | **Life Context** | lifeContextService.ts | People, milestones, themes, profession, identity, medications |
| 2 | **Psychological Profile** | psychAnalysisService.ts | Cognitive patterns, attachment style, values, defense mechanisms |
| 3 | **Chronotype & Travel** | coachPersonalityService.ts | Sleep rhythm, transitions, jet lag, timezone awareness |
| 4 | **HealthKit Data** | healthKitService.ts | Heart rate, sleep hours/quality, activity, stress indicators |
| 5 | **Health Correlations** | healthInsightService.ts | Sleep-mood correlation, activity-mood correlation, trends |
| 6 | **Detailed Tracking Logs** | quickLogsService.ts | **FULL counts** (today, week, month, all-time), streaks, notes |
| 7 | **Lifestyle Factors** | patternService.ts | Caffeine, alcohol, exercise, outdoor time, social time, sleep |
| 8 | **Exposure Ladder** | exposureLadderService.ts | Social anxiety level (1-8), attempts, completion rate, progress |
| 9 | **Recent Journal Entries** | journalStorage.ts | Actual text from past 7 days with moods and timestamps |
| 10 | **User Preferences** | userContextService.ts | Communication style, tone preferences, mood trends, triggers |
| 11 | **Conversation Context** | claudeAPIService.ts | Current chat context, recent messages, immediate mood |

### Detailed Tracking Data (Twigs)

The `getDetailedLogsContextForClaude()` function provides comprehensive tracking data:

```typescript
// Example output:
`DETAILED TRACKING DATA (Twigs - raw atomic facts):

  🏃 Exercised (habit_build):
    - Today: 2 times
    - This week: 8 times
    - This month (30 days): 25 times
    - All time total: 47 times
    - Current streak: 5 days
    - Longest streak: 12 days
    - Weekly average: 5.3 per week
    - Recent breakdown: Today: 2, Yesterday: 1, 2026-01-18: 2
    - Recent notes: "Morning jog", "Gym after work"
    - First logged: 2025-11-15
    - Last logged: 2026-01-20

  💊 Morning meds (medication):
    - Today: 1 time
    - This week: 7 times
    - This month (30 days): 28 times
    - All time total: 156 times
    - Current streak: 28 days
    - Longest streak: 45 days
    - Weekly average: 7 per week
    - First logged: 2025-08-01
    - Last logged: 2026-01-20

  😰 Anxious (symptom):
    - Today: 0 times
    - This week: 2 times
    - This month (30 days): 8 times
    - All time total: 34 times
    - Recent breakdown: 2026-01-18: 1, 2026-01-15: 1
    - Recent notes: "Before meeting", "Couldn't sleep"
    - First logged: 2025-09-10
    - Last logged: 2026-01-18`
```

**Implementation** (quickLogsService.ts):
```typescript
export async function getDetailedLogsContextForClaude(): Promise<string> {
  const logs = await getQuickLogs();
  if (logs.length === 0) return '';

  const parts: string[] = ['DETAILED TRACKING DATA (Twigs - raw atomic facts):'];

  for (const log of logs) {
    const streak = await getStreak(log.id);
    const todayCount = await getTodayCount(log.id);
    const weekEntries = await getEntriesForLog(log.id, 7);
    const monthEntries = await getEntriesForLog(log.id, 30);
    const allEntries = await getEntriesForLog(log.id);

    // Build comprehensive status with counts, streaks, dates, notes...
  }

  return parts.join('\n');
}
```

### Lifestyle Factors Context

The `getLifestyleFactorsContextForClaude()` function tracks manual daily inputs:

```typescript
// Example output:
`LIFESTYLE FACTORS (manually tracked daily):

  Today:
    - Caffeine: 2 drinks
    - Exercise: 45 minutes
    - Outdoor time: 30 minutes
    - Social time: 120 minutes
    - Sleep: 7 hours

  2-week averages:
    - Caffeine: 1.8 drinks/day
    - Exercise: 32 min/day
    - Outdoor time: 25 min/day
    - Social time: 85 min/day
    - Sleep: 6.8 hrs/night

  Recent daily breakdown:
    2026-01-20: ☕2, 🏃45m, 🌳30m, 👥120m, 😴7h
    2026-01-19: ☕1, 🏃30m, 🌳15m, 😴6.5h
    2026-01-18: ☕3, 🍺2, 👥180m, 😴5h`
```

### Exposure Ladder Context

The `getExposureContextForClaude()` function tracks social anxiety progress:

```typescript
// Example output:
`SOCIAL EXPOSURE PROGRESS (anxiety management):

  Current comfort level: 4/8 - "Short conversation"
  Level description: Brief but real exchanges

  Progress statistics:
    - Total attempts: 23
    - Completed: 19
    - Highest level attempted: 5/8
    - Average anxiety reduction: 2.3 points
    - Current practice streak: 8 days

  Recent exposure attempts (last 30 days):
    2026-01-20: ✓ Level 4 "Short conversation" (anxiety: 6→4)
    2026-01-19: ✓ Level 3 "Brief interaction"
    2026-01-18: ○ Level 5 "One-on-one hangout"
      Note: "Had to leave early, felt overwhelmed"`
```

### Recent Journal Context

The `getRecentJournalContextForClaude()` function provides actual journal text:

```typescript
// Example output:
`RECENT JOURNAL ENTRIES (what user actually wrote):

  [Mon, Jan 20 9:15 AM] (positive):
    "Had a great morning workout. Feeling energized and ready for the day."

  [Sun, Jan 19 10:30 PM] (neutral):
    "Quiet day. Spent time reading and didn't leave the house. Not bad, just quiet."

  [Sat, Jan 18 2:45 PM] (negative):
    "Anxious about the work presentation on Monday. Keep imagining all the ways..."

  Week summary: 5 entries (positive: 2, neutral: 2, negative: 1)
  Total journal entries all time: 156
  Current journaling streak: 12 days`
```

### Context Assembly in claudeAPIService.ts

```typescript
async function sendMessage(message: string, context: ConversationContext) {
  // ... persona and tone setup ...

  // Get ALL context sources
  const lifeContext = await getLifeContextForClaude();
  const psychContext = await psychAnalysisService.getCompressedContext();
  const chronotypeContext = await getChronotypeContextForClaude();

  let healthContext = '';
  let correlationContext = '';
  if (await isHealthKitEnabled()) {
    healthContext = await getHealthContextForClaude();
    correlationContext = await getCorrelationSummaryForClaude();
  }

  // DETAILED tracking data (not just summaries)
  const logsContext = await getDetailedLogsContextForClaude();

  // Lifestyle factors (caffeine, alcohol, exercise, outdoor, social, sleep)
  const lifestyleContext = await getLifestyleFactorsContextForClaude();

  // Exposure ladder progress
  const exposureContext = await getExposureContextForClaude();

  // Recent journal entries (actual text)
  const journalContext = await getRecentJournalContextForClaude();

  // User preferences and mood trends
  const richContext = await getContextForClaude();

  // Current conversation
  const conversationContext = buildConversationContext(context);

  // Assemble in order: facts → patterns → immediate context
  const contextParts = [
    lifeContext,         // Lifetime overview (people, events, themes)
    psychContext,        // Psychological profile (cognitive patterns)
    chronotypeContext,   // Chronotype and travel awareness
    healthContext,       // HealthKit data (heart rate, sleep, activity)
    correlationContext,  // Health-mood correlations
    logsContext,         // DETAILED tracking data (exact counts)
    lifestyleContext,    // Lifestyle factors (caffeine, alcohol, etc.)
    exposureContext,     // Social exposure ladder progress
    journalContext,      // Recent journal entries (actual text)
    richContext,         // User preferences and mood trends
    conversationContext  // Current conversation context
  ].filter(Boolean);

  const fullContext = contextParts.join('\n\n');
  const systemPrompt = buildSystemPrompt(fullContext, toneInstruction, personalityPrompt);
  // ... send to Claude API ...
}
```

### What Claude Can Now Answer

With comprehensive data integration, Claude can answer questions like:

| Question | Data Source | Example Response |
|----------|-------------|------------------|
| "How many times did I exercise?" | Detailed Logs | "You've exercised 47 times total, 8 times this week" |
| "When was my last panic attack?" | Detailed Logs | "Your last logged panic attack was January 15th" |
| "How's my sleep been?" | HealthKit + Lifestyle | "You averaged 6.8 hours this week, down from 7.2" |
| "What did I write about yesterday?" | Journal Context | "Yesterday you mentioned feeling anxious about..." |
| "How's my social anxiety progress?" | Exposure Context | "You've completed 19 of 23 attempts, now at level 4" |
| "Do I drink more coffee on bad days?" | Lifestyle + Correlations | "Your caffeine tends to be higher on anxious days" |
| "How long have I been journaling?" | Life Context | "You started 8 months ago with 156 entries" |
| "What are my triggers?" | User Context | "You've noted work deadlines and family calls" |

### Adding New Data Sources

To add a new data source:

1. **Create the context function** in the appropriate service:
```typescript
// In myService.ts
export async function getMyDataContextForClaude(): Promise<string> {
  const data = await getMyData();
  if (!data) return '';

  const parts: string[] = ['MY DATA CATEGORY:'];
  // Format data for Claude...
  return parts.join('\n');
}
```

2. **Import and call it** in claudeAPIService.ts:
```typescript
import { getMyDataContextForClaude } from './myService';

// In sendMessage():
let myDataContext = '';
try {
  myDataContext = await getMyDataContextForClaude();
} catch (error) {
  console.log('Could not load my data context:', error);
}

// Add to contextParts array:
const contextParts = [...existingParts, myDataContext].filter(Boolean);
```

3. **Document it** here and update tests.

### Testing Data Integration

```typescript
// Test that Claude receives detailed counts
describe('getDetailedLogsContextForClaude', () => {
  it('includes all-time totals', async () => {
    await createQuickLog('Test', '🧪', 'habit_build');
    await logEntry(logId);
    await logEntry(logId);

    const context = await getDetailedLogsContextForClaude();
    expect(context).toContain('All time total: 2 times');
  });

  it('includes weekly breakdown', async () => {
    const context = await getDetailedLogsContextForClaude();
    expect(context).toContain('This week:');
    expect(context).toContain('Recent breakdown:');
  });
});

// Test lifestyle factors
describe('getLifestyleFactorsContextForClaude', () => {
  it('shows today and averages', async () => {
    await saveFactors(today, { caffeineCount: 2, exerciseMinutes: 30 });

    const context = await getLifestyleFactorsContextForClaude();
    expect(context).toContain('Caffeine: 2 drinks');
    expect(context).toContain('2-week averages');
  });
});
```

### Ethics & Privacy

1. **Local Processing** - All context building happens on device
2. **Compressed Summaries** - Only necessary context sent to API
3. **User Control** - Users can delete any/all data at any time
4. **No External Storage** - Claude doesn't retain data between sessions
5. **Transparent** - Users can see what data exists via Settings

---

## AI Adaptation Verification System

The Simulator Mode is a comprehensive verification system that tests whether AI services are functioning correctly, adapting over time, compressing information safely, and accurately referencing data.

### Purpose

Verify that the AI:
1. **Can reference ALL user data** - Twigs, journals, life context, psych profile, etc.
2. **Can reason across time** - Days, months, years
3. **Admits data limits** - Acknowledges missing/ambiguous data
4. **Operates via natural language** - All reasoning verbalized
5. **Acts as a Coach** - Answers questions about user data safely

### Service File

**Location**: `services/simulatorModeService.ts`

**Key Exports**:
```typescript
// Enable/disable simulator mode
setSimulatorEnabled(enabled: boolean): Promise<void>
isSimulatorEnabled(): Promise<boolean>

// Run verification tests
runGlobalTest(): Promise<{ passed: boolean; results: ServiceTestResult[]; prompts: VerificationPrompt[] }>
runServiceTest(service: AIServiceType): Promise<ServiceTestResult>

// Generate test prompts
generateChallengeForChat(): Promise<{ challenge: VerificationPrompt; prefilledPrompt: string; expectedData: string }>
generateChallengeByCategory(category: string): Promise<{ challenge: VerificationPrompt | null; prefilledPrompt: string; expectedData: string }>

// Diagnostic report for troubleshooting
generateDiagnosticReport(): Promise<string>

// Failure logging
getFailureLogs(): Promise<FailureLog[]>
clearFailureLogs(): Promise<void>
```

### Services Tested

| Service | Description |
|---------|-------------|
| `twigs` | Quick logs (raw atomic data) |
| `journaling` | Journal entries |
| `compression` | Life context compression |
| `psych_series` | Psychological patterns/profiles |
| `health` | HealthKit integration |
| `insights` | Pattern observations |
| `coaching` | AI coach responses |
| `exposure` | Social exposure ladder |

### Four Testing Axes

Each service is tested on these axes (25 points each = 100 total):

1. **Input Integrity** (25 pts)
   - Is the AI using only available data?
   - Is it respecting ambiguity and gaps?
   - Is it avoiding overgeneralization?

2. **Compression Accuracy** (25 pts)
   - Are summaries traceable to real data?
   - Are assumptions marked as tentative?
   - Are revisions made when new data contradicts?

3. **Adaptation Over Time** (25 pts)
   - Does the data evolve as new info arrives?
   - Does it release outdated narratives?
   - Does it handle reversals (improvement after decline)?

4. **Mental Health Safety** (25 pts)
   - Emphasizes resilience and agency?
   - Avoids pathologizing language?
   - Avoids deterministic framing?

### Verification Prompts

The system generates test prompts based on available data:

```typescript
type VerificationPrompt = {
  id: string;
  category: 'data_accuracy' | 'long_term_correlation' | 'cross_domain' | 'memory_integrity' | 'mental_health_framing';
  prompt: string;
  expectedBehavior: string;
  failureIndicators: string[];
  targetService: AIServiceType;
}
```

**Example Categories**:

| Category | Purpose |
|----------|---------|
| `data_accuracy` | "How many times did I exercise today?" |
| `long_term_correlation` | "What patterns contributed to anxiety over 2 years?" |
| `cross_domain` | "Find a restaurant matching my preferences" |
| `memory_integrity` | "Earlier you said X - show me the data" |
| `mental_health_framing` | "Summarize last month supportively" |

### Diagnostic Report

Generates a comprehensive markdown report for Claude troubleshooting:

```typescript
const report = await generateDiagnosticReport();
// Copy report and paste to Claude to debug AI issues
```

**Report Sections**:
- Simulator State (enabled, last test, total runs)
- Data Available (twigs, journals, life context, psych profile)
- Today's Data (with exact counts and values)
- Recent Data Sample (last 7 days)
- Service Test Results (pass/fail per axis)
- Failure Logs (with evidence)
- Verification Prompts (ready-to-use test prompts)
- Life Context & Psych Profile (truncated)
- Troubleshooting Instructions

### Failure Logging

All failures are logged with:

```typescript
type FailureLog = {
  id: string;
  timestamp: string;
  service: AIServiceType;
  axis: TestAxis;
  claim: string;          // What the AI claimed
  issue: string;          // What was wrong
  evidence: string;       // Data that proves the issue
  isRegression: boolean;  // Was this working before?
  affectsOtherServices: AIServiceType[]; // Cascading failures
}
```

### UI Screen

**Location**: `app/simulator.tsx`

**Features**:
- On/Off toggle for continuous verification
- Data summary (twigs, journals, life context status)
- Global Test button (tests all services)
- Per-service test cards (tap to test, shows score /100)
- Reference Challenge "well":
  - Random Challenge button
  - By Category picker
  - Editable prompt text area
  - Copy to Clipboard button
  - Shows expected data
- Diagnostic Report generator with copy button
- Failure Logs viewer with clear button

**Access**: Settings → Developer Tools → Simulator Mode

### Usage Example

```typescript
import {
  runGlobalTest,
  generateChallengeForChat,
  generateDiagnosticReport,
} from '@/services/simulatorModeService';

// Run all tests
const result = await runGlobalTest();
console.log(`Global: ${result.passed ? 'PASS' : 'FAIL'}`);
for (const service of result.results) {
  console.log(`${service.service}: ${service.overallScore}/100`);
}

// Generate a challenge to test the AI
const challenge = await generateChallengeForChat();
console.log('Ask the AI:', challenge.prefilledPrompt);
console.log('Expected:', challenge.expectedData);

// Generate diagnostic report for troubleshooting
const report = await generateDiagnosticReport();
// Copy this and paste to Claude for debugging
```

### Privacy & Data

- **All testing happens locally** - No data sent to external services
- **Diagnostic reports are generated on-demand** - Not stored automatically
- **Failure logs stay on device** - Can be cleared at any time
- **User controls everything** - Toggle on/off, clear data anytime

---

## Cycle Tracking System

### Overview

The Cycle Tracking System enables the entire app to adapt based on menstrual cycle phases. When enabled, the guide becomes gentler during PMS, Sparks shift to soothing prompts, and Fireflies generate cycle-aware personal insights.

### Service: cycleService.ts (Planned)

**Purpose**: Track menstrual cycles and provide cycle-aware context to all app features.

**Key Exports**:
```typescript
interface CycleData {
  periodStartDates: string[];        // ISO dates of period starts
  periodEndDates: string[];          // ISO dates of period ends
  averageCycleLength: number;        // Calculated from history
  averagePeriodLength: number;       // Calculated from history
  currentPhase: CyclePhase;          // Current phase
  dayOfCycle: number;                // Current day (1-28+)
  predictedNextPeriod: string;       // Predicted start date
  predictedPMSStart: string;         // Predicted PMS start
}

type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

// Main functions
getCycleData(): Promise<CycleData | null>
logPeriodStart(): Promise<void>
logPeriodEnd(): Promise<void>
getCurrentPhase(): Promise<CyclePhase | null>
getCycleContextForClaude(): Promise<string>
```

### Settings: Cycle & Period Section

All cycle features are individually toggleable. Not everyone has heavy periods—users customize what's helpful:

```typescript
interface CycleSettings {
  // Master toggle - turns EVERYTHING off
  enabled: boolean;

  // Life stage - determines tracking mode
  lifeStage: 'regularCycles' | 'perimenopause' | 'menopause' | 'postMenopause' | 'pregnant' | 'postpartum';

  // Feature toggles
  showQuickSymptomButton: boolean;   // FAB on home screen during period
  enableSoothingSparks: boolean;     // Gentler Sparks during PMS
  enableCycleFireflies: boolean;     // Cycle-aware personal insights
  guideAdaptationLevel: 'none' | 'subtle' | 'full';  // How much guide adjusts

  // Symptom Twigs to show (user picks which ones)
  enabledTwigs: {
    periodStartEnd: boolean;
    flowLevel: boolean;
    cramps: boolean;
    bloating: boolean;
    breastTenderness: boolean;
    headache: boolean;
    moodShift: boolean;
    cravings: boolean;
    energyLevel: boolean;
    sleepQuality: boolean;
  };

  // Reminders
  reminders: CycleReminders;

  // Wearable sync
  syncSource: 'manual' | 'healthkit' | 'oura' | 'whoop';

  // Fertility & Contraception
  trackFertilityWindow: boolean;
  contraception: ContraceptionReminder;

  // Perimenopause/Menopause specific
  trackMenopauseSymptoms: boolean;

  // Pregnancy (when lifeStage === 'pregnant')
  pregnancy?: PregnancyData;
}
```

### Life Stages

Users select their current life stage for personalized tracking:

| Stage | Description | Tracking Mode |
|-------|-------------|---------------|
| `regularCycles` | Normal menstrual cycles | Full period/phase tracking |
| `perimenopause` | Transition phase, irregular cycles | Period tracking + menopause symptoms |
| `menopause` | No period for 12+ months | Symptom tracking only, no period predictions |
| `postMenopause` | Post-menopause wellness | Wellness focus, minimal tracking |
| `pregnant` | Pregnancy mode | Trimester tracking, period paused |
| `postpartum` | Post-birth recovery | Recovery focus, cycle may be irregular |

```typescript
// Life stage affects what's shown
const showPeriodTracking = ['regularCycles', 'perimenopause'].includes(settings.lifeStage);
const showMenopauseSymptoms = ['perimenopause', 'menopause'].includes(settings.lifeStage);
const showPregnancyUI = settings.lifeStage === 'pregnant';
```

### Perimenopause/Menopause Symptoms

Additional symptoms tracked during perimenopause/menopause:

```typescript
type MenopauseSymptom =
  | 'hotFlash'           // Frequency & intensity
  | 'nightSweat'         // Disrupted sleep
  | 'sleepDisturbance'   // Insomnia, waking
  | 'brainFog'           // Memory, concentration
  | 'vaginalDryness'     // Comfort issues
  | 'jointPain'          // Aches, stiffness
  | 'heartPalpitations'  // Racing heart
  | 'anxietySpike'       // Sudden anxiety
  | 'libidoChange';      // Desire changes

// Guide adaptation for menopause
const menopauseGuidance = {
  perimenopause: 'Validates unpredictability, normalizes symptoms, extra patience',
  menopause: 'No period expectations, focuses on symptom support and wellness',
  postMenopause: 'Wellness-focused, supports healthy aging',
};
```

### Pregnancy Mode

When `lifeStage === 'pregnant'`:

```typescript
interface PregnancyData {
  dueDate: string;        // Expected due date
  conceptionDate?: string;
  currentWeek: number;    // Calculated from due date
  trimester: 1 | 2 | 3;   // Auto-calculated
  notes: string[];
}

// Trimester-aware guide adaptation
const trimesterGuidance = {
  1: 'Acknowledges exhaustion, nausea, validates early pregnancy challenges',
  2: 'More energy often, still validates physical changes',
  3: 'Preparation mode, validates discomfort, gentle encouragement',
};

// Period tracking is automatically paused
// Quick Symptom Button hidden
// No period predictions or reminders
```

### Contraception Reminders

```typescript
interface ContraceptionReminder {
  type: 'pill' | 'iud' | 'implant' | 'ring' | 'patch' | 'injection' | 'none';
  enabled: boolean;
  reminderTime?: string;   // HH:MM for daily pill
  nextCheckDate?: string;  // IUD check, implant renewal
  notes?: string;
}

// Example reminders:
// - Pill: Daily at user's preferred time
// - IUD: "Time for your IUD check" (yearly)
// - Implant: "Implant renewal coming up" (3 years)
```

**Settings UI Layout**:
```
Settings > Cycle & Period
├── [Toggle] Cycle Tracking (master on/off)
│
├── Life Stage (grid selector)
│   ├── 🌙 Regular Cycles
│   ├── 🌅 Perimenopause
│   ├── 🌸 Menopause
│   ├── ✨ Post-Menopause
│   ├── 🤰 Pregnant
│   └── 👶 Postpartum
│
├── Menopause Symptoms (shows for perimenopause/menopause)
│   ├── [Toggle] Track Symptoms
│   └── Symptom chips: Hot Flashes, Night Sweats, Sleep Issues,
│       Brain Fog, Mood Changes, Anxiety, Joint Pain, etc.
│
├── Pregnancy Mode (shows for pregnant)
│   └── Set due date, track trimesters
│
├── Quick Actions
│   ├── [Button] Add All Cycle Twigs  → enables all symptom Twigs
│   └── [Button] Remove Cycle Twigs   → disables all symptom Twigs
│
├── Features
│   ├── [Toggle] Quick Symptom Button
│   ├── [Toggle] Soothing Sparks (PMS)
│   ├── [Toggle] Cycle Fireflies
│   ├── [Toggle] Track Fertility Window (optional)
│   └── [Picker] Guide Adaptation: None / Subtle / Full
│
├── Symptom Twigs (individual toggles)
│   ├── Period Start/End
│   ├── Flow Level
│   ├── Cramps
│   ├── Bloating
│   ├── Breast Tenderness
│   ├── Headache
│   ├── Mood Shift
│   ├── Cravings
│   ├── Energy Level
│   └── Sleep Quality
│
├── Reminders
│   ├── [Toggle] Enable Reminders
│   ├── [Toggle] Notifications (master on/off for all alerts)
│   ├── [Toggle] Period Approaching
│   │   └── [Picker] Alert me: 1d / 2d / 3d / 5d / 7d before
│   ├── [Toggle] PMS Starting (based on user's patterns)
│   ├── [Toggle] Log Symptoms Reminder
│   ├── [Toggle] Ovulation Reminder
│   └── [Picker] Alert Type: Push Notification / Firefly Alert
│
├── Contraception
│   ├── [Picker] Type: None / Pill / IUD / Implant / Ring / Patch / Injection
│   ├── [Time] Daily reminder time (for pill)
│   └── [Date] Next check date (for IUD/implant)
│
└── Data Source
    └── [Picker] Manual / HealthKit / Oura / Whoop
```

**Master Toggle Behavior**:
- OFF → Hides all cycle features, removes Quick Symptom button, stops cycle context from being sent to Claude
- Data is preserved (not deleted) so user can re-enable later

**UX Principle**: Respect that everyone's experience is different. Some have light periods with no symptoms. Some have debilitating cramps. Let users build their own tracking experience.

### Cycle Phases & Adaptation

| Phase | Days | Guide Behavior | Sparks | Fireflies |
|-------|------|----------------|--------|-----------|
| **Menstrual** | 1-5 | Extra gentle, acknowledges energy dips | Soft, restful prompts | "Rest is productive right now" |
| **Follicular** | 6-13 | Normal energy, open to challenges | Standard selection | Normal personalization |
| **Ovulation** | 14-16 | Peak energy, action-oriented | Energetic, creative prompts | Achievement-focused insights |
| **Luteal/PMS** | 17-28 | Gentler, validates physical symptoms | Soothing, introspective | "Your anxiety peaks now—it passes" |

### Cycle-Specific Twigs

Preset Twigs for cycle tracking:

```typescript
const CYCLE_TWIGS = [
  { name: 'Period Start', emoji: '🔴', type: 'symptom' },
  { name: 'Period End', emoji: '⭕', type: 'symptom' },
  { name: 'Flow Level', emoji: '💧', type: 'symptom' },
  { name: 'Cramps', emoji: '😣', type: 'symptom' },
  { name: 'Bloating', emoji: '🎈', type: 'symptom' },
  { name: 'Breast Tenderness', emoji: '💔', type: 'symptom' },
  { name: 'Headache', emoji: '🤕', type: 'symptom' },
  { name: 'Mood Shift', emoji: '🎭', type: 'symptom' },
  { name: 'Cravings', emoji: '🍫', type: 'symptom' },
  { name: 'Energy Level', emoji: '⚡', type: 'symptom' },
];
```

### Quick Symptom Button (Home Screen)

During menstrual phase, a floating action button appears on the home screen for quick symptom logging:

```typescript
// Settings toggle
interface CycleSettings {
  enabled: boolean;
  showQuickSymptomButton: boolean;  // Show FAB during period
  quickSymptomOptions: string[];     // Which symptoms to show
}

// Component logic
const showQuickButton =
  cycleSettings.enabled &&
  cycleSettings.showQuickSymptomButton &&
  currentPhase === 'menstrual';

// Quick symptom modal shows:
// - Flow level (light/medium/heavy)
// - Cramps (1-5 scale)
// - Energy (1-5 scale)
// - Quick notes
// - One-tap common symptoms (bloating, headache, mood)
```

**UX Rationale**: When someone is experiencing period symptoms, navigating through menus is extra friction. A prominent, easy-to-tap button removes barriers to tracking.

### Soothing Sparks (PMS-specific)

When `enableSoothingSparks` is ON and user is in luteal/PMS phase, Sparks filter to gentler prompts:

```typescript
// sparkService.ts additions
const SOOTHING_SPARK_TAGS = ['gentle', 'rest', 'comfort', 'grounding', 'self-care'];

function getSparkForPhase(phase: CyclePhase, settings: CycleSettings): Spark {
  if (phase === 'luteal' && settings.enableSoothingSparks) {
    // Filter to soothing category
    return getRandomSpark({ tags: SOOTHING_SPARK_TAGS });
  }
  return getRandomSpark(); // Normal selection
}

// Example soothing Sparks:
// "What would feel like kindness right now?"
// "Your body is asking for something. What is it?"
// "Rest is not giving up. Rest is preparation."
// "What's one small comfort you can give yourself?"
```

### Cycle Reminders & Firefly Alerts

Two alert types available:

**Push Notifications**:
- Standard iOS/Android notifications
- "Your period is predicted in 2 days"
- "PMS usually starts around now for you"

**Firefly Alerts** (less intrusive):
- A Firefly on home screen blinks/pulses to get attention
- Tap to reveal the cycle insight
- More gentle, in-app experience
- Great for users who hate notifications

```typescript
interface CycleReminders {
  enabled: boolean;                    // Master toggle for all reminders
  notificationsEnabled: boolean;       // On/off switch for period notifications
  periodApproaching: boolean;          // 1-3 days before predicted period
  pmsStarting: boolean;                // Based on user's historical patterns
  logSymptomsReminder: boolean;        // Daily during period
  ovulationReminder: boolean;          // Fertility window alerts
  alertType: 'push' | 'firefly';       // How to deliver alerts
}

// Firefly alert implementation
function triggerFireflyAlert(message: string) {
  // Set special "alert" firefly that blinks
  await setAlertFirefly({
    message,
    type: 'cycle_reminder',
    blink: true,
    expiresIn: '24h',
  });
}

// Example alerts:
// "Your period is predicted in 2 days. Prep time?"
// "PMS usually hits around now. Be extra gentle with yourself."
// "Day 3 of your period. How are you feeling?"
```

### Cycle Fireflies (Personal Insights)

When `enableCycleFireflies` is ON, Fireflies generate cycle-aware personal wisdom:

```typescript
// firefliesService.ts additions
async function generateCycleFirefly(cycleData: CycleData): Promise<string> {
  const patterns = await getCyclePatterns(); // From history

  // Examples of cycle-aware Fireflies:
  // "Your anxiety usually peaks around day 23. You're on day 24. It always passes."
  // "Last month you felt exactly like this on day 25. By day 28 you felt better."
  // "Cramps tend to start tomorrow for you. Maybe prep your heating pad?"
  // "You've tracked 6 cycles now. Your average is 29 days, not 28."
}
```

### Integration Points

1. **claudeAPIService.ts** - Add cycle context as 14th data source
2. **sparkService.ts** - Filter to soothing Sparks during luteal phase (if enabled)
3. **firefliesService.ts** - Generate cycle-aware personal insights (if enabled)
4. **coachPersonalityService.ts** - Guide becomes gentler during PMS (based on adaptation level)

### Context for Claude

```typescript
// Example output from getCycleContextForClaude()
`CYCLE CONTEXT:
  Phase: luteal (PMS)
  Day of cycle: 24
  Predicted period: 4 days

  Recent symptoms logged:
    - Cramps: today, yesterday
    - Mood shift: 3 times this week
    - Energy: low (2 days)

  Historical patterns:
    - Anxiety typically peaks days 22-26
    - Cramps usually start day 25
    - Average cycle: 28 days

  Adaptation: Be extra gentle, validate physical discomfort,
  avoid pushing productivity, remind her this phase always passes.`
```

### Onboarding Integration

During onboarding, ask:

```typescript
const PERSONALIZATION_QUESTIONS = [
  {
    id: 'first_name',
    question: "What's your first name?",
    type: 'text',
    placeholder: 'So your guide can address you personally',
  },
  {
    id: 'pronouns',
    question: 'What are your pronouns?',
    type: 'select',
    options: ['she/her', 'he/him', 'they/them', 'custom'],
  },
  {
    id: 'experiences_periods',
    question: 'Do you experience menstrual cycles?',
    type: 'boolean',
    description: 'Enables cycle-aware adaptation across the app',
  },
];
```

### HealthKit Integration

Cycle tracking fully integrates with Apple HealthKit for seamless data sync across health apps.

**Required HealthKit Permissions**:
```typescript
const CYCLE_HEALTHKIT_TYPES = {
  read: [
    HKCategoryTypeIdentifier.menstrualFlow,
    HKCategoryTypeIdentifier.intermenstrualBleeding,
    HKCategoryTypeIdentifier.ovulationTestResult,
    HKCategoryTypeIdentifier.cervicalMucusQuality,
    HKCategoryTypeIdentifier.sexualActivity,
    HKQuantityTypeIdentifier.basalBodyTemperature,
  ],
  write: [
    HKCategoryTypeIdentifier.menstrualFlow,
    HKCategoryTypeIdentifier.abdominalCramps,
    HKCategoryTypeIdentifier.bloating,
    HKCategoryTypeIdentifier.breastPain,
    HKCategoryTypeIdentifier.headache,
    HKCategoryTypeIdentifier.moodChanges,
    HKCategoryTypeIdentifier.fatigue,
  ],
};
```

**Sync Implementation**:
```typescript
interface HealthKitCycleSync {
  // Read cycle data from Apple Health
  async importCycleData(): Promise<CycleData> {
    const periods = await HealthKit.queryCategory(
      HKCategoryTypeIdentifier.menstrualFlow,
      { startDate: sixMonthsAgo }
    );
    return processPeriodData(periods);
  }

  // Write symptoms to Apple Health
  async exportSymptom(symptom: CycleSymptom): Promise<void> {
    await HealthKit.saveCategory(symptom.healthKitType, {
      value: symptom.severity,
      startDate: symptom.date,
      metadata: { source: 'MoodLeaf' },
    });
  }

  // Bi-directional sync
  async syncWithHealthKit(): Promise<void> {
    await this.importCycleData();
    await this.exportPendingSymptoms();
  }
}
```

**Symptom Mapping**:
| Mood Leaf Twig | HealthKit Category |
|----------------|-------------------|
| Cramps | abdominalCramps |
| Bloating | bloating |
| Breast Tenderness | breastPain |
| Headache | headache |
| Mood Shift | moodChanges |
| Fatigue/Energy | fatigue |
| Period Start/End | menstrualFlow |
| Flow Level | menstrualFlow (with value) |

**Privacy Notes**:
- HealthKit data never leaves device
- Symptoms sync bi-directionally
- User controls read/write permissions separately
- Data from other apps (Clue, Flo, Apple Cycle Tracking) becomes available

### Wearable Integrations

Cycle data can be imported from popular wearables:

| Source | API | Data Available |
|--------|-----|----------------|
| **Oura Ring** | Oura API v2 | Period prediction, temperature trends, readiness score |
| **Apple Watch** | HealthKit | Cycle tracking data, heart rate variability, sleep |
| **Whoop** | Whoop API | Recovery score, strain, sleep performance, cycle data |

**Implementation Notes**:
```typescript
// Check available sources
const sources = await getAvailableCycleSources();
// Returns: ['manual', 'healthkit', 'oura', 'whoop']

// Sync from preferred source
await syncCycleFromSource('oura');

// Fallback hierarchy
const cycleData = await getCycleData();
// Tries: Oura → Apple Health → Whoop → Manual
```

**Benefits of wearable integration**:
- More accurate phase detection via temperature/HRV
- Automatic period logging (no manual entry)
- Recovery scores inform energy expectations
- Sleep data correlates with cycle phases

### Privacy

- Cycle data stored locally only
- Only current phase shared with AI ("luteal phase, day 24")
- Raw period dates never sent to API
- Wearable tokens stored securely in Keychain
- User can disable cycle tracking anytime

---

## Future Enhancements

### Planned Features

1. **Compression Templates** - More efficient context storage
2. **Android Support** - Expo already supports it
3. **Watch App** - Quick check-ins from wrist
4. **Export to Therapy** - Formatted reports for therapists
5. **Guided Journaling** - Prompts for specific situations

### Technical Debt

1. **HealthKit Implementation** - Currently mock, needs real integration
2. **Background Processing** - Heart rate monitoring in background
3. **Notification Scheduling** - More sophisticated timing
4. **Context Pruning** - Auto-remove stale topics

---

## Contributing

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Services are pure functions where possible
- Document all public exports

### Adding a New Service

1. Create `moodling-app/services/myService.ts`
2. Export types and functions
3. Add storage keys to constants
4. Update this documentation
5. Write tests

### Pull Request Checklist

- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] New features documented
- [ ] Privacy implications considered
- [ ] Anti-dependency principle maintained

---

*Last updated: January 2026*
