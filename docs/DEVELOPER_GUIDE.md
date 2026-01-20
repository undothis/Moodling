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
15. [Future Enhancements](#future-enhancements)

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
