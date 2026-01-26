# MoodLeaf Training Workflow

A complete guide from data collection to deploying fine-tuned models across the three-tier AI architecture.

---

## Prerequisites

Before starting the training workflow, ensure Training Studio is properly installed.

### Quick Setup (macOS with Homebrew)

```bash
# 1. Install system dependencies
brew install python@3.11 node yt-dlp ffmpeg

# 2. Set up backend (MUST be in backend directory!)
cd training-studio/backend
python3.11 -m venv venv
source venv/bin/activate       # bash/zsh
# source venv/bin/activate.csh # tcsh users

pip install --upgrade pip
pip install -r requirements.txt

# 3. (Optional) Install Full Mode dependencies
pip install openai-whisper librosa praat-parselmouth py-feat mediapipe opencv-python

# 4. Set up frontend
cd ../frontend
npm install

# 5. Start Training Studio
cd ..
./start.sh   # or: source start.csh for tcsh
```

### API Keys Configuration

Configure in the UI (http://localhost:3000 sidebar) or in `backend/.env`:

| Key | Required | Purpose |
|-----|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude insight extraction |
| `HUGGINGFACE_TOKEN` | No | Speaker diarization (pyannote) |

> **Having issues?** See the [Complete Setup Guide](SETUP.md) for detailed troubleshooting.

---

## Overview: The Full Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA COLLECTION                                      │
│  YouTube → yt-dlp → Audio/Video Files → Storage                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROCESSING PIPELINE                                  │
│  Audio → Whisper (transcription) → Text with timestamps                     │
│  Audio → Prosody Analysis → Pitch, pace, pauses, distress markers           │
│  Video → Facial Analysis → Emotions, micro-expressions                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ALIVENESS EXTRACTION                                 │
│  Transcript + Prosody + Facial → Claude API → Texture Markers               │
│  Output: Training pairs with Coach guidance                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HUMAN REVIEW                                         │
│  Review insights → Approve/Reject → Quality filtering                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPORT                                               │
│  Aliveness Format → JSON/JSONL → Ready for fine-tuning                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FINE-TUNING                                          │
│  Unsloth + LoRA → Fine-tune Llama 3 → Quantize → Deploy                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THREE-TIER DEPLOYMENT                                │
│  iOS Native (light) ← → Phone Llama (local) ← → Cloud Llama (powerful)      │
│                         Anonymous Token Handshake                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# Part 1: Data Collection

## What We're Collecting

We harvest training data from sources rich in authentic human emotional expression:

| Source Type | Examples | Why It's Valuable |
|-------------|----------|-------------------|
| Therapy interviews | Licensed therapists on YouTube | Real therapeutic techniques |
| Vulnerability content | Brené Brown, Esther Perel | Authentic emotional expression |
| Grief/recovery content | Grief channels, addiction recovery | Raw human struggle |
| Neurodivergent voices | ADHD, autism creators | Different ways minds work |
| Deep conversations | Podcasts, interview shows | Extended emotional arcs |

## Tools Used

### yt-dlp (YouTube Downloader)

**What it does**: Downloads videos and audio from YouTube

**Why we use it**:
- Open source, actively maintained
- Handles age-restricted content
- Extracts metadata (title, channel, duration)
- Can download just audio (saves space)

**How it works in the pipeline**:
```bash
# Download audio only (for transcription)
yt-dlp -x --audio-format wav "https://youtube.com/watch?v=VIDEO_ID"

# Download video + audio (for facial analysis)
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]" "URL"
```

**In Training Studio**: Happens automatically when you click "Process Video"

---

# Part 2: Processing Pipeline

## Component 1: Whisper (Transcription)

### What It Does

Whisper is OpenAI's speech-to-text model. It converts audio into text with timestamps.

### Why Whisper (Not YouTube Captions)

| Feature | YouTube Captions | Whisper |
|---------|-----------------|---------|
| Accuracy | 70-85% | 95%+ |
| Handles accents | Poor | Excellent |
| Emotional speech | Often fails | Handles well |
| Timestamps | Approximate | Precise |
| Filler words | Removes them | Preserves them |

**Preserving filler words matters** - "um", "like", "you know" are texture data!

### Model Sizes

| Model | Size | Speed | Accuracy | Use When |
|-------|------|-------|----------|----------|
| tiny | 75MB | Very fast | Good | Quick testing |
| base | 150MB | Fast | Better | Development |
| small | 500MB | Medium | Good | Production (no GPU) |
| medium | 1.5GB | Slow | Great | When accuracy matters |
| large-v3 | 3GB | Very slow | Best | Final processing |

**Recommendation**: Use `base` for testing, `large-v3` for final data

### Configuration

In `.env`:
```env
WHISPER_MODEL=base  # or large-v3 for production
```

### Output Format

```json
{
  "text": "Full transcript here...",
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "I've been thinking about...",
      "confidence": 0.95
    }
  ],
  "language": "en",
  "duration": 3600
}
```

---

## Component 2: Prosody Analysis

### What It Does

Analyzes the "music" of speech - HOW someone says something, not just WHAT.

### Why It Matters

When someone says "I'm fine":
- **Flat pitch + slow pace** = probably not fine (depression indicators)
- **Rising pitch + fast pace** = anxious energy
- **Steady pitch + normal pace** = actually fine

The AI coach needs to recognize these patterns.

### Tools Used

| Tool | What It Extracts | Why It Matters |
|------|------------------|----------------|
| **librosa** | Pitch, tempo, energy | Core audio features |
| **parselmouth** (Praat) | Jitter, shimmer, voice quality | Emotional markers |
| **pyannote** | Speaker diarization | Who's speaking when |

### Features Extracted

```json
{
  "pitch": {
    "mean": 180,           // Average pitch in Hz
    "std": 45,             // Variability
    "trajectory": "falling" // rising/falling/stable/variable
  },
  "rhythm": {
    "speech_rate_wpm": 145,     // Words per minute
    "tempo_variability": 0.3    // How much pace changes
  },
  "pauses": {
    "frequency_per_minute": 8,
    "mean_duration": 0.8,
    "pattern": "frequent"       // minimal/normal/frequent/excessive
  },
  "volume": {
    "mean_db": -20,
    "trajectory": "sagging"     // increasing/decreasing/stable
  },
  "voice_quality": {
    "jitter": 0.02,            // Pitch irregularity (stress indicator)
    "shimmer": 0.04,           // Amplitude irregularity
    "tremor": 0.1              // Voice shake (0-1)
  },
  "aliveness_score": 75,       // Overall "human" quality (0-100)
  "distress_markers": {
    "crying_detected": false,
    "voice_breaks": 2,
    "breathing_pattern": "shallow"
  }
}
```

### Aliveness Score

The **aliveness_score** (0-100) measures how "alive" vs "flat" speech sounds:

| Score | Meaning | Training Value |
|-------|---------|----------------|
| 0-30 | Very flat, monotone | Low (scripted/robotic) |
| 30-50 | Somewhat flat | Medium |
| 50-70 | Normal variation | Good |
| 70-85 | Expressive | Excellent |
| 85-100 | Highly expressive | Excellent (but check for performance) |

---

## Component 3: Facial Analysis (Optional)

### What It Does

Analyzes facial expressions in video to detect emotions.

### Why It Matters

People often say one thing while their face shows another:
- "I'm not upset" + **furrowed brow** = actually upset
- "That's fine" + **micro-expression of disgust** = not fine

This incongruence is valuable training data.

### Tools Used

| Tool | What It Does |
|------|--------------|
| **py-feat** | Full facial action coding (FACS) |
| **MediaPipe** | Face mesh, landmarks |

### Features Extracted

```json
{
  "emotions": {
    "dominant": "sad",
    "intensity": 0.7,
    "distribution": {
      "neutral": 0.1,
      "sad": 0.7,
      "angry": 0.1,
      "fearful": 0.1
    }
  },
  "micro_expressions": [
    {
      "timestamp": 45.2,
      "emotion": "contempt",
      "duration_ms": 200,
      "type": "suppressed"
    }
  ],
  "congruence_score": 0.4  // How much face matches words (0=mismatch, 1=match)
}
```

### When to Use Facial Analysis

| Scenario | Use Facial? | Why |
|----------|-------------|-----|
| Podcast (audio only) | No | No video available |
| Interview (face visible) | Yes | Valuable emotion data |
| Presentation | Maybe | Speaker may be performing |
| Therapy session | Yes | Rich incongruence data |

---

# Part 3: Aliveness Extraction

## What Happens

After we have:
- Transcript (from Whisper)
- Prosody features (from audio analysis)
- Facial emotions (from video analysis)

We send everything to **Claude API** for texture extraction.

## The Extraction Prompt

Claude receives:
1. The full transcript
2. Prosody context (pitch, pace, pauses)
3. Facial context (emotions, incongruence)
4. Instructions to extract texture markers

## What Gets Extracted

For each meaningful moment, we extract:

```json
{
  "title": "Permission-seeking before vulnerability",
  "raw_quote": "I know this sounds stupid but...",
  "category": "micro_confession",

  "texture_analysis": {
    "emotional_granularity": "medium",
    "self_protective_type": "hedging",
    "temporal_orientation": "present",
    "ambivalence_present": false,
    "somatic_language": [],
    "what_not_said": "Didn't specify what they're struggling with"
  },

  "coach_response": {
    "what_to_do": "Acknowledge courage, not content of hedge",
    "what_to_avoid": "Don't say 'that's not stupid!'",
    "example_response": "Thank you for trusting me with that."
  },

  "training_example": {
    "user_message": "I know this sounds stupid but I've been struggling",
    "assistant_response": "It took courage to share that. What's weighing on you?",
    "system_context": "User is hedging - honor the protection"
  }
}
```

## The 26 Texture Categories

Organized in 6 tiers (see full list in TRAINING_ADMIN_MANUAL.md):

1. **Emotional Texture** - granularity, mixed feelings, somatic markers
2. **Cognitive Patterns** - temporal orientation, contradiction holding
3. **Self-Protective Language** - micro-confessions, hedging, permission-seeking
4. **Relational Signals** - repair attempts, bids for witness
5. **Authenticity Markers** - guarded hope, humor function
6. **The Rare Gold** - self-kindness, values conflict, integration moments

---

# Part 4: Human Review

## Why Review Matters

AI extraction isn't perfect. Human review ensures:
- No harmful content in training data
- Insights are actually useful
- Coach guidance makes sense
- Quality thresholds are met

## Review Workflow

```
Extracted Insight
       ↓
┌──────────────────┐
│ Quality Score    │
│ >= 75?           │
├──────────────────┤
│ YES → Pending    │
│ NO  → Review     │
└──────────────────┘
       ↓
Human Reviews
       ↓
┌──────────────────┐
│ Approve          │ → Used for training
│ Reject           │ → Discarded
│ Edit & Approve   │ → Corrected, then used
└──────────────────┘
```

## Quality Thresholds

| Score | Threshold | Action |
|-------|-----------|--------|
| Quality | < 60 | Auto-reject |
| Safety | < 80 | Auto-reject |
| Specificity | < 50 | Auto-reject |
| Quality | < 75 | Needs review |
| Quality | >= 85 | Candidate for auto-approve |

## Batch Operations

For efficiency:
- **Batch Approve**: Approve all insights with quality >= 85
- **Batch Reject**: Reject all insights with safety < 80

---

# Part 5: Export

## Export Formats

| Format | Use Case | Compatibility |
|--------|----------|---------------|
| **aliveness** | ★ Recommended | Llama 3+, custom training |
| **chatml** | Standard fine-tuning | OpenAI, Llama 3+ |
| **sharegpt** | Community tools | Unsloth, Axolotl |
| **alpaca** | Simple fine-tuning | Basic instruction tuning |
| **jsonl** | Generic | Any trainer |
| **raw** | Debugging | N/A |

## Aliveness Format (Recommended)

The `aliveness` format is optimized for training AI that feels human:

```json
{
  "format": "aliveness",
  "moodleaf_philosophy": {
    "curious_not_prescriptive": true,
    "tentative_language": true,
    "goal_become_unnecessary": true,
    "no_toxic_positivity": true,
    "respect_retreat": true
  },
  "data": [
    {
      "messages": [
        {
          "role": "system",
          "content": "You are MoodLeaf, a compassionate AI wellness coach.\n\nCORE PRINCIPLES:\n- Be curious, not prescriptive\n- Use tentative language: \"it seems like...\"\n- Your goal is to become unnecessary\n\nTEXTURE AWARENESS:\n- User is hedging - honor the protection"
        },
        {
          "role": "user",
          "content": "I know this sounds dumb but I've been really struggling"
        },
        {
          "role": "assistant",
          "content": "It took courage to share that. What's been weighing on you?"
        }
      ],
      "aliveness_metadata": {
        "source_token": "ch_grief_v_abc123_i_def456",
        "category": "micro_confession",
        "texture_markers": {
          "emotional_granularity": "medium",
          "self_protective_type": "hedging"
        },
        "coach_guidance": {
          "what_to_do": "Acknowledge courage",
          "what_to_avoid": "Don't correct the hedge"
        }
      }
    }
  ]
}
```

## Export API

```bash
# Export approved insights in aliveness format
GET /export?format=aliveness&status=approved

# Export all insights (including pending) in sharegpt format
GET /export?format=sharegpt&status=all

# Export without applying channel weights
GET /export?format=aliveness&apply_weights=false
```

---

# Part 6: Fine-Tuning with Unsloth

## What Is Unsloth?

Unsloth is a library that makes fine-tuning LLMs:
- **2x faster** than standard training
- **70% less memory** usage
- Works on consumer GPUs (even free Colab)

## Why LoRA?

**LoRA (Low-Rank Adaptation)** fine-tunes only a small part of the model:

| Approach | Parameters Trained | VRAM Needed | Quality |
|----------|-------------------|-------------|---------|
| Full fine-tune | All (8B) | 80GB+ | Best |
| LoRA | 1-5% (80-400M) | 8-16GB | Very good |
| QLoRA | 1-5% (quantized) | 4-8GB | Good |

**MoodLeaf uses QLoRA** - great quality, runs on consumer hardware.

## Step-by-Step Fine-Tuning

### 1. Install Unsloth

```bash
pip install unsloth
pip install --upgrade transformers datasets
```

### 2. Load Your Exported Data

```python
from datasets import load_dataset
import json

# Load your aliveness export
with open("aliveness_export.json") as f:
    data = json.load(f)

# Convert to HuggingFace dataset format
def format_for_training(example):
    return {
        "messages": example["messages"]
    }

dataset = [format_for_training(ex) for ex in data["data"]]
```

### 3. Load Base Model

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/llama-3-8b-bnb-4bit",  # or 70b for cloud
    max_seq_length=2048,
    dtype=None,  # Auto-detect
    load_in_4bit=True,  # QLoRA
)
```

### 4. Configure LoRA

```python
model = FastLanguageModel.get_peft_model(
    model,
    r=16,                    # LoRA rank (higher = more capacity)
    target_modules=[         # Which layers to fine-tune
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing=True,
)
```

### 5. Train

```python
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="messages",
    max_seq_length=2048,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        max_steps=100,  # Adjust based on dataset size
        learning_rate=2e-4,
        fp16=True,
        logging_steps=1,
        output_dir="moodleaf_outputs",
    ),
)

trainer.train()
```

### 6. Save & Export

```python
# Save LoRA adapter
model.save_pretrained("moodleaf_lora")

# Merge with base model (for deployment)
model.save_pretrained_merged(
    "moodleaf_merged",
    tokenizer,
    save_method="merged_16bit",
)

# Quantize for mobile (GGUF format)
# Use llama.cpp for this step
```

---

# Part 7: Three-Tier AI Architecture

## The Vision

MoodLeaf uses three AI tiers to balance privacy, capability, and responsiveness:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S DEVICE                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Tier 1: iOS Native (Core ML)                                │    │
│  │  - Always available                                          │    │
│  │  - Instant response                                          │    │
│  │  - Basic emotional recognition                               │    │
│  │  - Quick check-ins, journaling prompts                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              ↓ escalate                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Tier 2: Local Llama (llama.cpp)                             │    │
│  │  - Runs on device                                            │    │
│  │  - 3-7B parameter model                                      │    │
│  │  - Full conversation capability                              │    │
│  │  - Handles most coaching sessions                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              ↓ escalate (anonymous)                  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                     [Anonymous Token Handshake]
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUD (Anonymous)                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Tier 3: Cloud Llama (70B)                                   │    │
│  │  - Most capable model                                        │    │
│  │  - Complex therapeutic scenarios                             │    │
│  │  - Crisis support                                            │    │
│  │  - NO personal data stored                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Tier 1: iOS Native (Core ML)

### What It Is
A small, fast model optimized for Apple's Core ML framework.

### Capabilities
- Basic emotional recognition
- Quick journaling prompts
- Mood check-ins
- Simple reflections
- Always works (no network needed)

### Limitations
- Limited depth
- Can't handle complex emotions
- No extended conversations

### When It's Used
- Quick daily check-ins
- Simple journaling prompts
- Initial mood assessment
- Network unavailable

### Model Size
- ~500MB - 1GB
- Quantized for mobile
- Core ML optimized

---

## Tier 2: Local Llama (On-Device)

### What It Is
A 3-7B parameter Llama model running locally via llama.cpp.

### Capabilities
- Full conversational coaching
- Texture-aware responses
- Extended emotional processing
- Multi-turn conversations
- All Aliveness training applied

### Limitations
- Uses battery/CPU
- Slower than cloud
- Can't handle crisis scenarios
- Limited context window

### When It's Used
- Standard coaching sessions
- Emotional processing
- Journaling companions
- Privacy-sensitive conversations

### Model Size
- 3B: ~2GB (faster, basic)
- 7B: ~4GB (slower, better quality)
- Q4 quantized for mobile

### Technical Implementation

```swift
// iOS using llama.cpp
let model = LlamaModel(path: "moodleaf-7b-q4.gguf")

let response = model.generate(
    prompt: formatMoodLeafPrompt(userMessage),
    maxTokens: 512,
    temperature: 0.7
)
```

---

## Tier 3: Cloud Llama (Anonymous)

### What It Is
A large (70B) Llama model running on cloud infrastructure.

### Capabilities
- Most sophisticated responses
- Complex emotional scenarios
- Crisis support
- Nuanced therapeutic techniques
- Longest context window

### When It's Used
- Complex emotional situations
- Crisis support
- When local models escalate
- User explicitly requests

### Privacy Architecture

**The cloud tier is COMPLETELY ANONYMOUS:**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Device    │     │   Gateway    │     │  Cloud LLM   │
│              │     │              │     │              │
│  User data   │ ──► │  Strip PII   │ ──► │  Anonymous   │
│  stays here  │     │  Token only  │     │  request     │
│              │ ◄── │  Response    │ ◄── │  Response    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Anonymous Token Handshake

1. **Device generates session token** (random, no user ID)
2. **Token sent to gateway** (no personal data attached)
3. **Gateway strips any remaining PII**
4. **Cloud receives only**: token + conversation context
5. **Cloud processes and responds**
6. **Response returns via token** (no user identification)
7. **Cloud deletes context after response** (no storage)

### What The Cloud NEVER Sees

- User's name
- User's device ID
- User's location
- User's email
- Previous conversations
- Any identifying information

### What The Cloud ONLY Sees

```json
{
  "token": "randomized-session-abc123",
  "context": [
    {"role": "system", "content": "You are MoodLeaf..."},
    {"role": "user", "content": "I've been feeling overwhelmed lately"}
  ],
  "request_type": "coaching"
}
```

### Token Rotation

- Tokens expire after session
- New token generated for each session
- No way to link sessions together
- No user tracking possible

---

## Model Selection Logic

```python
def select_tier(user_request, device_state, conversation_context):

    # Tier 1: Quick, simple requests
    if is_quick_checkin(user_request):
        return Tier.IOS_NATIVE

    # Tier 1: No network available
    if not network_available():
        return Tier.IOS_NATIVE

    # Tier 3: Crisis detected
    if is_crisis(user_request, conversation_context):
        return Tier.CLOUD_LLAMA

    # Tier 3: High complexity
    if complexity_score(conversation_context) > 0.8:
        return Tier.CLOUD_LLAMA

    # Tier 3: User preference
    if user_prefers_cloud():
        return Tier.CLOUD_LLAMA

    # Tier 2: Default for most conversations
    return Tier.LOCAL_LLAMA
```

---

## Model Training Per Tier

### Tier 1 (iOS Native)
- **Base**: Distilled from larger model
- **Focus**: Quick responses, mood detection
- **Training data**: Simplified Aliveness extractions
- **Size**: Quantized for Core ML

### Tier 2 (Local Llama)
- **Base**: Llama 3 8B (or 3B for older devices)
- **Focus**: Full coaching capability
- **Training data**: Full Aliveness format
- **Fine-tuning**: QLoRA with Unsloth

### Tier 3 (Cloud Llama)
- **Base**: Llama 3 70B
- **Focus**: Complex scenarios, crisis support
- **Training data**: Extended Aliveness + specialized datasets
- **Fine-tuning**: Full LoRA (more resources available)

---

## Deployment Pipeline

```
Training Studio
       ↓
Export Aliveness Data
       ↓
┌──────┴──────┬──────────────┐
↓             ↓              ↓
Tier 1        Tier 2         Tier 3
Fine-tune     Fine-tune      Fine-tune
Small Model   7B Model       70B Model
       ↓             ↓              ↓
Quantize      Quantize       Deploy to
for Core ML   for llama.cpp  Cloud Infra
       ↓             ↓              ↓
Bundle in     Download to    API Endpoint
iOS App       Device         (Anonymous)
```

---

# Quick Reference

## Full Pipeline Commands

```bash
# 1. Start Training Studio
cd training-studio
./start.sh

# 2. Open UI
open http://localhost:3000

# 3. Add channels, process videos
# (Use the UI)

# 4. Review and approve insights
# (Use the UI - Insights page)

# 5. Export training data
curl "http://localhost:8000/export?format=aliveness&status=approved" > training_data.json

# 6. Fine-tune (in Colab or local GPU)
# See Unsloth section above

# 7. Quantize for deployment
python -m llama_cpp.convert --outfile moodleaf.gguf moodleaf_merged/

# 8. Deploy to device
# Copy .gguf file to iOS app bundle
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | API endpoints |
| `backend/insights.py` | Aliveness extraction |
| `backend/config.py` | Categories, channels |
| `backend/youtube.py` | Video download |
| `backend/transcription.py` | Whisper integration |
| `backend/prosody.py` | Audio analysis |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Whisper slow | Use smaller model or GPU |
| Export empty | Check insights are approved |
| Training fails | Reduce batch size |
| Model too large | Use more aggressive quantization |

---

## Summary

The MoodLeaf training workflow:

1. **Collect** rich emotional content from YouTube
2. **Process** with Whisper, prosody, and facial analysis
3. **Extract** texture markers with Claude
4. **Review** for quality and safety
5. **Export** in Aliveness format
6. **Fine-tune** with Unsloth + LoRA
7. **Deploy** across three tiers: iOS native, local Llama, anonymous cloud

The result: An AI coach that feels genuinely human, respects privacy, and works everywhere.
