# Moodling Developer Guide

Complete technical documentation for the Moodling codebase.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Services](#services)
4. [Data Models](#data-models)
5. [The Mega Prompt System](#the-mega-prompt-system)
6. [Life Context System](#life-context-system)
7. [HealthKit Integration](#healthkit-integration)
8. [Health Insights & Correlations](#health-insights--correlations)
9. [Keyword Detection System](#keyword-detection-system)
10. [Crisis Handling](#crisis-handling)
11. [Storage & Persistence](#storage--persistence)
12. [API Integration](#api-integration)
13. [Ethics Implementation](#ethics-implementation)
14. [Testing](#testing)
15. [Psychological Analysis System](#psychological-analysis-system)
16. [AI Coach Adaptive System](#ai-coach-adaptive-system) ← NEW
17. [Future Enhancements](#future-enhancements)

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
  return `You are Moodling, a warm and compassionate companion...

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
const lifeContext = await getLifeContextForClaude();        // Long-term memory
const healthContext = await getHealthContextForClaude();    // Current health data
const correlationContext = await getCorrelationSummaryForClaude(); // Patterns
const richContext = await getContextForClaude();            // Recent context
const conversationContext = buildConversationContext(ctx);  // Immediate context

const contextParts = [
  lifeContext,
  healthContext,
  correlationContext,
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

  // 6. Build full context and send to Claude
  const contextParts = [lifeContext, psychContext, healthContext, ...];
  const systemPrompt = buildSystemPrompt(fullContext, toneInstruction, personalityPrompt);
}
```

### Context Flow to Claude

The AI receives a rich, personalized context:

```
SYSTEM PROMPT:
├── Personality Prompt (persona identity, traits, time-aware energy)
├── Role & Boundaries (Moodling Ethics)
├── Conversation Approach (validate → explore → support → empower)
└── User Context:
    ├── Life Context (facts, events, people)
    ├── Psychological Profile (cognitive patterns, attachment style)
    ├── Health Context (sleep, activity, heart rate)
    └── Current Conversation Context (recent mood, upcoming events)
```

### Onboarding Flow

1. **"What brings you to Mood Leaf?"** - Multi-select challenges
2. **"When you're struggling, what helps most?"** - Support style (affects mood mappings)
3. **"How do you prefer to be spoken to?"** - Communication preference
4. **"What energy level do you prefer?"** - Calm ↔ Energetic slider
5. **"When are you most yourself?"** - Chronotype selection
6. **"Which approaches interest you?"** - Mindfulness, CBT, Somatic, etc.
7. **"Meet your guides"** - Initial persona selection

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
