# Training Module: Path to Local LLM

This document describes how Mood Leaf collects training data and eventually moves to a local LLM that understands humans deeply.

---

## The Vision

Right now, Mood Leaf uses Claude API for conversations. But our goal is:

1. **Learn from Claude** - Collect scored examples of good human-like responses
2. **Learn from interviews** - Import insights from real user research about how humans think
3. **Distill knowledge** - Extract patterns into training data
4. **Train local model** - Eventually run a fine-tuned local LLM that "gets" people
5. **Claude becomes optional** - Use local model for most things, Claude for edge cases

---

## Current Training Data Collection

### Human-ness Scoring (`humanScoreService.ts`)

Every conversation is scored for "human-ness" - how natural and real it feels.

**What we score:**
| Category | Points | What It Measures |
|----------|--------|------------------|
| Natural Language | 0-15 | Sounds like a real person, not a robot |
| Emotional Timing | 0-20 | Response matches the emotional moment |
| Brevity Control | 0-15 | Length appropriate to context |
| Memory Use | 0-15 | Recalls past subtly, not creepily |
| Imperfection | 0-10 | Allows uncertainty ("I'm not sure") |
| Personality Consistency | 0-15 | Same "voice" across sessions |
| Avoided AI Ticks | 0-10 | No "I understand", "That's valid" |

**Two-layer scoring:**
1. **Local scoring** - Fast, runs immediately, heuristic-based
2. **Claude scoring** - Background, more accurate, costs API

All scored exchanges are saved. When we have 500+ Claude-scored examples, we can train a local scorer.

**Export for training:**
```typescript
import { exportForTraining } from './services/humanScoreService';

const trainingData = await exportForTraining();
// Returns JSON with all scored exchanges + stats
```

---

## Interview Import System

### Purpose

User research interviews contain gold: real humans explaining how their minds work. This system lets you import interview insights to enrich the app's understanding.

### Interview Data Structure

```typescript
interface InterviewInsight {
  id: string;
  sourceType: 'user_interview' | 'research_paper' | 'expert_input' | 'pattern_observation';
  source: string;              // "Interview with user #23", "ADHD study 2024", etc.
  dateCollected: string;

  // The insight itself
  category: InsightCategory;
  title: string;               // Short summary
  insight: string;             // The actual learning
  quotes?: string[];           // Direct quotes if available

  // How to use it
  coachingImplication: string; // How this should change coach behavior
  techniqueSuggestions?: string[];
  antiPatterns?: string[];     // Things NOT to do based on this

  // Validation
  confidenceLevel: 'hypothesis' | 'observed' | 'validated';
  relatedProfiles?: string[];  // Cognitive profiles this applies to
}

type InsightCategory =
  | 'cognitive_patterns'       // How people think
  | 'emotional_processing'     // How people feel
  | 'neurological_differences' // Aphantasia, ADHD, etc.
  | 'communication_needs'      // How people want to be talked to
  | 'motivation_patterns'      // What drives/blocks action
  | 'relationship_with_self'   // Self-talk, self-perception
  | 'crisis_patterns'          // What crisis looks like
  | 'recovery_patterns'        // What healing looks like
  | 'daily_rhythms'            // Energy patterns, timing
  | 'social_dynamics';         // How connection affects them
```

### Import Methods

**1. Manual Import (Admin/Research Interface)**
```typescript
import { importInterviewInsight } from './services/trainingDataService';

await importInterviewInsight({
  sourceType: 'user_interview',
  source: 'Interview with user #23 (cyclical thinker)',
  category: 'cognitive_patterns',
  title: 'Cyclical minds often interpret low phases as personal failure',
  insight: `Many users with pronounced cognitive cycles reported that during
    low phases, they believed something was "wrong" with them. Several used
    phrases like "I should be able to..." or "Why can't I just..."`,
  quotes: [
    "When I'm in a low phase, I genuinely forget that I've ever been productive",
    "It feels like the good times were luck and this is the real me"
  ],
  coachingImplication: `During detected low phases, proactively normalize the
    experience. Don't wait for them to express shame. Frame low phases as
    integration, not failure. Reference their high phase capabilities.`,
  antiPatterns: [
    "Don't say 'You were so productive last week' - this highlights the gap",
    "Don't suggest they 'try harder' during low phases",
    "Don't imply the low phase is a choice or attitude problem"
  ],
  confidenceLevel: 'validated',
  relatedProfiles: ['cyclical_pronounced', 'burst_recovery']
});
```

**2. Bulk Import from Interview Transcripts**
```typescript
import { processInterviewTranscript } from './services/trainingDataService';

// Feed raw transcript, AI extracts insights
const insights = await processInterviewTranscript({
  transcript: rawTranscriptText,
  interviewType: 'user_research',
  participantProfile: {
    cognitiveMode: 'conceptual_systems',
    neurodivergence: ['aphantasia'],
    // ...
  }
});

// Review and approve extracted insights
for (const insight of insights) {
  await approveInsight(insight.id); // or rejectInsight()
}
```

**3. Import from Research Links**
```typescript
import { importFromResearchLink } from './services/trainingDataService';

// Point to a research paper, blog post, or resource
await importFromResearchLink({
  url: 'https://example.com/aphantasia-study-2024',
  type: 'research_paper',
  extractionPrompt: 'Focus on coaching implications and communication adaptations'
});
```

---

## Training Data Categories

### 1. Conversation Examples (Auto-collected)
- Every user-coach exchange
- Scored for human-ness
- Tagged with context (energy, mood, time, profile)
- **Use:** Train response generation

### 2. Interview Insights (Imported)
- Patterns from user research
- How different minds work
- What helps vs. harms
- **Use:** Train understanding, shape principles

### 3. Coach Corrections (User feedback)
- When users say "that's not helpful"
- Implicit negative signals (topic changes, disengagement)
- Explicit positive signals ("yes, exactly!")
- **Use:** Reinforcement learning signal

### 4. Profile-Outcome Correlations (Derived)
- Which approaches work for which profiles
- Technique effectiveness by cognitive mode
- Response length preferences by user type
- **Use:** Personalization training

---

## Integration with Core Principle Kernel

Interview insights feed into the kernel:

```
Interview Insights
       │
       ▼
┌──────────────────────┐
│ Pattern Extraction   │
│ (What did we learn?) │
└──────┬───────────────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌──────────────────────┐       ┌──────────────────────┐
│ Update CORE_BELIEFS  │       │ Add HARD_CONSTRAINTS │
│ (Philosophy evolves) │       │ (New "never do"s)    │
└──────────────────────┘       └──────────────────────┘
       │                                  │
       └──────────────────────────────────┤
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │ Update coach prompts │
                               │ (Better responses)   │
                               └──────────────────────┘
```

**Example:** Interview reveals that users with aphantasia feel dismissed when asked to "try visualizing anyway":

1. **Insight imported:** "Aphantasia users report frustration when visualization is suggested"
2. **Kernel updated:** `NO_VISUALIZATION_FOR_APHANTASIA` constraint strengthened
3. **Coach prompt updated:** Add explicit "NEVER suggest visualization for this user"
4. **Training data tagged:** All exchanges with aphantasic users marked for focus

---

## Path to Local LLM - Comprehensive Guide

### Current Claude Dependencies (What Must Be Replaced)

Right now, Claude handles multiple functions:

| Function | Service | Claude Role | Local Replacement |
|----------|---------|-------------|-------------------|
| **Conversation** | `claudeAPIService.ts` | Generate all coach responses | Fine-tuned local LLM |
| **Scoring** | `humanScoreService.ts` | Evaluate response quality | Trained classifier |
| **Memory Compression** | `memoryTierService.ts` | Weekly session summaries | Local summarization |
| **Insight Extraction** | (future) | Extract interview insights | Local extraction model |
| **Safety Monitoring** | `inputAnalysisService.ts` | Detect crisis/threats | Local safety model |

Each must be replaced step-by-step, with Claude as fallback.

---

### Phase 1: Data Collection (Current) ✓ IN PROGRESS

**Status:** Active - collecting data now

**What's Happening:**
```
Every Conversation
      │
      ├──▶ Store in memory tiers (local)
      │
      ├──▶ Score with local heuristics (immediate)
      │
      └──▶ Score with Claude (background)
           │
           └──▶ Save {input, output, score, context}
```

**Data Being Collected:**

1. **Scored Conversations**
   ```typescript
   {
     userMessage: "I can't focus today...",
     coachResponse: "Those days happen. What's pulling at your attention?",
     profile: {
       cognitiveMode: "conceptual_systems",
       rhythm: "burst_recovery",
       neurodivergence: ["adhd_traits"]
     },
     context: {
       energy: "low",
       mood: "frustrated",
       hour: 14,
       messageNumber: 5
     },
     scores: {
       local: 75,
       claude: {
         total: 82,
         breakdown: {
           naturalLanguage: 14,
           emotionalTiming: 18,
           brevityControl: 12,
           memoryUse: 13,
           imperfection: 8,
           personalityConsistency: 12,
           avoidedAITicks: 5
         },
         issues: ["Started with 'Those' - slightly generic opening"],
         suggestions: ["Try a more specific acknowledgment"]
       }
     }
   }
   ```

2. **Cognitive Profile Data**
   - Every user's cognitive profile (how they think)
   - Neurological differences (aphantasia, inner monologue, etc.)
   - Communication preferences
   - Rhythm patterns

3. **Interview Insights** (to add)
   - Patterns from user research
   - What works for different mind types
   - Anti-patterns to avoid

4. **User Feedback Signals**
   - Explicit: "Yes, exactly!", "That's not helpful"
   - Implicit: Topic changes, engagement patterns, session length

**Milestones:**
- [ ] 500 Claude-scored examples ← Ready for Phase 2
- [ ] 1,000 Claude-scored examples ← Local scorer reliable
- [ ] 50 interview insights imported ← Knowledge foundation
- [ ] 100 user corrections captured ← RLHF signal

---

### Phase 2: Local Scorer Training

**Goal:** Train a small model to score responses WITHOUT Claude.

**Why Local Scorer First:**
- Small model (can run on device)
- Clear supervised learning task
- Validation is easy (compare to Claude scores)
- Builds foundation for larger training

**Training Data Format:**
```json
{
  "input": {
    "user_message": "I've been anxious all week",
    "coach_response": "That sounds exhausting. What's the anxiety about?",
    "profile": {"cognitiveMode": "emotional_relational", "rhythm": "cyclical_mild"},
    "context": {"energy": "low", "mood": "anxious", "hour": 22}
  },
  "output": {
    "score": 85,
    "naturalLanguage": 14,
    "emotionalTiming": 19,
    "brevityControl": 14,
    "memoryUse": 12,
    "imperfection": 9,
    "personalityConsistency": 11,
    "avoidedAITicks": 6,
    "issues": [],
    "suggestions": []
  }
}
```

**Model Options for Local Scorer:**

| Model | Size | Runs On | Pros | Cons |
|-------|------|---------|------|------|
| TinyBERT | 15M params | Phone | Fast, tiny | Less accurate |
| DistilBERT | 66M params | Phone | Good balance | Moderate accuracy |
| Custom LSTM | 5M params | Phone | Super fast | Training from scratch |
| Phi-2 | 2.7B params | Server | Very accurate | Can't run on phone |

**Training Pipeline:**
```
Claude-scored examples (500+)
          │
          ▼
┌─────────────────────────┐
│   Data Preprocessing    │
│   - Normalize scores    │
│   - Encode profiles     │
│   - Tokenize text       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Model Training        │
│   - Regression for score│
│   - Multi-head for cats │
│   - Cross-validation    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Validation            │
│   - Compare to Claude   │
│   - Target: 85%+ corr   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Export to CoreML/ONNX │
│   - Runs on device      │
│   - No API needed       │
└─────────────────────────┘
```

**Success Criteria:**
- Correlation with Claude scores ≥ 0.85
- Latency < 100ms on device
- Identifies same "issues" as Claude 80%+ of time

---

### Phase 3: Response Ranking (Local Selection)

**Goal:** Generate multiple response candidates, rank them locally.

**Architecture:**
```
User Message + Context
          │
          ▼
┌─────────────────────────┐
│  Claude API (or Local)  │
│  Generate 3-5 candidates│
└───────────┬─────────────┘
            │
            ▼
     Response Candidates
     [R1, R2, R3, R4, R5]
            │
            ▼
┌─────────────────────────┐
│  Local Scorer (Phase 2) │
│  Score each candidate   │
└───────────┬─────────────┘
            │
            ▼
      Ranked Responses
      [R3: 89, R1: 84, R5: 78, R2: 72, R4: 65]
            │
            ▼
      Select best (R3)
```

**Why This Matters:**
- Claude generates options, but WE choose
- Enforces our principles (Core Principle Kernel)
- Catches Claude's "AI ticks" before user sees them
- Builds toward full local generation

**Integration with Core Principle Kernel:**
```typescript
async function selectBestResponse(candidates: string[]): Promise<string> {
  const profile = await getCognitiveProfile();
  const neuro = await getNeurologicalProfile();
  const connectionHealth = await getConnectionHealthForKernel();

  const scored = await Promise.all(candidates.map(async (response) => {
    // Score for human-ness
    const humannessScore = await localScorer.score(response);

    // Check against kernel constraints
    const kernelCheck = checkHardConstraints({
      action: 'coach_response',
      coachResponse: response,
      cognitiveProfile: profile,
      neurologicalProfile: neuro,
      connectionHealth
    });

    // Reject if violates hard constraints
    if (!kernelCheck.allowed) {
      return { response, score: 0, blocked: true };
    }

    return { response, score: humannessScore.total, blocked: false };
  }));

  // Select highest-scoring non-blocked response
  const best = scored
    .filter(s => !s.blocked)
    .sort((a, b) => b.score - a.score)[0];

  return best.response;
}
```

---

### Phase 4: Fine-Tuned Local LLM (The Big Step)

**Goal:** Train our own LLM that understands humans the way Mood Leaf does.

**What We're Training:**

The model needs to learn:

1. **Response Generation** - Generate human-like coaching responses
2. **Profile Awareness** - Adapt to cognitive profiles
3. **Principle Alignment** - Follow Core Principle Kernel
4. **Interview Insights** - Knowledge about how humans work

**Training Data Composition:**

```
Total Training Dataset
├── Scored Conversations (60%)
│   └── High-scoring (80+) Claude responses + context
├── Interview Insights (15%)
│   └── Formatted as "given this insight, respond like this"
├── Principle Examples (15%)
│   └── "DO this" and "DON'T do this" paired examples
└── Corrections (10%)
    └── Bad response → Better response pairs
```

**Model Selection:**

| Model | Size | Requirements | Best For |
|-------|------|--------------|----------|
| **Mistral 7B** | 7B | 16GB VRAM | Best quality/size ratio |
| **Llama 3 8B** | 8B | 16GB VRAM | Strong instruction following |
| **Phi-3 Mini** | 3.8B | 8GB VRAM | Efficient, mobile-possible |
| **Gemma 2B** | 2B | 4GB VRAM | Can run on high-end phones |

**Recommended: Mistral 7B** - Best balance of quality and practicality.

**Fine-Tuning Approach:**

```
Base Model (Mistral 7B)
          │
          ▼
┌─────────────────────────────────────────────┐
│         Supervised Fine-Tuning (SFT)        │
│                                             │
│  Input: User message + profile + context    │
│  Output: High-scoring coach response        │
│                                             │
│  Training: 1,000+ scored conversations      │
│  Method: QLoRA (memory efficient)           │
│  Epochs: 3-5                                │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│      Direct Preference Optimization (DPO)   │
│                                             │
│  Input: User message + profile + context    │
│  Chosen: High-scoring response              │
│  Rejected: Low-scoring response             │
│                                             │
│  Training: Pairs of good/bad responses      │
│  Method: Reinforcement from human prefs     │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│        Principle Alignment Layer            │
│                                             │
│  Inject Core Principle Kernel as system     │
│  prompt during inference                    │
│                                             │
│  Hard constraints enforced via:             │
│  - Training examples that avoid violations  │
│  - Post-generation filtering (Phase 3)     │
└─────────────────────────────────────────────┘
```

**Interview Insights Integration:**

Turn insights into training examples:

```json
// Raw insight
{
  "insight": "Cyclical minds often interpret low phases as personal failure",
  "coachingImplication": "Proactively normalize the experience during low phases"
}

// Becomes training example
{
  "input": "[Profile: cyclical_pronounced] [Energy: low] User: I can't do anything right. I was productive last week, what happened to me?",
  "output": "Low phases are part of how your mind works - not a sign something's wrong. Last week wasn't a fluke; this week isn't the 'real' you. Both are you. What feels heaviest right now?"
}

// And negative example
{
  "input": "[Profile: cyclical_pronounced] [Energy: low] User: I can't do anything right.",
  "rejected_output": "You were so productive last week! Try to remember that feeling.",
  "reason": "Highlights the gap, implies low phase is a choice"
}
```

**Deployment Options:**

| Option | Where | Latency | Cost | Privacy |
|--------|-------|---------|------|---------|
| **On-device** | User's phone | ~2s/response | $0 | Maximum |
| **Private server** | Your infrastructure | ~0.5s | $$/month | High |
| **Hybrid** | Try local, fallback cloud | Varies | $ | High |

**Recommended: Private Server + On-Device Fallback**
- Server for best quality
- Device for offline/fast responses
- Claude for edge cases

---

### Phase 5: Claude as Specialist

**Goal:** Claude becomes a specialist tool, not the default.

**When to Call Claude:**

```typescript
async function shouldUseClaude(
  userMessage: string,
  profile: CognitiveProfile,
  conversationHistory: Message[]
): Promise<boolean> {

  // 1. Crisis detection - always use Claude for safety
  if (await detectCrisisSignals(userMessage)) {
    return true; // Claude has better safety training
  }

  // 2. Novel situation - profile combination we haven't seen
  if (await isNovelProfileCombination(profile)) {
    return true; // Local model may not generalize well
  }

  // 3. Complex multi-turn - conversation exceeds local context
  if (conversationHistory.length > 20) {
    return true; // Local model context limits
  }

  // 4. User requested depth - explicitly wants thorough response
  if (await userRequestedDeepDive(userMessage)) {
    return true; // Claude excels at long-form
  }

  // 5. Local model uncertainty - confidence is low
  const localConfidence = await localModel.getConfidence(userMessage, profile);
  if (localConfidence < 0.7) {
    return true; // Better to use Claude than bad response
  }

  return false; // Local model handles it
}
```

**Architecture at Phase 5:**

```
User Message
      │
      ▼
┌─────────────────┐
│ Should use      │
│ Claude?         │───Yes──▶ Claude API ──▶ Response
└────────┬────────┘
         │ No
         ▼
┌─────────────────┐
│ Local LLM       │
│ (Fine-tuned)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Local Scorer    │
│ + Kernel Check  │───Fails──▶ Try Claude
└────────┬────────┘
         │ Passes
         ▼
    Response to User
```

**Expected Cost Reduction:**

| Phase | Claude API Usage | Cost vs Current |
|-------|-----------------|-----------------|
| Phase 1 (Current) | 100% of responses | 100% |
| Phase 2 | 100% responses, no scoring | 85% |
| Phase 3 | Ranking only | 60% |
| Phase 4 | 10-20% of responses | 20% |
| Phase 5 | Edge cases only | 5-10% |

---

### Technical Requirements Summary

**For Phase 2 (Local Scorer):**
- 500+ Claude-scored conversations
- Small ML model (~50MB)
- CoreML/ONNX export
- Runs on iPhone 11+

**For Phase 4 (Local LLM):**
- 2,000+ scored conversations
- 100+ interview insights
- 500+ correction pairs
- Training infrastructure (GPU server)
- Deployment infrastructure (server or edge)

**Model Serving Options:**

| Service | Latency | Cost | Notes |
|---------|---------|------|-------|
| RunPod | ~1s | $0.20/hr | Good for development |
| Lambda Labs | ~0.5s | $1.10/hr | Fast GPUs |
| Modal | ~0.5s | Pay per request | Serverless, auto-scale |
| Self-hosted | ~0.3s | Fixed server cost | Maximum control |
| On-device (Phi-3) | ~3s | $0 | Limited to small models |

---

### Complete Migration Timeline

```
NOW ────────────────────────────────────────────────────────────▶ GOAL

Phase 1: Data Collection                                    [NOW]
├── Automatic conversation scoring
├── Interview insight import (to build)
├── User feedback collection
└── Goal: 500 Claude-scored examples

Phase 2: Local Scorer                                       [NEXT]
├── Train small classifier
├── Validate against Claude
├── Deploy on-device
└── Goal: 85%+ correlation with Claude

Phase 3: Response Ranking                                   [THEN]
├── Generate candidates (Claude or local)
├── Rank with local scorer + kernel
├── Select best response locally
└── Goal: 80% responses selected locally

Phase 4: Fine-Tuned Local LLM                              [LATER]
├── Assemble training dataset
├── Fine-tune Mistral/Llama
├── Deploy to server
├── Integrate with app
└── Goal: 90%+ conversations use local

Phase 5: Claude as Specialist                              [FINAL]
├── Local handles routine
├── Claude for crisis/novel/complex
├── Continuous improvement loop
└── Goal: 90% cost reduction
```

---

## Training Data Schema

### Export Format (for model training)

```json
{
  "exportDate": "2024-12-15T10:00:00Z",
  "version": "1.0",
  "stats": {
    "totalConversations": 1523,
    "totalInsights": 89,
    "totalCorrections": 234,
    "uniqueProfiles": 156
  },
  "conversations": [
    {
      "id": "conv_123",
      "userMessage": "I've been in a fog for days...",
      "coachResponse": "That sounds exhausting. Has this happened before?",
      "profile": {
        "cognitiveMode": "emotional_relational",
        "rhythm": "cyclical_pronounced",
        "neurodivergence": []
      },
      "context": {
        "energy": "low",
        "mood": "frustrated",
        "messageNumber": 3,
        "hourOfDay": 23
      },
      "scores": {
        "local": 78,
        "claude": 82
      },
      "userFeedback": "positive_implicit"
    }
  ],
  "insights": [
    {
      "id": "insight_456",
      "category": "cognitive_patterns",
      "title": "Low phases feel permanent to those in them",
      "insight": "...",
      "coachingImplication": "...",
      "validatedInConversations": ["conv_789", "conv_012"]
    }
  ],
  "corrections": [
    {
      "id": "corr_789",
      "conversationId": "conv_321",
      "originalResponse": "Have you tried making a list?",
      "issue": "Generic advice for user who explicitly said lists don't work",
      "betterApproach": "Ask what HAS worked for them in the past"
    }
  ]
}
```

---

## API: Training Data Service

```typescript
// Import insights
import {
  importInterviewInsight,
  importFromResearchLink,
  processInterviewTranscript,
  approveInsight,
  rejectInsight,
} from './services/trainingDataService';

// Query insights
import {
  getInsightsByCategory,
  getInsightsForProfile,
  searchInsights,
} from './services/trainingDataService';

// Export for training
import {
  exportForTraining,
  exportConversations,
  exportInsights,
  getTrainingReadiness,
} from './services/trainingDataService';

// Check training readiness
const readiness = await getTrainingReadiness();
// {
//   claudeExamples: 523,
//   localExamples: 1892,
//   insightCount: 89,
//   correctionCount: 234,
//   readyForPhase: 2,
//   nextMilestone: "Phase 2 requires 85%+ local scorer accuracy"
// }
```

---

## Admin Interface Requirements

To make interview import practical, the admin interface needs:

### Interview Import UI
- [ ] Paste transcript text
- [ ] Specify participant profile
- [ ] Review AI-extracted insights
- [ ] Approve/reject/edit each insight
- [ ] Tag related profiles and categories

### Research Link Import
- [ ] Enter URL
- [ ] Specify focus areas
- [ ] Review extracted insights
- [ ] Validate against existing knowledge

### Insight Browser
- [ ] View all insights by category
- [ ] Search insights
- [ ] See which conversations validated each insight
- [ ] Edit/update insights as understanding evolves

### Training Dashboard
- [ ] Training data statistics
- [ ] Export buttons
- [ ] Phase progression indicator
- [ ] Quality metrics

---

## Security & Privacy

### Interview Data
- Strip all PII before import
- Use participant codes, not names
- Aggregate patterns, not individual stories
- Consent must be obtained for use in training

### Conversation Data
- User can opt out of training data collection
- Conversation content never leaves device (only metadata + scores)
- Export only includes anonymized examples
- No personal identifiers in training exports

### Model Training
- Training happens on secure servers
- Model weights don't contain raw data
- Fine-tuned model tested for data leakage
- Regular privacy audits

---

## Implementation Priority

1. **Now:** Continue collecting scored conversations (automatic)
2. **Next:** Build interview insight import (manual first)
3. **Then:** Build research link importer
4. **Then:** Build insight browser/admin UI
5. **Later:** Implement local scorer training
6. **Eventually:** Fine-tune local LLM

---

## Related Files

- `services/humanScoreService.ts` - Human-ness scoring
- `services/trainingDataService.ts` - Training data management (TO CREATE)
- `services/corePrincipleKernel.ts` - Principles that insights update
- `services/cognitiveProfileService.ts` - Profiles insights relate to

---

## Example: Full Interview Import Flow

```
1. Conduct user research interview
   └─> Record and transcribe

2. Load transcript into admin interface
   └─> processInterviewTranscript()

3. AI extracts potential insights
   └─> "Found 7 potential insights"

4. Review each insight:
   ┌─────────────────────────────────────────────────────────┐
   │ INSIGHT #3                                              │
   │                                                         │
   │ Category: emotional_processing                          │
   │ Title: "Validation before advice is non-negotiable"     │
   │                                                         │
   │ Insight:                                                │
   │ "User reported feeling dismissed when coach jumped      │
   │ to solutions. Direct quote: 'I just wanted to know     │
   │ it made sense to feel this way first.'"                │
   │                                                         │
   │ Coaching Implication:                                   │
   │ "Always acknowledge the emotion before offering any     │
   │ advice or solutions, regardless of how 'obvious' the   │
   │ solution seems."                                        │
   │                                                         │
   │ [APPROVE]  [EDIT]  [REJECT]                            │
   └─────────────────────────────────────────────────────────┘

5. Approved insights flow to:
   - Core beliefs (if philosophical)
   - Hard constraints (if "never do X")
   - Soft principles (if "prefer Y")
   - Coach prompt context

6. Future conversations reflect learning
```

---

This module is how Mood Leaf becomes smarter over time - not by guessing, but by learning from real humans about how real humans work.
