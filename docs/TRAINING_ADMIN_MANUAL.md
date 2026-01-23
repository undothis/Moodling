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

## Related Admin Tools

Besides Training Admin, there are other admin tools in **Settings → Developer Tools**:

| Tool | Path | Purpose |
|------|------|---------|
| **Interview Processor** | `Developer Tools → Interview Processor` | Harvest insights from YouTube therapy/coaching channels automatically |
| **Version Control** | `Developer Tools → Version Control` | Manage model versions, rollback if needed, configure deployment gates |
| **Simulator Mode** | `Developer Tools → Simulator Mode` | Test AI adaptation with different user profiles |

### Version Control Quick Reference

The Version Control admin lets you:
- View all model versions with quality scores
- Rollback to a previous version if quality drops
- Configure deployment gates (human approval, quality thresholds)
- View rollback history with reasons

**When to use:** After adding lots of training data, if the AI starts giving worse responses, use Version Control to rollback to a known-good version.

---

## Summary

1. **Single Import**: Fill form, click button - for one insight at a time
2. **Batch Import**: Paste JSON - for multiple insights at once
3. **Approve**: Review pending insights in Insights tab
4. **Export**: Get all data as JSON for training
5. **Version Control**: Rollback if quality drops (separate admin screen)

The goal is to capture what you learn from real users so the AI can serve people better.
