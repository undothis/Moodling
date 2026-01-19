# MOODLING — Claude Code Mega-Prompt
## iOS-Only · Local-First · Vibe-Coding · Atomic Units

---

# PART 1: CONTEXT & PHILOSOPHY

## Who You Are

You are a senior iOS engineer specializing in SwiftUI, Core Data, and Apple's ML frameworks.
You are also a compassionate product designer who understands mental health ethics.
You are building with a non-programmer who uses AI coding assistants.

We are building together in **vibe-coding mode**.
This means we go slow, small, and true — never fast and wrong.

---

## What We Are Building

**Moodling** is an adaptive mood-journaling and reflection companion app for iOS.

Its purpose is to help users:
- Track emotional, somatic, relational, and behavioral data via free-form journaling
- Observe patterns over time WITHOUT medical diagnosis
- Receive gentle, non-authoritative suggestions
- Build real-world skills and habits
- Leave the app to engage with the world

**Moodling's highest success is when users need it less, not more.**

---

## The Sacred Ethical Rules (NEVER VIOLATE)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOODLING ETHICS - HARDCODED                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ NEVER diagnose mental health conditions                     │
│  ❌ NEVER suggest medication changes                            │
│  ❌ NEVER present itself as a therapist                         │
│  ❌ NEVER replace human connection                              │
│  ❌ NEVER use shame, guilt, or streak-based pressure            │
│  ❌ NEVER moralize substances or coping strategies              │
│  ❌ NEVER use engagement metrics over wellbeing                 │
│                                                                 │
│  ✅ ALWAYS reflect patterns descriptively, not interpretively   │
│  ✅ ALWAYS encourage real-world connection                      │
│  ✅ ALWAYS use tentative, humble language                       │
│  ✅ ALWAYS track and discourage overuse of the app itself       │
│  ✅ ALWAYS prioritize the user's lived experience               │
│  ✅ ALWAYS treat distress as contextual and human               │
│  ✅ ALWAYS design toward the app's own obsolescence             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Language tone throughout the app:**
- Warm
- Grounded  
- Humble
- Uncertain (uses "might", "seems", "you may notice")
- Non-judgmental
- Compassionate

**Example good reflection:**
> "On days with less outdoor time, you seem to report more restlessness."

**Example bad reflection:**
> "You have anxiety. You should go outside more."

---

## The Vibe-Coding Rules (ALWAYS FOLLOW)

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIBE-CODING PRINCIPLES                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. NEVER MAKE THINGS UP                                        │
│     If you don't know, say "UNKNOWN" and show how to find out   │
│                                                                 │
│  2. ONE REAL STEP AT A TIME                                     │
│     No "whole system" — only this small piece                   │
│                                                                 │
│  3. ERRORS ARE SACRED                                           │
│     If something goes wrong, it must be loud, logged, saved     │
│                                                                 │
│  4. SAME INPUT = SAME OUTPUT                                    │
│     Reality must be stable and predictable                      │
│                                                                 │
│  5. EVERY STEP IS TESTABLE                                      │
│     If we can't test it, we don't trust it                      │
│                                                                 │
│  6. NO INVISIBLE MAGIC                                          │
│     Everything important must leave a trace                     │
│                                                                 │
│  7. CHECKPOINT EVERYTHING                                       │
│     Pause, show what's done, wait before continuing             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**At the end of EVERY response, you must say:**
```
STOPPING HERE. 
✓ What we built: [summary]
✓ How to test: [specific steps]
→ Next small step: [X]
```

---

## Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOODLING STACK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PLATFORM:        iOS 17+ (iPhone & iPad)                       │
│  FRAMEWORK:       SwiftUI                                       │
│  LANGUAGE:        Swift 5.9+                                    │
│  DATA:            SwiftData (local only)                        │
│  ENCRYPTION:      iOS Keychain for sensitive data               │
│  ML - SENTIMENT:  Apple NaturalLanguage framework               │
│  ML - PATTERNS:   Create ML tabular models                      │
│  ML - LLM:        HYBRID: Apple Foundation Models + Claude API  │
│  VOICE:           WhisperKit (on-device transcription)          │
│  HEALTH:          HealthKit (sleep, activity)                   │
│  CALENDAR:        EventKit (event-aware reminders)              │
│  NOTIFICATIONS:   UserNotifications framework                   │
│                                                                 │
│  LOCAL AI:        Apple Foundation Models (summaries, search)   │
│  CLOUD AI:        Claude API (therapeutic conversations)        │
│  COST:            $99/year Apple + ~$0.005/conversation turn    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## The Hybrid AI Architecture

**Why hybrid?** Apple's on-device LLM blocks ~50% of mental health conversations due to safety guardrails. Claude API handles therapeutic content that Apple won't.

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INPUT                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTENT CLASSIFIER                            │
│                  (On-Device, Core ML)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   🍎 APPLE FOUNDATION    │    │      ☁️ CLAUDE API       │
│   MODELS (Free/Private)  │    │    (Paid/Consented)      │
├──────────────────────────┤    ├──────────────────────────┤
│ • "Summarize my week"    │    │ • "I'm feeling anxious"  │
│ • "What patterns do      │    │ • "Help me prepare for   │
│    you see?"             │    │    this party"           │
│ • "Find entries about    │    │ • "I'm struggling with   │
│    work"                 │    │    drinking"             │
│                          │    │ • "I feel so lonely"     │
│ 🔒 100% On-Device        │    │                          │
│ 💰 Free                  │    │ 💰 ~$0.005/turn          │
│ ⚡ Instant               │    │ ☁️ Requires consent      │
└──────────────────────────┘    └──────────────────────────┘
```

**Privacy model:**
- Journal entries ALWAYS stay on device
- Pattern data ALWAYS stays on device
- Only the current conversation goes to Claude (with consent)
- User can disable cloud AI anytime
- App works fully offline (just without coaching)

**Why this stack:**
- SwiftData is Apple's modern, simple persistence (replaces Core Data complexity)
- NaturalLanguage is built into iOS — zero setup, instant sentiment analysis
- WhisperKit is MIT-licensed, on-device, 0.46s latency
- Hybrid AI gives us the best of both: privacy where possible, capability where needed
- Claude API enables real therapeutic conversations Apple's AI blocks
- User is ALWAYS informed which AI is processing their message

---

# PART 2: THE BUILD PLAN — ATOMIC UNITS

Each unit is a **complete, testable, working app**.
Each unit builds on the previous.
We never move forward until the current unit works on a real device.

```
PHASE 1: FOUNDATION (Units 0-3)
├── Unit 0: Project Infrastructure
├── Unit 1: Basic Journal Entry
├── Unit 2: Persistent Storage
└── Unit 3: Entry History View

PHASE 2: INTELLIGENCE (Units 4-6)
├── Unit 4: Sentiment Analysis
├── Unit 5: Voice Journaling
└── Unit 6: Basic Notifications

PHASE 3: AWARENESS (Units 7-9)
├── Unit 7: Calendar Integration
├── Unit 8: Event-Aware Reminders
└── Unit 9: HealthKit Integration

PHASE 4: PATTERNS (Units 10-12)
├── Unit 10: Pattern Data Model
├── Unit 11: Pattern Visualization
└── Unit 12: Correlation Engine

PHASE 5: ETHICS (Units 13-15)
├── Unit 13: Anti-Dependency System
├── Unit 14: Adaptive Reminders
└── Unit 15: Compassionate Reflections (Templates)

PHASE 6: HYBRID AI (Units 16-19)  ← Real-time coaching
├── Unit 16: Hybrid AI Architecture Setup (Router)
├── Unit 17: Apple Foundation Models Integration
├── Unit 18: Claude API Integration
├── Unit 18B: Rich User Context Builder  ← Personalization magic
├── Unit 18C: Anonymized Training Data Collection  ← Future model training
└── Unit 19: Coaching Conversation UI

PHASE 7: ADVANCED FEATURES (Units 20-22)
├── Unit 20: Event-Aware Coaching Conversations
├── Unit 21: Social Exposure Ladder
└── Unit 22: Location-Based Suggestions
```

**Key Milestone Points:**

| After Unit | You Have |
|------------|----------|
| 3 | Working journal app (write, save, view) |
| 6 | Smart journal with sentiment + voice + reminders |
| 9 | Context-aware app (calendar, health data) |
| 12 | Pattern-detecting app with visualizations |
| 15 | Ethically-designed app with anti-dependency |
| 18C | **Full AI coaching with personalization + training data** |
| 22 | Complete Moodling with all features |

**Data Strategy:**
- Units 0-15: 100% local, no backend needed
- Unit 18: Claude API (cloud, user-consented)
- Unit 18C: Railway backend (anonymized training data, user-consented)
- All raw personal data ALWAYS stays on device

---

# PART 3: DETAILED UNIT SPECIFICATIONS

---

## UNIT 0: Project Infrastructure

**Goal:** Create the Xcode project with proper structure and build it successfully.

**What we're building:**
- New Xcode project for iOS 17+
- SwiftUI App lifecycle
- Basic folder structure
- App icon placeholder
- Launch screen
- Basic tab navigation shell

**Folder structure:**
```
Moodling/
├── MoodlingApp.swift          # App entry point
├── ContentView.swift          # Main tab view
├── Info.plist                 # App configuration
├── Assets.xcassets/           # Images, colors, app icon
├── Models/                    # Data models (empty for now)
├── Views/                     # SwiftUI views
│   ├── JournalTab/           # Journal-related views
│   ├── InsightsTab/          # Pattern/insight views
│   └── SettingsTab/          # Settings views
├── Services/                  # Business logic
│   ├── Storage/              # Data persistence
│   ├── ML/                   # Machine learning
│   └── Notifications/        # Reminder system
└── Utilities/                 # Helpers, extensions
```

**Tab structure:**
1. **Journal** — Write entries (primary)
2. **Insights** — See patterns (secondary)
3. **Settings** — Configure app

**Deliverable:**
- App builds and runs on simulator
- Shows 3 tabs with placeholder text
- No crashes, no warnings

**Test:**
1. Open Xcode
2. Build (Cmd+B) — should succeed
3. Run on simulator (Cmd+R) — should show tabs
4. Tap each tab — should switch without crash

---

## UNIT 1: Basic Journal Entry

**Goal:** User can type a journal entry and see it on screen.

**What we're building:**
- Text editor view for journaling
- "Save" button
- Display the saved entry
- Timestamp display
- Character count

**UI Components:**
```
┌─────────────────────────────────────────┐
│  Journal                         [Save] │
├─────────────────────────────────────────┤
│                                         │
│  How are you feeling right now?         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  [Text input area]              │   │
│  │                                 │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  142 characters · Jan 18, 2026 3:42 PM  │
│                                         │
├─────────────────────────────────────────┤
│  Your entry:                            │
│  "I went for a walk today and felt..."  │
└─────────────────────────────────────────┘
```

**Data model (in-memory only for now):**
```swift
struct JournalEntry: Identifiable {
    let id: UUID
    let text: String
    let createdAt: Date
}
```

**Behavior:**
- Text field is multiline, minimum 5 lines visible
- Save button disabled if text is empty
- After save, entry appears below
- Entry shows truncated preview (first 100 chars)
- Timestamp in friendly format ("Today 3:42 PM")

**Deliverable:**
- Can type text
- Can tap Save
- See the entry displayed below
- Data is NOT persisted (lost on app restart) — that's Unit 2

**Test:**
1. Launch app
2. Go to Journal tab
3. Type "I'm feeling okay today"
4. Tap Save
5. See entry appear below with timestamp
6. Close app and reopen — entry is gone (expected)

---

## UNIT 2: Persistent Storage

**Goal:** Journal entries survive app restart using SwiftData.

**What we're building:**
- SwiftData model for JournalEntry
- ModelContainer setup
- Save entries to local database
- Load entries on app launch

**SwiftData Model:**
```swift
import SwiftData

@Model
final class JournalEntry {
    var id: UUID
    var text: String
    var createdAt: Date
    
    init(text: String) {
        self.id = UUID()
        self.text = text
        self.createdAt = Date()
    }
}
```

**Changes to MoodlingApp.swift:**
```swift
@main
struct MoodlingApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: JournalEntry.self)
    }
}
```

**Deliverable:**
- Entries persist after app restart
- Data stored locally in app sandbox
- No cloud sync (intentionally)

**Test:**
1. Launch app
2. Create entry: "Test persistence"
3. Tap Save
4. Force quit app (swipe up from app switcher)
5. Relaunch app
6. Entry should still be there ✓

---

## UNIT 3: Entry History View

**Goal:** See all past entries in a scrollable list.

**What we're building:**
- List view showing all entries
- Sorted by date (newest first)
- Tap entry to see full text
- Delete entries (swipe to delete)
- Entry count display

**UI Components:**
```
┌─────────────────────────────────────────┐
│  Journal                    [+ New]     │
├─────────────────────────────────────────┤
│  12 entries                             │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ Today, 3:42 PM                  │   │
│  │ I went for a walk today and...  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Yesterday, 9:15 AM              │   │
│  │ Feeling anxious about the...    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Jan 15, 2026                    │   │
│  │ Had coffee with Sarah and...    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Detail View (tap an entry):**
```
┌─────────────────────────────────────────┐
│  [Back]        Entry                    │
├─────────────────────────────────────────┤
│                                         │
│  January 18, 2026                       │
│  3:42 PM                                │
│                                         │
│  I went for a walk today and felt       │
│  much better than I expected. The       │
│  fresh air really helped clear my       │
│  head. I noticed the trees are          │
│  starting to bloom...                   │
│                                         │
│                                         │
│  ─────────────────────────────────────  │
│  [Delete Entry]                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Newest entries at top
- Swipe left to delete (with confirmation)
- Tap entry to see full text
- "+ New" button opens entry composer

**Deliverable:**
- Scrollable list of all entries
- Can view full entry detail
- Can delete entries
- Entry count updates

**Test:**
1. Create 3 entries with different content
2. See all 3 in list, newest first
3. Tap middle entry — see full text
4. Go back, swipe to delete oldest
5. Confirm delete
6. Entry count shows "2 entries"

---

## UNIT 4: Sentiment Analysis

**Goal:** Automatically analyze mood of each entry using Apple's NaturalLanguage.

**What we're building:**
- NaturalLanguage integration
- Sentiment score (-1.0 to +1.0) for each entry
- Visual mood indicator (emoji or color)
- Store sentiment with entry

**Updated Data Model:**
```swift
@Model
final class JournalEntry {
    var id: UUID
    var text: String
    var createdAt: Date
    var sentimentScore: Double?  // -1.0 (negative) to +1.0 (positive)
    
    var moodIndicator: String {
        guard let score = sentimentScore else { return "⚪️" }
        switch score {
        case 0.3...: return "😊"      // Positive
        case -0.3..<0.3: return "😐"  // Neutral
        default: return "😔"          // Negative
        }
    }
}
```

**Sentiment Service:**
```swift
import NaturalLanguage

class SentimentService {
    func analyzeSentiment(for text: String) -> Double {
        let tagger = NLTagger(tagSchemes: [.sentimentScore])
        tagger.string = text
        
        let (sentiment, _) = tagger.tag(
            at: text.startIndex,
            unit: .paragraph,
            scheme: .sentimentScore
        )
        
        return Double(sentiment?.rawValue ?? "0") ?? 0.0
    }
}
```

**UI Update — Entry shows mood:**
```
┌─────────────────────────────────────────┐
│ 😊 Today, 3:42 PM                       │
│ I went for a walk today and felt...     │
└─────────────────────────────────────────┘
```

**Behavior:**
- Sentiment analyzed automatically on save
- No label like "positive" or "negative" shown to user
- Just a subtle emoji indicator
- Score stored for pattern analysis later

**Deliverable:**
- Each entry gets sentiment score
- Emoji appears in list view
- Analysis happens instantly (on-device)

**Test:**
1. Create entry: "I feel wonderful today! Everything is great!"
   - Should show 😊
2. Create entry: "Just a normal day, nothing special."
   - Should show 😐
3. Create entry: "I'm so frustrated and sad right now."
   - Should show 😔
4. Verify scores are different in debug console

---

## UNIT 5: Voice Journaling

**Goal:** User can speak their journal entry instead of typing.

**What we're building:**
- Microphone button in journal composer
- WhisperKit integration for on-device transcription
- Real-time transcription display
- Privacy indicator (all on-device)

**Dependencies:**
Add WhisperKit via Swift Package Manager:
```
https://github.com/argmaxinc/WhisperKit
```

**UI Components:**
```
┌─────────────────────────────────────────┐
│  Journal                         [Save] │
├─────────────────────────────────────────┤
│                                         │
│  How are you feeling right now?         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  [Text from voice or typing]    │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│         🎤                              │
│    [Tap to speak]                       │
│                                         │
│  🔒 Voice processed on your device      │
└─────────────────────────────────────────┘
```

**Recording State:**
```
┌─────────────────────────────────────────┐
│         🔴                              │
│    [Recording...]                       │
│                                         │
│  "I went to the park today and..."      │
│  (transcribing in real-time)            │
└─────────────────────────────────────────┘
```

**Behavior:**
- Tap mic to start recording
- Tap again to stop
- Transcription appears in real-time
- User can edit transcription before saving
- First launch: request microphone permission
- Download whisper model on first use (~50MB base.en)

**Permissions needed in Info.plist:**
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Moodling uses your microphone for voice journaling. All voice processing happens on your device — nothing is sent to any server.</string>
```

**Deliverable:**
- Can tap mic and speak
- See transcription appear
- Edit if needed
- Save as normal entry

**Test:**
1. Tap microphone button
2. Grant permission when prompted
3. Say "I feel pretty good today"
4. See text appear
5. Tap to stop recording
6. Edit text if needed
7. Tap Save
8. Entry appears in list with sentiment

---

## UNIT 6: Basic Notifications

**Goal:** User can set daily reminder to journal.

**What we're building:**
- Settings screen with reminder toggle
- Time picker for reminder
- Local notification scheduling
- Compassionate notification copy

**Settings UI:**
```
┌─────────────────────────────────────────┐
│  Settings                               │
├─────────────────────────────────────────┤
│                                         │
│  REMINDERS                              │
│  ┌─────────────────────────────────┐   │
│  │ Daily check-in          [ON]   │   │
│  │ Time                   8:00 PM │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Moodling will gently remind you        │
│  to check in. You can always ignore     │
│  it — no pressure, no streaks.          │
│                                         │
├─────────────────────────────────────────┤
│  PRIVACY                                │
│  ┌─────────────────────────────────┐   │
│  │ 🔒 All data stored on device   │   │
│  │ Nothing sent to any server      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Notification copy (randomized, compassionate):**
```swift
let notificationMessages = [
    "Check in when you're ready 🌿",
    "How are you feeling? No rush.",
    "A moment to notice how you are.",
    "Whenever you're ready to reflect.",
    "Just checking in. Take your time."
]
```

**Behavior:**
- Toggle enables/disables daily reminder
- Time picker sets the hour
- Notification uses passive interruption level (not urgent)
- Tapping notification opens journal composer
- No streak counting, no guilt

**Permissions needed:**
```swift
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])
```

**Deliverable:**
- Can enable daily reminder
- Can set time
- Notification fires at set time
- Tapping opens app

**Test:**
1. Go to Settings
2. Enable "Daily check-in"
3. Set time to 2 minutes from now
4. Close app (don't force quit)
5. Wait for notification
6. Notification appears with gentle message
7. Tap notification — app opens to Journal

---

## UNIT 7: Calendar Integration

**Goal:** App can read calendar events to enable event-aware reminders.

**What we're building:**
- EventKit integration
- Request calendar permission
- Scan for social events (keywords: party, dinner, date, meeting, lunch, drinks, birthday, wedding, gathering)
- Display upcoming social events in app

**Permissions needed in Info.plist:**
```xml
<key>NSCalendarsFullAccessUsageDescription</key>
<string>Moodling can read your calendar to offer check-ins before and after social events. We never modify your calendar or share this data.</string>
```

**Settings Addition:**
```
┌─────────────────────────────────────────┐
│  EVENT-AWARE CHECK-INS                  │
│  ┌─────────────────────────────────┐   │
│  │ Calendar access          [ON]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Moodling can notice social events      │
│  and offer gentle check-ins before      │
│  and after. You control everything.     │
│                                         │
│  UPCOMING SOCIAL EVENTS                 │
│  ┌─────────────────────────────────┐   │
│  │ 🎉 Sarah's birthday party      │   │
│  │    Saturday 8:30 PM             │   │
│  │    [Before] [After] check-ins   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Calendar Service:**
```swift
import EventKit

class CalendarService {
    let eventStore = EKEventStore()
    
    let socialKeywords = [
        "party", "dinner", "date", "meeting", "lunch", 
        "drinks", "birthday", "wedding", "gathering",
        "hangout", "coffee", "brunch", "concert", "show"
    ]
    
    func fetchUpcomingSocialEvents(days: Int = 7) async -> [EKEvent] {
        // Fetch events for next N days
        // Filter by keywords in title
        // Return matching events
    }
}
```

**Deliverable:**
- Can request calendar permission
- Shows upcoming social events
- Events filtered by social keywords
- User sees what events Moodling detected

**Test:**
1. Create calendar event: "Sarah's birthday party" for tomorrow 8:30 PM
2. Open Moodling Settings
3. Enable Calendar access
4. Grant permission
5. See "Sarah's birthday party" appear in upcoming events
6. Non-social events (like "Dentist appointment") should NOT appear

---

## UNIT 8: Event-Aware Reminders

**Goal:** Automatically schedule check-ins before, during (optional), and after social events.

**This is the core "social anxiety support" feature.**

**What we're building:**
- Automatic reminder scheduling around events
- "Before" reminder (customizable: 2h, 1h, 30min before)
- "After" reminder (next morning or custom time after)
- Optional "during" check-in (mid-event)
- Event-specific compassionate prompts

**Reminder Timing UI:**
```
┌─────────────────────────────────────────┐
│  🎉 Sarah's birthday party             │
│  Saturday 8:30 PM                       │
├─────────────────────────────────────────┤
│                                         │
│  BEFORE EVENT                           │
│  ┌─────────────────────────────────┐   │
│  │ Check-in               [ON]    │   │
│  │ Time before         [1 hour]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  DURING EVENT                           │
│  ┌─────────────────────────────────┐   │
│  │ Mid-event check-in     [OFF]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  AFTER EVENT                            │
│  ┌─────────────────────────────────┐   │
│  │ Reflection             [ON]    │   │
│  │ Time after       [Next morning]│   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Before-Event Prompts (randomized):**
```swift
let beforeEventPrompts = [
    "Your [EVENT] is in [TIME]. How are you feeling about it?",
    "Heading to [EVENT] soon. Notice any feelings coming up?",
    "[EVENT] is coming up. What would help you feel ready?",
    "Before [EVENT]: What do you need right now?",
    "Getting ready for [EVENT]. How's your body feeling?"
]
```

**After-Event Prompts (randomized):**
```swift
let afterEventPrompts = [
    "How did [EVENT] go? What do you notice now?",
    "Reflecting on [EVENT]. What stood out?",
    "After [EVENT]: How are you feeling this morning?",
    "[EVENT] is done. Anything you want to remember?",
    "How was your experience at [EVENT]?"
]
```

**During-Event Prompts (if enabled):**
```swift
let duringEventPrompts = [
    "Quick check-in: How are you doing right now?",
    "Pause for a breath. How's it going?",
    "Just checking in. You're doing great."
]
```

**Behavior:**
- When calendar syncs, auto-detect social events
- Create pending reminders for each event
- User can customize or disable per event
- Reminders include event name for context
- After event: prompt includes space for reflection

**Deliverable:**
- Social events auto-detected
- Reminders scheduled before/after
- Notifications include event name
- Tapping opens journal with event context

**Test:**
1. Create event "Dinner with Alex" tomorrow at 7:00 PM
2. Open Moodling, sync calendar
3. See event detected with before/after toggles
4. Enable "1 hour before" check-in
5. Simulator: advance time to 6:00 PM tomorrow
6. Notification: "Dinner with Alex is in 1 hour. How are you feeling about it?"
7. Tap notification — journal opens with event context pre-filled

---

## UNIT 9: HealthKit Integration

**Goal:** Pull sleep and activity data to correlate with mood.

**What we're building:**
- HealthKit authorization
- Read sleep data (hours, quality)
- Read step count
- Read active energy (optional)
- Display health summary in Insights

**Permissions needed in Info.plist:**
```xml
<key>NSHealthShareUsageDescription</key>
<string>Moodling can read your sleep and activity data to help you notice patterns between rest, movement, and mood. This data never leaves your device.</string>
```

**HealthKit Service:**
```swift
import HealthKit

class HealthKitService {
    let healthStore = HKHealthStore()
    
    let readTypes: Set<HKObjectType> = [
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
    ]
    
    func requestAuthorization() async throws {
        try await healthStore.requestAuthorization(toShare: [], read: readTypes)
    }
    
    func fetchSleepHours(for date: Date) async -> Double? {
        // Query sleep analysis for date
        // Sum asleep time
        // Return hours
    }
    
    func fetchStepCount(for date: Date) async -> Int? {
        // Query step count for date
    }
}
```

**Updated Data Model:**
```swift
@Model
final class DailyHealth {
    var date: Date
    var sleepHours: Double?
    var stepCount: Int?
    var activeEnergy: Double?
}
```

**Insights UI Addition:**
```
┌─────────────────────────────────────────┐
│  TODAY'S CONTEXT                        │
│  ┌─────────────────────────────────┐   │
│  │ 😴 Sleep: 6.5 hours             │   │
│  │ 🚶 Steps: 4,230                 │   │
│  │ 📝 Entries: 2                   │   │
│  │ 😊 Avg mood: Positive           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Behavior:**
- Request permission on first access to Insights
- Fetch last 7 days of health data
- Store locally for pattern analysis
- Never write to HealthKit (read-only)

**Deliverable:**
- Can authorize HealthKit
- Sleep and steps appear in Insights
- Data stored locally for patterns

**Test:**
1. Go to Insights tab
2. Prompt asks for HealthKit permission
3. Grant permission
4. See today's sleep and step data
5. If using simulator, data may be empty (expected)
6. On real device with Health data, should show actual numbers

---

## UNIT 10: Pattern Data Model

**Goal:** Create data structures for tracking patterns over time.

**What we're building:**
- Daily summary model (aggregates entries + health)
- Weekly/monthly aggregation
- Substance tracking (optional user input)
- Activity tracking (optional user input)

**Data Models:**
```swift
@Model
final class DailySummary {
    var date: Date
    var entryCount: Int
    var averageSentiment: Double?
    var sleepHours: Double?
    var stepCount: Int?
    
    // Optional user-tracked factors
    var caffeineCount: Int?      // Coffees/teas
    var alcoholCount: Int?       // Drinks
    var exerciseMinutes: Int?    // Workout time
    var outdoorMinutes: Int?     // Time outside
    var socialMinutes: Int?      // Time with people
    
    // Computed
    var moodCategory: MoodCategory {
        guard let sentiment = averageSentiment else { return .unknown }
        switch sentiment {
        case 0.3...: return .positive
        case -0.3..<0.3: return .neutral
        default: return .negative
        }
    }
}

enum MoodCategory: String, Codable {
    case positive, neutral, negative, unknown
}
```

**Quick Log UI (for factors):**
```
┌─────────────────────────────────────────┐
│  QUICK LOG (optional)                   │
├─────────────────────────────────────────┤
│                                         │
│  ☕️ Caffeine    [−]  2  [+]            │
│  🍺 Alcohol     [−]  0  [+]            │
│  🏃 Exercise    [−] 30m [+]            │
│  🌳 Outside     [−] 15m [+]            │
│  👥 Social      [−] 60m [+]            │
│                                         │
│  This helps Moodling notice patterns.   │
│  Track what matters to you.             │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Daily summary auto-generated at end of day
- User can optionally log factors
- No judgment on any values
- All data stays local

**Deliverable:**
- Daily summary model exists
- Can log optional factors
- Data persists for analysis

**Test:**
1. Log 2 coffees via Quick Log
2. Log 30 minutes exercise
3. Create journal entry
4. View Insights — see today's summary
5. Restart app — data persists

---

## UNIT 11: Pattern Visualization

**Goal:** Show simple visualizations of mood and factors over time.

**What we're building:**
- 7-day mood chart (simple line or bar)
- Factor correlation hints (visual only)
- Weekly summary view
- No Swift Charts initially (too complex) — use simple custom views

**Insights UI:**
```
┌─────────────────────────────────────────┐
│  Insights                    [7 days ▼] │
├─────────────────────────────────────────┤
│                                         │
│  YOUR WEEK                              │
│  ┌─────────────────────────────────┐   │
│  │ M   T   W   T   F   S   S      │   │
│  │ 😊  😐  😔  😐  😊  😊  😐      │   │
│  │ ▁▂  ▄▅  ▇█  ▄▅  ▂▃  ▁▂  ▄▅      │   │
│  │ (sleep bars below mood)         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  WHAT WE NOTICE                         │
│  ┌─────────────────────────────────┐   │
│  │ On days with 7+ hours sleep,   │   │
│  │ you tend to write more          │   │
│  │ positively.                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  This is just a pattern — you know     │
│  yourself best.                         │
└─────────────────────────────────────────┘
```

**Implementation approach:**
- Simple HStack of emoji for mood
- Simple bar chart using Rectangle views for sleep/factors
- Static pattern observations (hardcoded logic initially)

**Behavior:**
- Show last 7 days by default
- Can tap to expand to 30 days
- Simple visual representation
- Pattern observations are tentative language

**Deliverable:**
- 7-day mood visualization
- Sleep/steps shown as context
- Simple pattern text

**Test:**
1. Create entries for past 3 days (use debug feature to backdate)
2. Log varying sleep hours
3. Open Insights
4. See 7-day view with mood emoji
5. See sleep bars underneath
6. If clear pattern exists, see observation text

---

## UNIT 12: Correlation Engine

**Goal:** Detect statistical correlations between factors and mood.

**What we're building:**
- Simple correlation calculation (Pearson or simpler)
- Sleep vs mood correlation
- Exercise vs mood correlation  
- Substance vs mood correlation
- Generate descriptive observations

**Correlation Service:**
```swift
class PatternService {
    
    func calculateCorrelation(factor: [Double], mood: [Double]) -> Double {
        // Simple Pearson correlation
        // Returns -1 to +1
        // Positive = factor increases with better mood
        // Negative = factor increases with worse mood
    }
    
    func generateObservations(from summaries: [DailySummary]) -> [PatternObservation] {
        var observations: [PatternObservation] = []
        
        // Extract arrays
        let moods = summaries.compactMap { $0.averageSentiment }
        let sleeps = summaries.compactMap { $0.sleepHours }
        
        // Calculate correlations
        if sleeps.count >= 7 {
            let sleepCorr = calculateCorrelation(factor: sleeps, mood: moods)
            if sleepCorr > 0.3 {
                observations.append(PatternObservation(
                    text: "On days with more sleep, you tend to feel more positive.",
                    confidence: .moderate,
                    factors: [.sleep, .mood]
                ))
            }
        }
        
        return observations
    }
}

struct PatternObservation: Identifiable {
    let id = UUID()
    let text: String
    let confidence: Confidence
    let factors: [Factor]
    
    enum Confidence { case low, moderate, high }
    enum Factor { case sleep, steps, caffeine, alcohol, exercise, outdoor, social, mood }
}
```

**Observation Templates (always tentative):**
```swift
let observationTemplates = [
    "On days with more [FACTOR], you seem to feel [DIRECTION].",
    "You might notice that [FACTOR] and your mood tend to [RELATIONSHIP].",
    "There may be a connection between [FACTOR] and how you feel.",
    "Your entries suggest [FACTOR] might influence your mood.",
]
```

**Behavior:**
- Requires minimum 7 days of data
- Only shows correlations above threshold (r > 0.3)
- Always uses tentative language
- Shows confidence level
- User can dismiss/hide observations

**Deliverable:**
- Correlations calculated automatically
- Observations generated from data
- Displayed in Insights tab

**Test:**
1. Create 14 days of test data (debug feature)
2. Days 1-7: low sleep (5h), negative entries
3. Days 8-14: good sleep (8h), positive entries
4. Open Insights
5. See observation about sleep-mood correlation
6. Verify language is tentative, not diagnostic

---

## UNIT 13: Anti-Dependency System

**Goal:** Track app usage and gently discourage overuse.

**This is critical to Moodling's ethics.**

**What we're building:**
- Track session count and duration
- Daily usage limits (soft)
- "You don't need me" messages
- Celebrate days without app use
- Usage visualization

**Usage Tracking Model:**
```swift
@Model
final class AppUsage {
    var date: Date
    var sessionCount: Int
    var totalMinutes: Double
    var entriesCreated: Int
}
```

**Anti-Dependency Service:**
```swift
class AntiDependencyService {
    
    func checkUsage() -> UsageStatus {
        let today = fetchTodayUsage()
        
        if today.sessionCount > 8 {
            return .gentleRedirect(message: "You've checked in quite a bit today. What would feel good to do offline right now?")
        }
        
        if today.totalMinutes > 60 {
            return .encourage离开(message: "You've been here a while. The most helpful thing might be to close this app.")
        }
        
        return .normal
    }
    
    enum UsageStatus {
        case normal
        case gentleRedirect(message: String)
        case encourageLeaving(message: String)
    }
}
```

**UI Interventions:**
```
┌─────────────────────────────────────────┐
│                                         │
│  💚                                     │
│                                         │
│  You've checked in 6 times today.       │
│                                         │
│  That's okay — and also, you don't      │
│  need me right now. You have what       │
│  you need.                              │
│                                         │
│  What would feel good to do offline?    │
│                                         │
│  • Go for a walk                        │
│  • Text someone you care about          │
│  • Just rest                            │
│                                         │
│  [Close Moodling]      [Continue anyway]│
│                                         │
└─────────────────────────────────────────┘
```

**Settings Addition:**
```
┌─────────────────────────────────────────┐
│  APP USAGE THIS WEEK                    │
│  ┌─────────────────────────────────┐   │
│  │ M  T  W  T  F  S  S             │   │
│  │ 3  5  2  ·  4  1  2   sessions  │   │
│  │                                 │   │
│  │ 🎉 Thursday: You didn't need me │   │
│  └─────────────────────────────────┘   │
│                                         │
│  The goal is to need Moodling less,    │
│  not more. You're doing great.          │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Track every session open/close
- After threshold, show gentle message
- Never lock the user out (just encourage)
- Celebrate days with zero app usage
- Show weekly usage in Settings

**Deliverable:**
- Usage tracked automatically
- Gentle interventions at thresholds
- Usage visible in Settings
- "You didn't need me" celebrations

**Test:**
1. Open and close app 7 times
2. On 8th open, see gentle redirect message
3. Can still continue if desired
4. Check Settings — see session count
5. Skip a day, see "you didn't need me" message

---

## UNIT 14: Adaptive Reminders

**Goal:** Reminders that reduce automatically as habits form.

**What we're building:**
- Habit tracking (did user respond to reminder?)
- Adaptive frequency (reduce over time)
- Shift from prompting → checking in → stepping back
- Personalized based on what works

**Adaptive Logic:**
```swift
class AdaptiveReminderService {
    
    func calculateOptimalFrequency(for habit: Habit) -> ReminderFrequency {
        let responseRate = habit.responsesLast14Days / habit.remindersLast14Days
        let streak = habit.currentStreak
        
        // Phase 1: Building (first 2 weeks) - daily reminders
        if habit.daysSinceStart < 14 {
            return .daily
        }
        
        // Phase 2: Strengthening - reduce if responding well
        if responseRate > 0.8 && streak > 7 {
            return .everyOtherDay
        }
        
        // Phase 3: Maintaining - minimal check-ins
        if responseRate > 0.8 && streak > 21 {
            return .twiceWeekly
        }
        
        // Phase 4: Autonomous - just occasional
        if streak > 60 {
            return .weekly
        }
        
        return .daily // Default
    }
    
    func getReminderText(for phase: Phase) -> String {
        switch phase {
        case .building:
            return "Time for your daily check-in 🌱"
        case .strengthening:
            return "How are you doing today?"
        case .maintaining:
            return "Just checking in when you're ready."
        case .autonomous:
            return "Been a little while. How are things?"
        }
    }
}
```

**User Feedback on Reminders:**
```
┌─────────────────────────────────────────┐
│  How are reminders working for you?     │
├─────────────────────────────────────────┤
│                                         │
│  [Too many]  [Just right]  [More please]│
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Track which reminders user responds to
- Automatically reduce frequency over time
- Never increase without user request
- Show reminder phase in Settings
- Allow manual override

**Deliverable:**
- Reminders adapt based on usage
- Frequency reduces as habits form
- User can see and adjust

**Test:**
1. Enable daily reminders
2. Respond to reminders for 14 days (use debug)
3. Verify frequency suggestion changes to "every other day"
4. Continue responding for 21 days
5. Verify suggestion changes to "twice weekly"
6. Check Settings — see current phase

---

## UNIT 15: Compassionate Reflections

**Goal:** Generate simple, compassionate reflections on entries.

**Pre-Foundation Models approach using templates.**

**What we're building:**
- Rule-based reflection generation
- Sentiment-aware responses
- Time-of-day awareness
- Event-context awareness
- Always compassionate, never diagnostic

**Reflection Service:**
```swift
class ReflectionService {
    
    func generateReflection(for entry: JournalEntry, context: EntryContext) -> String? {
        // Don't always give a reflection (sometimes silence is best)
        guard shouldOfferReflection() else { return nil }
        
        var reflection = ""
        
        // Acknowledge what was written
        if entry.sentiment < -0.3 {
            reflection = selectFrom([
                "That sounds really hard.",
                "Thank you for being honest about how you're feeling.",
                "It takes courage to sit with difficult feelings.",
                "I hear you. This is heavy."
            ])
        } else if entry.sentiment > 0.3 {
            reflection = selectFrom([
                "That's really lovely to read.",
                "It sounds like something is going well.",
                "What a nice thing to notice.",
            ])
        } else {
            reflection = selectFrom([
                "Thank you for checking in.",
                "Just noticing how things are is valuable.",
                "There's no right way to feel.",
            ])
        }
        
        // Add gentle suggestion (sometimes)
        if shouldAddSuggestion() {
            reflection += " " + selectFrom([
                "What feels like the kindest thing you could do for yourself right now?",
                "Is there someone you'd feel good talking to?",
                "Would stepping outside for a moment help?",
                "What does your body need?",
            ])
        }
        
        return reflection
    }
    
    private func shouldOfferReflection() -> Bool {
        // Don't always reflect — sometimes just receive
        return Double.random(in: 0...1) > 0.3  // 70% of the time
    }
    
    private func shouldAddSuggestion() -> Bool {
        return Double.random(in: 0...1) > 0.5  // 50% of the time
    }
}
```

**UI After Saving Entry:**
```
┌─────────────────────────────────────────┐
│  ✓ Saved                                │
├─────────────────────────────────────────┤
│                                         │
│  That sounds really hard. Thank you     │
│  for being honest about how you're      │
│  feeling.                               │
│                                         │
│  What feels like the kindest thing      │
│  you could do for yourself right now?   │
│                                         │
│                          [Done]         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Reflection appears after save (not always)
- Never diagnostic ("you seem anxious")
- Always compassionate acknowledgment
- Sometimes includes gentle suggestion
- Never mandatory to engage with

**Deliverable:**
- Reflections appear after some entries
- Tone is warm and non-judgmental
- Suggestions encourage real-world action

**Test:**
1. Write negative entry: "I feel terrible today, everything is wrong"
2. Save — see compassionate reflection
3. Write neutral entry: "Had lunch, nothing special"
4. Save — see acknowledgment (or nothing — both valid)
5. Verify no reflection says "you have depression" or similar

---

## UNIT 16: Hybrid AI Architecture Setup

**Goal:** Create the routing system that decides Apple LLM vs Claude API.

**This is the foundation for intelligent, cost-effective AI.**

**What we're building:**
- Intent classifier (Core ML)
- Router service
- Privacy consent flow
- API key secure storage

**Intent Categories:**
```swift
enum ConversationIntent: String, CaseIterable {
    // Apple Foundation Models handles these (free, private)
    case journalSummary      // "Summarize my week"
    case patternQuery        // "What patterns do you see?"
    case dataSearch          // "Find entries about work"
    case textFormatting      // "Reformat this as bullets"
    case generalReflection   // "How was my month?"
    
    // Claude API handles these (paid, consented)
    case therapeuticSupport  // "I'm feeling anxious"
    case anxietyCoaching     // "Help me prepare for..."
    case substanceSupport    // "I drank too much"
    case loneliness          // "I feel so alone"
    case copingStrategies    // "What should I do?"
    case eventPreparation    // "I have a party tonight"
    
    // No AI - immediate resources
    case crisisDetected      // Self-harm indicators
    
    var requiresClaudeAPI: Bool {
        switch self {
        case .therapeuticSupport, .anxietyCoaching, .substanceSupport,
             .loneliness, .copingStrategies, .eventPreparation:
            return true
        default:
            return false
        }
    }
    
    var requiresCrisisResponse: Bool {
        self == .crisisDetected
    }
}
```

**Router Service:**
```swift
class AIRouterService {
    private let intentClassifier: IntentClassifier
    private let appleLLMService: AppleLLMService
    private let claudeAPIService: ClaudeAPIService
    private let crisisService: CrisisService
    private let consentManager: ConsentManager
    
    func route(userMessage: String, context: ConversationContext) async -> AIResponse {
        // Step 1: Classify intent
        let intent = await intentClassifier.classify(userMessage)
        
        // Step 2: Crisis check (always first)
        if intent.requiresCrisisResponse {
            return crisisService.getCrisisResponse()
        }
        
        // Step 3: Route to appropriate AI
        if intent.requiresClaudeAPI {
            // Check consent
            guard consentManager.hasClaudeConsent else {
                return requestClaudeConsent()
            }
            return await claudeAPIService.respond(to: userMessage, context: context)
        } else {
            // Try Apple LLM first
            do {
                return try await appleLLMService.respond(to: userMessage, context: context)
            } catch AppleLLMError.guardrailViolation {
                // Fallback to Claude if Apple blocks it
                guard consentManager.hasClaudeConsent else {
                    return requestClaudeConsent()
                }
                return await claudeAPIService.respond(to: userMessage, context: context)
            }
        }
    }
}
```

**Consent Manager:**
```swift
class ConsentManager {
    @AppStorage("claudeAPIConsent") private var _hasClaudeConsent: Bool = false
    @AppStorage("claudeConsentDate") private var _consentDate: Date?
    
    var hasClaudeConsent: Bool {
        _hasClaudeConsent
    }
    
    func requestConsent() -> ConsentRequest {
        ConsentRequest(
            title: "Enable Coaching Conversations",
            explanation: """
                To have deeper conversations about how you're feeling, 
                Moodling can connect to a secure AI service.
                
                What this means:
                • Your current conversation is sent encrypted
                • Your journal history stays on your device
                • You can disable this anytime
                • Conversations are not stored on servers
                
                This is optional. Moodling works fully offline too.
                """,
            privacyLink: URL(string: "https://moodling.app/privacy")!
        )
    }
    
    func grantConsent() {
        _hasClaudeConsent = true
        _consentDate = Date()
    }
    
    func revokeConsent() {
        _hasClaudeConsent = false
    }
}
```

**Deliverable:**
- Intent classifier routes messages correctly
- Consent flow for Claude API
- Graceful fallback when Apple LLM fails
- Clear user understanding of what goes where

**Test:**
1. Type "Summarize my entries" → Routes to Apple (no consent needed)
2. Type "I'm feeling anxious" → Prompts for consent
3. Grant consent → Routes to Claude
4. Type "I'm having thoughts of hurting myself" → Shows crisis resources (no AI)
5. Revoke consent in settings → Therapeutic requests show consent prompt again

---

## UNIT 17: Apple Foundation Models Integration

**Goal:** Handle non-therapeutic AI tasks on-device for free.

**Note: Requires iOS 26+. Build with fallbacks for iOS 17.**

**What we're building:**
- Journal summarization
- Pattern description
- Natural language search
- Text reformatting

**Apple LLM Service:**
```swift
import FoundationModels

class AppleLLMService {
    
    func respond(to message: String, context: ConversationContext) async throws -> AIResponse {
        let session = LanguageModelSession()
        
        let systemPrompt = """
        You are a helpful assistant for a journaling app.
        You help users understand their journal entries and patterns.
        
        You DO NOT:
        - Provide therapy or counseling
        - Diagnose conditions
        - Give medical advice
        - Discuss difficult emotions in depth
        
        You DO:
        - Summarize journal entries
        - Describe patterns in data
        - Search and find relevant entries
        - Reformat text when asked
        
        Keep responses concise and factual.
        """
        
        let prompt = buildPrompt(message: message, context: context)
        
        do {
            let response = try await session.respond(
                to: prompt,
                systemPrompt: systemPrompt
            )
            return AIResponse(
                text: response.content,
                source: .appleLLM,
                cost: 0
            )
        } catch let error as FoundationModelsError {
            if error.isGuardrailViolation {
                throw AppleLLMError.guardrailViolation
            }
            throw error
        }
    }
    
    // Specific task methods
    func summarizeEntries(_ entries: [JournalEntry]) async throws -> String {
        let entriesText = entries.map { 
            "[\($0.createdAt.formatted())]: \($0.text)" 
        }.joined(separator: "\n\n")
        
        let prompt = """
        Summarize these journal entries. Focus on:
        - Main themes
        - Notable events
        - General mood trajectory
        
        Keep it to 3-4 sentences.
        
        Entries:
        \(entriesText)
        """
        
        let response = try await respond(to: prompt, context: .empty)
        return response.text
    }
    
    func describePatterns(_ patterns: [PatternObservation]) async throws -> String {
        let patternsText = patterns.map { $0.description }.joined(separator: "\n")
        
        let prompt = """
        Describe these patterns in a warm, conversational way.
        Use phrases like "you might notice" or "it seems like".
        Don't diagnose or label.
        
        Patterns:
        \(patternsText)
        """
        
        let response = try await respond(to: prompt, context: .empty)
        return response.text
    }
}

enum AppleLLMError: Error {
    case guardrailViolation
    case modelUnavailable
    case contextTooLong
}
```

**Fallback for iOS 17 (pre-Foundation Models):**
```swift
class AppleLLMService {
    func respond(to message: String, context: ConversationContext) async throws -> AIResponse {
        if #available(iOS 26, *) {
            // Use Foundation Models
            return try await useFoundationModels(message: message, context: context)
        } else {
            // Fallback: Use templates or route to Claude
            throw AppleLLMError.modelUnavailable
        }
    }
}
```

**Deliverable:**
- Apple LLM handles summaries, patterns, search
- Graceful guardrail violation handling
- iOS 17 fallback to Claude or templates

**Test:**
1. "Summarize my week" → Apple LLM responds with summary
2. "What patterns do you see?" → Apple LLM describes patterns
3. "Find entries about my job" → Apple LLM lists relevant entries
4. "I feel anxious" → Apple LLM throws guardrailViolation → Router catches

---

## UNIT 18: Claude API Integration

**Goal:** Handle therapeutic conversations via Claude API.

**What we're building:**
- Secure API communication
- Moodling's therapeutic persona
- Context window management
- Cost tracking

**API Configuration:**
```swift
// Store API key securely in Keychain
class ClaudeAPIConfig {
    static let baseURL = "https://api.anthropic.com/v1/messages"
    static let model = "claude-3-haiku-20240307"  // Cheapest, fast
    // For higher quality: "claude-3-5-sonnet-20241022"
    
    private static let keychain = KeychainService()
    
    static var apiKey: String? {
        get { keychain.get("claude_api_key") }
        set { keychain.set("claude_api_key", value: newValue) }
    }
}
```

**Claude API Service:**
```swift
class ClaudeAPIService {
    
    private let systemPrompt = """
    You are Moodling, a warm and compassionate companion in a journaling app.
    
    YOUR ROLE:
    - Listen with empathy and without judgment
    - Help users process emotions and prepare for challenges
    - Encourage real-world connection and self-compassion
    - Support users in building skills and habits
    
    YOU NEVER:
    - Diagnose mental health conditions
    - Suggest medication changes
    - Claim to be a therapist or replacement for professional help
    - Use clinical labels like "you have anxiety disorder"
    - Encourage dependence on you
    
    YOUR TONE:
    - Warm but not effusive
    - Tentative ("it seems", "you might notice", "I wonder if")
    - Grounded and honest
    - Encouraging of autonomy
    
    YOUR BOUNDARIES:
    - For crisis/self-harm: Immediately provide crisis resources (988, Crisis Text Line)
    - Remind users you're an AI companion, not a therapist
    - Encourage professional help for persistent struggles
    - Sometimes suggest closing the app and connecting with real people
    
    CONTEXT ABOUT THIS USER:
    {user_context}
    
    Keep responses concise (2-4 sentences usually). 
    Ask one question at most.
    Focus on the user's immediate experience.
    """
    
    func respond(to message: String, context: ConversationContext) async -> AIResponse {
        let userContext = buildUserContext(from: context)
        let fullSystemPrompt = systemPrompt.replacingOccurrences(
            of: "{user_context}", 
            with: userContext
        )
        
        let messages = buildMessages(currentMessage: message, history: context.recentMessages)
        
        let request = ClaudeRequest(
            model: ClaudeAPIConfig.model,
            max_tokens: 300,  // Keep responses concise
            system: fullSystemPrompt,
            messages: messages
        )
        
        do {
            let response = try await sendRequest(request)
            
            // Track cost
            CostTracker.shared.recordUsage(
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                model: ClaudeAPIConfig.model
            )
            
            return AIResponse(
                text: response.content.first?.text ?? "",
                source: .claudeAPI,
                cost: calculateCost(response.usage)
            )
        } catch {
            // Fallback to template response
            return AIResponse(
                text: "I'm having trouble connecting right now. How about we try again in a moment?",
                source: .fallback,
                cost: 0
            )
        }
    }
    
    private func buildUserContext(from context: ConversationContext) -> String {
        var parts: [String] = []
        
        if let mood = context.recentMood {
            parts.append("Recent mood: \(mood.description)")
        }
        if let event = context.upcomingEvent {
            parts.append("Upcoming event: \(event.title) at \(event.time.formatted())")
        }
        if let patterns = context.relevantPatterns, !patterns.isEmpty {
            parts.append("Notable patterns: \(patterns.map { $0.shortDescription }.joined(separator: ", "))")
        }
        if let sleepHours = context.lastNightSleep {
            parts.append("Last night's sleep: \(sleepHours) hours")
        }
        
        return parts.isEmpty ? "No additional context available." : parts.joined(separator: "\n")
    }
    
    private func buildMessages(currentMessage: String, history: [ChatMessage]) -> [[String: String]] {
        var messages: [[String: String]] = []
        
        // Include last 6 messages for context (3 turns)
        for msg in history.suffix(6) {
            messages.append([
                "role": msg.isUser ? "user" : "assistant",
                "content": msg.text
            ])
        }
        
        // Add current message
        messages.append([
            "role": "user",
            "content": currentMessage
        ])
        
        return messages
    }
}
```

**Cost Tracking:**
```swift
class CostTracker {
    static let shared = CostTracker()
    
    @AppStorage("totalAPISpend") private var totalSpend: Double = 0
    @AppStorage("monthlyAPISpend") private var monthlySpend: Double = 0
    @AppStorage("monthlySpendResetDate") private var resetDate: Date = Date()
    
    // Claude pricing (as of 2024)
    private let pricing: [String: (input: Double, output: Double)] = [
        "claude-3-haiku-20240307": (0.00025, 0.00125),      // Per 1K tokens
        "claude-3-5-sonnet-20241022": (0.003, 0.015),
        "claude-sonnet-4-20250514": (0.003, 0.015)
    ]
    
    func recordUsage(inputTokens: Int, outputTokens: Int, model: String) {
        guard let price = pricing[model] else { return }
        
        let cost = (Double(inputTokens) / 1000 * price.input) +
                   (Double(outputTokens) / 1000 * price.output)
        
        checkMonthlyReset()
        totalSpend += cost
        monthlySpend += cost
    }
    
    var formattedMonthlySpend: String {
        String(format: "$%.2f", monthlySpend)
    }
}
```

**Deliverable:**
- Secure Claude API communication
- Moodling persona in system prompt
- Context includes user's patterns and situation
- Cost tracking visible to user

**Test:**
1. "I'm nervous about a party tonight"
   → Claude responds with empathy and preparation tips
2. "I drank too much last night"
   → Claude responds without judgment, gently curious
3. "I'm having thoughts of hurting myself"
   → Crisis response triggers, Claude not called
4. Check Settings → See API usage cost
5. Long conversation → Context maintained across turns

---

## UNIT 18B: Rich User Context Builder

**Goal:** Build a comprehensive context about the user that makes Claude's responses deeply personalized.

**This is what makes Moodling feel like it "knows" the user.**

**What we're building:**
- Context aggregation from all local data
- Smart summarization (not raw data dumps)
- Privacy-preserving context (derived insights, not raw entries)
- Dynamic context based on current situation

**User Context Model:**
```swift
struct UserContext: Codable {
    // Who they are
    var temperament: Temperament?                    // Introvert/extrovert/ambivert
    var sensitivityLevel: SensitivityLevel?          // How they respond to stimulation
    var communicationStyle: CommunicationStyle?      // Direct/gentle/detailed
    
    // Current state
    var recentMoodTrend: MoodTrend?                  // Up/down/stable over 3-7 days
    var currentEnergyLevel: EnergyLevel?             // From recent entries
    var lastNightSleep: Double?                      // Hours
    var todaySteps: Int?                             // Activity level
    var daysIntoWeek: Int?                           // Mon=1, weekend different
    
    // Patterns discovered
    var knownTriggers: [String]                      // "Low sleep", "work stress"
    var knownHelpers: [String]                       // "Walking", "calling mom"
    var substancePatterns: SubstancePattern?         // Recent alcohol/caffeine
    var socialBattery: SocialBatteryLevel?           // Based on recent social activity
    
    // Situational
    var upcomingEvents: [UpcomingEvent]              // Next 24-48 hours
    var recentSignificantEntry: String?              // Key theme from today/yesterday
    var currentSocialExposureLevel: Int?             // 1-8 scale
    
    // What's worked before
    var effectiveCopingStrategies: [String]          // Strategies user rated helpful
    var preferredReflectionStyle: ReflectionStyle?   // Questions vs statements
    
    // Conversation preferences (learned over time)
    var prefersDirectness: Bool?
    var dislikesPlatitudes: Bool?
    var respondsWellToHumor: Bool?
    var needsMoreEncouragement: Bool?
}
```

**Context Builder Service:**
```swift
class UserContextBuilder {
    private let journalStore: JournalStore
    private let patternService: PatternService
    private let healthService: HealthKitService
    private let calendarService: CalendarService
    private let preferencesStore: PreferencesStore
    
    func buildContext() async -> UserContext {
        var context = UserContext()
        
        // Basic profile (set by user or inferred)
        context.temperament = preferencesStore.temperament
        context.communicationStyle = preferencesStore.communicationStyle
        
        // Recent mood from entries
        let recentEntries = await journalStore.entriesFromLastDays(7)
        context.recentMoodTrend = analyzeMoodTrend(recentEntries)
        
        // Health data
        context.lastNightSleep = await healthService.lastNightSleepHours()
        context.todaySteps = await healthService.todaySteps()
        
        // Patterns
        let patterns = await patternService.getActivePatterns()
        context.knownTriggers = patterns.filter { $0.isNegativeCorrelation }.map { $0.factorName }
        context.knownHelpers = patterns.filter { $0.isPositiveCorrelation }.map { $0.factorName }
        
        // Upcoming events
        context.upcomingEvents = await calendarService.socialEventsNext48Hours()
        
        // What's worked
        context.effectiveCopingStrategies = await getFeedbackRatedStrategies(minRating: 4)
        
        // Recent significant theme (summarized, not raw)
        if let recentEntry = recentEntries.first {
            context.recentSignificantEntry = summarizeTheme(recentEntry)
        }
        
        return context
    }
    
    func formatForClaudePrompt(_ context: UserContext) -> String {
        var parts: [String] = []
        
        // Who they are
        if let temperament = context.temperament {
            parts.append("Temperament: \(temperament.description)")
        }
        if let style = context.communicationStyle {
            parts.append("Communication style: \(style.description)")
        }
        
        // Current state
        if let trend = context.recentMoodTrend {
            parts.append("Mood trend (past week): \(trend.description)")
        }
        if let sleep = context.lastNightSleep {
            parts.append("Last night's sleep: \(String(format: "%.1f", sleep)) hours")
        }
        if let steps = context.todaySteps {
            parts.append("Activity today: \(steps) steps")
        }
        
        // Patterns
        if !context.knownTriggers.isEmpty {
            parts.append("Known triggers: \(context.knownTriggers.joined(separator: ", "))")
        }
        if !context.knownHelpers.isEmpty {
            parts.append("What has helped before: \(context.knownHelpers.joined(separator: ", "))")
        }
        
        // Situational
        if !context.upcomingEvents.isEmpty {
            let eventsDesc = context.upcomingEvents.map { "\($0.title) at \($0.time.formatted())" }
            parts.append("Upcoming: \(eventsDesc.joined(separator: "; "))")
        }
        
        // Recent theme
        if let theme = context.recentSignificantEntry {
            parts.append("Recent focus: \(theme)")
        }
        
        // Preferences
        if context.prefersDirectness == true {
            parts.append("Prefers direct communication")
        }
        if context.dislikesPlatitudes == true {
            parts.append("Dislikes generic platitudes")
        }
        
        return parts.isEmpty ? "No additional context available." : parts.joined(separator: "\n")
    }
}
```

**Example Context Sent to Claude:**
```
CONTEXT ABOUT THIS USER:
Temperament: Introvert, sensitive to overstimulation
Communication style: Prefers direct, specific suggestions
Mood trend (past week): Declining slightly
Last night's sleep: 5.5 hours
Activity today: 2,340 steps (lower than usual)
Known triggers: Low sleep, work deadlines, crowded spaces
What has helped before: Walking outside, breathing exercises, calling mom
Upcoming: Sarah's birthday party at 8:30 PM tonight
Recent focus: Feeling disconnected from friends
Prefers direct communication
Dislikes generic platitudes
Social comfort level: 3 (comfortable with brief interactions)
```

**This enables Claude to respond:**
> "A party after a rough sleep week is genuinely hard, especially for someone who finds crowds draining. You mentioned walking helps — would a 10-minute walk before the party feel doable? And remember, you don't have to stay long. What's the minimum time that would feel like a win?"

**Deliverable:**
- Rich context aggregated from all local sources
- Formatted appropriately for Claude system prompt
- Privacy preserved (insights, not raw data)
- Updates dynamically based on current situation

**Test:**
1. Set temperament in onboarding: Introvert
2. Log 3 days of entries with anxiety theme
3. Log poor sleep via HealthKit
4. Add calendar event: "Party tonight 8pm"
5. Start conversation: "I'm nervous"
6. Claude's response references: temperament, sleep, upcoming party, what's helped before
7. Response feels personalized, not generic

---

## UNIT 18C: Anonymized Training Data Collection

**Goal:** Collect anonymized conversation data to train your own model later.

**This is your long-term competitive advantage.**

**What we're building:**
- On-device anonymization engine
- Consent management
- Railway backend for storage
- Data export for model training

**Anonymization Engine:**
```swift
class AnonymizationEngine {
    
    // Patterns to detect and replace
    private let namePattern = /\b[A-Z][a-z]+\b/  // Capitalized words (names)
    private let emailPattern = /\b[\w.+-]+@[\w.-]+\.\w+\b/
    private let phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/
    private let datePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?,?\s*\d{4}\b/i
    private let timePattern = /\b\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)\b/
    private let addressPattern = /\b\d+\s+[\w\s]+\b(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b/i
    
    // Known entities from user's data (built dynamically)
    private var knownNames: Set<String> = []
    private var knownPlaces: Set<String> = []
    
    func anonymize(_ text: String) -> AnonymizedText {
        var result = text
        var replacements: [Replacement] = []
        
        // Replace emails
        result = result.replacing(emailPattern) { match in
            replacements.append(Replacement(original: String(match.0), type: .email))
            return "[EMAIL]"
        }
        
        // Replace phone numbers
        result = result.replacing(phonePattern) { match in
            replacements.append(Replacement(original: String(match.0), type: .phone))
            return "[PHONE]"
        }
        
        // Replace addresses
        result = result.replacing(addressPattern) { match in
            replacements.append(Replacement(original: String(match.0), type: .address))
            return "[ADDRESS]"
        }
        
        // Replace known names (from calendar, contacts if permitted)
        var personCounter = 1
        for name in knownNames {
            if result.contains(name) {
                result = result.replacingOccurrences(of: name, with: "[PERSON_\(personCounter)]")
                replacements.append(Replacement(original: name, type: .name))
                personCounter += 1
            }
        }
        
        // Replace dates with relative terms
        result = result.replacing(datePattern) { match in
            replacements.append(Replacement(original: String(match.0), type: .date))
            return "[DATE]"
        }
        
        // Replace specific times
        result = result.replacing(timePattern) { match in
            replacements.append(Replacement(original: String(match.0), type: .time))
            return "[TIME]"
        }
        
        // Replace location-specific terms
        for place in knownPlaces {
            if result.contains(place) {
                result = result.replacingOccurrences(of: place, with: "[LOCATION]")
                replacements.append(Replacement(original: place, type: .location))
            }
        }
        
        return AnonymizedText(
            original: text,
            anonymized: result,
            replacements: replacements,
            anonymizationScore: calculateScore(replacements.count, textLength: text.count)
        )
    }
    
    // Update known entities from user's calendar/contacts
    func updateKnownEntities(from calendarEvents: [EKEvent]) {
        for event in calendarEvents {
            // Extract names from event titles
            if let title = event.title {
                let words = title.components(separatedBy: " ")
                for word in words where word.first?.isUppercase == true {
                    knownNames.insert(word)
                }
            }
            // Extract locations
            if let location = event.location {
                knownPlaces.insert(location)
            }
        }
    }
}
```

**Training Data Model:**
```swift
struct TrainingDataRecord: Codable {
    let id: UUID
    let timestamp: Date
    let intentCategory: String
    
    // Context (no PII)
    let contextSnapshot: AnonymizedContext
    
    // Conversation
    let anonymizedUserInput: String
    let anonymizedAssistantOutput: String
    
    // Quality signals
    let userFeedback: UserFeedback?
    let conversationOutcome: ConversationOutcome?
    
    struct AnonymizedContext: Codable {
        let temperament: String?
        let moodTrend: String?
        let sleepCategory: String?  // "poor", "fair", "good" not exact hours
        let activityLevel: String?  // "low", "moderate", "high"
        let hasUpcomingEvent: Bool
        let eventType: String?      // "social", "work", "personal"
        let dayOfWeek: Int
        let timeOfDay: String       // "morning", "afternoon", "evening", "night"
    }
    
    struct UserFeedback: Codable {
        let helpfulRating: Int?     // 1-5
        let usedSuggestion: Bool?
        let feltHeard: Bool?
    }
    
    struct ConversationOutcome: Codable {
        let moodBefore: String?     // "negative", "neutral", "positive"
        let moodAfter: String?
        let conversationLength: Int // Number of turns
        let endedNaturally: Bool
    }
}
```

**Consent Manager for Training Data:**
```swift
class TrainingDataConsentManager {
    @AppStorage("trainingDataConsent") private var hasConsent: Bool = false
    @AppStorage("trainingDataConsentDate") private var consentDate: Date?
    @AppStorage("contributionCount") private var contributionCount: Int = 0
    
    var consentStatus: ConsentStatus {
        hasConsent ? .granted(since: consentDate!, contributions: contributionCount) : .notGranted
    }
    
    func requestConsent() -> ConsentRequest {
        ConsentRequest(
            title: "Help Moodling Get Smarter",
            explanation: """
                You can help improve Moodling for everyone by sharing 
                anonymized conversation data.
                
                HOW IT WORKS:
                • Names, places, and dates are automatically removed
                • Your identity is never attached to the data
                • We only collect conversation patterns, not personal details
                • You can stop anytime and request deletion
                
                WHAT WE COLLECT:
                • Anonymized version of conversations
                • Whether responses were helpful
                • General patterns (not personal specifics)
                
                WHY IT MATTERS:
                • Helps us train AI that truly helps people
                • Improves responses for future users
                • Contributes to mental health research
                
                Your privacy is protected by design.
                """,
            examples: [
                AnonymizationExample(
                    before: "I'm worried about seeing my ex Tom at Sarah's party on Friday at 8pm",
                    after: "I'm worried about seeing [PERSON_1] at [PERSON_2]'s [SOCIAL_EVENT] on [DATE] at [TIME]"
                ),
                AnonymizationExample(
                    before: "My therapist Dr. Johnson at 123 Main Street said I should try breathing exercises",
                    after: "My therapist [PERSON_1] at [ADDRESS] said I should try breathing exercises"
                )
            ],
            privacyPolicyURL: URL(string: "https://moodling.app/training-data-privacy")!
        )
    }
    
    func grantConsent() {
        hasConsent = true
        consentDate = Date()
    }
    
    func revokeConsent() {
        hasConsent = false
        // Trigger deletion request to backend
        Task {
            await TrainingDataService.shared.requestDeletion()
        }
    }
}
```

**Railway Backend Service:**
```swift
class TrainingDataService {
    static let shared = TrainingDataService()
    
    private let baseURL = "https://moodling-training.up.railway.app"
    
    func submitTrainingData(_ record: TrainingDataRecord) async throws {
        guard TrainingDataConsentManager().hasConsent else { return }
        
        // Double-check anonymization
        guard record.anonymizedUserInput.contains("[") else {
            // If no anonymization markers, something went wrong - don't submit
            throw TrainingDataError.insufficientAnonymization
        }
        
        let url = URL(string: "\(baseURL)/api/training-data")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(record)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 201 else {
            throw TrainingDataError.uploadFailed
        }
        
        // Update local count
        TrainingDataConsentManager().incrementContributionCount()
    }
    
    func requestDeletion() async {
        // Request deletion of all data associated with this device
        // Uses a device-specific anonymous token, not user identity
    }
}
```

**Railway Backend Schema (PostgreSQL):**
```sql
CREATE TABLE training_data (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context (no PII)
    intent_category VARCHAR(50),
    temperament VARCHAR(20),
    mood_trend VARCHAR(20),
    sleep_category VARCHAR(10),
    activity_level VARCHAR(10),
    has_upcoming_event BOOLEAN,
    event_type VARCHAR(20),
    day_of_week INTEGER,
    time_of_day VARCHAR(10),
    
    -- Anonymized conversation
    anonymized_input TEXT,
    anonymized_output TEXT,
    
    -- Quality signals
    helpful_rating INTEGER,
    used_suggestion BOOLEAN,
    felt_heard BOOLEAN,
    mood_before VARCHAR(20),
    mood_after VARCHAR(20),
    conversation_length INTEGER,
    ended_naturally BOOLEAN,
    
    -- Metadata
    app_version VARCHAR(20),
    model_used VARCHAR(50)
);

-- Index for training queries
CREATE INDEX idx_training_intent ON training_data(intent_category);
CREATE INDEX idx_training_helpful ON training_data(helpful_rating);
CREATE INDEX idx_training_outcome ON training_data(mood_before, mood_after);
```

**Feedback Collection UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Was this helpful?                                             │
│                                                                 │
│  😞  😕  😐  🙂  😊                                             │
│   1   2   3   4   5                                            │
│                                                                 │
│  [Did you try the suggestion?]  [Yes] [No] [Not yet]           │
│                                                                 │
│  This feedback helps Moodling improve.                         │
│  (Only shared if you opted into research)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Deliverable:**
- On-device anonymization before any data leaves
- Explicit consent flow with clear examples
- Railway backend stores anonymized training data
- Feedback collection improves data quality
- User can revoke consent and request deletion

**Test:**
1. Opt into training data contribution
2. Have conversation: "I'm worried about seeing Tom at the party"
3. Check anonymization: "I'm worried about seeing [PERSON_1] at the [SOCIAL_EVENT]"
4. Rate the response as helpful
5. Verify data uploaded to Railway (check backend logs)
6. Revoke consent
7. Verify deletion request sent

---

## UNIT 19: Coaching Conversation UI

**Goal:** Build the chat interface for AI conversations.

**What we're building:**
- Chat bubble UI
- Typing indicator
- Source indicator (🍎 Apple / ☁️ Claude)
- Conversation history
- Quick action buttons

**UI Components:**
```
┌─────────────────────────────────────────┐
│  Talk with Moodling            [Done]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🍎 Here's a summary of your    │   │
│  │ week: You journaled 5 times,   │   │
│  │ mostly in the evenings...      │   │
│  └─────────────────────────────────┘   │
│                                         │
│         ┌─────────────────────────────┐ │
│         │ I'm feeling nervous about  │ │
│         │ the party tonight.         │ │
│         └─────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ☁️ That makes sense - social   │   │
│  │ events can bring up a lot.     │   │
│  │ What feels most uncertain      │   │
│  │ about tonight?                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ●●● typing...                         │
│                                         │
├─────────────────────────────────────────┤
│  QUICK ACTIONS                          │
│  [Prepare for event] [Breathing] [Vent] │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ Type a message...          🎤  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🔒 On-device  ☁️ Uses coaching service │
└─────────────────────────────────────────┘
```

**Source Indicator:**
```swift
struct MessageBubble: View {
    let message: ChatMessage
    
    var sourceIcon: String {
        switch message.source {
        case .appleLLM: return "🍎"
        case .claudeAPI: return "☁️"
        case .template: return "💭"
        case .user: return ""
        }
    }
    
    var sourceTooltip: String {
        switch message.source {
        case .appleLLM: return "Processed on your device"
        case .claudeAPI: return "Uses coaching service"
        case .template: return "Pre-written response"
        case .user: return ""
        }
    }
}
```

**Quick Actions:**
```swift
let quickActions: [QuickAction] = [
    QuickAction(
        label: "Prepare for event",
        prompt: "Help me prepare for my upcoming event",
        icon: "calendar"
    ),
    QuickAction(
        label: "Breathing exercise",
        prompt: "Guide me through a quick breathing exercise",
        icon: "wind"
    ),
    QuickAction(
        label: "Just vent",
        prompt: "I need to get something off my chest",
        icon: "bubble.left"
    ),
    QuickAction(
        label: "Check patterns",
        prompt: "What patterns have you noticed lately?",
        icon: "chart.line.uptrend.xyaxis"
    )
]
```

**Anti-Dependency Features in Chat:**
```swift
class ConversationManager {
    @Published var messages: [ChatMessage] = []
    
    private var turnCount: Int = 0
    private let maxTurnsBeforeNudge = 10
    
    func addResponse(_ response: AIResponse) {
        messages.append(ChatMessage(from: response))
        turnCount += 1
        
        // Anti-dependency: After extended conversation, gently suggest break
        if turnCount >= maxTurnsBeforeNudge && turnCount % 5 == 0 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.messages.append(ChatMessage(
                    text: "We've been talking a while. Would it feel good to take a break and come back later?",
                    source: .system,
                    isAntiDependencyNudge: true
                ))
            }
        }
    }
}
```

**Deliverable:**
- Full chat interface
- Source transparency (user knows what's on-device vs cloud)
- Quick action buttons
- Anti-dependency nudges

**Test:**
1. Open chat, see welcome message
2. Tap "Prepare for event" quick action
3. See response with ☁️ indicator (Claude)
4. Ask "Summarize my entries"
5. See response with 🍎 indicator (Apple)
6. Have 10+ turn conversation
7. See gentle "take a break" nudge appear

---

## UNIT 20: Event-Aware Coaching Conversations

**Goal:** Proactive coaching tied to calendar events.

**The signature Moodling feature: "I'm going to a party at 8:30pm"**

**What we're building:**
- Event detection from user input
- Automatic reminder scheduling
- Pre/during/post event coaching flows
- Practice suggestions

**Event Detection:**
```swift
class EventAwareService {
    
    func detectEventMention(in text: String) -> DetectedEvent? {
        // Use NaturalLanguage for entity extraction
        let tagger = NLTagger(tagSchemes: [.lexicalClass, .nameType])
        tagger.string = text
        
        // Look for time expressions
        let timePattern = /(\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)?)|tonight|tomorrow|this evening/
        
        // Look for event keywords
        let eventKeywords = ["party", "dinner", "date", "meeting", "interview", 
                           "presentation", "wedding", "gathering", "hangout"]
        
        if let timeMatch = text.firstMatch(of: timePattern),
           eventKeywords.contains(where: { text.lowercased().contains($0) }) {
            return DetectedEvent(
                originalText: text,
                detectedTime: parseTime(String(timeMatch.0)),
                eventType: detectEventType(text)
            )
        }
        return nil
    }
    
    func offerEventSupport(for event: DetectedEvent) async -> AIResponse {
        let prompt = """
        The user mentioned: "\(event.originalText)"
        
        This seems to be a social event. Offer to help them:
        1. Prepare mentally beforehand
        2. Set up check-in reminders
        3. Plan a post-event reflection
        
        Be warm and not pushy. Ask if they'd like support.
        """
        
        return await claudeAPI.respond(to: prompt, context: .eventSupport(event))
    }
}
```

**Pre-Event Coaching Flow:**
```swift
struct PreEventCoachingFlow {
    let event: CalendarEvent
    
    let stages: [CoachingStage] = [
        CoachingStage(
            timing: .hoursBeforeEvent(2),
            prompt: """
                Your [EVENT] is in about 2 hours. 
                Let's take a moment to check in.
                
                How are you feeling about it right now?
                """,
            followUps: [
                "What feels most uncertain?",
                "What's one thing you're looking forward to?",
                "What would help you feel more ready?"
            ]
        ),
        CoachingStage(
            timing: .minutesBeforeEvent(30),
            prompt: """
                [EVENT] is coming up soon.
                
                Remember: you don't have to be perfect.
                You just have to show up.
                
                One small thing that might help: [PERSONALIZED_TIP]
                """,
            tips: [
                "Take three slow breaths before you walk in.",
                "Find one person to connect with, not everyone.",
                "It's okay to step outside if you need a moment.",
                "You can leave whenever you need to."
            ]
        )
    ]
}
```

**During-Event Check-In (Optional):**
```swift
struct DuringEventCheckIn {
    // Only if user opted in
    let notification = UNNotificationContent()
    notification.title = "Quick check-in"
    notification.body = "How's it going? Tap if you want to chat."
    notification.interruptionLevel = .passive  // Non-intrusive
    
    // If user opens:
    let prompts = [
        "How are you holding up?",
        "Need a quick breather?",
        "You're doing great. What's one thing going okay?"
    ]
}
```

**Post-Event Reflection:**
```swift
struct PostEventReflection {
    let timing: ReflectionTiming = .nextMorning  // Default
    
    let prompt = """
        Good morning. You had [EVENT] last night.
        
        How are you feeling about it now?
        
        No pressure to analyze - just notice what comes up.
        """
    
    let followUpPrompts = [
        "What went better than expected?",
        "What would you do differently next time?",
        "What did you learn about yourself?",
        "How did your body feel during it?"
    ]
}
```

**Practice Suggestions Engine:**
```swift
class PracticeSuggestionEngine {
    
    func suggestPractices(for eventType: EventType, anxietyLevel: AnxietyLevel) -> [Practice] {
        var practices: [Practice] = []
        
        // Breathing always
        practices.append(Practice(
            name: "Box Breathing",
            duration: "2 minutes",
            description: "4 counts in, 4 hold, 4 out, 4 hold",
            timing: .beforeEvent
        ))
        
        // Social-specific
        if eventType.isSocial {
            practices.append(Practice(
                name: "Arrival Plan",
                duration: "5 minutes",
                description: "Visualize arriving: Where will you go first? Who might you talk to?",
                timing: .hoursBeforeEvent(1)
            ))
            
            practices.append(Practice(
                name: "Exit Strategy",
                duration: "2 minutes", 
                description: "Know how you'll leave if needed. Having an out reduces anxiety.",
                timing: .beforeEvent
            ))
            
            practices.append(Practice(
                name: "One Connection Goal",
                duration: "1 minute",
                description: "Pick one person to have a real conversation with. Quality over quantity.",
                timing: .beforeEvent
            ))
        }
        
        // High anxiety additions
        if anxietyLevel == .high {
            practices.append(Practice(
                name: "Grounding Check-In",
                duration: "1 minute",
                description: "5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.",
                timing: .duringEvent
            ))
        }
        
        return practices
    }
}
```

**Deliverable:**
- Detects event mentions in conversation
- Offers to set up coaching flow
- Schedules appropriate reminders
- Delivers personalized practice suggestions
- Post-event reflection prompts

**Test:**
1. Type "I have a party at 8:30pm tonight"
2. Moodling detects event, offers support
3. Accept → See practice suggestions
4. Reminders scheduled for 2h before, 30min before, next morning
5. Receive pre-event notification with tip
6. Next morning: reflection prompt appears
7. Complete reflection → Entry saved to journal

---

## UNIT 21: Social Exposure Ladder

**Goal:** Graduated support for building social confidence.

**What we're building:**
- Self-assessment of current comfort level
- Progressive challenge suggestions
- Celebration of attempts (not just success)
- Anxiety normalization

**Exposure Levels:**
```swift
enum SocialExposureLevel: Int, CaseIterable {
    case level1 = 1  // Leave the house
    case level2 = 2  // Be around people (cafe, park)
    case level3 = 3  // Brief interaction (order coffee, ask directions)
    case level4 = 4  // Short conversation (chat with cashier, neighbor)
    case level5 = 5  // Extended one-on-one (coffee with a friend)
    case level6 = 6  // Small group (3-5 people)
    case level7 = 7  // Larger gathering (party, event)
    case level8 = 8  // Speaking to a group
    
    var description: String {
        switch self {
        case .level1: return "Leave the house"
        case .level2: return "Be around people"
        case .level3: return "Brief interaction"
        case .level4: return "Short conversation"
        case .level5: return "One-on-one hangout"
        case .level6: return "Small group"
        case .level7: return "Larger gathering"
        case .level8: return "Speaking to a group"
        }
    }
    
    var examples: [String] {
        switch self {
        case .level1: return ["Walk around the block", "Sit on your porch", "Go to your mailbox"]
        case .level2: return ["Sit in a cafe", "Walk through a park", "Browse a bookstore"]
        case .level3: return ["Order a coffee", "Ask for directions", "Return something at a store"]
        // ... etc
        }
    }
    
    var encouragement: String {
        switch self {
        case .level1: return "Just being outside is a win. No interaction required."
        case .level2: return "You don't have to talk to anyone. Just being present counts."
        case .level3: return "These interactions have a natural end. You've got this."
        // ... etc
        }
    }
}
```

**Challenge Suggestions:**
```swift
class ExposureLadderService {
    
    func suggestChallenge(currentLevel: SocialExposureLevel, 
                         recentSuccess: Bool) -> ExposureChallenge {
        
        // Never push more than one level
        let targetLevel = recentSuccess ? 
            min(currentLevel.rawValue + 1, SocialExposureLevel.level8.rawValue) :
            currentLevel.rawValue
        
        let level = SocialExposureLevel(rawValue: targetLevel)!
        
        return ExposureChallenge(
            level: level,
            suggestion: level.examples.randomElement()!,
            encouragement: level.encouragement,
            normalizer: "Feeling nervous is normal and expected. It doesn't mean you can't do this."
        )
    }
    
    func celebrateAttempt(completed: Bool, anxietyBefore: Int, anxietyAfter: Int) -> String {
        if completed {
            if anxietyAfter < anxietyBefore {
                return "You did it, and your anxiety went down! That's how exposure works."
            } else {
                return "You showed up even though it was hard. That's courage."
            }
        } else {
            return "You tried, and that matters. Every attempt builds your capacity."
        }
    }
}
```

**Deliverable:**
- User sets their current comfort level
- App suggests appropriate next step
- Never pushes more than one level
- Celebrates attempts, not just success
- Tracks progress over time

**Test:**
1. Complete social exposure assessment
2. Set current level: 3 (brief interactions)
3. See suggestion for level 3 or 4 challenge
4. Log an attempt (completed or not)
5. See celebration message
6. View progress over time in Insights

---

## UNIT 22: Location-Based Suggestions

**Goal:** Suggest local places aligned with user's temperament and current needs.

**What we're building:**
- Location permission handling
- MapKit place search
- Temperament-based filtering
- Current-state-aware suggestions

**Location Service:**
```swift
class LocationSuggestionService {
    private let locationManager = CLLocationManager()
    
    struct PlaceCategory {
        let name: String
        let mapKitQuery: String
        let suitableFor: [Temperament]
        let suitableStates: [EmotionalState]
    }
    
    let categories: [PlaceCategory] = [
        PlaceCategory(
            name: "Quiet cafes",
            mapKitQuery: "coffee shop",
            suitableFor: [.introvert, .sensitive],
            suitableStates: [.needsCalm, .wantsToBeAroundPeopleQuietly]
        ),
        PlaceCategory(
            name: "Libraries",
            mapKitQuery: "library",
            suitableFor: [.introvert],
            suitableStates: [.needsFocus, .wantsQuietSpace]
        ),
        PlaceCategory(
            name: "Parks",
            mapKitQuery: "park",
            suitableFor: [.introvert, .extrovert],
            suitableStates: [.needsNature, .needsMovement, .needsCalm]
        ),
        PlaceCategory(
            name: "Gyms & fitness",
            mapKitQuery: "gym",
            suitableFor: [.active],
            suitableStates: [.needsMovement, .hasExcessEnergy]
        ),
        PlaceCategory(
            name: "Community classes",
            mapKitQuery: "yoga studio OR art class OR dance studio",
            suitableFor: [.wantsSoftSocial],
            suitableStates: [.wantsStructuredSocial, .wantsToMeetPeople]
        )
    ]
    
    func suggestPlaces(
        temperament: Temperament,
        currentState: EmotionalState,
        location: CLLocation
    ) async -> [PlaceSuggestion] {
        
        let relevantCategories = categories.filter {
            $0.suitableFor.contains(temperament) &&
            $0.suitableStates.contains(currentState)
        }
        
        var suggestions: [PlaceSuggestion] = []
        
        for category in relevantCategories {
            let places = await searchPlaces(
                query: category.mapKitQuery,
                near: location,
                limit: 3
            )
            suggestions.append(contentsOf: places.map {
                PlaceSuggestion(place: $0, category: category.name)
            })
        }
        
        return suggestions
    }
}
```

**Privacy-Preserving Design:**
```swift
// Location is ONLY used on-device
// Never sent to any server
// User can disable anytime

class LocationPrivacyManager {
    @AppStorage("locationEnabled") var isEnabled: Bool = false
    
    func requestPermission() async -> Bool {
        // Show custom explanation first
        let explained = await showExplanation(
            title: "Location helps find nearby places",
            body: """
                Moodling can suggest quiet cafes, parks, or classes near you.
                
                Your location:
                • Stays on your device
                • Is never sent to any server
                • Can be turned off anytime
                
                This is completely optional.
                """
        )
        
        guard explained else { return false }
        
        // Then request system permission
        return await locationManager.requestWhenInUseAuthorization()
    }
}
```

**Deliverable:**
- Location permission with clear explanation
- Place suggestions based on temperament
- Current emotional state affects suggestions
- All processing on-device

**Test:**
1. Enable location in Settings
2. See privacy explanation, grant permission
3. Set temperament: introvert
4. Current state: needs calm
5. See suggestions: quiet cafes, libraries, parks
6. Tap suggestion → Opens in Maps
7. Disable location → Suggestions feature hidden

---

# PART 4: PROJECT SETUP CHECKLIST

When starting, do these steps in order:

```
□ 1. Create new Xcode project
      - iOS App
      - SwiftUI Interface
      - Swift Language
      - Include Tests
      - Product Name: Moodling
      - Bundle ID: com.yourname.moodling
      
□ 2. Set deployment target: iOS 17.0

□ 3. Create folder structure per Unit 0

□ 4. Add Info.plist entries:
      - NSMicrophoneUsageDescription
      - NSCalendarsFullAccessUsageDescription
      - NSHealthShareUsageDescription
      - NSLocationWhenInUseUsageDescription
      
□ 5. Enable capabilities:
      - HealthKit
      - Background Modes (Background fetch)
      
□ 6. Build and run — should show empty app
```

## Claude API Setup (for Unit 18)

When you reach Phase 6, you'll need a Claude API key:

```
□ 1. Go to https://console.anthropic.com
□ 2. Create account or sign in
□ 3. Go to API Keys → Create Key
□ 4. Copy the key (starts with sk-ant-)
□ 5. Store securely — you'll add to Keychain in Unit 18
```

**Recommended Model:**
- **Development:** `claude-3-haiku-20240307` (~$0.00025/1K input)
- **Production:** `claude-3-5-sonnet-20241022` (~$0.003/1K input)

## Railway Setup (for Unit 18C - Training Data)

When you reach Unit 18C, set up Railway for anonymized training data:

```
□ 1. Go to https://railway.app
□ 2. Create account (GitHub login recommended)
□ 3. Create new project → Add PostgreSQL
□ 4. Add new service → Deploy from GitHub or template
□ 5. Set DATABASE_URL environment variable
□ 6. Note your API endpoint URL
```

**Railway Cost:** ~$5-20/month

---

# PART 5: DEBUGGING & TESTING

## Debug Features to Build

For testing, include hidden debug features:

```swift
#if DEBUG
struct DebugView: View {
    var body: some View {
        List {
            Button("Create 14 days of test data") {
                DebugService.createTestData(days: 14)
            }
            Button("Trigger usage warning") {
                DebugService.simulateHighUsage()
            }
            Button("Clear all data") {
                DebugService.clearAllData()
            }
            Button("Advance time 1 day") {
                DebugService.advanceDay()
            }
        }
    }
}
#endif
```

Access via Settings → shake device (debug builds only).

---

# PART 6: REMEMBER THESE ALWAYS

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALWAYS REMEMBER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Every unit must BUILD and RUN before moving to next         │
│                                                                 │
│  2. Every unit must be TESTABLE on real device                  │
│                                                                 │
│  3. Language is ALWAYS compassionate and tentative              │
│                                                                 │
│  4. NEVER diagnose, label, or pathologize                       │
│                                                                 │
│  5. The goal is users needing the app LESS                      │
│                                                                 │
│  6. Privacy is absolute — ALL data stays on device              │
│                                                                 │
│  7. When in doubt, ask the human for clarification              │
│                                                                 │
│  8. End every response with STOPPING HERE and next step         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# START HERE

Say to Claude Code:

> "Let's build Moodling. Start with Unit 0: Project Infrastructure. Create the Xcode project structure and basic tab navigation. Stop when it builds and runs."

Then after each unit works:

> "Unit [N] works. Let's move to Unit [N+1]."

If something breaks:

> "Unit [N] has an error: [paste error]. Help me fix it before we continue."

---

**STOPPING HERE.**
**This mega-prompt is complete.**
**→ Next step: Open Xcode and start Unit 0 with Claude Code.**

