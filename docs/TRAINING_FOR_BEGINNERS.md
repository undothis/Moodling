# MoodLeaf AI Training - Plain English Guide

A simple explanation of how MoodLeaf trains its AI, and how to fix problems.

---

## How Does AI Training Work? (Simple Version)

Think of AI training like teaching a person to be a good therapist:

### The Basics

```
                    YOUR TRAINING DATA
                           ↓
    ┌─────────────────────────────────────────┐
    │                                         │
    │   BASE MODEL (Llama 3.2)               │
    │   "A smart person who knows nothing    │
    │    about being a supportive coach"     │
    │                                         │
    └─────────────────────────────────────────┘
                           ↓
                    FINE-TUNING (LoRA)
                           ↓
    ┌─────────────────────────────────────────┐
    │                                         │
    │   YOUR TRAINED MODEL                    │
    │   "A smart person who knows how to     │
    │    be warm, honest, and supportive"    │
    │                                         │
    └─────────────────────────────────────────┘
```

### Plain English Explanation

1. **Base Model (Llama)**: This is like hiring a very smart person who knows about everything (history, science, language) but doesn't know YOUR specific job (being an emotionally supportive coach).

2. **Training Data**: The insights you collect from YouTube videos and manual entry. This is like giving that smart person a training manual on "how to be a good MoodLeaf coach."

3. **Fine-Tuning (LoRA)**: The process of teaching the model using your data. It's like that person reading your training manual and learning from it.

4. **Trained Model**: The result - an AI that knows both general knowledge AND your specific coaching style.

---

## What is LoRA? (Even Simpler)

**LoRA** = Low-Rank Adaptation

Imagine you have a huge textbook (the base model - 7 billion parameters). Instead of rewriting the entire textbook (expensive, slow), LoRA adds small "sticky notes" that adjust how the textbook is read.

```
Without LoRA:
  Need to rewrite entire textbook = expensive, slow

With LoRA:
  Add sticky notes to adjust = cheap, fast
```

**Key Point**: LoRA creates small "adapter weights" (about 1-5% the size of the full model) that modify behavior without changing the entire model.

---

## The Training Pipeline (What Actually Happens)

```
Step 1: COLLECT DATA
├── YouTube channel processing
├── Manual insight entry
└── Quality review (approve/reject)

Step 2: QUALITY CHECK
├── Remove duplicates
├── Check for harmful content
├── Balance categories
└── Validate sources

Step 3: EXPORT FOR TRAINING
├── Format as question/answer pairs
├── Create training examples
└── Export in Alpaca format

Step 4: TRAIN (LoRA Fine-Tuning)
├── Load base Llama model
├── Apply training examples
├── Create LoRA adapter weights
└── Save new model version

Step 5: TEST & DEPLOY
├── Compare to previous version
├── Run safety checks
├── If better → deploy
└── If worse → rollback
```

---

## When Things Go Wrong (Glitches)

### Types of "Glitches"

| Symptom | What It Means | Likely Cause |
|---------|---------------|--------------|
| AI gives harmful advice | Bad training data | Remove the bad insight, retrain |
| AI sounds generic | Not enough training data | Add more quality insights |
| AI is too preachy | Training data is too prescriptive | Add more neutral/balanced insights |
| AI contradicts itself | Conflicting insights | Run contradiction detection, resolve |
| AI is biased | Biased training data | Run bias detection, fix imbalances |
| AI doesn't remember personality | LoRA not applied correctly | Check model config |

### How to Fix Glitches

#### Option 1: Remove Bad Data (No Retraining)

If the glitch is caused by a specific bad insight:

1. Go to **Interview Processor** > **Review**
2. Find the problematic insight
3. **Reject** it (moves to rejected, not used in training)
4. The CURRENT model still has it, but NEXT training won't

**When to use**: Isolated bad insights, minor issues

#### Option 2: Rollback to Previous Version

If a new training made things worse:

1. Go to **Developer Tools** > **Model Versions**
2. Find the last known good version
3. Click **Rollback**

```
What this does:
  Current (bad) → Marked as "rolled_back"
  Previous (good) → Marked as "deployed"
```

**When to use**: New training clearly worse than before

#### Option 3: Retrain with Fixed Data

If you need to fix the current model:

1. Remove/fix the problematic training data
2. Export clean training data
3. Run training again
4. This creates a NEW model version

**When to use**: Multiple issues, want fresh start with clean data

---

## Do I Need to "Split Weights"?

**Short answer**: No, you don't manually split weights.

**Explanation**:

When people say "weights," they mean the numbers that make up the AI's knowledge. These are automatically managed by:

- **Base Model Weights**: The Llama model (you download this, don't modify it)
- **LoRA Adapter Weights**: Your customizations (created automatically during training)

```
                                  YOU DON'T TOUCH THESE
                                          ↓
┌─────────────────────────────────────────────────────────┐
│  BASE WEIGHTS (Llama 3.2)                               │
│  7 billion parameters                                   │
│  Downloaded from Meta/HuggingFace                       │
└─────────────────────────────────────────────────────────┘
                                          +
┌─────────────────────────────────────────────────────────┐
│  LoRA ADAPTER WEIGHTS (YOUR CUSTOMIZATION)              │
│  ~50-100 million parameters                             │  ← TRAINING CREATES THESE
│  Created by your training process                       │
└─────────────────────────────────────────────────────────┘
                                          =
┌─────────────────────────────────────────────────────────┐
│  YOUR FINAL MODEL                                       │
│  Base + LoRA combined at inference time                 │
└─────────────────────────────────────────────────────────┘
```

**What you DO control**:
- What training data goes in
- Quality of training data
- When to train
- When to rollback

**What happens automatically**:
- Weight adjustments
- Gradient calculations
- Optimization
- LoRA rank selection

---

## The Quality Control Process

### Before Training

Run these checks on your training data:

| Check | What It Does | Tool |
|-------|--------------|------|
| Semantic Deduplication | Removes near-duplicate insights | `trainingQualityService.ts` |
| Bias Detection | Finds gender/cultural/age biases | `advancedResearchService.ts` |
| Contradiction Detection | Finds conflicting advice | `advancedResearchService.ts` |
| Category Balance | Ensures diversity of topics | `trainingQualityService.ts` |
| Evidence Grading | Scores source credibility | `advancedResearchService.ts` |

### After Training

Compare new model to previous:

| Check | Threshold | Action if Failed |
|-------|-----------|------------------|
| Quality Score | Must be ≥70% | Don't deploy |
| Regression | Can't drop >10% | Rollback |
| Safety Tests | Must pass all | Block deployment |

### Automatic Rollback Triggers

The system will automatically rollback if:

- Quality drops more than 15%
- User satisfaction drops below 40%
- Error rate exceeds 5%

---

## Practical Troubleshooting Guide

### "The AI said something harmful"

1. **Immediate**: Note exactly what was said
2. **Find the source**: Search training data for similar phrasing
3. **Remove it**: Reject the problematic insight
4. **Retrain**: Create new model version without it
5. **Verify**: Test the same scenario with new model

### "The AI doesn't sound like MoodLeaf"

1. **Check training data**: Is it balanced across categories?
2. **Check quality scores**: Low diversity score?
3. **Review recent additions**: Did new data change the tone?
4. **Consider rollback**: Go back to a version that sounded right

### "The AI gives contradictory advice"

1. **Run contradiction detection**:
   ```typescript
   import { detectContradictions } from './advancedResearchService';
   const conflicts = await detectContradictions();
   ```
2. **Review each conflict**: Decide which insight is correct
3. **Remove or merge**: Delete one, or combine into balanced insight
4. **Retrain**: With resolved contradictions

### "The AI seems biased"

1. **Run bias detection**:
   ```typescript
   import { detectBias } from './advancedResearchService';
   const biasReports = await detectBias();
   ```
2. **Review flagged insights**: Check each for problematic patterns
3. **Fix or remove**: Edit biased language or remove entirely
4. **Add counter-examples**: If bias is from imbalance, add diverse data
5. **Retrain**: With fixed data

---

## The Training Cycle (Summary)

```
         ┌──────────────────────────────────────────┐
         │                                          │
         ▼                                          │
    ┌─────────┐     ┌─────────┐     ┌─────────┐    │
    │ COLLECT │ ──► │ QUALITY │ ──► │  TRAIN  │    │
    │  DATA   │     │  CHECK  │     │         │    │
    └─────────┘     └─────────┘     └────┬────┘    │
                                         │         │
                                         ▼         │
                                    ┌─────────┐    │
                                    │  TEST   │    │
                                    └────┬────┘    │
                                         │         │
                          ┌──────────────┼──────────────┐
                          │              │              │
                          ▼              ▼              ▼
                    ┌─────────┐    ┌─────────┐    ┌─────────┐
                    │ DEPLOY  │    │ ROLLBACK│    │  FIX    │ ──┘
                    │(if good)│    │(if bad) │    │  DATA   │
                    └─────────┘    └─────────┘    └─────────┘
```

1. **Collect**: Gather insights from videos, manual entry
2. **Quality Check**: Run deduplication, bias detection, etc.
3. **Train**: Create new model version with LoRA
4. **Test**: Compare to previous version
5. **Deploy/Rollback/Fix**: Based on test results

---

## Key Takeaways

1. **You don't touch weights directly** - The training process handles this
2. **Focus on DATA QUALITY** - Garbage in = garbage out
3. **Always test before deploying** - Compare new vs old
4. **Rollback is your friend** - Easy to undo bad training
5. **Small, frequent updates** - Better than big changes
6. **Use the quality tools** - They catch problems early

---

## Quick Reference

| Problem | Solution |
|---------|----------|
| Bad response | Find source insight → reject → retrain |
| Worse after training | Rollback to previous version |
| Too generic | Add more specific, high-quality insights |
| Biased | Run bias detection → fix → retrain |
| Contradictory | Run contradiction detection → resolve → retrain |
| Not enough data | Keep collecting and reviewing |

---

## Need Help?

- **Interview Processor**: `/app/admin/interview-processor.tsx`
- **Quality Tools**: `/services/trainingQualityService.ts`
- **Advanced Research**: `/services/advancedResearchService.ts`
- **Version Control**: `/services/modelVersionControlService.ts`
- **Comprehensive Manual**: `/docs/AI_TRAINING_SYSTEM_MANUAL.md`
