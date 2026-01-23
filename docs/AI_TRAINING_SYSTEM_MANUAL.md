# MoodLeaf AI Training System - Comprehensive Manual

## Overview

The MoodLeaf AI Training System is designed to create a specialized, human-like AI companion by fine-tuning a local LLM (Llama 3.2) on curated human experience data. This manual covers every component of the system.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Collection Pipeline](#2-data-collection-pipeline)
3. [Quality Control System](#3-quality-control-system)
4. [Advanced Research Methods](#4-advanced-research-methods)
5. [Model Version Control](#5-model-version-control)
6. [Data Persistence & Backup](#6-data-persistence--backup)
7. [Training Data Impact Analysis](#7-training-data-impact-analysis)
8. [Llama Integration](#8-llama-integration)
9. [Status Monitoring](#9-status-monitoring)
10. [Best Practices](#10-best-practices)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────────┐ │
│  │ Interview      │  │ Training Admin │  │ Status Indicator               │ │
│  │ Processor      │  │ (Manual Entry) │  │ (Persistent)                   │ │
│  └───────┬────────┘  └───────┬────────┘  └───────────────────────────────┘ │
└──────────┼───────────────────┼──────────────────────────────────────────────┘
           │                   │
           ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MIDDLEWARE LAYER                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      DATA COLLECTION SERVICES                           ││
│  │  • youtubeProcessorService.ts - YouTube harvesting                      ││
│  │  • trainingQualityService.ts - Quality validation                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      CONTROL SERVICES                                    ││
│  │  • modelVersionControlService.ts - Git-style versioning                 ││
│  │  • trainingDataImpactService.ts - Data lineage & impact                 ││
│  │  • dataPersistenceService.ts - Multi-layer storage                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      INTEGRATION SERVICES                                ││
│  │  • llamaIntegrationService.ts - LLM integration                         ││
│  │  • trainingStatusService.ts - Real-time monitoring                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LLAMA LLM KERNEL                                   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Base Model: Llama 3.2                                                  │ │
│  │  + Fine-tuned LoRA Weights (from your training data)                   │ │
│  │                                                                          │ │
│  │  The kernel is a pure function: prompt in → response out               │ │
│  │  It has no direct access to data, storage, or version control          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principle: The App Wraps the Kernel

The app code acts as a **control plane**, not a firewall. It:
- **Controls inputs** - What prompts reach the LLM
- **Controls training** - What data shapes the model
- **Controls versions** - Which model weights are active
- **Controls outputs** - How responses are processed

The LLM kernel doesn't "follow" the app's code - the app **wraps** the kernel.

---

## 2. Data Collection Pipeline

### 2.1 YouTube Harvesting

**Service**: `youtubeProcessorService.ts`

**Location**: Settings → Developer Tools → Interview Processor

#### How It Works

1. **Add YouTube Channels**
   - Paste channel URLs (supports @handle, /channel/, /c/ formats)
   - Assign category and trust level
   - System fetches via RSS feed (no API key needed)

2. **Video Processing with Smart Sampling**

   **Default Behavior** (no API key):
   - Fetches recent videos via RSS feed (~15-50 videos)
   - Randomly selects 20 for processing
   - Extracts transcript from auto-captions
   - Sends to Claude for insight extraction

   **Smart Sampling Strategies** (with YouTube Data API key):

   | Strategy | Description | Best For |
   |----------|-------------|----------|
   | `random` | Pure random selection | Quick sampling |
   | `popular` | Prioritizes high view counts | Community-validated content |
   | `recent` | Prioritizes newest videos | Up-to-date advice |
   | `engagement` | Prioritizes high like/view ratio | Resonant, valuable content |
   | **`balanced`** | 40% popular + 40% recent + 20% random | **RECOMMENDED** |

   **Balanced Strategy (Default When API Key Available)**:
   ```
   ┌─────────────────────────────────────────────────────┐
   │ BALANCED SAMPLING                                   │
   ├─────────────────────────────────────────────────────┤
   │ 40% Popular   │ High view count videos              │
   │ 40% Recent    │ Videos from last 2 years            │
   │ 20% Random    │ Diversity to avoid "greatest hits"  │
   ├─────────────────────────────────────────────────────┤
   │ FILTERS APPLIED:                                    │
   │ • Exclude YouTube Shorts (<60 seconds)              │
   │ • Exclude very old videos (optional)                │
   │ • Exclude based on minimum duration (optional)      │
   └─────────────────────────────────────────────────────┘
   ```

   **Why Smart Sampling?**
   - Popular videos = content validated by many viewers
   - High engagement ratio = content that resonates
   - Diversity prevents over-fitting to one style
   - Quality > quantity for LoRA fine-tuning

   **Code Usage**:
   ```typescript
   import { fetchChannelVideosWithSampling } from './youtubeProcessorService';

   const result = await fetchChannelVideosWithSampling(
     'https://youtube.com/@ChannelName',
     {
       strategy: 'balanced',
       maxVideos: 25,
       popularPercent: 40,
       recentPercent: 40,
       randomPercent: 20,
       excludeShorts: true,
       maxAgeMonths: 24,
       minDurationMinutes: 5,
     },
     process.env.YOUTUBE_API_KEY
   );
   ```

3. **Insight Extraction**
   - Claude analyzes transcript for human insights
   - 27 extraction categories across 5 domains:
     - **Pain** (struggles, coping, trauma)
     - **Joy** (humor, celebration, playfulness)
     - **Connection** (companionship, love, belonging)
     - **Growth** (wisdom, self-discovery, lessons)
     - **Authenticity** (real quotes, contradictions, messy middle)

4. **Quality Filtering**
   - Minimum quality score: 60
   - Minimum specificity: 50
   - Minimum safety: 80
   - Minimum confidence: 0.6
   - Deduplication via content hashing

5. **Human Review**
   - All insights go to pending queue
   - Human approves or rejects
   - Approved insights become training data

#### Categories Explained

| Domain | Categories | Purpose |
|--------|-----------|---------|
| Pain | emotional_struggles, coping_strategies, what_helps_hurts, vulnerability, mental_health_patterns, trauma_recovery | Understand suffering |
| Joy | humor_wit, joy_celebration, excitement_passion, playfulness, gratitude_appreciation | Understand happiness |
| Connection | companionship, friendship_dynamics, romantic_love, family_bonds, belonging_community, loneliness_isolation | Understand relationships |
| Growth | self_discovery, growth_moments, life_lessons, wisdom_perspective, meaning_purpose | Understand development |
| Authenticity | real_quotes, contradictions_complexity, messy_middle, uncomfortable_truths, beautiful_imperfection | Understand humanness |

### 2.2 Manual Entry

**Location**: Settings → Developer Tools → Training Admin

For manually adding insights from:
- Research papers
- Books
- Personal observations
- User feedback

---

## 3. Quality Control System

### 3.1 Quality Thresholds

**Service**: `youtubeProcessorService.ts` and `trainingQualityService.ts`

| Threshold | Value | Purpose |
|-----------|-------|---------|
| MIN_QUALITY_SCORE | 60 | Overall quality |
| MIN_SPECIFICITY_SCORE | 50 | Reject generic insights |
| MIN_SAFETY_SCORE | 80 | Protect users |
| MIN_CONFIDENCE_SCORE | 0.6 | AI must be confident |
| HUMAN_REVIEW_THRESHOLD | 75 | Below = needs review |
| DUPLICATE_SIMILARITY | 0.85 | Semantic dedup |

### 3.2 Advanced Quality Metrics

**Service**: `trainingQualityService.ts`

#### Semantic Deduplication
```
Content hash only catches exact duplicates.
Semantic similarity (TF-IDF based) catches:
- "I feel alone" ≈ "I'm experiencing loneliness"
- Threshold: 0.8 similarity = duplicate
```

#### Cross-Source Validation
```
Insights confirmed by 2+ independent sources = higher confidence
Why: If multiple therapists say the same thing, it's probably true
Score: % of insights with cross-source validation
```

#### Category Balance
```
Target distribution by domain:
- Pain: 20%
- Joy: 20%
- Connection: 25%
- Growth: 20%
- Authenticity: 15%

Status: under (<50% of target), balanced, over (>150% of target)
```

#### Temporal Freshness
```
Newer insights = higher freshness score
Half-life: 180 days (50% fresh after 6 months)
Minimum: 10% (never fully stale)
Why: Cultural context changes, advice evolves
```

#### Curriculum Learning
```
Insights ordered by complexity:
1. Basic - Simple empathy and support
2. Intermediate - Multi-step responses
3. Advanced - Complex emotional situations
4. Nuanced - Contradictions and complexity

Training in order helps LLM learn progressively
```

### 3.3 Quality Metrics Dashboard

```
Overall Quality: 78/100
├── Diversity Score: 72/100 (unique topics)
├── Balance Score: 65/100 (category distribution)
├── Freshness Score: 85/100 (data recency)
├── Cross-Source Score: 45/100 (validation)
└── User Satisfaction: 80/100 (feedback loop)
```

---

## 4. Advanced Research Methods

**Service**: `advancedResearchService.ts`

These are research-grade techniques for maximizing training data quality beyond basic filtering.

### 11.1 Contrastive Examples

Generate good vs bad response pairs to teach the model what TO do and what NOT to do.

```typescript
const pair = await generateContrastivePairs(insightId);
// Returns:
// {
//   scenario: "User is feeling isolated",
//   goodResponse: { text: "That loneliness sounds really heavy...", ... },
//   badResponse: { text: "Just get out more!", whyBad: "Dismissive" },
//   difficulty: "medium"
// }
```

**Purpose**: Contrastive learning helps the model distinguish between helpful and harmful responses.

### 11.2 Persona Diversity

Ensure training data covers different demographics and life situations.

| Persona | Description | Target Coverage |
|---------|-------------|-----------------|
| young_adult | Ages 18-25 | ~8% |
| mid_career | Ages 26-40 | ~8% |
| midlife | Ages 41-55 | ~8% |
| senior | Ages 55+ | ~8% |
| parent | Parents | ~8% |
| single | Single people | ~8% |
| lgbtq | LGBTQ+ | ~8% |
| neurodivergent | ADHD, autism, etc. | ~8% |
| grief | Grieving people | ~8% |
| caregiver | Caregivers | ~8% |
| immigrant | Immigrant/Expat | ~8% |
| veteran | Veterans | ~8% |

```typescript
const coverage = await analyzePersonaCoverage();
const underrep = await getUnderrepresentedPersonas();
```

### 11.3 Emotional Arc Coverage

Ensure insights cover complete emotional journeys, not just isolated moments.

**Tracked Arcs:**
- **Grief to Recovery**: shock → denial → anger → bargaining → depression → acceptance → growth
- **Anxiety to Calm**: trigger → escalation → peak → coping → regulation → calm → reflection
- **Conflict to Resolution**: tension → conflict → escalation → turning_point → de-escalation → resolution → repair
- **Joy Experience**: anticipation → experience → peak_joy → savoring → gratitude → memory → sharing
- **Personal Growth**: comfort_zone → discomfort → challenge → struggle → breakthrough → integration → mastery
- **Building Connection**: stranger → acquaintance → opening_up → vulnerability → deepening → trust → intimacy

```typescript
const arcs = await analyzeEmotionalArcCoverage();
// Shows which stages are missing for each arc
```

### 11.4 Bias Detection

Automatically scan for cultural, gender, age, socioeconomic, and ability biases.

| Bias Type | Example Pattern | Severity |
|-----------|-----------------|----------|
| Gender | "man up", "boys don't cry" | High |
| Cultural | "weird custom", "normal family" | Medium |
| Age | "old people can't", "kids these days" | Medium |
| Socioeconomic | "just travel", "everyone can afford therapy" | Medium |
| Ability | "crazy", "insane", "lame" | High |

```typescript
const biasReports = await detectBias();
const biasScore = await getBiasScore(); // Higher = less biased
```

### 11.5 Contradiction Detection

Find conflicting advice in the training data.

```typescript
const contradictions = await detectContradictions();
// Finds pairs like:
// Insight 1: "Express anger openly"
// Insight 2: "Suppress anger to avoid conflict"
// Type: "direct contradiction"
```

**Resolution Options**: keep_both (if context-dependent), merge, remove_one, needs_review

### 11.6 Evidence Grading

Rate source credibility for each insight.

| Source Type | Base Credibility |
|-------------|------------------|
| peer_reviewed | 90 |
| expert_opinion | 80 |
| lived_experience | 70 |
| anecdotal | 50 |
| unknown | 40 |

```typescript
const grade = await gradeEvidence(insightId);
const lowEvidence = await getLowEvidenceInsights();
```

### 11.7 Sentiment Distribution

Balance positive, negative, neutral, and mixed insights.

**Target Distribution:**
- Positive: ~30%
- Negative: ~30%
- Neutral: ~20%
- Mixed: ~20%

```typescript
const distribution = await analyzeSentimentDistribution();
// Returns: { balance: "good" | "too_positive" | "too_negative" | "too_neutral" }
```

### 11.8 Response Simulation

Test how an insight would affect actual AI responses.

```typescript
const result = await simulateResponse(insightId, "I feel so alone", apiKey);
// Returns:
// {
//   generatedResponse: "That loneliness sounds really heavy...",
//   qualityScore: 85,
//   humanlikeness: 80,
//   helpfulness: 90,
//   safetyScore: 95,
//   issues: []
// }
```

### 11.9 Expert Validation Queue

Flag insights for domain expert review.

**Auto-flagging triggers:**
- Contains suicide/self-harm content → Flag for therapist
- Contains research claims → Flag for researcher
- Low AI confidence → Flag for general review

```typescript
await autoFlagForExpertReview();
const queue = await getExpertQueue();
```

### 11.10 Advanced Scoring

Multi-dimensional quality analysis for each insight:

| Score | What It Measures |
|-------|------------------|
| Actionability | Can this be applied immediately? |
| Memorability | Will this stick with users? |
| Transferability | Does this apply across contexts? |
| Emotional Safety | Deep harm prevention analysis |
| Readability | Appropriate complexity level |
| Cultural Sensitivity | Cross-cultural validity |

```typescript
const scores = await calculateAdvancedScores(insightId);
```

### 11.11 Synthetic Augmentation

Generate variations of high-quality insights to expand training data.

```typescript
const { original, variations } = await generateInsightVariations(insightId, apiKey, 3);
// Creates 3 variations of the insight with same core wisdom but different phrasing
```

### 11.12 Comprehensive Research Report

```typescript
const report = await generateResearchQualityReport();
// Returns overall score and prioritized issues:
// {
//   overallScore: 78,
//   priorities: [
//     { priority: "critical", issue: "Bias detected", recommendation: "..." },
//     { priority: "high", issue: "5 contradictions unresolved", ... },
//     ...
//   ]
// }
```

---

## 5. Model Version Control

### 11.1 Overview

**Service**: `modelVersionControlService.ts`

Git-style version control for AI models. Every training creates a new version that can be tracked, tested, and rolled back.

### 11.2 Version Lifecycle

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Created │ ───► │ Staged  │ ───► │ Testing │ ───► │ Deployed│
└─────────┘      └─────────┘      └─────────┘      └─────────┘
                       │                                 │
                       ▼                                 ▼
                 ┌─────────┐                       ┌─────────┐
                 │ Rejected│                       │ Rollback│
                 └─────────┘                       └─────────┘
```

### 11.3 Version States

| State | Description | Can Deploy? |
|-------|-------------|-------------|
| created | Just trained, not tested | No |
| staged | In staging environment | No |
| approved | Passed safety gates | Yes |
| deployed | Currently in production | N/A |
| rolled_back | Previously deployed, now replaced | No |
| deprecated | Old version, archived | No |

### 11.4 Safety Gates

Before any version can be deployed, it must pass safety checks:

1. **Minimum Quality Score**: ≥70%
2. **Maximum Regression**: ≤10% quality drop from current
3. **Human Approval**: Required for production
4. **A/B Testing**: Optional but recommended

#### Gate Configuration

```typescript
const DEFAULT_GATES = {
  requireHumanApproval: true,
  minQualityScore: 70,
  maxRegressionPercent: 10,
  abTestRequired: false,
  minAbTestSampleSize: 100,
  abTestMinImprovement: 5,
};
```

### 11.5 A/B Testing

Compare two versions before full deployment:

```
New Version (50% traffic) vs Current Version (50% traffic)

After 100+ comparisons:
- If new wins by 5%+: Promote new
- If new loses: Reject new
- If unclear: Need more data
```

### 11.6 Auto-Rollback Triggers

System automatically rolls back if:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| qualityDrop | >15% decline | Rollback |
| userSatisfaction | <40% | Rollback |
| errorRate | >5% | Rollback |

### 11.7 Drift Detection

Monitors for gradual quality degradation:

```
Quality snapshots taken periodically
If trend is consistently downward: Warning
If >20% below baseline: Auto-rollback consideration
```

### 11.8 Branching

Create experimental branches without affecting production:

```
main (production)
├── experiment/humor-training (testing humor responses)
├── experiment/therapy-focus (more therapeutic approach)
└── user-feedback/jan-2026 (based on user suggestions)
```

### 11.9 Tagging

Mark significant versions:

```
v1.0.0 - Initial release
v1.1.0-beta - Beta with humor improvements
v1.2.0 - Stable with relationship insights
```

---

## 6. Data Persistence & Backup

### 11.1 Overview

**Service**: `dataPersistenceService.ts`

Multi-layer storage ensures training data survives:
- App crashes
- App reinstalls
- Development resets
- Device issues

### 11.2 Storage Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: AsyncStorage                    │
│                    (Fast, Primary)                          │
│                                                             │
│  Speed: Instant | Survives: App restarts                   │
│  Use: Active data, real-time access                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 2: FileSystem                      │
│                    (Durable, Secondary)                     │
│                                                             │
│  Speed: Fast | Survives: App reinstalls                    │
│  Location: App documents directory                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 3: Cloud Sync                      │
│                    (Off-device, Optional)                   │
│                                                             │
│  Speed: Slow | Survives: Device loss                       │
│  Requires: User opt-in, API configuration                  │
└─────────────────────────────────────────────────────────────┘
```

### 11.3 Automatic Backup

```
Every 5 minutes during active use:
1. Serialize all training data
2. Write to FileSystem
3. Maintain last 5 backups
4. Prune old backups
```

### 11.4 Auto-Recovery

On app start:
```
1. Check AsyncStorage integrity
2. If corrupted/empty but FileSystem has backup:
   → Auto-restore from backup
3. If both layers empty but Cloud has backup:
   → Prompt user to restore
```

### 11.5 Developer Commands

```typescript
// Quick save during development
await devQuickSave();

// Quick restore
await devQuickRestore();

// Export all data to file
const filePath = await exportAllData();

// Import data from file
await importData(filePath);

// Manual backup
await runBackup();
```

### 11.6 Data Categories Persisted

| Category | Description |
|----------|-------------|
| training_insights | Approved insights for training |
| pending_insights | Awaiting human review |
| model_versions | All version metadata |
| quality_metrics | Quality scores over time |
| user_feedback | User ratings of responses |
| curated_channels | YouTube channels |
| processing_jobs | Active/completed jobs |

---

## 7. Training Data Impact Analysis

### 11.1 Overview

**Service**: `trainingDataImpactService.ts`

When a model gets worse, this service helps identify WHAT caused the degradation.

### 11.2 Data Lineage

Every model version tracks:
- Which insights were included
- What changed from previous version
- Source breakdown (which channels contributed)
- Quality correlation data

```typescript
interface DataLineageEntry {
  modelVersionId: string;
  modelVersion: string;
  trainedAt: string;
  insightIds: string[];        // All insights used
  newInsightIds: string[];     // Added since last version
  removedInsightIds: string[]; // Removed since last version
  sourceBreakdown: {...};      // By channel/source
  qualityScore: number;
  qualityDelta: number;        // Change from previous
  correlations: {...};         // Source ↔ quality correlation
}
```

### 11.3 Source Impact Scoring

For each YouTube channel or data source:

```
Impact Score = (Avg Quality When Included) - (Avg Quality When Excluded)

Positive = Source helps quality
Negative = Source hurts quality

Flagged if: Impact < -10 AND Sample Size >= 2
```

### 11.4 Insight Impact Scoring

For each individual insight:

```
Impact Score = (Avg Quality in Versions Including Insight)
             - (Avg Quality in Versions Excluding Insight)

Flagged as problematic if:
- Impact < -5
- Confidence >= 0.6 (enough data)
```

### 11.5 Problem Data Analysis

When quality drops, run:

```typescript
const report = await analyzeQualityDrop(badVersionId, goodVersionId);
```

Report includes:
- What data was added since good version
- Suspected problematic data (with confidence levels)
- Recommendations:
  - Remove high-confidence suspects
  - Flag problematic sources for review
  - Retrain without new data

### 11.6 Data Diff

Compare any two versions:

```typescript
const diff = await getDataDiff(versionA, versionB);

// Returns:
// - Added insights
// - Removed insights
// - Source changes
// - Quality change
```

---

## 8. Llama Integration

### 11.1 Overview

**Service**: `llamaIntegrationService.ts`

The app wraps the Llama LLM, controlling all inputs and outputs.

### 11.2 Prompt Formatting

Every user message is formatted with:

1. **System Prompt**: MoodPrint personality and guidelines
2. **Relevant Insights**: Context from training data
3. **Emotional State**: User's current mood (if known)
4. **Style Preference**: Warm, direct, playful, gentle
5. **Conversation History**: Last 5 turns

```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

[MoodPrint System Prompt]
[Injected Insights]
[Emotional Context]
[Style Guide]

<|eot_id|><|start_header_id|>user<|end_header_id|>

[Conversation History]
User: [Current Message]

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

Moodling:
```

### 11.3 Training Data Export

Export approved insights for LoRA fine-tuning:

```typescript
const exportData = await exportTrainingData('alpaca');

// Generates training examples like:
{
  instruction: "Respond to a user experiencing loneliness",
  input: "The person feels disconnected from their friends",
  output: "That disconnect can feel really isolating...",
  metadata: { category, source, qualityScore, complexity }
}
```

Each insight generates multiple training examples:
1. Direct coaching application
2. Authentic quote usage
3. Anti-pattern teaching

### 11.4 Model Configuration

```typescript
const config = {
  modelPath: '',         // Path to Llama weights
  loraPath: '',          // Path to fine-tuned LoRA
  contextLength: 4096,   // Max context window
  temperature: 0.7,      // Creativity
  topP: 0.9,            // Nucleus sampling
  topK: 40,             // Top-k sampling
  maxTokens: 512,        // Max response length
  threads: 4,           // CPU threads
  gpuLayers: 0,         // GPU offload (0 = CPU only)
};
```

### 11.5 Future Implementation

Currently a placeholder. Full implementation requires:
- `react-native-llama-cpp` or similar binding
- Downloaded Llama 3.2 model weights
- LoRA fine-tuned weights from your data
- Sufficient device resources

---

## 9. Status Monitoring

### 11.1 Overview

**Services**: `trainingStatusService.ts` and `TrainingStatusIndicator.tsx`

A persistent indicator shows training system health.

### 11.2 Visual States

| Color | State | Meaning |
|-------|-------|---------|
| Green (pulsing) | Healthy | System active, no issues |
| Yellow | Warning | Needs attention |
| Red | Error | Issues detected |
| Gray | Inactive | No recent activity (24h+) |

### 11.3 Status Information

```typescript
interface TrainingStatus {
  isActive: boolean;
  health: 'healthy' | 'warning' | 'error' | 'inactive';
  lastActivity: string;

  stats: {
    totalInsights: number;
    approvedInsights: number;
    pendingInsights: number;
    conversationsScored: number;
    videosProcessed: number;
  };

  session: {
    startedAt: string;
    insightsThisSession: number;
    actionsThisSession: number;
  };

  model: {
    activeVersion: string;
    stagedVersion: string;
    lastTrainedAt: string;
  };

  alerts: TrainingAlert[];

  backupStatus: {
    lastBackup: string;
    isAutoBackupActive: boolean;
  };
}
```

### 11.4 Activity Logging

All significant events are logged:
- Insight added/approved/rejected
- Video processed
- Model trained/deployed
- Backup completed
- Errors

View recent activity by tapping the status indicator.

---

## 10. Best Practices

### 11.1 Data Collection

**DO:**
- Curate channels with diverse perspectives
- Balance across all 5 domains (pain, joy, connection, growth, authenticity)
- Review pending insights regularly
- Reject low-quality or harmful content
- Add channels gradually, monitor impact

**DON'T:**
- Bulk approve without review
- Over-rely on one channel or source
- Ignore pending queue
- Skip safety score reviews
- Add channels without categorization

### 11.2 Quality Maintenance

**Weekly:**
- Review quality metrics
- Check for underrepresented categories
- Approve/reject pending insights
- Monitor source impact scores

**Monthly:**
- Run full quality analysis
- Identify and remove stale insights
- Review flagged sources
- Update training data export

### 11.3 Version Control

**Before Training:**
1. Export current training data
2. Note current quality score
3. Create version tag if stable

**After Training:**
1. Create new version (auto-generated)
2. Stage for testing
3. Run safety checks
4. A/B test if significant changes
5. Require human approval

**If Quality Drops:**
1. Don't panic - you can rollback
2. Run `analyzeQualityDrop()` to find cause
3. Review suspected data
4. Either rollback or remove bad data and retrain

### 11.4 Backup Strategy

**Development:**
- Use `devQuickSave()` before major changes
- Keep local backup files
- Export data periodically

**Production:**
- Enable cloud sync if available
- Verify backups restore correctly
- Keep version history

---

## 11. Troubleshooting

### 11.1 Common Issues

#### "Import button does nothing"
The Import tab is a FORM. Fill in Title, Insight, and Coaching Implication, then scroll down to click "Import Insight".

#### "No insights extracted from video"
- Video may lack captions
- Transcript may be too short (<100 chars)
- API key may be invalid
- Video content may not contain relevant insights

#### "Model quality degraded"
1. Check `trainingDataImpactService.ts` for problem data
2. Review recently added insights
3. Check source impact scores
4. Rollback if needed

#### "Data disappeared after reinstall"
1. Check FileSystem backup layer
2. Use `devQuickRestore()` or `recoverFromBackup()`
3. If cloud enabled, restore from cloud

#### "Can't find Developer Tools"
Settings → scroll past Privacy → Developer Tools (near bottom)

### 11.2 Emergency Rollback

```typescript
import { rollback, getProductionVersion } from './modelVersionControlService';

// Find the last good version
const versions = await getAllVersions();
const lastGood = versions.find(v => v.qualityScore > 75);

if (lastGood) {
  await rollback(lastGood.id, 'Emergency rollback due to quality issues');
}
```

### 11.3 Data Recovery

```typescript
import { recoverFromBackup, getBackupInfo } from './dataPersistenceService';

// Check available backups
const backups = await getBackupInfo();
console.log(backups);

// Recover from most recent
await recoverFromBackup();

// Or from specific timestamp
await recoverFromBackup('2026-01-20T10:00:00Z');
```

### 11.4 Debugging Quality Issues

```typescript
import { calculateAllQualityMetrics, getQualityRecommendations } from './trainingQualityService';
import { analyzeQualityDrop, getFlaggedSources, getProblematicInsights } from './trainingDataImpactService';

// Get current quality
const metrics = await calculateAllQualityMetrics();
console.log('Quality Metrics:', metrics);

// Get improvement recommendations
const recs = await getQualityRecommendations();
console.log('Recommendations:', recs);

// Find problematic sources
const flagged = await getFlaggedSources();
console.log('Flagged Sources:', flagged);

// Find problematic insights
const problems = await getProblematicInsights();
console.log('Problem Insights:', problems);
```

---

## Appendix A: Service File Reference

| File | Purpose |
|------|---------|
| `youtubeProcessorService.ts` | YouTube harvesting, transcript extraction, Claude insight extraction |
| `trainingQualityService.ts` | Semantic dedup, balance, freshness, diversity, curriculum |
| `advancedResearchService.ts` | Contrastive examples, persona diversity, bias detection, contradiction detection, evidence grading, sentiment analysis, response simulation, expert queue, synthetic augmentation |
| `modelVersionControlService.ts` | Version control, safety gates, A/B testing, rollback |
| `dataPersistenceService.ts` | Multi-layer storage, backup, recovery |
| `trainingDataImpactService.ts` | Data lineage, source impact, problem analysis |
| `llamaIntegrationService.ts` | LLM integration, prompt formatting, export |
| `trainingStatusService.ts` | Real-time status, activity logging, alerts |
| `TrainingStatusIndicator.tsx` | Persistent UI indicator component |
| `aiAccountabilityService.ts` | AI auto-creation of Twigs, calendar events, contacts, limit alerts |
| `quickLogsService.ts` | Twig/Quick Log management with limit support |

---

## Appendix B: Storage Keys Reference

| Key | Service | Purpose |
|-----|---------|---------|
| `moodleaf_youtube_queue` | YouTube | Processing queue |
| `moodleaf_processed_videos` | YouTube | Video IDs already processed |
| `moodleaf_youtube_pending_insights` | YouTube | Pending review |
| `moodleaf_youtube_approved_insights` | YouTube | Approved insights |
| `moodleaf_curated_channels` | YouTube | Channel list |
| `moodleaf_insight_hashes` | YouTube | Deduplication hashes |
| `moodleaf_model_versions` | Version | All model versions |
| `moodleaf_active_model` | Version | Current production |
| `moodleaf_staging_model` | Version | Staged version |
| `moodleaf_rollback_log` | Version | Rollback history |
| `moodleaf_ab_tests` | Version | A/B test data |
| `moodleaf_quality_snapshots` | Version | Quality over time |
| `moodleaf_data_lineage` | Impact | Version → data mapping |
| `moodleaf_source_impact` | Impact | Source quality impact |
| `moodleaf_insight_scores` | Impact | Insight quality impact |
| `moodleaf_training_status` | Status | Current status |
| `moodleaf_activity_log` | Status | Activity history |
| `moodleaf_backup_index` | Persistence | Backup metadata |
| `moodleaf_contrastive_pairs` | Advanced Research | Good/bad response pairs |
| `moodleaf_persona_coverage` | Advanced Research | Demographic coverage |
| `moodleaf_emotional_arcs` | Advanced Research | Emotional journey coverage |
| `moodleaf_bias_reports` | Advanced Research | Bias detection results |
| `moodleaf_contradictions` | Advanced Research | Conflicting insights |
| `moodleaf_evidence_grades` | Advanced Research | Source credibility |
| `moodleaf_simulation_results` | Advanced Research | Response test results |
| `moodleaf_expert_queue` | Advanced Research | Expert review queue |
| `moodleaf_advanced_scores` | Advanced Research | Multi-dimensional scores |
| `moodleaf_accountability_goals` | Accountability | User accountability goals |
| `moodleaf_limit_alerts` | Accountability | Limit-based alert configurations |
| `moodleaf_ai_created_items` | Accountability | Items created by AI from conversation |

---

## Appendix C: Quality Score Calculations

### Overall Quality (Weighted Average)
```
Overall = Diversity × 0.15
        + Balance × 0.20
        + Freshness × 0.15
        + CrossSource × 0.20
        + UserSatisfaction × 0.30
```

### Freshness Score
```
Freshness = 0.5^(age_in_days / 180) × 100
Minimum = 10
```

### Balance Score
```
For each category:
  percentOfTarget = actual / target × 100
  status = under (<50), balanced (50-150), over (>150)

BalanceScore = balancedCategories / totalCategories × 100
```

### Diversity Score
```
TopicScore = min(uniqueTopics / 50, 1) × 100
GapPenalty = identifiedGaps × 3
OverrepPenalty = overrepresentedAreas × 5

DiversityScore = TopicScore - GapPenalty - OverrepPenalty
```

---

## Appendix D: Llama 3.2 Fine-Tuning Guide

### Prerequisites
1. Llama 3.2 base model (3B or 8B)
2. Python 3.10+
3. PyTorch 2.0+
4. transformers, peft, trl libraries
5. Exported training data from app

### Basic LoRA Training
```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer

# Load base model
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B")

# Configure LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

# Apply LoRA
model = get_peft_model(model, lora_config)

# Load your exported data
from datasets import load_dataset
dataset = load_dataset("json", data_files="training_export.json")

# Train
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset["train"],
    # ... additional config
)
trainer.train()

# Save LoRA weights
model.save_pretrained("moodleaf-lora")
```

### Deploy to React Native
1. Merge LoRA weights with base model
2. Convert to GGUF format
3. Use react-native-llama-cpp or similar
4. Set model path in `llamaIntegrationService.ts`

---

*Last Updated: January 2026*
*Version: 1.0*
