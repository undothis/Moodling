# iOS Migration & Local LLM Checklist

## Overview

This document tracks what can be developed on the web (Mac), what requires iOS, and the path to local LLM independence.

**Current Status:** Web development with Expo (runs in browser on Mac)
**Target:** Native iOS app with local LLM

---

## Part 1: Web vs iOS Capabilities

### What Works on Web (Mac Browser)

| Feature | Web Support | Notes |
|---------|-------------|-------|
| **Core App** | | |
| Journal entries | FULL | Works completely |
| Quick logs (Twigs) | FULL | Works completely |
| Settings storage | FULL | Uses localStorage/IndexedDB |
| Coach conversations | FULL | Uses Claude API |
| Skills system | FULL | Works completely |
| Insights/patterns | FULL | Works completely |
| Collections | FULL | Works completely |
| Slash commands | FULL | Works completely |
| **Voice Features** | | |
| Text-to-Speech | PARTIAL | Web Speech API works, limited voices |
| Speech-to-Text | PARTIAL | Web Speech API, requires online |
| Voice recording | FULL | MediaRecorder API |
| **Biometrics** | | |
| Camera access | FULL | getUserMedia API |
| Face detection | FULL | face-api.js / TensorFlow.js |
| Emotion detection | FULL | TensorFlow.js models |
| Audio recording | FULL | MediaRecorder API |
| Speech analysis | PARTIAL | Basic with Web Audio API |
| Voice identity | PARTIAL | Needs local model |
| **Notifications** | | |
| In-app alerts | FULL | Works completely |
| Push notifications | LIMITED | Web Push is unreliable |
| Background alerts | NO | Browsers don't support |

### What Requires iOS

| Feature | Why iOS Needed | Priority |
|---------|---------------|----------|
| HealthKit | Apple-only API | HIGH |
| Apple Watch | watchOS app | MEDIUM |
| Background processing | iOS scheduling | HIGH |
| Native push notifications | APNs | MEDIUM |
| Siri integration | SiriKit | LOW |
| Face ID / Touch ID | Native biometrics | MEDIUM |
| Core ML | On-device ML | HIGH |
| Offline mode | Full capability | HIGH |
| Home screen widget | iOS widgets | LOW |

---

## Part 2: Development Checklist

### Phase 1: Web Development (Current - Mac)

**Core Features - DONE**
- [x] Journal entry system
- [x] Coach conversation UI
- [x] MoodPrint system
- [x] Cognitive profile onboarding
- [x] Persona system (7 coaches)
- [x] Quick logs (Twigs)
- [x] Fireflies (wisdom)
- [x] Sparks (prompts)
- [x] Skills progression
- [x] Collections system
- [x] Insights visualization
- [x] Slash commands

**Voice Features - IN PROGRESS**
- [x] Text-to-Speech service (created)
- [x] Guided tour with narration (created)
- [ ] Voice recording UI (needs camera/mic component)
- [ ] Speech-to-text transcription
- [ ] Voice settings UI

**Biometrics - IN PROGRESS**
- [x] Speech analysis service (structure)
- [x] Facial recognition service (structure)
- [x] Biometric monitoring service (structure)
- [x] Settings UI for biometrics
- [ ] Camera component for face detection
- [ ] Audio component for voice analysis
- [ ] TensorFlow.js model integration
- [ ] face-api.js integration

**AI/LLM - IN PROGRESS**
- [x] Claude API integration
- [x] MoodPrint context compression
- [x] Cognitive profile → prompt adaptation
- [x] Self-scoring system (humanScoreService)
- [ ] Memory tier compression (weekly)
- [ ] Training data export
- [ ] Local LLM fallback

### Phase 2: iOS-Specific Development

**HealthKit Integration**
- [ ] Request health permissions
- [ ] Heart rate monitoring
- [ ] Sleep analysis
- [ ] Steps/activity data
- [ ] Menstrual cycle sync
- [ ] Heart rate variability (HRV)
- [ ] Respiratory rate

**Native Features**
- [ ] APNs push notifications
- [ ] Background app refresh
- [ ] Core ML model loading
- [ ] Face ID enrollment
- [ ] App Clips (optional)
- [ ] Widgets

**Apple Watch**
- [ ] Complication design
- [ ] Quick log from watch
- [ ] Heart rate alerts
- [ ] Breathing exercises

---

## Part 3: Local LLM Strategy

### Current Architecture

```
User → Expo Web → Claude API → Response
                      ↓
              (Scores, learns)
```

### Target Architecture

```
User → Expo/iOS → Local LLM (primary) → Response
                       ↓
                 Claude API (backup/scoring)
```

### Local LLM Options

#### For Mac Development (Training & Testing)

| Tool | Pros | Cons |
|------|------|------|
| **Ollama** | Easy setup, runs many models | Resource heavy |
| **LM Studio** | GUI, model management | Mac-focused |
| **llama.cpp** | Fast, efficient | CLI only |
| **MLX** | Apple Silicon optimized | Apple-only |

**Recommended for Mac:** Ollama + Mistral 7B or Llama 3 8B

#### For iOS Deployment

| Option | Size | Quality | Offline |
|--------|------|---------|---------|
| **TinyLlama 1.1B** | ~600MB | Basic | Yes |
| **Phi-2 2.7B** | ~1.5GB | Good | Yes |
| **Mistral 7B (quantized)** | ~4GB | Excellent | Yes |
| **Llama 3 8B (4-bit)** | ~4.5GB | Excellent | Yes |

**Recommended for iOS:** Start with Phi-2, upgrade to quantized Mistral/Llama

### Integration Plan

**Step 1: Add Ollama Support (Mac)**
```typescript
// localLLMService.ts
export async function queryLocalLLM(prompt: string): Promise<string> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'mistral',
      prompt: prompt,
      stream: false
    })
  });
  return response.json();
}
```

**Step 2: Hybrid Routing**
```typescript
// In claudeAPIService.ts
async function getResponse(messages, context) {
  const useLocal = await shouldUseLocalLLM();

  if (useLocal) {
    return await queryLocalLLM(buildPrompt(messages, context));
  } else {
    return await callClaudeAPI(messages, context);
  }
}
```

**Step 3: iOS Core ML**
- Convert fine-tuned model to Core ML format
- Use llama.cpp Swift bindings
- Implement same interface as Ollama

---

## Part 4: Training Pipeline

### What Needs Training

1. **Response Scoring Model** - Replaces Claude scoring
2. **MoodPrint Adapter** - Fine-tunes base model on user style
3. **Voice Analysis Model** - Speech pattern detection
4. **Emotion Detection Model** - Face analysis refinement

### Training on Mac (Easier)

**Setup:**
```bash
# Install training environment
pip install torch transformers datasets peft
pip install mlx mlx-lm  # For Apple Silicon
```

**Data Collection (Already Happening):**
- `humanScoreService.ts` saves {input, output, score} pairs
- `exportForTraining()` function exists
- Target: 500+ examples for scorer, 1000+ for fine-tuning

**Training Scripts Needed:**

```
/training/
├── prepare_data.py       # Convert exported JSON to training format
├── train_scorer.py       # Train response quality classifier
├── train_adapter.py      # LoRA/QLoRA fine-tuning
├── export_coreml.py      # Convert to iOS format
└── evaluate.py           # Test model quality
```

### Training Workflow

```
1. COLLECT
   └── App saves conversation data locally

2. EXPORT
   └── User exports anonymized training data

3. TRAIN (on Mac)
   ├── Run training scripts
   ├── Evaluate quality
   └── Export to Core ML

4. DEPLOY
   ├── Update iOS app with new model
   └── A/B test against Claude
```

### Training Milestones

| Milestone | Data Needed | Result |
|-----------|-------------|--------|
| Local scorer works | 500 scored responses | Can score without Claude |
| Basic fine-tune | 1000 conversations | Model understands coach style |
| Quality fine-tune | 5000 conversations | Matches Claude quality |
| User-specific | 100 per user | Personalized model |

---

## Part 5: Megaprompt Updates Needed

### Current System
- Uses Claude API exclusively
- Sends full context on each request
- No local processing

### Required Changes

**1. Add Local LLM Flag**
```typescript
// In coachPersonalityService.ts
export interface CoachSettings {
  // ... existing
  preferLocalLLM: boolean;
  localModelName: string;
}
```

**2. Update Context Building**
- Local models have smaller context windows
- Need more aggressive compression
- Add `buildLocalPrompt()` function

**3. Add Fallback Logic**
```typescript
// In claudeAPIService.ts
async function generateResponse() {
  try {
    if (settings.preferLocalLLM) {
      return await queryLocalLLM(compressedContext);
    }
  } catch (error) {
    console.log('Local LLM failed, falling back to Claude');
  }
  return await callClaudeAPI(fullContext);
}
```

**4. Update Scoring**
- Local scorer for quick feedback
- Claude scoring for training data (background)

---

## Part 6: Immediate Next Steps

### This Week (Mac/Web)
1. [ ] Add camera/microphone React components
2. [ ] Integrate face-api.js for emotion detection
3. [ ] Test TensorFlow.js voice analysis
4. [ ] Set up Ollama for local testing
5. [ ] Create `localLLMService.ts`

### Next Week
1. [ ] Build training data export UI
2. [ ] Create `prepare_data.py` script
3. [ ] Train first scorer model
4. [ ] Test hybrid routing (local + Claude)

### iOS Prep (Parallel)
1. [ ] Test Expo build for iOS simulator
2. [ ] Research HealthKit permissions
3. [ ] Research Core ML integration
4. [ ] Design offline-first data sync

---

## Part 7: File Changes Summary

### New Files Needed

```
moodling-app/services/
├── localLLMService.ts         # Ollama/Core ML interface
├── cameraService.ts           # Camera access for face detection
├── microphoneService.ts       # Mic access for voice analysis
└── trainingDataService.ts     # Export training data

training/
├── prepare_data.py
├── train_scorer.py
├── train_adapter.py
├── export_coreml.py
├── evaluate.py
└── requirements.txt

moodling-app/components/
├── Camera.tsx                 # Face detection camera
└── VoiceRecorder.tsx          # Voice recording component
```

### Files to Modify

```
moodling-app/services/
├── claudeAPIService.ts        # Add local LLM routing
├── coachPersonalityService.ts # Add local LLM settings
├── humanScoreService.ts       # Add local scorer option
└── biometricMonitoringService.ts # Add real implementations

docs/
├── DEVELOPER_GUIDE.md         # Update with local LLM
├── HYBRID_AI_ARCHITECTURE.md  # Update architecture diagram
└── Handoff.md                 # Update roadmap
```

---

## Part 8: Risk Assessment

### High Risk
- **Local LLM quality** - May not match Claude initially
- **iOS Core ML size** - 4GB model may be too large
- **Training data privacy** - Must be opt-in, anonymized

### Medium Risk
- **Ollama API changes** - Use abstraction layer
- **TensorFlow.js performance** - May need WebGL
- **HealthKit permissions** - Users may decline

### Low Risk
- **Web → iOS migration** - Expo handles most of it
- **Voice recording** - Standard APIs
- **Camera access** - Standard APIs

---

*Last Updated: January 2026*
