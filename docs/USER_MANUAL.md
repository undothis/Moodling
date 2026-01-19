# Moodling User Manual

A complete guide to all features and functionality in Moodling.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Core Philosophy](#core-philosophy)
3. [Getting Started](#getting-started)
4. [Journaling](#journaling)
5. [AI Chat Companion](#ai-chat-companion)
6. [Life Context System](#life-context-system)
7. [HealthKit Integration](#healthkit-integration)
8. [Patterns & Insights](#patterns--insights)
9. [Notifications](#notifications)
10. [Settings & Personalization](#settings--personalization)
11. [Privacy & Security](#privacy--security)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is Moodling?

Moodling is a mental health journaling app with an AI companion that truly remembers you. Unlike generic chatbots, Moodling:

- **Remembers your story** - People, events, challenges, and progress
- **Sees patterns** - Connects your mood to sleep, activity, and life events
- **Builds self-awareness** - Helps you understand yourself so you eventually don't need the app
- **Respects your privacy** - All data stays on your device

### Who is Moodling for?

Moodling is designed for anyone who wants to:
- Process thoughts and emotions through journaling
- Have a supportive conversation partner
- Track mood patterns over time
- Build emotional self-awareness
- Complement (not replace) professional mental health care

---

## Core Philosophy

### The Moodling Ethics

Moodling follows strict ethical principles:

#### 1. Never Diagnose
Moodling will never label you with conditions. Instead of "you have anxiety," it says "you've been mentioning feeling anxious lately."

#### 2. Tentative Language
Moodling uses phrases like "it seems," "I wonder if," and "you might notice" because only YOU know your experience.

#### 3. Anti-Dependency
Moodling is designed to help you NOT need it. It:
- Encourages real-world connections
- Celebrates when you solve things yourself
- Suggests stepping away when appropriate
- Builds your self-knowledge so you can be independent

#### 4. Privacy First
Your data never leaves your device. Period.

#### 5. Encourage Professional Help
For serious or persistent struggles, Moodling always encourages seeking professional support.

---

## Getting Started

### Initial Setup

1. **Download Moodling** from the App Store
2. **Open the app** and complete the brief onboarding
3. **Set your tone preferences** (optional - can change later)
4. **Add your API key** in Settings (required for AI chat)

### Setting Up Your API Key

Moodling uses Claude AI, which requires an API key from Anthropic:

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key
5. In Moodling: **Settings** > **API Key** > Paste and save

Your key is stored securely on your device.

### Optional: Enable HealthKit

For enhanced insights, connect HealthKit:

1. Go to **Settings** > **HealthKit**
2. Tap **Enable HealthKit**
3. Allow access to requested health data
4. Moodling will now incorporate health data into insights

---

## Journaling

### Creating Entries

#### Text Entry
1. Tap the **+** button on the home screen
2. Write your thoughts
3. Tap **Save**

#### Voice Entry
1. Tap the **+** button
2. Tap the **microphone icon**
3. Speak your entry
4. Review the transcription
5. Edit if needed, then **Save**

### What Happens When You Save

When you save an entry, Moodling automatically:

1. **Analyzes sentiment** - Detects overall mood (positive, negative, neutral)
2. **Extracts topics** - Identifies people, events, themes
3. **Detects significance** - Marks entries with important life context
4. **Updates life context** - Adds new information to your story

### Entry Features

#### Mood Detection
Each entry shows a mood indicator:
- Color-coded (green = positive, red = negative, gray = neutral)
- Intensity level (very positive, positive, neutral, negative, very negative)

#### Topics & Tags
Entries are automatically tagged with detected topics like:
- People mentioned
- Emotions expressed
- Activities referenced
- Life areas (work, health, relationships)

#### Talk About This
From any entry, tap **"Talk about this"** to start a conversation with Moodling specifically about that entry's content.

### Viewing History

- **Home screen** shows recent entries
- **Timeline view** shows entries chronologically
- **Search** lets you find entries by content
- **Filter** by mood, date range, or topics

---

## AI Chat Companion

### How Chat Works

When you chat with Moodling:

1. Your message is analyzed for crisis keywords (handled first)
2. Context is gathered (life context, health data, conversation history)
3. Your message + context is sent to Claude AI
4. Response is generated and displayed

### Conversation Approach

Moodling follows a consistent approach:

1. **VALIDATE** - Acknowledge your feelings first
2. **EXPLORE** - Ask clarifying questions if needed
3. **SUPPORT** - Offer perspective or techniques
4. **EMPOWER** - End with something that builds your autonomy

### Different Conversation Modes

#### Venting Mode
If you say things like "I just need to vent" or "let me get this off my chest," Moodling focuses purely on validation without problem-solving.

#### Advice Mode
If you ask "what should I do?" or "need advice," Moodling helps explore options while still encouraging your own wisdom.

#### Processing Mode
For exploring complex feelings, Moodling asks gentle questions to help you understand what you're experiencing.

### What Moodling Knows About You

During chat, Moodling has access to:

- **Life Context** - Key people, events, themes from your journaling history
- **Recent Mood** - Your current emotional state
- **Health Data** - Sleep, activity, heart rate (if HealthKit enabled)
- **Conversation History** - Recent messages in current chat
- **Your Preferences** - Communication style, tone preferences

### Response Characteristics

Moodling responses are:
- **Concise** - Usually 2-4 sentences
- **Focused** - One question at most per response
- **Tentative** - Uses "it seems," "I wonder if"
- **Empowering** - Encourages your own wisdom

### Crisis Handling

If you mention self-harm, suicide, or crisis:
1. Moodling immediately provides crisis resources
2. 988 Suicide & Crisis Lifeline
3. Crisis Text Line
4. International resources
5. This happens BEFORE any AI processing

---

## Life Context System

### What is Life Context?

Life Context is Moodling's memory of your story. It extracts and remembers:

#### People
- Family (mom, dad, siblings, etc.)
- Romantic partners
- Friends
- Coworkers, bosses
- Therapists, doctors

#### Topics & Themes
- Health journey (conditions, medications, treatments)
- Work/career situation
- Financial circumstances
- Living situation
- Hobbies and interests

#### Events & Milestones
- Achievements
- Losses
- Major life changes
- Relationship events
- Health events

#### Patterns
- Coping mechanisms (healthy and unhealthy)
- Temporal patterns (Sunday scaries, seasonal moods)
- Recurring themes

### How Life Context is Built

Life Context builds automatically from your journal entries:

1. **Keyword detection** - 600+ keywords across 30+ categories
2. **Entity extraction** - Names, ages, locations, medications
3. **Pattern recognition** - Recurring themes and behaviors
4. **Sentiment tracking** - How topics make you feel over time

### Viewing Your Life Context

Go to **Settings** > **Life Context** to see:
- Key people and relationships
- Active topics and themes
- Recent milestones
- Detected patterns

### Correcting Information

If Moodling gets something wrong, just tell it in chat:
- "Actually, Sarah is my therapist, not my friend"
- "I'm not married anymore, we divorced"

The context will update based on new information.

---

## HealthKit Integration

### Available Health Data

When enabled, Moodling accesses:

#### Heart Rate
- Current heart rate
- Resting heart rate (baseline)
- Heart rate variability (HRV)
- Recent heart rate trends

#### Sleep
- Total sleep duration
- Sleep quality indicators
- Awakenings during night
- Sleep trends over time

#### Activity
- Daily steps
- Exercise minutes
- Active calories
- Activity trends

### Heart Rate Spike Detection

Moodling monitors your heart rate for significant spikes:

1. **Baseline tracking** - Learns your normal resting heart rate
2. **Spike detection** - Notices when HR goes 30%+ above baseline
3. **Smart notifications** - Sends a check-in (max 1 per 30 min)
4. **Journaling prompt** - Asks if you want to share what's happening

This helps you connect physical sensations to emotional experiences.

### Sleep Impact Awareness

When you chat, Moodling considers your sleep:
- Acknowledges if you had poor sleep
- Notes it might affect how you're feeling
- Doesn't make assumptions, just observations

### Activity Correlation

Moodling tracks how activity relates to mood:
- Notes if you've been more/less active than usual
- May gently suggest movement as self-care
- Points out patterns if you feel better on active days

---

## Patterns & Insights

### Correlation Tracking

Moodling tracks correlations over 90 days:

#### Sleep-Mood Correlation
- Compares mood scores on good sleep vs. poor sleep nights
- Identifies if you consistently feel better with more sleep

#### Activity-Mood Correlation
- Compares mood scores on active vs. sedentary days
- Identifies if movement improves your wellbeing

### Insight Types

Moodling generates several insight types:

#### Heart Rate Check-ins
> "Your heart rate is elevated. Want to share what's going on?"

#### Sleep Acknowledgments
> "Rough night? Only 5 hours of sleep. Be gentle with yourself today."

#### Activity Suggestions
> "You've been still today. A short walk might help shift things."

#### Pattern Discoveries
> "Looking at your data, you tend to feel better on days after good sleep."

#### Positive Reinforcement
> "Good sleep, some movement - you're taking care of yourself."

### How Insights Are Used

Insights can:
1. Appear as popup notifications
2. Be referenced in chat conversations
3. Help you see your own patterns
4. Build self-awareness over time

---

## Notifications

### Notification Types

#### Heart Rate Spike
- Triggers when HR spikes above threshold
- Rate-limited to 1 per 30 minutes
- Asks "What's going on?"

#### Sleep Check-in
- Triggers after poor sleep detected
- Acknowledges difficulty
- Encourages self-compassion

#### Activity Nudge
- Triggers when significantly below average activity
- Gentle suggestion, not prescription
- Easy to dismiss

#### Pattern Insight
- Triggers when new correlation is discovered
- Shows data-backed pattern
- Encourages self-reflection

### Notification Settings

Customize in **Settings** > **Notifications**:
- Enable/disable each type
- Adjust frequency
- Set quiet hours
- Choose notification style

---

## Settings & Personalization

### Tone Preferences

Choose how Moodling communicates:

#### Warm & Nurturing
Gentle, supportive, comforting language.
> "That sounds really hard. You're carrying a lot right now."

#### Direct & Practical
Straightforward, solution-focused.
> "Here's what I'm noticing. What do you want to do about it?"

#### Thoughtful & Reflective
Deep, contemplative, philosophical.
> "I wonder what this brings up for you. There might be something underneath..."

#### Encouraging & Uplifting
Positive, motivating, celebratory.
> "Look at you showing up for yourself! That takes courage."

You can select multiple styles to blend.

### API Settings

- **API Key** - Add or update your Claude API key
- **Model Selection** - Choose Claude model (Haiku for fast/cheap, Sonnet for higher quality)
- **Usage Tracking** - View monthly and total API costs

### Privacy Settings

- **Export Data** - Download all your data
- **Delete All Data** - Permanently remove everything
- **Life Context** - View or clear stored context

### HealthKit Settings

- **Enable/Disable** - Turn HealthKit integration on/off
- **Heart Rate Threshold** - Adjust spike detection sensitivity
- **Data Types** - Choose which health data to share

---

## Privacy & Security

### Data Storage

**All data is stored locally on your device:**
- Journal entries
- Chat history
- Life context
- Settings and preferences
- Health data (cached)

### What's Sent to AI

When you chat, Moodling sends:
- Your current message
- Recent conversation history (last ~6 messages)
- A **compressed summary** of life context (not raw entries)
- Current health snapshot (if enabled)

This is sent encrypted to Anthropic's API.

### What's NOT Sent

- Full text of all journal entries
- Your API key to anyone but Anthropic
- Data to Moodling servers (we don't have any)
- Information to third parties

### Anthropic's Privacy

Anthropic (Claude's maker) has committed to:
- Not using API data for training
- Encrypting data in transit and at rest
- Deleting conversation data after processing

### Your Rights

You can always:
- Export all your data
- Delete all your data
- Disable any feature
- Revoke HealthKit access
- Remove your API key

---

## Troubleshooting

### Chat Not Working

**Check your API key:**
1. Go to Settings > API Key
2. Verify key is entered correctly
3. Test with a new key if needed

**Check internet connection:**
- Chat requires internet to reach Claude API

**Check API credits:**
- Ensure your Anthropic account has credits

### HealthKit Not Syncing

1. Go to Settings > Privacy > Health
2. Verify Moodling has access
3. Disable and re-enable in Moodling settings

### App Running Slowly

1. Clear old chat history
2. Rebuild life context (Settings > Life Context > Rebuild)
3. Restart the app

### Notifications Not Working

1. Check iOS Settings > Notifications > Moodling
2. Ensure notifications are enabled in app settings
3. Check quiet hours aren't active

### Wrong Information in Context

Tell Moodling the correct information in chat:
> "I want to correct something - [correct info]"

The life context will update.

### Data Loss Concerns

Your data is stored locally. To protect it:
- Regular iOS backups include app data
- Use Export Data feature periodically
- Consider iCloud backup

---

## Getting Help

### In-App Support
Shake your device to report an issue with context attached.

### Contact
Email: [support email]

### Community
Join our community to share tips and feedback: [community link]

---

## Appendix: Keyboard Shortcuts (iPad)

| Shortcut | Action |
|----------|--------|
| Cmd + N | New journal entry |
| Cmd + Return | Send chat message |
| Cmd + , | Open settings |

---

*Moodling - Your companion for emotional wellness and self-discovery.*
