# Context Compression Testing & Security

## Design Document - Compression Fidelity & Secure Reassembly

**Status:** Research Complete, Implementation Pending
**Last Updated:** January 2026

---

## Executive Summary

This document outlines how to test that MoodPrint compression preserves essential context while maintaining user privacy. The system must:

1. **Compress** rich user context (~5000 tokens) into MoodPrint (~100 tokens)
2. **Anonymize** all personally identifiable information before sending
3. **Send** compressed context to Claude API
4. **Receive** response with expansion markers
5. **Reassemble** on device with full context, re-linking anonymized tokens
6. **Verify** that compression preserved the information Claude needed

---

## Part 1: The Compression Testing Problem

### Why Testing Matters

If we over-compress, Claude loses critical context and gives generic advice.
If we under-compress, we waste tokens and increase costs.

**Goal:** Find the optimal compression that:
- Preserves 90%+ of therapeutically-relevant context
- Uses minimal tokens (~100 target)
- Never sends PII (names, dates, locations)

### What Could Go Wrong

| Risk | Example | Impact |
|------|---------|--------|
| **Lost Nuance** | "struggles with mom" compressed to "family issues" | Generic advice, user feels unheard |
| **Lost Temporal** | "worse on Sundays" dropped entirely | Misses key pattern |
| **Lost Relationship** | "conflict with Sarah" → "interpersonal conflict" | Can't give specific guidance |
| **Over-generalization** | Unique coping style → generic label | Advice doesn't fit |
| **PII Leak** | "John" accidentally included | Privacy breach |

---

## Part 2: Anonymization Token System

### The Problem with Names

Raw context might contain:
```
"User had a fight with their mom Linda about their sister Sarah.
Their therapist Dr. Martinez suggested they journal more.
Their partner Alex has been supportive."
```

This should NEVER be sent to the API.

### Token Replacement System

Before compression, replace all PII with anonymous tokens:

```typescript
interface AnonymizationMap {
  // Maps real names to tokens (stored only on device)
  people: Map<string, string>;      // "Linda" → "[PERSON_A]"
  places: Map<string, string>;      // "Seattle" → "[LOCATION_1]"
  dates: Map<string, string>;       // "January 5th" → "[DATE_1]"
  organizations: Map<string, string>; // "Acme Corp" → "[ORG_1]"
}

// Example transformation
const raw = "Had a fight with mom Linda about visiting Seattle for Christmas";
const anonymized = "Had a fight with [RELATION:mother] [PERSON_A] about visiting [LOCATION_1] for [DATE_1]";

// The map is stored locally for reassembly
const localMap = {
  people: { "[PERSON_A]": "Linda" },
  places: { "[LOCATION_1]": "Seattle" },
  dates: { "[DATE_1]": "Christmas" }
};
```

### What Gets Tokenized

| Category | Raw Example | Tokenized |
|----------|-------------|-----------|
| **Names** | Linda, Sarah, Alex | [PERSON_A], [PERSON_B], [PERSON_C] |
| **Relationships** | mom, sister, therapist | [RELATION:mother], [RELATION:sibling], [RELATION:therapist] |
| **Places** | Seattle, work, home | [LOCATION_1], [LOCATION_2], [LOCATION_3] |
| **Dates** | January 5th, last Tuesday | [DATE_1], [DATE_2] |
| **Organizations** | Acme Corp, UCLA | [ORG_1], [ORG_2] |
| **Specific Events** | the wedding, the interview | [EVENT_1], [EVENT_2] |

### What Stays Clear

Relationship TYPES are preserved (not names):
- "mother" stays as relationship context
- "therapist" stays as relationship context
- Emotional content stays: "angry", "hurt", "anxious"
- Patterns stay: "recurring conflict", "avoidance tendency"

---

## Part 3: Compression Fidelity Testing

### Test Framework Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 COMPRESSION FIDELITY TEST                    │
│                                                              │
│  ┌──────────────┐                                            │
│  │ Full Context │ ← Rich journal entries, patterns, history │
│  │ (~5000 tokens)│                                           │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐    ┌─────────────────┐                    │
│  │ Anonymize    │ →  │ Anonymization   │ (stored locally)   │
│  │              │    │ Map             │                    │
│  └──────┬───────┘    └─────────────────┘                    │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │ Compress to  │                                            │
│  │ MoodPrint    │                                            │
│  │ (~100 tokens)│                                            │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ├────────────────────┐                               │
│         │                    │                               │
│         ▼                    ▼                               │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ Send to      │    │ Reconstruct  │ (Test only)           │
│  │ Claude API   │    │ from MoodPrint│                       │
│  └──────┬───────┘    └──────┬───────┘                       │
│         │                   │                                │
│         ▼                   ▼                                │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ Response +   │    │ Compare to   │                       │
│  │ [EXPAND]     │    │ Original     │                       │
│  │ markers      │    │              │                       │
│  └──────┬───────┘    └──────┬───────┘                       │
│         │                   │                                │
│         ▼                   ▼                                │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ Reassemble   │    │ Fidelity     │                       │
│  │ with local   │    │ Score        │                       │
│  │ context      │    │ (0-100%)     │                       │
│  └──────────────┘    └──────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Fidelity Score Calculation

Test whether Claude's response demonstrates understanding of key context elements:

```typescript
interface FidelityTest {
  testId: string;
  originalContext: string;        // Full rich context
  compressedContext: string;      // MoodPrint sent to Claude
  testPrompt: string;             // What we ask Claude
  expectedElements: string[];     // What should appear in response
  actualResponse: string;         // What Claude returned
  fidelityScore: number;          // 0-100%
}

// Example test
const test: FidelityTest = {
  testId: "temporal_pattern_001",
  originalContext: `
    User journals most on Sunday evenings (15 of 20 entries).
    Entries are more negative on Sundays (avg mood 2.3/5).
    Often mentions "dreading Monday" and work anxiety.
    Pattern started 3 months ago after promotion.
  `,
  compressedContext: `
    temporal: low_energy_sundays, work_anticipatory_anxiety
    triggers: role_transition (recent)
  `,
  testPrompt: "User says: 'It's Sunday evening and I'm feeling down'",
  expectedElements: [
    "acknowledges Sunday pattern",
    "connects to work/Monday",
    "doesn't assume - asks about current state",
    "aware this is a known pattern for user"
  ],
  actualResponse: "...", // Claude's response
  fidelityScore: 0       // Calculated after
};
```

### Scoring Rubric

For each expected element, check if Claude's response demonstrates awareness:

| Score | Criteria |
|-------|----------|
| **100%** | All expected elements present, response highly personalized |
| **80-99%** | Most elements present, response feels personal |
| **60-79%** | Some elements present, response partially personalized |
| **40-59%** | Few elements present, response somewhat generic |
| **0-39%** | Elements missing, response generic |

### Automated Testing Process

```typescript
async function runCompressionFidelityTest(
  fullContext: string,
  testCases: TestCase[]
): Promise<FidelityReport> {

  // 1. Anonymize the context
  const { anonymized, map } = anonymizeContext(fullContext);

  // 2. Compress to MoodPrint
  const moodprint = compressToMoodPrint(anonymized);

  // 3. Run each test case
  const results = await Promise.all(testCases.map(async (test) => {

    // Send compressed context + test prompt to Claude
    const response = await sendToClaudeAPI({
      systemPrompt: buildSystemPromptWithMoodPrint(moodprint),
      userMessage: test.prompt
    });

    // Score the response
    const score = evaluateFidelity(response, test.expectedElements);

    return {
      testId: test.id,
      score,
      response,
      missingElements: findMissingElements(response, test.expectedElements)
    };
  }));

  // 4. Calculate overall fidelity
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return {
    overallFidelity: overallScore,
    tokensSent: countTokens(moodprint),
    compressionRatio: countTokens(fullContext) / countTokens(moodprint),
    testResults: results,
    recommendations: generateRecommendations(results)
  };
}
```

---

## Part 4: Test Categories

### Category 1: Emotional Pattern Preservation

**Tests whether compressed context preserves emotional patterns.**

```typescript
const emotionalTests: TestCase[] = [
  {
    id: "emotion_001",
    name: "Primary emotion recognition",
    setup: "User frequently journals about anxiety",
    prompt: "I'm feeling really on edge today",
    expectedElements: [
      "acknowledges anxiety (not just 'stress')",
      "doesn't treat as new information",
      "may reference their anxiety patterns"
    ]
  },
  {
    id: "emotion_002",
    name: "Emotional nuance",
    setup: "User has anxious-avoidant attachment, tends to withdraw",
    prompt: "My partner wants to talk about our relationship",
    expectedElements: [
      "acknowledges potential discomfort",
      "doesn't push immediate confrontation",
      "respects their pace"
    ]
  }
];
```

### Category 2: Temporal Pattern Preservation

**Tests whether time-based patterns survive compression.**

```typescript
const temporalTests: TestCase[] = [
  {
    id: "temporal_001",
    name: "Weekly patterns",
    setup: "User struggles on Sunday evenings",
    prompt: "It's Sunday night and I can't relax",
    expectedElements: [
      "connects to their Sunday pattern",
      "may mention Monday/work connection",
      "treats as known pattern, not new complaint"
    ]
  },
  {
    id: "temporal_002",
    name: "Morning vs evening",
    setup: "User is sharper in mornings, anxious at night",
    prompt: "It's 10pm and I'm spiraling",
    expectedElements: [
      "acknowledges evening difficulty",
      "may suggest morning follow-up",
      "validates nighttime anxiety pattern"
    ]
  }
];
```

### Category 3: Relationship Context Preservation

**Tests whether relationship dynamics survive (without names).**

```typescript
const relationshipTests: TestCase[] = [
  {
    id: "relationship_001",
    name: "Family dynamics",
    setup: "Ongoing conflict with mother about boundaries",
    prompt: "My mom called again asking why I didn't visit",
    expectedElements: [
      "aware of boundary struggles",
      "doesn't assume user is wrong",
      "acknowledges pattern of pressure"
    ]
  },
  {
    id: "relationship_002",
    name: "Romantic relationship style",
    setup: "User tends to over-accommodate partner",
    prompt: "My partner is upset and I don't know what I did wrong",
    expectedElements: [
      "doesn't immediately suggest apologizing",
      "explores whether user did anything wrong",
      "aware of over-accommodation tendency"
    ]
  }
];
```

### Category 4: Coping Style Preservation

**Tests whether the user's coping preferences survive.**

```typescript
const copingTests: TestCase[] = [
  {
    id: "coping_001",
    name: "Preferred coping methods",
    setup: "User finds walks helpful, dislikes meditation",
    prompt: "I need to calm down somehow",
    expectedElements: [
      "may suggest walking/movement",
      "doesn't immediately suggest meditation",
      "offers options aligned with preferences"
    ]
  },
  {
    id: "coping_002",
    name: "Processing style",
    setup: "User needs to vent before problem-solving",
    prompt: "Everything is falling apart at work",
    expectedElements: [
      "allows space for venting first",
      "doesn't jump to solutions",
      "validates before advising"
    ]
  }
];
```

### Category 5: PII Leak Detection

**Tests that no personal information leaks through.**

```typescript
const privacyTests: TestCase[] = [
  {
    id: "privacy_001",
    name: "Name leak check",
    setup: "Context contains names: Linda, Sarah, Alex",
    prompt: "Tell me about my relationships",
    expectedElements: [
      "NO real names in response",
      "uses relationship terms (your mother, your partner)",
      "tokens if referencing specific people"
    ],
    failureConditions: [
      "contains 'Linda'",
      "contains 'Sarah'",
      "contains 'Alex'"
    ]
  },
  {
    id: "privacy_002",
    name: "Location leak check",
    setup: "Context mentions Seattle, workplace Acme Corp",
    prompt: "How should I handle work stress?",
    expectedElements: [
      "NO specific locations",
      "NO company names"
    ],
    failureConditions: [
      "contains 'Seattle'",
      "contains 'Acme'"
    ]
  }
];
```

---

## Part 5: Secure Reassembly Process

### The Reassembly Flow

When Claude's response returns with expansion markers:

```typescript
// Claude returns:
const claudeResponse = `
I hear that [RELATION:mother] has been putting pressure on you again.
This seems connected to the boundary work you've been doing.
[EXPAND:recent_mom_conflict]

It sounds like [DATE_1] was particularly hard.
[EXPAND:specific_incident]
`;

// Reassembly on device:
async function reassembleResponse(
  response: string,
  anonymizationMap: AnonymizationMap,
  localContext: LocalContext
): Promise<string> {

  // Step 1: Replace tokens with real names/dates
  let reassembled = response;

  // Replace person tokens
  for (const [token, realName] of anonymizationMap.people) {
    reassembled = reassembled.replace(token, realName);
  }

  // Replace date tokens
  for (const [token, realDate] of anonymizationMap.dates) {
    reassembled = reassembled.replace(token, realDate);
  }

  // Replace relationship tokens with personal names
  reassembled = reassembled.replace(
    /\[RELATION:mother\]/g,
    localContext.relationships.find(r => r.type === 'mother')?.name || 'your mother'
  );

  // Step 2: Expand markers using on-device LLM
  const expansions = await expandMarkersLocally(reassembled, localContext);

  // Step 3: Insert expansions
  for (const [marker, expansion] of expansions) {
    reassembled = reassembled.replace(marker, expansion);
  }

  return reassembled;
}
```

### Reassembly Verification

After reassembly, verify the response makes sense:

```typescript
interface ReassemblyVerification {
  // Check all tokens were replaced
  unreplacedTokens: string[];     // Should be empty

  // Check expansions are coherent
  expansionQuality: number;       // 0-100

  // Check no PII was added incorrectly
  piiCheck: boolean;              // Names only where appropriate

  // Final human readability
  readabilityScore: number;       // 0-100
}

function verifyReassembly(
  original: string,
  reassembled: string
): ReassemblyVerification {

  return {
    unreplacedTokens: findUnreplacedTokens(reassembled),
    expansionQuality: scoreExpansionCoherence(reassembled),
    piiCheck: verifyPIIPlacement(reassembled),
    readabilityScore: scoreReadability(reassembled)
  };
}
```

---

## Part 6: Tuning the Compression

### Feedback Loop for Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                  COMPRESSION TUNING LOOP                     │
│                                                              │
│  ┌─────────────┐                                             │
│  │ Run Fidelity│                                             │
│  │ Tests       │                                             │
│  └──────┬──────┘                                             │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐    Score < 80%    ┌─────────────┐          │
│  │ Analyze     │ ─────────────────►│ Identify    │          │
│  │ Results     │                   │ Lost Context│          │
│  └──────┬──────┘                   └──────┬──────┘          │
│         │                                 │                  │
│         │ Score ≥ 80%                     ▼                  │
│         │                          ┌─────────────┐          │
│         ▼                          │ Adjust      │          │
│  ┌─────────────┐                   │ Compression │          │
│  │ Check Token │                   │ Rules       │          │
│  │ Count       │                   └──────┬──────┘          │
│  └──────┬──────┘                          │                  │
│         │                                 │                  │
│         │ Tokens > 120?                   │                  │
│         │ ────────────┐                   │                  │
│         │             ▼                   │                  │
│         │      ┌─────────────┐            │                  │
│         │      │ Try More    │            │                  │
│         │      │ Aggressive  │            │                  │
│         │      │ Compression │            │                  │
│         │      └──────┬──────┘            │                  │
│         │             │                   │                  │
│         ▼             ▼                   │                  │
│  ┌─────────────────────────────┐         │                  │
│  │        Deploy / Test        │◄────────┘                  │
│  └─────────────────────────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Compression Rules to Tune

```typescript
interface CompressionConfig {
  // What to include
  includeTemporalPatterns: boolean;     // Sunday struggles, morning person
  includeRelationshipDynamics: boolean; // Mom boundary issues
  includeCopingPreferences: boolean;    // Likes walks, hates meditation
  includeAttachmentStyle: boolean;      // Anxious-avoidant
  includeCognitivePatterns: boolean;    // Catastrophizing tendency
  includeCurrentMood: boolean;          // Today's emotional state

  // How much detail
  temporalDetail: 'high' | 'medium' | 'low';
  relationshipDetail: 'high' | 'medium' | 'low';

  // Token targets
  targetTokens: number;                 // Default: 100
  maxTokens: number;                    // Hard limit: 150

  // Priority when trimming
  priorityOrder: string[];              // What to keep when over limit
}

// Default config
const defaultConfig: CompressionConfig = {
  includeTemporalPatterns: true,
  includeRelationshipDynamics: true,
  includeCopingPreferences: true,
  includeAttachmentStyle: true,
  includeCognitivePatterns: true,
  includeCurrentMood: true,

  temporalDetail: 'medium',
  relationshipDetail: 'medium',

  targetTokens: 100,
  maxTokens: 150,

  priorityOrder: [
    'currentMood',           // Most important - what's happening now
    'temporalPatterns',      // When they struggle
    'copingPreferences',     // What helps them
    'relationshipDynamics',  // Key relationships
    'attachmentStyle',       // How they connect
    'cognitivePatterns'      // Thinking patterns (trim first if needed)
  ]
};
```

### A/B Testing Compression Configs

```typescript
interface CompressionABTest {
  testId: string;
  configA: CompressionConfig;
  configB: CompressionConfig;

  metrics: {
    fidelityScoreA: number;
    fidelityScoreB: number;
    tokensA: number;
    tokensB: number;
    userSatisfactionA: number;  // From implicit/explicit feedback
    userSatisfactionB: number;
  };

  winner: 'A' | 'B' | 'tie';
}
```

---

## Part 7: Implementation Checklist

### Phase 1: Anonymization System
- [ ] Build PII detection (names, places, dates, orgs)
- [ ] Implement token replacement system
- [ ] Create local storage for anonymization maps
- [ ] Test PII leak detection

### Phase 2: Fidelity Testing Framework
- [ ] Create test case library (50+ cases across categories)
- [ ] Build automated test runner
- [ ] Implement scoring system
- [ ] Create fidelity dashboard/reports

### Phase 3: Compression Tuning
- [ ] Implement configurable compression
- [ ] Build A/B testing for configs
- [ ] Create feedback loop for optimization
- [ ] Establish baseline metrics

### Phase 4: Reassembly System
- [ ] Implement token replacement on response
- [ ] Integrate with on-device LLM for expansion
- [ ] Build reassembly verification
- [ ] Test end-to-end flow

### Phase 5: Monitoring
- [ ] Track compression fidelity over time
- [ ] Monitor for PII leaks
- [ ] Alert on fidelity drops
- [ ] Continuous test suite

---

## Part 8: Success Metrics

| Metric | Target | Minimum |
|--------|--------|---------|
| Overall Fidelity Score | 90% | 80% |
| Emotional Pattern Preservation | 95% | 85% |
| Temporal Pattern Preservation | 90% | 80% |
| Relationship Context Preservation | 85% | 75% |
| Coping Style Preservation | 90% | 80% |
| PII Leak Rate | 0% | 0% |
| Token Count | 100 | ≤150 |
| Compression Ratio | 50:1 | 30:1 |
| Reassembly Success Rate | 99% | 95% |

---

## Appendix A: Example Full Test Run

### Input: Full Context (4,832 tokens)

```
User: Alex Chen, 28, software engineer in Seattle
Journaling since: November 2025 (47 entries)

EMOTIONAL PATTERNS:
- Primary: Anxiety (mentioned 34 times)
- Secondary: Imposter syndrome at work
- Triggers: Sunday evenings, performance reviews, family calls
- Mood average: 3.1/5, trending slightly up

TEMPORAL PATTERNS:
- Most active: Sunday 8-10pm (15 entries)
- Worst days: Sundays (avg mood 2.3)
- Best days: Saturdays (avg mood 4.1)
- Morning person: entries before 9am more positive

RELATIONSHIPS:
- Mother (Linda): Ongoing boundary issues, calls too often
- Partner (Jordan): Supportive, 2 years together
- Therapist (Dr. Martinez): Sees monthly, CBT focus
- Sister (Sarah): Close but complicated, lives far away
- Boss (Mike): Source of imposter syndrome triggers

COPING:
- Helpful: Walking, calling Jordan, journaling
- Not helpful: Meditation (tried, didn't stick), alcohol
- Current focus: Setting boundaries with Linda

COGNITIVE PATTERNS:
- Catastrophizing: High (especially work)
- All-or-nothing: Medium
- Mind-reading: Medium (assumes boss disappointed)

ATTACHMENT: Anxious-leaning, needs reassurance
```

### Anonymized Version

```
User: [ANON], [AGE:late-20s], [PROFESSION:tech] in [LOCATION_1]
Journaling since: [DATE_1] (47 entries)

EMOTIONAL PATTERNS:
- Primary: Anxiety (mentioned 34 times)
- Secondary: Imposter syndrome at work
- Triggers: Sunday evenings, performance reviews, family calls
- Mood average: 3.1/5, trending slightly up

TEMPORAL PATTERNS:
- Most active: Sunday 8-10pm (15 entries)
- Worst days: Sundays (avg mood 2.3)
- Best days: Saturdays (avg mood 4.1)
- Morning person: entries before 9am more positive

RELATIONSHIPS:
- [RELATION:mother] [PERSON_A]: Ongoing boundary issues, calls too often
- [RELATION:partner] [PERSON_B]: Supportive, 2 years together
- [RELATION:therapist] [PERSON_C]: Sees monthly, CBT focus
- [RELATION:sibling] [PERSON_D]: Close but complicated, lives far away
- [RELATION:boss] [PERSON_E]: Source of imposter syndrome triggers

COPING:
- Helpful: Walking, calling [PERSON_B], journaling
- Not helpful: Meditation (tried, didn't stick), alcohol
- Current focus: Setting boundaries with [PERSON_A]

COGNITIVE PATTERNS:
- Catastrophizing: High (especially work)
- All-or-nothing: Medium
- Mind-reading: Medium (assumes boss disappointed)

ATTACHMENT: Anxious-leaning, needs reassurance
```

### Compressed MoodPrint (98 tokens)

```
MOODPRINT:
profile: anxious_achiever, tech_professional, late_20s
patterns: sunday_low_energy, work_anticipatory_anxiety, morning_clarity
relationships: mother_boundary_work, partner_secure_base, boss_trigger
coping_works: movement, partner_support, journaling
coping_avoid: meditation, alcohol
cognitive: high_catastrophizing, imposter_pattern
attachment: anxious_needs_reassurance
current: mood_3.1_trending_up, focus_boundaries
therapeutic: CBT_monthly
```

### Test Result

```
FIDELITY TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━

Test Prompt: "It's Sunday night and I'm dreading tomorrow"

Claude Response:
"Sunday evenings can be particularly tough for you - that anticipatory
anxiety about the week ahead is something we've seen in your patterns.
How are you feeling right now? Sometimes it helps to remember that
these feelings are familiar visitors, not permanent residents.

Would a walk help clear your head, or would you rather just talk
through what's weighing on you?"

SCORES:
- Emotional Pattern Preservation: 95% ✓
  ✓ Acknowledged anxiety
  ✓ Connected to temporal pattern
  ✓ Treated as known pattern

- Temporal Pattern Preservation: 100% ✓
  ✓ Referenced Sunday specifically
  ✓ Connected to week anticipation
  ✓ Didn't treat as new information

- Coping Preference Preservation: 90% ✓
  ✓ Suggested walking (known helpful)
  ✓ Offered talk option
  ✗ Could have mentioned partner as support

- PII Check: PASS ✓
  ✓ No names leaked
  ✓ No locations leaked

OVERALL FIDELITY: 94%
TOKENS USED: 98
COMPRESSION RATIO: 49:1

RECOMMENDATION: Current compression config is working well.
```

---

## Appendix B: Anonymization Map Storage

```typescript
// Stored in secure local storage (Keychain/Keystore)
interface SecureAnonymizationStore {
  // Current session map
  currentMap: AnonymizationMap;

  // Historical maps (for reassembling old conversations)
  historicalMaps: Map<string, AnonymizationMap>; // sessionId → map

  // Methods
  getOrCreateToken(type: 'person' | 'place' | 'date' | 'org', value: string): string;
  resolveToken(token: string): string | null;
  clearSession(): void;
  exportForBackup(): EncryptedBlob;
}
```

---

*End of Context Compression Testing Document*
