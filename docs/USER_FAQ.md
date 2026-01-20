# Moodling User FAQ

A comprehensive guide answering common questions about using Moodling.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Journaling](#journaling)
3. [Chatting with Moodling](#chatting-with-moodling)
4. [Privacy & Data](#privacy--data)
5. [HealthKit Integration](#healthkit-integration)
6. [Notifications & Insights](#notifications--insights)
7. [Personalization](#personalization)
8. [Crisis Support](#crisis-support)
9. [Technical Questions](#technical-questions)

---

## Getting Started

### What is Moodling?

Moodling is a mental health journaling app with an AI companion. It helps you:
- Journal your thoughts and feelings
- Chat with an empathetic AI that remembers your story
- See patterns and correlations in your mood, sleep, and activity
- Build self-awareness so you can eventually not need the app

### Is Moodling a replacement for therapy?

**No.** Moodling is a journaling companion, not a therapist. It will never:
- Diagnose you with any condition
- Tell you to change medications
- Replace professional mental health care

If you're struggling, Moodling will encourage you to seek professional help.

### How do I set up my API key?

Moodling uses Claude AI, which requires an API key:
1. Go to **Settings** > **API Key**
2. Get a key from [Anthropic](https://console.anthropic.com)
3. Paste your key and save

Your key stays on your device and is never shared.

### How much does it cost to use?

Moodling itself is free. API usage costs depend on how much you chat:
- Light usage: ~$0.50-1/month
- Regular usage: ~$2-5/month
- You can track costs in **Settings** > **Usage**

---

## Journaling

### How do I create a journal entry?

1. Tap the **+** button on the home screen
2. Write your thoughts (text or voice)
3. Tap **Save**

That's it! Moodling will automatically detect the mood and themes.

### Can I use voice to journal?

Yes! Tap the microphone icon to speak your entry. Moodling will transcribe it for you.

### What does Moodling do with my journal entries?

Moodling:
- Stores entries **only on your device**
- Extracts themes and topics to remember your story
- Detects mood to track patterns over time
- Uses context to give you better responses when chatting

Moodling does **not**:
- Send your full entries to any server
- Share your data with anyone
- Use your entries to train AI models

### Can I edit or delete entries?

Yes. Tap any entry to view it, then use **Edit** or **Delete**.

### What are "significant" entries?

Moodling marks entries as significant when they contain important life context like:
- Relationships (partner, family, friends)
- Work/career events
- Health mentions
- Milestones and achievements
- Challenges you're facing

This helps Moodling remember what matters to you.

---

## Chatting with Moodling

### How does Moodling remember things about me?

Moodling builds a **Life Context** from your journal entries over time:
- Key people in your life (partner, therapist, boss, etc.)
- Important events and milestones
- Health journey and medications
- Work situation and challenges
- Hobbies and interests
- Your communication preferences

This lets Moodling give responses that understand YOUR story, not generic advice.

### Why does Moodling use tentative language?

You'll notice Moodling says things like "it seems like" or "I wonder if" rather than definitive statements. This is intentional because:
- Only YOU know your experience
- We don't want to tell you how you feel
- It leaves room for you to correct or clarify

### Can I ask Moodling for advice?

Yes, but Moodling will:
- Help you explore options rather than tell you what to do
- Ask what your gut says
- Encourage you to trust your own wisdom
- Suggest professional help for serious decisions

### What if I just want to vent?

That's totally fine! Just start venting. Moodling will focus on validation and listening rather than problem-solving. You can say "I just need to vent" to make it clear.

### Why does Moodling sometimes suggest stepping away?

Moodling is designed to help you build independence, not dependency. If you've been chatting a while, it might gently suggest:
- Taking a break
- Journaling instead
- Talking to someone in real life
- Trusting your own wisdom

This is a feature, not a bug!

### How do I talk about a specific journal entry?

From the entry detail screen, tap **"Talk about this"**. Moodling will have context about that entry in the chat.

---

## Privacy & Data

### Where is my data stored?

**Everything stays on your device.** Moodling uses local storage only. Your data is never uploaded to our servers.

### Does Moodling send my data to AI servers?

When you chat, Moodling sends:
- Your current message
- Recent chat history (last few messages)
- A **summary** of your life context (not raw journal entries)

This is sent to Anthropic's Claude API with encryption. Anthropic does not use your data for training.

### Can I export my data?

Yes. Go to **Settings** > **Export Data** to download all your:
- Journal entries
- Chat history
- Life context
- Settings

### Can I delete all my data?

Yes. Go to **Settings** > **Delete All Data**. This permanently removes everything from your device.

### Is my API key secure?

Your API key is stored locally on your device. On iOS, we use secure storage. The key is never sent anywhere except directly to Anthropic's API.

---

## HealthKit Integration

### What health data does Moodling use?

If you enable HealthKit, Moodling can access:
- **Heart rate** - Current, resting, and variability
- **Sleep** - Duration, quality, and patterns
- **Activity** - Steps, exercise minutes, active calories

### Why would I connect HealthKit?

Connecting HealthKit allows Moodling to:
- Notice when your heart rate spikes (stress indicator)
- Acknowledge poor sleep might affect your mood
- Point out patterns ("you feel better on active days")
- Send gentle check-ins when your body signals stress

### How does heart rate monitoring work?

When your heart rate spikes significantly above your baseline:
1. Your phone buzzes with a gentle notification
2. The notification asks "What's going on?"
3. You can tap to journal about it
4. This helps you connect physical sensations to emotions

Notifications are rate-limited (max 1 per 30 minutes) to avoid being annoying.

### Does Moodling diagnose health issues?

**Never.** Moodling only describes what it observes:
- "Your heart rate is elevated" (not "you're having a panic attack")
- "You got limited sleep" (not "you have insomnia")
- "You've been less active" (not "you're depressed")

For health concerns, always consult a doctor.

### Can I disable HealthKit?

Yes. Go to **Settings** > **HealthKit** > **Disable**. Moodling works fine without it.

---

## Notifications & Insights

### What notifications will I get?

Moodling can send:
- **Heart rate spike check-ins** - "Your heart rate is up. Want to share what's happening?"
- **Sleep acknowledgments** - "Rough night? Be gentle with yourself today."
- **Pattern insights** - "You tend to feel better after good sleep."
- **Gentle activity suggestions** - "You've been still today. A short walk might help."

### Can I turn off notifications?

Yes. Go to **Settings** > **Notifications** to customize what you receive.

### What are "correlation insights"?

Over time, Moodling tracks patterns between:
- Sleep quality and mood
- Physical activity and mood
- Heart rate and anxiety mentions

When it finds patterns (backed by YOUR data), it shares them:
> "Looking at your data, you tend to feel better on days after good sleep."

This builds your self-knowledge so you can make your own decisions.

### Why does Moodling show me my patterns?

The goal is to help you understand yourself better so you eventually don't need the app. When you know that sleep affects your mood, you can prioritize sleep yourself.

---

## Personalization

### How do I change Moodling's tone?

Go to **Settings** > **Tone Preferences**. You can choose:
- **Warm & nurturing** - Gentle, supportive
- **Direct & practical** - Straightforward, solution-focused
- **Thoughtful & reflective** - Deep, contemplative
- **Encouraging & uplifting** - Positive, motivating

Mix and match to get your ideal communication style.

### Can Moodling remember my preferences?

Yes! If you tell Moodling things like:
- "I prefer direct feedback"
- "Don't sugarcoat things"
- "I just need validation, not advice"

It will remember and adjust its responses.

### How do I correct wrong information?

Just tell Moodling in chat:
- "Actually, Sarah is my sister, not my friend"
- "I quit that job last month"

The life context will update based on new information.

---

## Crisis Support

### What happens if I mention self-harm or suicide?

If you express thoughts of self-harm or suicide, Moodling will immediately:
1. Acknowledge what you shared
2. Provide crisis resources:
   - **988 Suicide & Crisis Lifeline** (call or text)
   - **Crisis Text Line** (text HOME to 741741)
   - International resources

This response comes before any AI processing to ensure you get help fast.

### Does Moodling report me to anyone?

**No.** Moodling does not contact anyone, report to authorities, or share your information. All crisis resources are provided for YOU to use if you choose.

### Is Moodling appropriate for serious mental health issues?

Moodling can be a helpful companion alongside professional treatment, but it's **not a replacement** for:
- Therapy
- Psychiatric care
- Crisis intervention
- Medical treatment

If you're struggling significantly, please reach out to a mental health professional.

---

## Technical Questions

### Which devices is Moodling available on?

Currently iOS (iPhone and iPad). Android support is planned.

### Does Moodling work offline?

- **Journaling**: Yes, fully offline
- **Chatting**: Requires internet connection for AI responses
- **HealthKit**: Works offline, syncs when connected

### How do I update the app?

Update through the App Store like any other app.

### Something isn't working. What should I do?

1. Try closing and reopening the app
2. Check your internet connection (for chat features)
3. Verify your API key is valid in Settings
4. Contact support if issues persist

### How do I give feedback?

We'd love to hear from you! You can:
- Shake the device to report an issue
- Email us at [support email]
- Leave a review on the App Store

---

## Still have questions?

If your question isn't answered here, try asking Moodling directly in the chat - it knows a lot about how it works!

For technical support, contact [support email].
