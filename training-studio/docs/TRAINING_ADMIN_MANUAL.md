# Training Admin Manual

A simple guide to using the Training Admin to import interview insights and build training data.

---

## What Is This For?

The Training Admin lets you **import insights from user interviews** so the coaching AI can learn from real human experiences.

**This is NOT for:**
- Chatting with the AI
- Getting coaching advice

**This IS for:**
- Importing learnings from interviews you've conducted
- Building a dataset to train/improve the AI
- Tracking what the AI has learned about humans

---

## Quick Start: Import an Interview Insight

### The Simplest Way (Single Import)

1. Go to **Settings → Developer Tools → Training Admin**
2. Click the **Import** tab
3. Make sure **Single Import** is selected
4. Fill in:
   - **Title**: Short name (e.g., "Users hate generic advice")
   - **Category**: Pick one (cognitive_patterns, emotional_needs, etc.)
   - **Insight**: What you learned (e.g., "People with anxiety prefer body-based techniques over visualization")
   - **Coaching Implication**: How the AI should behave differently (e.g., "Ask about physical sensations before suggesting mental exercises")
   - **Confidence**: How sure you are (observed, inferred, validated)
5. Click **Import Insight**

That's it! The insight is now saved.

---

## Bulk Import: Multiple Insights at Once

If you have many insights from interviews, use **Batch Import** to add them all at once.

### Step 1: Prepare Your Data

Create a JSON file with your insights. Here's a **simple template you can copy**:

```json
{
  "source": "January 2025 User Interviews",
  "insights": [
    {
      "category": "cognitive_patterns",
      "title": "Systems thinkers need the 'why' first",
      "insight": "Users who think in systems need to understand WHY a technique works before they'll try it.",
      "coachingImplication": "For analytical users, explain the reasoning behind suggestions before giving them.",
      "confidenceLevel": "validated"
    },
    {
      "category": "neurological_differences",
      "title": "Aphantasia users can't visualize",
      "insight": "About 3% of users have aphantasia and cannot create mental images.",
      "coachingImplication": "Never suggest visualization exercises. Use body-based or verbal alternatives.",
      "confidenceLevel": "validated"
    },
    {
      "category": "emotional_needs",
      "title": "Validation before solutions",
      "insight": "Most users want to feel heard before getting advice.",
      "coachingImplication": "Acknowledge feelings first, wait for cue before offering solutions.",
      "confidenceLevel": "observed"
    }
  ]
}
```

### Step 2: Import the JSON

1. Go to **Training Admin → Import tab**
2. Click **Batch Import** (toggle at top)
3. Paste your JSON into the text box
4. Click **Import from JSON**
5. See results: "Imported 3 insights"

---

## Bulk Import with Interview Links

If you want to track which interview each insight came from:

```json
{
  "source": "Q1 Research Sessions",
  "interviewLinks": [
    {
      "interviewId": "INT-001",
      "date": "2025-01-15",
      "link": "https://notion.so/interview-001",
      "notes": "Sarah, 28, anxiety + ADHD",
      "insights": [
        {
          "category": "neurological_differences",
          "title": "ADHD users need novelty",
          "insight": "Users with ADHD traits get bored with repetitive exercises quickly.",
          "coachingImplication": "Rotate techniques frequently. Offer variety in suggestions.",
          "confidenceLevel": "observed"
        }
      ]
    },
    {
      "interviewId": "INT-002",
      "date": "2025-01-16",
      "link": "https://notion.so/interview-002",
      "notes": "Mike, 35, depression recovery",
      "insights": [
        {
          "category": "emotional_needs",
          "title": "Low phases aren't failures",
          "insight": "Users in recovery hate being told they're 'slipping' during low periods.",
          "coachingImplication": "Frame low phases as natural cycles, not setbacks.",
          "confidenceLevel": "validated"
        }
      ]
    }
  ]
}
```

---

## Categories Explained

| Category | What It Means | Example Insight |
|----------|---------------|-----------------|
| `cognitive_patterns` | How people think | "Visual thinkers need diagrams" |
| `emotional_needs` | What people need emotionally | "Validation before advice" |
| `communication_styles` | How people prefer to be talked to | "Direct communicators hate fluff" |
| `neurological_differences` | Brain wiring differences | "Aphantasia can't visualize" |
| `coping_mechanisms` | How people handle stress | "Some need distraction, not processing" |
| `social_dynamics` | Relationship patterns | "Introverts recharge alone" |
| `growth_patterns` | How people change | "Change happens in spirals, not lines" |
| `resistance_patterns` | Why people resist help | "Unsolicited advice feels controlling" |

---

## Confidence Levels

| Level | Meaning | When to Use |
|-------|---------|-------------|
| `observed` | Saw it in interviews | One or two people mentioned this |
| `inferred` | Concluded from patterns | You see a trend across interviews |
| `validated` | Confirmed multiple times | 5+ people showed this pattern |
| `research_backed` | Academic support | Research papers confirm this |

---

## After Importing: Approve Insights

Imported insights start as **pending**. To use them for training:

1. Go to **Insights** tab
2. Filter by **Pending**
3. Review each insight
4. Click **Approve** or **Reject**

Only approved insights are used for training.

---

## Exporting Data

To export all your training data (for backup or actual model training):

1. Go to **Export** tab
2. Click **Export as JSON**
3. Share/save the file

---

## What Happens to This Data?

```
Your Insights
     ↓
[Stored on device]
     ↓
Used to build prompts for coaching AI
     ↓
Eventually: Train a local model (Phase 4-5)
```

**Right now:** Insights shape how the AI responds by adding context to prompts.

**Future:** With enough data (500+ scored examples, 50+ insights), you can train a local model.

---

## The Aliveness Qualities

Before diving into technical details, understand the philosophy that makes Mood Leaf different. These are the qualities that make something feel **alive** rather than **animated**. They apply to the visual tree AND to how the AI coach communicates.

This is the human-ness layer.

### 1. Imperfect Rhythm

Human things do not loop cleanly. Breathing, posture, attention, thought — all have micro-pauses, uneven timing, slight accelerations and decelerations.

**For coaching**: If the AI always responds at the same pace, same length, same cadence — it stops feeling alive. Responses should vary. Sometimes quick. Sometimes lingering. Sometimes a pause before answering.

**What to extract**: Note when speakers pause mid-thought, trail off, speed up with excitement, slow down with weight.

### 2. Asymmetry Over Time

Humans are not symmetrical in motion. We shift weight, favor one side, return to center imperfectly.

**For coaching**: Don't mirror the user perfectly. Don't always match their energy. Be consistent in character but asymmetric in response.

**What to extract**: How do people's speech patterns shift during a conversation? Do they lead with questions then settle into statements?

### 3. Latency (Reaction Delay)

Living systems don't respond instantly. Even breathing lags intention. A human thinks → then moves. Feels → then shifts. Reacts → then settles.

**For coaching**: The AI shouldn't feel like a reflex. A tiny conceptual delay — acknowledgment before response — makes it feel like there's someone there.

**What to extract**: The gap between what someone feels and when they express it. The "wait, let me think" moments.

### 4. Rest Is Part of Motion

We don't move constantly. We settle, hover, pause mid-breath, rest in stillness without being "off."

**For coaching**: The AI doesn't need to fill every silence. Brief responses are okay. Sometimes presence without productivity.

**What to extract**: When do people pause? What does comfortable silence look like in conversation?

### 5. Amplitude Restraint

Humans rarely move at full range unless distressed or performing. Most motion is 10–20% of possible range — barely perceptible, economical.

**For coaching**: Don't over-respond. Don't be dramatic. Understatement often lands better than enthusiasm. "That sounds hard" vs "Oh no, that must be SO difficult!"

**What to extract**: How much do people actually emote vs how much do they hold back? The restraint IS the data.

### 6. Flow Without Destination

Human life doesn't move toward something most of the time. It just continues. Animation has easing in → easing out → repeating. Life has existing → shifting → existing.

**For coaching**: Don't always drive toward outcomes. Sometimes the conversation just IS. No agenda, no "so what will you do about it?"

**What to extract**: Conversations that don't conclude neatly. The messy middle. Being without resolution.

### 7. Consistency Across States

Humans don't breathe "better" when doing well. Life continues under joy, grief, exhaustion, presence.

**For coaching**: The AI's character should remain consistent whether the user is thriving or struggling. Same warmth. Same presence. Growth doesn't earn better treatment.

**What to extract**: How do people's core communication patterns persist across emotional states?

### 8. Scale Independence

A child fidgets. An adult shifts weight. An elder breathes slowly. Different scales. Same principles.

**For coaching**: Whether someone needs a lot of support or a little, the QUALITY of presence remains the same. A check-in isn't "less" than a deep session.

**What to extract**: How do different people embody similar needs at different scales?

### 9. Backgrounded Attention

Humans are good at being with things that don't demand focus. A pet breathing nearby. Curtains moving. A tree outside a window. The moment something tries to be seen, it stops being companionable.

**For coaching**: The AI should tolerate being ignored. Not demand engagement. Not guilt-trip or prompt unnecessarily. Remain alive without acknowledgment.

**What to extract**: What makes people feel "accompanied" without pressure?

### 10. Non-Instrumentality

Humans can feel when something exists FOR them vs WITH them.

**For coaching**: The AI does not exist to motivate, reflect performance, or measure worth. It's alive the way other people are alive — not as mirrors, but as presences.

**What to extract**: The distinction between advice that feels instrumental vs presence that feels real.

---

### Summary of Aliveness Qualities

Not features — qualities:

| Instead of... | Capture... |
|---------------|------------|
| Tempo | **Cadence** |
| Animation | **Flow** |
| Feedback | **Presence** |
| Progress | **Continuity** |
| Motion | **Breath** |
| Responding | **Being-with** |
| Metrics | **Time** |

This is why Mood Leaf feels different from every "growth" metaphor app.

### Fine-Tuning Aliveness

These qualities can be adjusted in the Principle Kernel settings. If the coach feels too:

- **Eager** → Increase AMPLITUDE_RESTRAINT, RESTFUL_PAUSES
- **Robotic** → Adjust IMPERFECT_RHYTHM, NATURAL_LATENCY
- **Pushy** → Strengthen FLOW_WITHOUT_DESTINATION, NON_INSTRUMENTALITY
- **Distant** → Soften BACKGROUNDED_ATTENTION, increase warmth

The goal is finding the balance where the coach feels like a thoughtful friend sitting with you—not a productivity tool, not a therapist, not an always-available servant.

---

## Adaptive Aliveness (Real-Time Response)

Aliveness isn't just static guidelines—the coach actively **detects** the user's communication patterns and **adapts** its response to bring balance.

### The Principle

If someone is speaking rapidly (stress), the coach slows down to ground them.
If someone is quiet and withdrawn, the coach matches them—doesn't overwhelm.
If someone is processing out loud, the coach gives space—doesn't rush to fix.

### What Gets Detected

**From Voice Chat:**
- Speech rate (words per minute)
- Pause frequency
- Volume level
- Pitch variability

**From Text:**
- Message length (terse vs verbose)
- Punctuation intensity (!!!  vs ...)
- Stress keywords
- Response latency

### Adaptive Response Strategies

| User State | Coach Response |
|------------|----------------|
| **Rapid/Stressed** | Slow down, brief responses, short sentences, breathing space |
| **Low-energy/Withdrawn** | Match pace, brief, don't push, be present |
| **Processing/Exploratory** | Give space, acknowledge, don't rush to solutions |
| **Neutral/Balanced** | Match energy, flow naturally |

### Example: Rapid Stressed User

```
User (rapid, loud, no pauses):
"I can't do this anymore everything is falling apart and I don't know
what to do and my boss is being impossible and I haven't slept and!!!"

Coach (slowing down, grounding):
"I hear you.

That's a lot hitting at once.

Let's take this one piece at a time.

What feels most pressing right now?"
```

Notice: Short sentences. Line breaks. Acknowledgment first. No solutions yet.

### Example: Low-Energy User

```
User (quiet, terse):
"tired"

Coach (matching, not pushing):
"Yeah.

What kind of tired?"
```

Notice: Brief. Doesn't overwhelm. Just present.

### Integration

The adaptive aliveness system runs automatically during voice and text conversations. It analyzes the user's input before generating each response and adjusts the coaching style accordingly.

---

## Prosody Extraction for Training

**Prosody** is the "music" of speech—the rhythm, pitch, pace, and emotional texture that tells us how someone is really feeling, often more than their words.

### Why Extract Prosody?

When processing interviews for training, we don't just want WHAT someone said—we want HOW they said it:

- Did their voice **sag down** when talking about their job? (hopelessness)
- Did they **choke up** when mentioning family? (suppressed emotion)
- Did their pace **accelerate** when anxious? (dysregulation)
- Did volume stay **even** or become **erratic**? (emotional stability)

This data teaches the coach to recognize emotional states and respond appropriately.

### Key Prosody Terms

| Term | What It Means | What To Listen For |
|------|---------------|-------------------|
| **Prosody** | The overall "music" of speech | Rhythm + pitch + stress patterns |
| **Cadence** | The natural rise and fall of voice | Falling at statements, rising at questions |
| **Meter** | Regular rhythmic pattern | Stressed/unstressed syllables |
| **Intonation** | Pitch movement | High when excited, flat when depressed |
| **Tempo** | Speed of speech | Fast = anxious, slow = sad/tired |
| **Scansion** | Analyzing the rhythm pattern | Marking stressed beats |

### Features We Extract

#### Voice Quality

| Feature | What It Tells Us |
|---------|-----------------|
| **Volume Evenness** | Stable (regulated) vs. erratic (dysregulated) |
| **Volume Trajectory** | **Sagging down** (giving up, sadness) vs **building up** (anger, excitement) |
| **Flatness** | Low pitch variance = depression, disengagement |
| **Tremor/Shakiness** | Fear, anxiety, crying, distress |
| **Tightness** | Constricted throat = stress, holding back |
| **Breathiness** | Vulnerability, exhaustion, intimacy |

#### Distress Markers

| Marker | Description | What It Indicates |
|--------|-------------|-------------------|
| **Choking** | Voice catches, can't get words out | Overwhelmed, suppressed emotion |
| **Squealing** | High-pitched escape | Acute distress |
| **Voice Breaking** | Pitch cracks | Emotional overload |
| **Crying** | Tears in voice, sniffling, sobbing | Grief, relief, joy |
| **Gasping** | Can't get breath | Panic, hyperventilation |

#### Emotional States

From prosody, we can detect 25+ emotional states:

**Negative High Energy**: anger, fear, anxiety, frustration, panic, distress
**Negative Low Energy**: sadness, grief, depression, exhaustion, hopelessness
**Positive High Energy**: joy, excitement, enthusiasm, passion, triumph
**Positive Low Energy**: calm, contentment, peace, relief, tenderness
**Mixed**: contemplative, curious, uncertain, vulnerable

### Interview Statistics

For each processed interview, we calculate:

```
📊 Interview Statistics
├── Prosody Richness (1-5): How varied the vocal features are
├── Emotional Range (1-5): How many different emotions appear
├── Authenticity (1-5): Genuine vs. performative
├── Training Value (1-5): How useful for training the AI
├── Distress Occurrences: Count of choking, crying, breaks
└── Volume Trajectory: Stable? Sagging? Building?
```

### Interview Type Classification

Interviews are automatically classified:

| Type | Description |
|------|-------------|
| **Therapeutic** | Processing emotions, deep sharing |
| **Coaching** | Goal-oriented, motivational |
| **Crisis Support** | Acute distress, needing grounding |
| **Casual Chat** | Light conversation |
| **Intimate Share** | Vulnerable disclosure |
| **Storytelling** | Narrative, recounting experiences |
| **Celebration** | Positive sharing, wins |

### Using Prosody Data

When reviewing interviews in the Training Admin:

1. **High Training Value** (4-5): Rich prosodic variety, authentic emotion, useful patterns
2. **Medium Training Value** (3): Some useful features but limited range
3. **Low Training Value** (1-2): Flat, scripted, or too short to extract patterns

Focus on HIGH training value interviews for building the coach's emotional intelligence.

### Extraction Pipeline

```
Interview Audio
       ↓
[Backend Service]
  ├── Whisper (transcription with timestamps)
  ├── librosa (audio features)
  └── praat (pitch/formant analysis)
       ↓
Prosody Features (JSON)
       ↓
Classification + Statistics
       ↓
Training Data Storage
```

---

## Insight Scoring System

When insights are processed through the Interview Processor (YouTube harvester), they're automatically scored across **5 dimensions**. This helps filter quality training data.

### The 5 Scoring Dimensions

| Dimension | Range | What It Measures |
|-----------|-------|------------------|
| `qualityScore` | 0-100 | Overall quality of the insight |
| `specificityScore` | 0-100 | How specific vs generic the insight is |
| `actionabilityScore` | 0-100 | Can the coach actually use this? |
| `safetyScore` | 0-100 | Could this insight cause harm if applied? |
| `noveltyScore` | 0-100 | Is this unique or duplicate of existing data? |

### Quality Thresholds

Insights are automatically filtered based on these thresholds:

```
MIN_QUALITY_SCORE:      60  → Below this = rejected
MIN_SPECIFICITY_SCORE:  50  → Below this = rejected
MIN_SAFETY_SCORE:       80  → Below this = rejected
HUMAN_REVIEW_THRESHOLD: 75  → Below this = needs human approval
```

### Scoring Flow

```
YouTube Interview Video
       ↓
AI Extracts Insight
       ↓
Score on 5 Dimensions
       ↓
   ┌──────────────────────────────────────┐
   │ safetyScore < 80?        → REJECT    │
   │ qualityScore < 60?       → REJECT    │
   │ specificityScore < 50?   → REJECT    │
   │ qualityScore < 75?       → HUMAN REVIEW │
   │ All thresholds pass?     → AUTO-APPROVE │
   └──────────────────────────────────────┘
```

### Example Scores

**High-scoring insight:**
```json
{
  "insight": "Users with ADHD respond better to body-based grounding than mental focus exercises because physical sensation anchors attention more effectively",
  "qualityScore": 85,
  "specificityScore": 90,
  "actionabilityScore": 88,
  "safetyScore": 95,
  "noveltyScore": 72
}
```

**Low-scoring insight (would be rejected):**
```json
{
  "insight": "People like feeling understood",
  "qualityScore": 35,
  "specificityScore": 20,
  "actionabilityScore": 30,
  "safetyScore": 100,
  "noveltyScore": 10
}
```

The second insight is too generic and obvious—it doesn't give the coach actionable guidance.

---

## Synthetic Data Generator

Since we can't get real user data until the prototype is ready, we can generate **synthetic training data** using Claude itself. This creates diverse, realistic coaching conversations without actual users.

### What Is Synthetic Data?

Synthetic data = AI-generated training examples that simulate real human interactions.

Instead of waiting for real users, we have Claude roleplay as diverse users with different:
- Cognitive styles (visual, verbal, systems thinkers)
- Neurological differences (ADHD, aphantasia, HSP)
- Emotional states (anxious, depressed, burnt out, stuck)
- Communication preferences (direct, exploratory, validating)
- Life situations (career crisis, relationship issues, grief)

### Why This Works

1. **Diversity control**: We explicitly generate edge cases real users might not show early on
2. **No privacy concerns**: It's synthetic, so no real user data needed
3. **Volume**: Can generate hundreds of examples quickly
4. **Quality control**: We define what "good" coaching looks like

### Generation Process

```
Define User Persona
      ↓
Claude plays User + Coach
      ↓
Generate 5-10 turn conversation
      ↓
Score the coaching response quality
      ↓
Keep high-quality examples
      ↓
Use for fine-tuning
```

### Example Persona Prompt

```
You are simulating a user named Alex who has:
- ADHD (diagnosed 2 years ago)
- Works as a software engineer
- Currently overwhelmed by a job transition
- Communication style: Direct, gets impatient with small talk
- Needs: Actionable steps, variety in suggestions, validation that ADHD isn't a character flaw

Generate a realistic coaching conversation where Alex seeks help managing overwhelm during their job transition.
```

### Key Principles for Synthetic Generation

1. **Ground in real patterns**: Use insights from actual interviews to inform personas
2. **Include edge cases**: Generate scenarios the coach might struggle with
3. **Vary difficulty**: Some easy wins, some complex multi-session arcs
4. **Include failures**: Generate examples where coaching goes wrong to train on
5. **Diversity in demographics**: Age, culture, socioeconomic background, neurology

### Current Implementation

The Interview Processor can generate synthetic data by:

1. Taking existing approved insights
2. Creating realistic personas that would have those insights
3. Generating coaching conversations that demonstrate how to apply insights
4. Scoring and filtering the results

This creates a feedback loop: real insights → synthetic examples → better coaching → better insights.

---

## Communication Style Analysis

The Interview Processor doesn't just extract **what** people say - it captures **how** they communicate. This is critical for training a coach that can adapt to different personalities and communication styles.

### Why This Matters

Generic AI responses feel robotic because they ignore communication style. A coach that understands:
- "This person speaks in rapid, terse sentences" → Match their pace
- "This person is exploratory and verbose" → Give them space to process
- "This person uses dry humor" → It's safe to be lightly witty

### What We Extract

**1. Communication Style**

| Dimension | Options | What It Means |
|-----------|---------|---------------|
| `cadence` | rapid, measured, slow, variable | Speech rhythm/pacing |
| `verbosity` | terse, concise, moderate, verbose | How much they say |
| `directness` | very_direct, direct, exploratory, indirect | How they approach topics |
| `formality` | casual, conversational, professional, formal | Register |
| `emotionalExpression` | reserved, moderate, expressive, highly_expressive | How they show feeling |

**2. Personality Markers**

| Trait | Options | What It Reveals |
|-------|---------|-----------------|
| `thinkingStyle` | analytical, intuitive, practical, creative | How they process information |
| `socialEnergy` | introverted, ambivert, extroverted | Energy in interaction |
| `decisionMaking` | deliberate, balanced, spontaneous | How they choose |
| `conflictStyle` | avoidant, accommodating, direct, collaborative | How they handle tension |
| `humorStyle` | dry, self_deprecating, playful, observational, dark, none | Type of humor |

**3. Speech Patterns**

| Pattern | Example | Why It Matters |
|---------|---------|----------------|
| `fillerWords` | "um", "like", "you know" | Natural conversation markers |
| `catchPhrases` | "The thing is...", "Here's the deal" | Personal linguistic fingerprints |
| `sentenceStructure` | simple, compound, complex, varied | How they build thoughts |
| `questioningStyle` | rhetorical, genuine, leading, rare | How they engage |
| `storytellingStyle` | linear, tangential, dramatic, minimal | How they share experiences |

### Example Extraction

```json
{
  "insight": "When someone repeatedly trails off mid-sentence, they may be processing in real-time rather than having pre-formed thoughts",

  "communicationStyle": {
    "cadence": "variable",
    "verbosity": "moderate",
    "directness": "exploratory",
    "formality": "casual",
    "emotionalExpression": "expressive"
  },

  "personalityMarkers": {
    "thinkingStyle": "intuitive",
    "socialEnergy": "ambivert",
    "decisionMaking": "deliberate",
    "conflictStyle": "accommodating",
    "humorStyle": "self_deprecating"
  },

  "speechPatterns": {
    "fillerWords": ["like", "I mean", "sort of"],
    "catchPhrases": ["The thing is...", "I don't know if this makes sense but"],
    "sentenceStructure": "complex",
    "questioningStyle": "genuine",
    "storytellingStyle": "tangential"
  },

  "coachingImplication": "Give this person space to think out loud. Don't rush to fill silences. Reflect back what you hear to help them land on their point."
}
```

### Using This Data

The coach can use communication style data to:

1. **Match pacing** - Respond tersely to terse people, elaborate with verbose people
2. **Adjust formality** - Use casual language with casual communicators
3. **Honor processing style** - Let exploratory thinkers meander
4. **Mirror humor** - Use dry wit with dry humor people, warmth with earnest people
5. **Recognize personality** - Analytical people want reasons, intuitive people want resonance

---

## Audio Analysis for Aliveness

**Critical Limitation**: Text transcripts alone cannot capture aliveness qualities like cadence, rhythm, and pauses. The interview processor has audio analysis capabilities for extracting these features.

### What Audio Analysis Captures

| Feature | What It Measures | Why It Matters |
|---------|------------------|----------------|
| `speechRate` | Words per minute | Tempo baseline |
| `speechRateVariability` | How much rate changes | Imperfect rhythm marker |
| `pauseFrequency` | Pauses per minute | Natural latency |
| `pauseDuration` | How long pauses last | Thinking vs breathing |
| `volumeVariability` | Dynamic range | Amplitude restraint |
| `pitchContour` | Rising/falling/varied | Emotional expression |

### Aliveness Scores from Audio

The system calculates four aliveness scores from audio:

```
Imperfect Rhythm (0-100)
└── Derived from speech rate variability
    High variation = more alive, metronomic = robotic

Natural Latency (0-100)
└── Presence of thinking pauses (>2 seconds)
    Pauses indicate real processing, not script reading

Amplitude Restraint (0-100)
└── Lower average volume with dynamics
    Constant high volume = dramatic, restrained = human

Flow Quality (0-100)
└── Natural rhythm pattern
    Flowing > Variable > Steady > Staccato
```

### Current Status

**Audio analysis requires backend processing** (not yet implemented):

- Option 1: Backend service with Python/librosa
- Option 2: Integration with AssemblyAI or similar
- Option 3: Native module for on-device processing

Until implemented, aliveness qualities are **inferred from transcript** (less accurate):
- Filler words suggest natural rhythm
- Sentence fragments suggest variable pacing
- "..." or pauses in transcript hint at latency

### Workaround: Manual Observation

When reviewing interviews, manually note:
- Does the speaker pause to think?
- Is their pace variable or constant?
- Do they speak quietly or dramatically?
- Is there natural flow or choppy delivery?

Add these observations as custom aliveness markers in the insight.

---

### Limitations

- **Not a replacement**: Synthetic data supplements, doesn't replace real user data
- **Model bias**: Claude's synthetic users will have Claude's biases
- **Validation needed**: Real user testing still required before production
- **Quality variance**: Some generated conversations will be unrealistic

### Future Vision

```
Phase 1: Manual insight import (current)
Phase 2: YouTube harvesting + synthetic generation
Phase 3: Real user data collection (with consent)
Phase 4: Hybrid training (real + synthetic)
Phase 5: Self-improving loop
```

---

## Frequently Asked Questions

### "Do I need to install Llama to start training?"

**No.** The current training workflow does NOT require Llama to be installed.

Here's how the system works:

1. **Interview Processor** uses **Claude API** (cloud-based) to extract insights from YouTube videos
2. **Training Admin** stores insights locally on your device
3. **Version Control** manages training data versions

**Llama is only needed for the FUTURE phase** when you want to run a local AI model on-device. That phase is not yet implemented.

**Current workflow:**
```
YouTube Videos → Claude API extracts insights → Stored locally → Used in prompts
```

**Future workflow (not implemented yet):**
```
Stored insights → Export to JSON → Fine-tune Llama with LoRA → Run local model
```

### "Where is the Version Control UI?"

Go to: **Settings → Developer Tools → Version Control**

If you don't see it, make sure you've pulled the latest code and rebuilt the app:
```bash
git pull origin <your-branch>
npx expo start --clear
```

### "What is the Seeds tab?"

The **Seeds tab** is where users see pattern insights discovered from their data. Insights are presented as "seeds" that grow over time:

| Stage | Icon | Meaning |
|-------|------|---------|
| Sprouting | 🌰 | Just noticed, needs more data |
| Growing | 🌱 | Pattern becoming clearer |
| Flourishing | 🌿 | Strong, consistent pattern |
| Rooted | 🌳 | Core understanding |

**Where**: Main tab bar (between Skills and Insights)

### "How does the app discover insights?"

The app analyzes multiple data sources to find patterns:

1. **Twigs/Quick Logs** - Mood entries and notes
2. **Coach Conversations** - Topics and themes discussed
3. **Calendar Events** - Schedule patterns (with permission)
4. **Contacts** - Social interaction patterns (with permission)
5. **Location** - Movement patterns (with permission)
6. **Screen Time** - Digital habits (with permission)
7. **Health Data** - Sleep, steps, heart rate (with permission)
8. **Weather** - Environmental correlations

All analysis runs locally by default (no API needed).

### "What's the difference between Seeds and Insights tabs?"

| Seeds Tab | Insights Tab |
|-----------|--------------|
| Nature-based UI with growth metaphor | Charts and data visualizations |
| Pattern discoveries about YOU | Statistics and trends |
| Reactions (🌱 🤔 🍂) to mark relevance | Graphs of mood over time |
| Coach can reference these naturally | Reference data for self-analysis |

Both help users understand themselves - Seeds focuses on discoveries, Insights focuses on data.

### "How do I add training insights vs. user insights?"

**Training Insights** (for AI learning):
- Added via Training Admin
- Shape how the AI responds to ALL users
- Example: "Users with anxiety prefer body-based techniques"

**User Insights** (Seeds):
- Discovered automatically from user data
- Personal patterns for ONE user
- Example: "You sleep better after evening walks"

They're separate systems with different purposes.

---

## Troubleshooting

### "Buttons don't work"
- Make sure all required fields are filled (Title, Insight, Coaching Implication)
- Check that JSON is valid (no trailing commas, proper quotes)

### "Import failed"
- Validate your JSON at jsonlint.com
- Check that `category` matches one of the valid categories exactly
- Check that `confidenceLevel` is one of: observed, inferred, validated, research_backed

### "Can't see Training Admin"
- Go to Settings → Developer Tools → Training Admin
- If missing, pull latest code and restart app

---

## Quick Copy Templates

### Single Insight (minimal)
```json
{
  "source": "Interview Notes",
  "insights": [
    {
      "category": "emotional_needs",
      "title": "YOUR TITLE HERE",
      "insight": "WHAT YOU LEARNED",
      "coachingImplication": "HOW AI SHOULD BEHAVE",
      "confidenceLevel": "observed"
    }
  ]
}
```

### Multiple Insights (batch)
```json
{
  "source": "Research Round 1",
  "insights": [
    {
      "category": "cognitive_patterns",
      "title": "Insight 1 title",
      "insight": "What you learned",
      "coachingImplication": "How AI should behave",
      "confidenceLevel": "observed"
    },
    {
      "category": "emotional_needs",
      "title": "Insight 2 title",
      "insight": "What you learned",
      "coachingImplication": "How AI should behave",
      "confidenceLevel": "observed"
    }
  ]
}
```

---

## Summary

1. **Single Import**: Fill form, click button - for one insight at a time
2. **Batch Import**: Paste JSON - for multiple insights at once
3. **Approve**: Review pending insights in Insights tab
4. **Export**: Get all data as JSON for training

The goal is to capture what you learn from real users so the AI can serve people better.

---

# Full Setup Guide: Training Studio

This section covers everything you need to install and run the Training Studio from scratch.

---

## Prerequisites

Before starting, you need these installed on your computer:

### Required Software

| Software | Version | How to Install | Check If Installed |
|----------|---------|----------------|-------------------|
| **Python** | 3.10+ | [python.org](https://python.org) or `brew install python` | `python3 --version` |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) or `brew install node` | `node --version` |
| **yt-dlp** | Latest | `pip install yt-dlp` or `brew install yt-dlp` | `yt-dlp --version` |
| **FFmpeg** | Latest | `brew install ffmpeg` (Mac) or [ffmpeg.org](https://ffmpeg.org) | `ffmpeg -version` |

### Optional (for advanced features)

| Software | For | Install |
|----------|-----|---------|
| **Whisper** | Local transcription | `pip install openai-whisper` |
| **CUDA** | GPU acceleration | [nvidia.com](https://developer.nvidia.com/cuda-downloads) |

---

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/undothis/Mood-Leaf.git
cd Mood-Leaf/training-studio
```

### 2. Set Up the Backend

```bash
# Navigate to backend folder
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # Mac/Linux
# OR on Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Set Up the Frontend

```bash
# Navigate to frontend folder (from training-studio root)
cd frontend

# Install Node dependencies
npm install
```

### 4. Configure Environment

Create a `.env` file in the `backend` folder:

```bash
cd backend
touch .env
```

Add these lines to `.env`:

```env
# Required: Your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Change default ports
PORT=8000
FRONTEND_PORT=3000

# Optional: Whisper model size (tiny, base, small, medium, large)
WHISPER_MODEL=base

# Optional: Enable debug logging
DEBUG=false
```

**Getting an Anthropic API Key:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-` or `sk-`)

---

## Starting Training Studio

### Option A: Using the Start Script (Recommended)

From the `training-studio` folder:

```bash
./start.sh
```

This starts both backend and frontend automatically.

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd training-studio/backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd training-studio/frontend
npm run dev
```

### Option C: Using Docker (Coming Soon)

```bash
docker-compose up
```

---

## Accessing Training Studio

Once started, open your browser to:

| Service | URL |
|---------|-----|
| **Frontend (UI)** | [http://localhost:3000](http://localhost:3000) |
| **Backend (API)** | [http://localhost:8000](http://localhost:8000) |
| **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## First-Time Setup Walkthrough

### 1. Set Your API Key

If you didn't set it in `.env`:

1. Open Training Studio (http://localhost:3000)
2. Go to **Settings** (gear icon)
3. Enter your Anthropic API key
4. Click **Save**

### 2. Add Your First Channel

1. Go to **Channels** page
2. Browse the **Recommended Channels** section
3. Click **+ Add** on channels relevant to your training goals
4. Or add a custom channel by entering a YouTube URL

### 3. Process Your First Video

1. Go to **Videos** page
2. Click **Add Video**
3. Paste a YouTube URL
4. Click **Process**
5. Wait for transcription and insight extraction

### 4. Review Insights

1. Go to **Insights** page
2. Review extracted insights
3. **Approve** good ones, **Reject** bad ones
4. Only approved insights are used for training

### 5. Export Training Data

1. Go to **Export** page
2. Choose format:
   - **Aliveness** (recommended) - Full texture markers
   - **ChatML** - For Llama 3+ fine-tuning
   - **Alpaca** - Simple instruction format
3. Click **Download**

---

## Troubleshooting Setup

### "Command not found: python3"

Install Python:
- Mac: `brew install python`
- Windows: Download from [python.org](https://python.org)
- Linux: `sudo apt install python3`

### "pip: command not found"

Python might not be in your PATH:
```bash
python3 -m pip install -r requirements.txt
```

### "yt-dlp: command not found"

Install yt-dlp:
```bash
pip install yt-dlp
# OR
brew install yt-dlp  # Mac
```

### "Backend crashed with NameError"

Make sure you have all dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### "API key not saving"

1. Check your key starts with `sk-ant-` or `sk-`
2. Check the backend terminal for errors
3. Try setting it in `.env` instead:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

### "Port already in use"

Another process is using port 8000 or 3000:
```bash
# Find what's using the port
lsof -i :8000

# Kill it
kill -9 <PID>

# Or change the port in .env
PORT=8001
```

### "Database errors"

Reset the database:
```bash
cd backend
rm -f training_studio.db
python main.py  # Will recreate
```

---

# Aliveness Extraction System

The Aliveness Extraction system captures the **texture** of human conversation - not just WHAT people say, but HOW they say it. This is what makes AI feel genuinely human.

---

## Why Aliveness Matters

Current AI fails because it:
- Resolves contradictions humans hold
- Fills silences that carry meaning
- Validates when challenge would help
- Treats emotions as categories, not flowing experiences

The Aliveness system captures:
- **Hedging before vulnerability** ("I know this is dumb but...")
- **Contradictions held without resolution** ("I love them AND they drive me crazy")
- **Body language in speech** ("pit in my stomach")
- **Topic circling before going direct**
- **Permission-seeking and self-doubt**
- **Repair attempts after rupture**

---

## The Six Tiers of Extraction

### Tier 1: Emotional Texture

| Category | What It Captures |
|----------|------------------|
| `emotional_granularity` | Specificity of emotion words (low → very high) |
| `mixed_feelings` | Contradictory emotions held simultaneously |
| `somatic_markers` | Body-based language ("weight on shoulders") |
| `emotional_evolution` | How emotions shift during conversation |

### Tier 2: Cognitive Patterns

| Category | What It Captures |
|----------|------------------|
| `temporal_orientation` | Past-negative, past-positive, future-anxious, etc. |
| `contradiction_holding` | Ability to hold unresolved tensions |
| `narrative_identity` | Problem-saturated vs agency narratives |
| `cognitive_patterns` | Distortions without pathologizing them |

### Tier 3: Self-Protective Language

| Category | What It Captures |
|----------|------------------|
| `micro_confession` | "I know this sounds dumb but..." |
| `hedging_shields` | "sort of", "kind of", "just" |
| `permission_seeking` | "Is it okay if I feel...?" |
| `topic_circling` | Approaching then retreating from topics |
| `retreat_signals` | "Nevermind, it's not important" |

### Tier 4: Relational Signals

| Category | What It Captures |
|----------|------------------|
| `repair_attempts` | "Can I try that again?" |
| `bids_for_witness` | "I just needed someone to know" |
| `attachment_echoes` | Anxious, avoidant, secure patterns |
| `pronoun_patterns` | I/we/you/they usage |

### Tier 5: Authenticity Markers

| Category | What It Captures |
|----------|------------------|
| `guarded_hope` | Careful hope that protects against disappointment |
| `humor_function` | Coping vs deflection |
| `performed_vs_authentic` | Genuine vs validation-seeking vulnerability |
| `unresolved_questions` | Questions carried, not answered |

### Tier 6: The Rare Gold

| Category | What It Captures |
|----------|------------------|
| `self_kindness_moments` | Rare self-compassion breakthroughs |
| `values_in_conflict` | When values clash (loyalty vs honesty) |
| `identity_friction` | Gap between who someone is vs expected |
| `memory_echoes` | Past shaping present reactions |
| `meaning_resistance` | "Don't turn this into a lesson" |
| `integration_moments` | "Oh, that's why I always..." |

---

## How Extraction Works

When you process a video or interview, the system:

1. **Transcribes** the audio (using Whisper)
2. **Analyzes prosody** (pitch, pace, pauses)
3. **Extracts texture markers** (the 6 tiers above)
4. **Generates training pairs** (user message → coach response)
5. **Scores quality** (specificity, actionability, safety)

Each extraction includes:

```json
{
  "title": "Permission-seeking before sharing struggle",
  "raw_quote": "I know this is probably stupid but I've been really struggling with...",
  "category": "permission_seeking",
  "texture_analysis": {
    "emotional_granularity": "medium",
    "self_protective_type": "hedging",
    "temporal_orientation": "present",
    "ambivalence_present": false,
    "somatic_language": [],
    "what_not_said": "Didn't name the specific struggle"
  },
  "coach_response": {
    "what_to_do": "Acknowledge the courage in sharing, not the content of the hedge",
    "what_to_avoid": "Don't correct the self-deprecation ('That's not stupid!')",
    "example_response": "Thank you for trusting me with that. What's been weighing on you?"
  },
  "training_example": {
    "user_message": "I know this is probably stupid but I've been really struggling lately",
    "assistant_response": "It took courage to share that. What's been weighing on you?",
    "system_context": "User is hedging with self-doubt; respond to the courage, not the content"
  }
}
```

---

## Exporting Aliveness Data

Use the **Aliveness export format** for the richest training data:

```bash
# API call
GET /export?format=aliveness&status=approved

# Or use the UI
# Export → Format: Aliveness → Download
```

This format includes:
- System prompts tailored to texture markers
- Coach guidance (what to do, what to avoid)
- Ready-to-use training pairs
- MoodLeaf philosophy embedded

---

## MoodLeaf Coach Philosophy

All extractions align with these principles:

| Principle | What It Means |
|-----------|---------------|
| **Curious, not prescriptive** | Ask questions, don't give answers |
| **Tentative language** | "It seems like...", "I wonder if..." |
| **Goal: become unnecessary** | Help people help themselves |
| **No toxic positivity** | Don't force silver linings |
| **Meet people where they are** | Don't push, don't pull |
| **Respect retreat** | Honor when someone pulls back |

---

## Using Aliveness Data for Training

The exported data is ready for LLM fine-tuning:

### For Llama 3+ (ChatML format)

```python
from datasets import load_dataset

# Load your exported data
data = load_dataset("json", data_files="aliveness_export.json")

# Format for fine-tuning
def format_example(example):
    return {
        "messages": example["messages"],
        "texture": example["aliveness_metadata"]["texture_markers"]
    }
```

### For Unsloth

```python
from unsloth import FastLanguageModel

# Load base model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/llama-3-8b-bnb-4bit",
    max_seq_length=2048,
)

# Load your Aliveness data
# The system prompts include texture-aware guidance
```

### Quality Filtering

Before training, filter for high-quality examples:

```python
# Only use high-quality extractions
filtered = [
    ex for ex in data
    if ex["scores"]["quality"] >= 70
    and ex["scores"]["safety"] >= 80
    and ex["scores"]["specificity"] >= 60
]
```

---

## Best Practices

### For Extraction

1. **Use high-quality source material** - Therapy interviews, authentic conversations
2. **Variety matters** - Different speakers, topics, emotional states
3. **Review extractions** - AI isn't perfect, human review improves quality
4. **Look for rare gold** - Self-kindness moments are precious

### For Training

1. **Balance categories** - Don't over-represent one texture type
2. **Include edge cases** - Permission-seeking, retreat signals, etc.
3. **Preserve Coach_notes** - They contain crucial guidance
4. **Test with humans** - Does it feel more human? Ask real people.

### For the AI

1. **Don't over-engineer** - Sometimes "I hear you" is enough
2. **Respect the texture** - If someone hedges, honor the hedge
3. **Hold contradictions** - "Both of those can be true"
4. **Follow readiness** - Don't push people deeper than they want

---

## Summary

The Aliveness Extraction system transforms raw conversations into training data that captures the full texture of human experience. By extracting not just WHAT people say but HOW they say it, we train AI that feels genuinely human - not a chatbot performing empathy, but a presence that truly understands.
