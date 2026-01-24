/**
 * User Guide Content
 *
 * Single source of truth for FAQ and User Manual content.
 * Update this file to sync content across the app.
 *
 * This mirrors docs/USER_FAQ.md and docs/USER_MANUAL.md
 */

// ============================================
// FAQ - Quick answers to common questions
// ============================================

export interface FAQItem {
  question: string;
  answer: string;
  category: 'basics' | 'guide' | 'privacy' | 'features';
}

export const FAQ_CONTENT: FAQItem[] = [
  // Basics
  {
    category: 'basics',
    question: 'What is the tree?',
    answer: 'Your tree is a visual representation of your emotional journey. Each journal entry becomes a leaf, and patterns form branches over time.',
  },
  {
    category: 'basics',
    question: 'What are Fireflies?',
    answer: 'Fireflies are Personal wisdom—AI-generated insights written specifically for you. They reference your life: your mom, your job, your patterns. They change as your life changes.',
  },
  {
    category: 'basics',
    question: 'What are Sparks?',
    answer: 'Sparks are Universal wisdom—210+ curated prompts from a pre-written library. Like a book of quotes, they speak to universal human experience. What adapts is selection: the right Spark finds you based on your mood.',
  },
  {
    category: 'basics',
    question: 'Sparks vs Fireflies—what\'s the difference?',
    answer: 'Sparks are Universal (pre-written, for everyone), Fireflies are Personal (AI-generated, just for you). Sparks are like a book of timeless quotes; Fireflies are like a note from a friend who knows your situation.',
  },
  {
    category: 'basics',
    question: 'What are Twigs?',
    answer: 'Twigs are quick logs for when you don\'t have time for a full entry. Track mood, sleep, or energy with just a tap.',
  },

  // Guide & Adaptation
  {
    category: 'guide',
    question: 'What are Personas?',
    answer: 'Your guide has 7 nature-themed personalities: Clover (warm & casual), Spark (energetic), Willow (wise), Luna (mindful), Ridge (goal-focused), Flint (direct), and Fern (nurturing). Pick one during onboarding or change anytime in Coach Settings.',
  },
  {
    category: 'guide',
    question: 'How does my guide adapt?',
    answer: 'With Adaptive Mode on, your guide can shift personalities based on your mood (anxious → calming Luna, sad → nurturing Fern). It also adjusts energy throughout the day—more energizing in the morning, calmer at night.',
  },
  {
    category: 'guide',
    question: 'What is Chronotype?',
    answer: 'Your natural rhythm—early bird, normal, or night owl. Your guide respects this: night owls won\'t get "wind down" pressure at 10pm if that\'s their productive time. Set this during onboarding or in Coach Settings.',
  },
  {
    category: 'guide',
    question: 'What are Mood-to-Persona Switches?',
    answer: 'Automatic personality shifts based on what you\'re sharing. Feeling anxious? Your guide becomes more calming (like Luna). Feeling sad? More nurturing (like Fern). These are personalized based on your onboarding answers.',
  },
  {
    category: 'guide',
    question: 'Do Sparks adapt to my guide?',
    answer: 'Yes! Sparks match your guide\'s personality. Spark (the persona) delivers prompts with high energy, while Luna offers them contemplatively. The same creative prompt feels different based on who\'s sharing it with you.',
  },
  {
    category: 'guide',
    question: 'Can I change my chronotype over time?',
    answer: 'Yes! If you\'re a night owl wanting to become more of a morning person, your guide can help you gradually shift. It will adjust energy and encouragement to support your transition, gently nudging earlier wind-downs and celebrating morning wins.',
  },
  {
    category: 'guide',
    question: 'Does the guide help with jet lag?',
    answer: 'After travel, your guide notices when your rhythm is off and adjusts accordingly. It won\'t pressure you to be energetic when you\'re exhausted, and it can offer tips to help you readjust to your new time zone gradually.',
  },
  {
    category: 'guide',
    question: 'How does travel tracking work?',
    answer: 'During onboarding, you\'ll share how often you travel across time zones. If you travel frequently, your guide knows your rhythm may be chronically disrupted. After specific trips, it can detect jet lag and adjust for up to 2-3 weeks while you readjust.',
  },
  {
    category: 'guide',
    question: 'What gets compressed and sent to AI?',
    answer: 'Your chronotype, rhythm transitions, recent travel, and Twigs tracking are all compressed into brief summaries. Example: "Night owl transitioning to early bird, 12 days in. Meditation: 5 day streak. Morning meds: taken today." No raw journal text is sent.',
  },
  {
    category: 'guide',
    question: 'Does my guide know about my Twigs (tracking)?',
    answer: 'Yes! Your guide sees your habit streaks, medication tracking, and symptom logs. It can reference your progress ("You\'ve meditated 5 days in a row!") and offer support around your actual habits and goals.',
  },

  // Privacy
  {
    category: 'privacy',
    question: 'Is my data private?',
    answer: 'Yes! All journal entries and patterns stay on your device. Only coaching messages are sent to Claude\'s API (if enabled), and they\'re not stored.',
  },
  {
    category: 'privacy',
    question: 'What data is sent to AI?',
    answer: 'Only your current message and a compressed summary of context (not raw journal entries). This is sent encrypted to Anthropic\'s API for processing, then deleted.',
  },

  // Features
  {
    category: 'features',
    question: 'How do I change my guide\'s personality?',
    answer: 'Go to Settings > Coach Settings > Choose Persona. You can also give your guide a custom name and toggle Adaptive Mode on/off.',
  },
  {
    category: 'features',
    question: 'Can I redo the onboarding?',
    answer: 'Yes! Go to Settings > Help & FAQ > Redo Onboarding to start fresh with new preferences.',
  },

  // Calendar Integration
  {
    category: 'features',
    question: 'How does Calendar integration work?',
    answer: 'When enabled, your guide can see your upcoming events—meetings, travel, deadlines. It can offer support before a big presentation, notice when you\'re overbooked, and adapt to jet lag after trips.',
  },
  {
    category: 'features',
    question: 'What calendar info does my guide see?',
    answer: 'Event titles, times, and locations for the next 7 days. It detects travel (flights, timezone changes), important events (interviews, appointments), and your overall busyness level. Event contents/notes are not shared.',
  },
  {
    category: 'privacy',
    question: 'Is my calendar data private?',
    answer: 'Yes. Calendar data stays on your device. Only brief summaries ("interview tomorrow at 2pm") are included in AI context when you chat. You can disable calendar integration anytime in Settings.',
  },

  // Cycle & PMS Tracking
  {
    category: 'features',
    question: 'How does cycle tracking work?',
    answer: 'Enable cycle tracking in Settings to log your period and symptoms. The entire app adapts to your cycle—your guide becomes gentler, Sparks shift to soothing prompts, Fireflies offer cycle-aware wisdom, and special Twigs help you track symptoms.',
  },
  {
    category: 'features',
    question: 'How do Sparks change during PMS?',
    answer: 'During your premenstrual phase, Sparks shift to gentler, more soothing prompts. Less "push yourself" energy, more "be gentle with yourself" wisdom. The creative prompts become softer, more introspective, and acknowledge that this isn\'t the time for big challenges.',
  },
  {
    category: 'features',
    question: 'What Fireflies appear during my cycle?',
    answer: 'Fireflies become cycle-aware—offering insights like "Your anxiety often peaks around day 24, and it always passes" or "Last month you felt this way too, and a warm bath helped." Personal wisdom that connects your mood to your body\'s rhythm.',
  },
  {
    category: 'features',
    question: 'What Twigs are available for cycle tracking?',
    answer: 'Special cycle Twigs include: Period start/end, Flow level, Cramps, Bloating, Breast tenderness, Headache, Mood shifts, Cravings, Energy level, and Sleep quality. Track what matters to you and see patterns emerge over months.',
  },
  {
    category: 'features',
    question: 'How do I add cycle Twigs?',
    answer: 'In Settings > Cycle & Period, tap "Add Cycle Twigs" to enable all period-related tracking buttons at once. Or pick individual symptoms. They\'ll appear in your Twigs section ready to tap.',
  },
  {
    category: 'features',
    question: 'Does my guide know where I am in my cycle?',
    answer: 'Yes! Your guide sees your cycle phase and adapts accordingly. During PMS it\'s gentler and validates physical discomfort. During your period it acknowledges energy dips. It learns YOUR patterns—not generic averages—and meets you where you are.',
  },
  {
    category: 'features',
    question: 'What is the Quick Symptom button?',
    answer: 'When cycle tracking is enabled, a quick-access button appears on your home screen during your period. One tap to log cramps, flow, energy, or other symptoms—no navigating through menus. Toggle this in Settings > Cycle Tracking.',
  },
  {
    category: 'features',
    question: 'Can I customize which cycle features are on?',
    answer: 'Yes! In Settings > Cycle & Period, you control everything: Quick Symptom button, which Twigs appear, soothing Sparks during PMS, cycle-aware Fireflies, and how much your guide adapts. Not everyone has heavy periods—customize what\'s helpful for you.',
  },
  {
    category: 'features',
    question: 'How do I turn off cycle tracking completely?',
    answer: 'In Settings > Cycle & Period, toggle off "Cycle Tracking" at the top. This disables everything—Quick Symptom button, cycle Twigs, soothing Sparks, Fireflies, and guide adaptation. Your data is kept in case you re-enable later.',
  },
  {
    category: 'features',
    question: 'Can I get cycle reminders?',
    answer: 'Yes! Enable reminders in Settings > Cycle & Period. Get notified when your period is approaching, when PMS typically starts, or gentle reminders to log symptoms. Choose between push notifications or in-app alerts (Firefly blinks to get your attention).',
  },
  {
    category: 'features',
    question: 'How do I turn off period notifications?',
    answer: 'In Settings > Cycle Tracking > Notifications, there\'s a master on/off switch for all period-related notifications. One tap turns them all off (or back on). Keep cycle tracking enabled but silence the alerts.',
  },
  {
    category: 'features',
    question: 'What is a Firefly alert?',
    answer: 'Instead of a push notification, a Firefly can gently blink on your home screen to alert you. Tap it for cycle-related wisdom like "Your period is predicted in 2 days" or "PMS usually starts around now for you." Less intrusive than notifications.',
  },
  {
    category: 'features',
    question: 'Does cycle tracking sync with Apple Health?',
    answer: 'Yes! With HealthKit enabled, Mood Leaf reads your cycle data from Apple Health (synced from apps like Clue, Flo, or Apple\'s Cycle Tracking). It can also write your logs back. One source of truth across all your health apps.',
  },

  // Life Stages & Menopause
  {
    category: 'features',
    question: 'What life stages does the app support?',
    answer: 'Mood Leaf adapts to your current life stage: Regular Cycles (standard tracking), Perimenopause (irregular cycles, transition symptoms), Menopause (no periods, symptom focus), Post-Menopause (wellness maintenance), Pregnant (trimester tracking), and Postpartum (recovery support). Switch anytime in Settings.',
  },
  {
    category: 'features',
    question: 'How do I switch to menopause mode?',
    answer: 'Go to Settings > Cycle Tracking > Life Stage and select "Menopause" or "Perimenopause". Period tracking adjusts—no more period predictions during menopause, but you can still track symptoms like hot flashes, night sweats, and mood changes.',
  },
  {
    category: 'features',
    question: 'What symptoms can I track during perimenopause/menopause?',
    answer: 'Track hot flashes, night sweats, sleep disturbances, brain fog, mood changes, anxiety, joint pain, heart palpitations, and libido changes. Your guide understands this transition and offers extra compassion during difficult symptoms.',
  },
  {
    category: 'features',
    question: 'Does the app support pregnancy?',
    answer: 'Yes! Select "Pregnant" as your life stage and set your due date. Period tracking pauses automatically. Your guide becomes trimester-aware—understanding first trimester exhaustion, second trimester energy, and third trimester preparation.',
  },
  {
    category: 'features',
    question: 'Can I track fertility/ovulation?',
    answer: 'Yes, optionally. Enable "Track Fertility Window" in Settings > Cycle Tracking. The app highlights your predicted fertile window based on your cycle history. You can also get optional ovulation reminders. All data stays on your device.',
  },
  {
    category: 'features',
    question: 'Can I set contraception reminders?',
    answer: 'Yes! Set daily pill reminders, IUD check dates, implant renewal reminders, or ring/patch change alerts in Settings > Cycle Tracking > Contraception. Choose your reminder time and the app will notify you.',
  },

  // Personalization & Onboarding
  {
    category: 'guide',
    question: 'What personal info does onboarding ask?',
    answer: 'During setup, we ask your first name (so your guide can address you personally), your preferred pronouns (so responses feel right), and whether you experience menstrual cycles (to enable cycle-aware adaptation). All optional, all changeable later.',
  },
  {
    category: 'guide',
    question: 'Why does the app ask about pronouns?',
    answer: 'Your guide uses pronouns when reflecting back to you ("You mentioned you were feeling..."). Getting this right makes conversations feel natural and respectful. You can change this anytime in Settings.',
  },
];

// ============================================
// USER MANUAL - Comprehensive guide sections
// ============================================

export interface ManualSection {
  id: string;
  emoji: string;
  title: string;
  content: string;
  subsections?: {
    title: string;
    content: string;
  }[];
}

export const USER_MANUAL_CONTENT: ManualSection[] = [
  {
    id: 'introduction',
    emoji: '🌳',
    title: 'Welcome to Mood Leaf',
    content: 'Mood Leaf is a mental health journaling app with an AI companion that truly remembers you. Unlike generic chatbots, Mood Leaf remembers your story, sees patterns, and builds self-awareness—all while keeping your data private on your device.',
    subsections: [
      {
        title: 'What makes it different',
        content: '• Remembers your story - people, events, challenges, progress\n• Sees patterns - connects mood to sleep, activity, life events\n• Builds self-awareness - helps you understand yourself\n• Respects privacy - all data stays on your device',
      },
      {
        title: 'The whole app adapts',
        content: 'Every part of Mood Leaf evolves with you:\n• Your Guide - Personality shifts based on mood, time, and what\'s helped before\n• Sparks - Mood-matched prompts from a universal library\n• Fireflies - AI regenerates personal wisdom using your latest context\n• Life Context - Grows automatically as you journal\n• Psych Profile - Updates based on new patterns\n• Health Insights - Correlations improve with more data\n\nThe longer you use Mood Leaf, the more it knows you.',
      },
    ],
  },
  {
    id: 'tree',
    emoji: '🌿',
    title: 'Your Tree',
    content: 'The tree is the heart of Mood Leaf. It\'s a living visualization of your emotional journey that grows with you over time.',
    subsections: [
      {
        title: 'Leaves',
        content: 'Each journal entry becomes a leaf. Different moods create different colored leaves. Tap leaves to revisit past entries.',
      },
      {
        title: 'Branches',
        content: 'As you journal more, branches form showing patterns in your moods and thoughts. No judgment—patterns are just information.',
      },
      {
        title: 'Growth',
        content: 'Your tree grows through stages: sapling → rooting → grounded → flourishing. Growth reflects consistent use, not "good" moods.',
      },
    ],
  },
  {
    id: 'guide',
    emoji: '💬',
    title: 'Your AI Guide',
    content: 'Your AI guide is available for coaching conversations whenever you need support or want to process something. Talk via text or have a natural voice conversation.',
    subsections: [
      {
        title: 'Voice Conversation',
        content: 'Tap the record button and just talk. With auto-send on, your guide responds with both text and voice—like a real conversation. Say "bye" or "see ya" when you\'re done, or tap the button again to end.',
      },
      {
        title: 'Guided Skills',
        content: 'When you need help with breathing, grounding, or other exercises, your guide walks you through them right in the conversation. A visual appears over the chat while your guide narrates—you never leave the conversation.',
      },
      {
        title: 'Conversation Practice',
        content: 'Need to rehearse a difficult conversation? Just ask. Your guide becomes the other person—your boss, a friend, a family member—and roleplays with you. They\'ll break character to give feedback and let you try again.',
      },
      {
        title: 'The 7 Personas',
        content: '🍀 Clover - Warm, casual, relatable (your lucky friend)\n✨ Spark - Energetic, motivating, uplifting (your cheerleader)\n🌿 Willow - Calm, wise, reflective (the sage)\n🌙 Luna - Mindful, grounding, present (the mystic)\n⛰️ Ridge - Focused, goal-oriented, practical (the coach)\n🔥 Flint - Direct, honest, no-nonsense (straight shooter)\n🌱 Fern - Gentle, soft, nurturing (the nurturer)',
      },
      {
        title: 'Adaptive Mode',
        content: 'When on, your guide automatically adjusts based on:\n• Your mood - shifts persona to match what you need\n• Time of day - energizing morning, calming night\n• Your chronotype - respects early bird vs night owl rhythm',
      },
      {
        title: 'Mood-to-Persona Switches',
        content: 'Your guide can temporarily shift personality:\n• Feeling anxious → More calming (Luna)\n• Feeling sad → More nurturing (Fern)\n• Feeling frustrated → More direct (Flint)\n• Feeling great → More energetic (Spark)\n\nThese are personalized based on your onboarding answers.',
      },
      {
        title: 'Chronotype Awareness',
        content: 'Your natural rhythm affects how your guide responds:\n• Early Bird - Full energy mornings, wind down earlier\n• Normal - Standard day rhythm\n• Night Owl - Low-key mornings, engaged evenings',
      },
      {
        title: 'Changing Your Chronotype',
        content: 'Want to shift your rhythm? Your guide can help you transition gradually:\n• Encourages earlier wind-downs over time\n• Celebrates morning check-ins\n• Adjusts expectations patiently\n• Supports setbacks without judgment',
      },
      {
        title: 'Jet Lag Support',
        content: 'After travel, your guide adapts to help you readjust:\n• Recognizes when your rhythm is disrupted\n• Doesn\'t pressure energy when you\'re exhausted\n• Offers tips for gradual adjustment\n• Supports your body\'s natural recalibration',
      },
    ],
  },
  {
    id: 'fireflies',
    emoji: '✨',
    title: 'Fireflies (Personal Wisdom)',
    content: 'Fireflies are Personal wisdom—AI-generated insights written specifically for you. They reference your life: your mom, your job, your patterns, your journey. They change as your life changes.',
    subsections: [
      {
        title: 'How they work',
        content: 'Tap a firefly to receive personalized wisdom. The AI draws from your journal patterns, life context, psychological profile, and current situation to generate insights that speak directly to you.',
      },
      {
        title: 'Why they\'re different',
        content: 'A generic app might say "Take time for yourself." Fireflies say "Your mom\'s visit is next week—maybe that walk by the river would help you reset before?" They know your story.',
      },
    ],
  },
  {
    id: 'sparks',
    emoji: '💡',
    title: 'Sparks (Universal Wisdom)',
    content: 'Sparks are Universal wisdom—210+ curated prompts from a pre-written library inspired by Brian Eno\'s Oblique Strategies. They speak to universal human experience. What adapts is selection: the right Spark finds you.',
    subsections: [
      {
        title: 'Creative Categories',
        content: '• For Artists - Visual creative unblocking\n• For Musicians - Sonic exploration prompts\n• Walking - Contemplations for when you\'re in motion\n• Funny - Absurdist humor to break the spell\n• Strange - Weird perspectives to jar you loose',
      },
      {
        title: 'Adaptive Selection',
        content: 'Sparks adapt to your mood and time of day. Anxious at 11pm? You\'ll see grounding prompts. Energetic in the morning? More action-oriented ones. The library is universal, but selection is personal.',
      },
      {
        title: 'Universal vs Personal',
        content: 'Sparks = Universal (like a book of quotes—timeless, you find the right one)\nFireflies = Personal (like a friend\'s note—written knowing your situation)\n\nBoth adapt. Sparks adapt which prompt finds you. Fireflies adapt the content itself.',
      },
    ],
  },
  {
    id: 'twigs',
    emoji: '🌱',
    title: 'Twigs (Quick Logs)',
    content: 'Twigs are quick logs for when you don\'t have time for a full journal entry. Track mood, sleep, energy, or custom metrics with just a tap.',
    subsections: [
      {
        title: 'Types of Twigs',
        content: '• Habit building - Track habits you want to build\n• Habit breaking - Track habits you want to reduce\n• Symptoms - Log how you\'re feeling\n• Medications - Track med adherence\n• Custom - Anything you want to track',
      },
    ],
  },
  {
    id: 'privacy',
    emoji: '🔒',
    title: 'Privacy & Security',
    content: 'Your privacy is fundamental to Mood Leaf. Everything stays on your device.',
    subsections: [
      {
        title: 'What stays on device',
        content: '• All journal entries\n• Chat history\n• Life context & patterns\n• Settings and preferences\n• Health data (if enabled)',
      },
      {
        title: 'What\'s sent to AI',
        content: 'When you chat, only these are sent (encrypted):\n• Your current message\n• Recent conversation (last ~6 messages)\n• Compressed summary of context (not raw entries)\n\nAnthropic doesn\'t store or train on this data.',
      },
    ],
  },
  {
    id: 'settings',
    emoji: '⚙️',
    title: 'Settings & Customization',
    content: 'Customize your Mood Leaf experience in Settings.',
    subsections: [
      {
        title: 'Coach Settings',
        content: '• Choose Persona - Pick your guide\'s personality\n• Custom Name - Give your guide a personal name\n• Adaptive Mode - Toggle automatic adjustments\n• Chronotype - Set your natural rhythm\n• Detailed Settings - Fine-tune communication style',
      },
      {
        title: 'Tone Preferences',
        content: '• Warm & Nurturing - Gentle, supportive\n• Direct & Practical - Straightforward\n• Thoughtful & Reflective - Contemplative\n• Encouraging & Uplifting - Motivating',
      },
    ],
  },
  {
    id: 'calendar',
    emoji: '📅',
    title: 'Calendar Integration',
    content: 'Connect your iOS Calendar so your guide understands your schedule. A packed week feels different than an open one. An interview tomorrow creates different anxiety than a free weekend.',
    subsections: [
      {
        title: 'What your guide sees',
        content: '• Today\'s events - Meetings, appointments, deadlines\n• Week overview - Schedule density and busyness level\n• Travel events - Flights, trips, timezone changes\n• Important events - Interviews, doctor visits, deadlines',
      },
      {
        title: 'How it helps',
        content: '• Acknowledges busy periods ("You have a packed week")\n• Prepares you for important events ("Interview tomorrow?")\n• Detects travel and anticipates jet lag\n• Understands context without you explaining',
      },
      {
        title: 'Travel & jet lag',
        content: 'When your calendar shows travel:\n• Your guide notices timezone changes\n• Adjusts expectations during recovery\n• Connects with chronotype awareness\n• Doesn\'t pressure you when you\'re adjusting',
      },
      {
        title: 'Privacy',
        content: 'Only event titles, times, and locations are read. Data stays on your device. We never see or store your calendar. You can disable anytime in Settings.',
      },
    ],
  },
  {
    id: 'cycle',
    emoji: '🌙',
    title: 'Cycle Tracking',
    content: 'For those who experience menstrual cycles, the entire app adapts to your rhythm. Your guide becomes gentler during PMS, Sparks shift to soothing prompts, and Fireflies offer cycle-aware personal wisdom.',
    subsections: [
      {
        title: 'How it works',
        content: 'Log your period start/end dates and the app learns your cycle. It predicts upcoming phases and adapts before you even notice the shift. The longer you track, the more accurate predictions become.',
      },
      {
        title: 'What adapts',
        content: '• Your Guide - Becomes gentler, validates physical symptoms, avoids pushing productivity\n• Sparks - Shift to soothing, introspective prompts during PMS\n• Fireflies - Generate cycle-aware insights ("Your anxiety usually peaks now—it always passes")\n• Twigs - Special cycle-specific tracking options appear',
      },
      {
        title: 'Cycle phases',
        content: '• Menstrual (days 1-5) - Acknowledges energy dips, extra gentle\n• Follicular (days 6-13) - Normal energy, open to challenges\n• Ovulation (days 14-16) - Peak energy, action-oriented\n• Luteal/PMS (days 17-28) - Soothing mode, validates discomfort',
      },
      {
        title: 'Cycle Twigs',
        content: 'Track what matters to you:\n• Period start/end, Flow level\n• Cramps, Bloating, Breast tenderness\n• Headache, Mood shifts, Cravings\n• Energy level, Sleep quality\n\nPatterns emerge over months.',
      },
      {
        title: 'Quick Symptom Button',
        content: 'During your period, a quick-access button appears on your home screen. One tap opens symptom logging—no hunting through menus when you\'re already uncomfortable. Cramps, flow, energy, mood—log and go. Toggle this in Settings > Cycle Tracking.',
      },
      {
        title: 'Customize Everything',
        content: 'In Settings > Cycle & Period, toggle each feature:\n• Quick Symptom Button - Show/hide home screen button\n• Cycle Twigs - Choose which symptoms to track\n• Soothing Sparks - PMS-specific gentle prompts\n• Cycle Fireflies - Personal insights about your patterns\n• Guide Adaptation - How much gentler during PMS\n\nNot everyone has heavy periods. Make it work for you.',
      },
      {
        title: 'Reminders',
        content: 'Get gentle reminders about your cycle:\n• Period approaching (1-3 days before)\n• PMS starting (based on YOUR patterns)\n• Log symptoms reminder\n• Ovulation/fertility window alerts\n\nMaster on/off switch: Settings → Cycle Tracking → Notifications. Turn all period notifications off (or back on) with one tap.',
      },
      {
        title: 'Firefly Alerts',
        content: 'Don\'t like push notifications? Choose Firefly alerts instead—a gentler, more discreet option.\n\nHow it works:\n• A Firefly on your home screen gently blinks/pulses\n• Tap it to see your cycle reminder\n• Messages like "Your period is predicted in 2 days" or "PMS usually starts around now"\n\nWhy Firefly alerts?\n• Less intrusive than push notifications\n• No buzzing or sounds\n• Check when YOU\'re ready\n• Stays visible until you tap it\n• Perfect for those who hate notifications\n\nSet in Settings → Cycle Tracking → Alert Type.',
      },
      {
        title: 'HealthKit Integration',
        content: 'With HealthKit enabled, Mood Leaf syncs with Apple Health:\n• Reads cycle data from other apps (Clue, Flo, Apple Cycle Tracking)\n• Writes your symptoms back to Apple Health\n• Heart rate, sleep, and activity data inform cycle insights\n• One source of truth across all your health apps',
      },
      {
        title: 'Life Stages',
        content: 'Your body changes over time. Mood Leaf adapts to where you are:\n\n• Regular Cycles - Standard period tracking with phase awareness\n• Perimenopause - Validates irregular cycles, tracks transition symptoms\n• Menopause - No period expectations, focuses on symptom management\n• Post-Menopause - Wellness maintenance, healthy aging support\n• Pregnant - Cycle tracking paused, trimester-aware support\n• Postpartum - Recovery focus, validates exhaustion\n\nSwitch your life stage anytime in Settings > Cycle Tracking.',
      },
      {
        title: 'Perimenopause & Menopause',
        content: 'For those in the menopause transition, track specific symptoms:\n\n• Hot flashes (frequency & intensity)\n• Night sweats\n• Sleep disturbances\n• Brain fog & memory\n• Mood changes & anxiety\n• Joint pain\n• Heart palpitations\n• Libido changes\n\nYour guide understands this transition is significant. It validates unpredictability, doesn\'t expect regular cycles, and offers extra compassion during difficult symptoms.',
      },
      {
        title: 'Pregnancy Mode',
        content: 'When you select "Pregnant" as your life stage:\n\n• Period tracking automatically pauses\n• Your guide becomes trimester-aware\n• Support adapts to physical changes each trimester\n• No period-related reminders or predictions\n• Gentle, encouraging tone throughout\n\nSet your due date to track weeks and trimesters. Your guide meets you where you are—first trimester exhaustion, second trimester energy, third trimester preparation.',
      },
      {
        title: 'Fertility Window',
        content: 'Optional fertility tracking for those trying to conceive:\n\n• Highlights predicted ovulation window\n• Based on your cycle history\n• Can send optional ovulation reminders\n• Privacy-first: this data never leaves your device\n\nEnable in Settings > Cycle Tracking > Track Fertility Window. Completely optional—only turn on if helpful for you.',
      },
      {
        title: 'Contraception Reminders',
        content: 'Optional reminders for birth control:\n\n• Daily pill reminders at your preferred time\n• IUD check date reminders\n• Implant renewal dates\n• Ring/patch change reminders\n\nSet up in Settings > Cycle Tracking > Contraception. All data stays on your device.',
      },
      {
        title: 'Privacy',
        content: 'Cycle data stays on your device. Only your current phase or life stage is shared with your guide ("luteal phase, day 24" or "perimenopause"). Raw tracking data, dates, and symptoms are never sent to AI. You can disable cycle tracking anytime.',
      },
    ],
  },
  {
    id: 'moodprint',
    emoji: '🧠',
    title: 'Your MoodPrint',
    content: 'MoodPrint is your unique cognitive fingerprint—a deep understanding of how YOUR mind works. Not personality labels. Not IQ. Just how you actually think, feel, and process the world.',
    subsections: [
      {
        title: 'Why it matters',
        content: 'Most apps treat everyone the same. Generic advice. One-size-fits-all. But minds work differently—not better or worse, just differently. MoodPrint captures YOUR way of thinking so your guide can actually help you, not give you advice that works for someone else.',
      },
      {
        title: 'How it\'s built',
        content: 'During onboarding, we ask questions about how you learn, how you feel, how insights arrive for you. There are no "right" answers—each response reveals something about how your unique mind operates. The more you share, the more personalized your experience becomes.',
      },
      {
        title: 'The 10 Cognitive Modes',
        content: 'Your mind has a primary way of operating. Most people have 1-2 dominant modes:\n\n• Procedural-Sequential — "Show me the steps." Linear, rule-based, process-oriented\n• Analytical-Symbolic — "Let me analyze this." Logical, precise, comfortable with abstraction\n• Conceptual-Systems — "I see how this fits together." Patterns, frameworks, big picture\n• Narrative-Meaning — "What\'s the story?" Identity-aware, meaning-seeking, story-driven\n• Embodied-Somatic — "I know it in my body." Learns by doing, sensation-focused\n• Associative-Divergent — "Everything connects." Rapid connections, creative leaps, nonlinear\n• Emotional-Relational — "How does this affect people?" Attuned to others, interpersonal\n• Visual-Spatial — "I see it." Thinks in images and spatial models\n• Temporal-Foresight — "Where does this lead?" Timelines, consequences, long arcs\n• Integrative-Meta — "How do these interact?" Meta-cognition, holds contradictions',
      },
      {
        title: 'How your guide adapts',
        content: 'Once your MoodPrint is built, everything changes:\n\n• Systems Thinkers get framing first, not steps\n• Procedural Thinkers get clear, logical sequences\n• Emotional Processors get validation before solutions\n• Visual Thinkers get spatial metaphors and imagery\n• Embodied Learners get action-oriented, grounded prompts\n\nYour guide speaks YOUR cognitive language.',
      },
      {
        title: 'Neurological differences',
        content: 'MoodPrint also detects important neurological differences:\n\n• Aphantasia — If you can\'t visualize (mind\'s eye is "blind"), we NEVER ask you to "picture" anything\n• Internal monologue — If you don\'t think in words, we use feelings/sensations instead of "self-talk"\n• Audio imagination — If you can\'t "hear" music in your head, no audio-based techniques\n\nMany coaching techniques assume abilities not everyone has. MoodPrint ensures we only use techniques that work for YOUR brain.',
      },
      {
        title: 'Cognitive rhythms',
        content: 'Your energy and clarity fluctuate. MoodPrint tracks your pattern:\n\n• Steady State — Consistent day to day\n• Cyclical Mild — Some waves, manageable\n• Cyclical Pronounced — Clear high/low phases\n• Burst-Recovery — Intense sprints then crashes\n\nCritical insight: Low phases are NOT failure—they\'re integration and recovery. Your guide adapts to wherever you are in your rhythm.',
      },
      {
        title: 'Daily energy patterns',
        content: 'When is your mind sharpest?\n\n• Morning Person — Peak early, fades by evening\n• Night Owl — Slow start, comes alive late\n• Afternoon Peak — Midday is best\n• Unpredictable — No clear pattern\n\nYour guide suggests hard tasks during YOUR peak time and respects your natural rhythm.',
      },
      {
        title: 'Discovered strengths',
        content: 'As you answer questions, MoodPrint identifies your unique strengths:\n\n• Pattern recognition\n• Deep intuition\n• Systems thinking\n• Rapid connections\n• Burst productivity\n• Non-verbal thinking\n• High emotional intelligence\n\nThese aren\'t labels—they\'re real capabilities your mind has that traditional systems might not have recognized.',
      },
      {
        title: 'Traditional education',
        content: 'If school didn\'t work for you, that says NOTHING about your intelligence. Traditional education rewards one type of mind. MoodPrint recognizes that your mind might work differently—and that\'s actually valuable, not a deficiency.',
      },
      {
        title: 'Privacy',
        content: 'Your MoodPrint stays on your device. Only compressed summaries (like "systems thinker, needs validation first") are shared with your AI guide during chats. Raw profile data never leaves your phone.',
      },
    ],
  },
  {
    id: 'onboarding',
    emoji: '👋',
    title: 'Personalization',
    content: 'During onboarding, we ask a few questions to personalize your experience. Everything is optional and can be changed later in Settings.',
    subsections: [
      {
        title: 'Your name',
        content: 'Your first name so your guide can address you personally. "Hey Sarah" feels different than "Hey there." Optional—your guide works fine without it.',
      },
      {
        title: 'Your pronouns',
        content: 'Your guide uses pronouns when reflecting back to you. Options include she/her, he/him, they/them, or custom. This makes conversations feel natural and respectful.',
      },
      {
        title: 'Cognitive questions',
        content: 'The onboarding questions aren\'t personality tests. They\'re discovering how YOUR mind actually works—how you learn, process emotions, relate to others, and think through problems. Your answers build your MoodPrint.',
      },
      {
        title: 'Cycle tracking',
        content: 'If you experience menstrual cycles, enabling this unlocks cycle-aware adaptation. The whole app shifts based on your phase—gentler during PMS, more energetic during ovulation.',
      },
      {
        title: 'Changing later',
        content: 'All personalization settings can be updated in Settings > Profile. Your guide adapts immediately to changes.',
      },
    ],
  },
  {
    id: 'slash-commands',
    emoji: '⚡',
    title: 'Slash Commands',
    content: 'Type commands starting with / in the chat to access quick features. Slash commands give you instant access to exercises, persona switches, and more.',
    subsections: [
      {
        title: 'Quick Reference',
        content: '/skills — Browse all skills and exercises\n/breathe — Start breathing exercise\n/ground — 5-4-3-2-1 grounding\n/calm — Let AI pick best technique\n/games — Browse mindful games\n/collection — View your artifacts\n/stats — See your activity patterns\n/help — Show all commands',
      },
      {
        title: 'Switching Coaches',
        content: 'Instantly change your guide\'s personality:\n/flint — Direct, honest, no-fluff\n/luna — Mindful, grounding, calm\n/willow — Wise, reflective\n/spark — Energetic, motivating\n/clover — Friendly, casual\n/ridge — Action-oriented\n/fern — Gentle, nurturing\n/random — Surprise!',
      },
      {
        title: 'Guided Exercises',
        content: '/breathe — Box breathing (4-4-4-4)\n/breathe 478 — 4-7-8 sleep breathing\n/breathe sigh — Quick physiological sigh\n/ground — 5-4-3-2-1 grounding\n/body — Quick body scan\n/prep — Event preparation',
      },
    ],
  },
  {
    id: 'skills',
    emoji: '🎯',
    title: 'Skills & Exercises',
    content: 'Skills are capabilities you develop through practice. Unlike streaks that punish missed days, skills celebrate every attempt. The Skills tab shows what\'s available—your coach guides you through them.',
    subsections: [
      {
        title: 'Coach-Guided Skills',
        content: 'Most skills happen right in your conversation with your guide. When you start a breathing exercise or grounding technique, it appears as an overlay while your coach walks you through it with voice or text guidance. You never leave the conversation.',
      },
      {
        title: 'Conversation Practice',
        content: 'Need to practice a difficult conversation? Your coach becomes your roleplay partner. Whether it\'s asking for a raise, setting boundaries, or confronting someone, your coach plays the other person and gives you feedback. No separate screen—just natural practice.',
      },
      {
        title: 'Skill Types',
        content: '🌊 Calm — Breathing, relaxation\n🦶 Ground — Anchoring, presence\n🎯 Focus — Attention, concentration\n💪 Challenge — Thought work, CBT\n🤝 Connect — Social skills\n✨ Restore — Recovery, healing',
      },
      {
        title: 'Rarity System',
        content: '⚪ Common — Core skills everyone starts with\n🟢 Uncommon — Specialized techniques\n🔵 Rare — Advanced approaches\n🟣 Legendary — Secret unlocks and mastery',
      },
      {
        title: 'Breathing Exercises',
        content: '📦 Box Breathing — 4-4-4-4 for calm (/breathe)\n🌙 4-7-8 Breathing — For sleep (/breathe 478)\n💗 Coherent Breathing — HRV optimization\n😮‍💨 Physiological Sigh — Instant calm (/breathe sigh)',
      },
      {
        title: 'Grounding Exercises',
        content: '🖐️ 5-4-3-2-1 — Name things you see, hear, touch, smell, taste (/ground)\n👣 Feet on Floor — Simple physical anchoring\n🧊 Ice Cube — Intense grounding for strong emotions',
      },
      {
        title: 'Body & Thought Work',
        content: '🔍 Quick Body Scan — 2-minute check-in (/body)\n💆 Progressive Relaxation — Tense and release muscles\n🧠 Thought Record — CBT technique for negative thinking\n🎈 Thought Defusion — Create distance from thoughts',
      },
      {
        title: 'Social Skills & Roleplay',
        content: '🎉 Event Preparation — Mental rehearsal before events (/prep)\n💬 Conversation Practice — Roleplay difficult conversations with your coach\n🗣️ Asking for a Raise — Practice with your coach as your manager\n🚧 Setting Boundaries — Practice saying no',
      },
      {
        title: 'Skill Progress',
        content: 'Each skill has 5 levels:\n■□□□□ Beginner — Just starting\n■■■□□ Practicing — Building habit\n■■■■■ Mastery — Made it your own\n\nProgress never decreases. No streaks to maintain. Every attempt counts.',
      },
    ],
  },
  {
    id: 'games',
    emoji: '🎮',
    title: 'Mindful Games',
    content: 'Games designed to calm, ground, and build skills—not to addict. Type /games to browse.',
    subsections: [
      {
        title: 'Grounding Games',
        content: '🫧 Breathing Bubble — Pop bubbles by breathing\n🔍 Grounding Quest — Find items around you\n📷 I Spy AI — Camera finds objects for scavenger hunt (Premium)\n🎯 Color Finder — Find 5 blue things, 4 red...',
      },
      {
        title: 'Calming Games',
        content: '🎨 Color Sort — Sort objects by color\n🧩 Calm Puzzles — Jigsaw with nature images\n🖍️ Mood Coloring — Color mandalas\n✨ Flow Drawing — Draw with flowing particles',
      },
      {
        title: 'Classic Games (Mindful Versions)',
        content: '🐍 Mindful Snake — Slow, with calming music\n🧱 Zen Blocks — Tetris with no game over\n🔢 Calm Sudoku — Hints and no timer\n🏓 Gentle Pong — Slow motion',
      },
      {
        title: 'Fidget Tools',
        content: '🔘 Fidget Pad — Sliders, switches, dials (/fidget)\n🔵 Bubble Wrap — Endless popping\n🌀 Fidget Spinner — Watch it spin',
      },
    ],
  },
  {
    id: 'collection',
    emoji: '🏆',
    title: 'Collection System',
    content: 'As you use Mood Leaf, you unlock collectibles—artifacts, titles, and card backs. This D&D-inspired system celebrates your journey without any pressure.',
    subsections: [
      {
        title: 'How It Works',
        content: 'Every time you practice a skill, play a game, or explore the app, you\'re building toward unlocks. The system quietly tracks your patterns and rewards consistency, curiosity, and presence.',
      },
      {
        title: 'Artifacts',
        content: 'Symbolic items earned through milestones:\n🪨 Calm Stone — First breathing session\n🪶 Breath Feather — 10 breathing exercises\n✨ Starlight Vial — Practice at 3am\n🌈 Rainbow Prism — Try all skill types',
      },
      {
        title: 'Titles',
        content: 'Names that reflect your journey:\n• Breath Wanderer — Practice breathing 5 times\n• Grounding Guardian — Master grounding\n• Night Owl — Practice after midnight\n• Dawn Keeper — Practice before 6am',
      },
      {
        title: 'Card Backs',
        content: 'Customize your skill cards:\n🌫️ Mist (Common) — Starter\n🌲 Forest (Uncommon) — Try 3 skills\n🌅 Sunset (Rare) — 50 total activities\n🌌 Aurora (Legendary) — 10 artifacts',
      },
      {
        title: 'Zero Pressure Design',
        content: '• Progress bars never decrease\n• No streaks to maintain\n• Nothing expires or disappears\n• Surprise rewards add joy\n• Every session counts equally',
      },
      {
        title: 'View Your Collection',
        content: 'Type /collection (or /artifacts, /inventory, /bag) to see your unlocked items and progress.',
      },
    ],
  },
  {
    id: 'biometrics',
    emoji: '🔬',
    title: 'Biometric Safety Features',
    content: 'Optional biometric monitoring can detect concerning patterns in your voice and facial expressions, providing an extra safety net. Everything is privacy-first—your biometric data never leaves your device.',
    subsections: [
      {
        title: 'How it helps',
        content: 'The biometric system learns YOUR normal patterns. When it detects something unusual—like speech changes or signs of distress—it can check in with you. Think of it as a caring friend who notices when you\'re not yourself.',
      },
      {
        title: 'Voice analysis',
        content: 'Your voice carries information about your state. The system can detect:\n\n• Speech pace changes — Unusually slow or fast\n• Articulation changes — Slurring or difficulty speaking\n• Stuttering patterns — New or increased stuttering\n• Voice tremor — Signs of stress or distress\n\nThese might indicate fatigue, intoxication, medication effects, or distress—all situations where a check-in might help.',
      },
      {
        title: 'Facial analysis',
        content: 'Your face tells a story too. The system can detect:\n\n• Emotion mismatches — Saying "I\'m fine" while looking sad\n• Fatigue signs — Drooping eyes, exhaustion\n• Stress indicators — Tension, jaw clenching\n• Distress signals — Signs that something is wrong\n\nThis isn\'t surveillance—it\'s care. The system only looks when you\'re actively using the app.',
      },
      {
        title: 'Identity verification',
        content: 'The system creates a "voice print" and "face print" unique to you. This protects your privacy—if someone else tries to use your app, the system knows it\'s not you and won\'t share your personal content.',
      },
      {
        title: 'Triage approach',
        content: 'If something concerning is detected, the system follows a careful process:\n\n1. Alert YOU first — "I noticed something. Are you okay?"\n2. Give you time to respond — You can say "I\'m fine" and continue\n3. Wait period — If you don\'t respond, it waits (configurable)\n4. Emergency contact — Only if enabled AND you don\'t respond\n\nYou\'re always in control. The system never contacts anyone without giving you a chance to respond first.',
      },
      {
        title: 'Emergency contact',
        content: 'You can optionally set up an emergency contact—someone who can be notified if concerning patterns are detected AND you don\'t respond to check-ins. Configure:\n\n• Contact name and relationship\n• Phone number for SMS/calls\n• Email address (optional)\n• Wait time before contacting (5-30 minutes)\n\nThis is completely optional. Many people use the app without any emergency contact configured.',
      },
      {
        title: 'Enabling features',
        content: 'In Settings > Safety & Monitoring, you control everything:\n\n• Voice Analysis — On/Off\n• Facial Analysis — On/Off\n• Continuous Monitoring — Whether to monitor during conversations\n• Emergency Contact — Add, edit, or remove\n• Wait Time — How long before escalation\n\nAll features are off by default. Only enable what feels comfortable.',
      },
      {
        title: 'Privacy guarantees',
        content: '• All biometric data stays on your device\n• Voice recordings are processed locally, then deleted\n• Face images are never stored—only processed in real-time\n• Voice/face prints are encrypted on your device\n• No biometric data is ever sent to any server\n• Anonymous training data is opt-in only',
      },
      {
        title: 'Anonymous training',
        content: 'You can optionally help improve the system by sharing anonymous pattern data. This sends ONLY aggregated metrics (like "speech pace variance")—never actual recordings, images, or anything identifiable. Off by default. If you enable it, you\'re helping improve safety features for everyone.',
      },
    ],
  },
  {
    id: 'voice',
    emoji: '🎙️',
    title: 'Voice Features',
    content: 'Mood Leaf supports voice in multiple ways—your guide can speak to you, and you can speak to record entries. All voice processing happens on your device.',
    subsections: [
      {
        title: 'Guide voice',
        content: 'Your AI guide can speak responses aloud using text-to-speech. Each persona has a different voice that matches their personality—Clover sounds warm and friendly, Luna sounds calm and soothing, Flint sounds direct and clear.',
      },
      {
        title: 'Voice recording',
        content: 'Instead of typing journal entries, you can speak them. Tap the microphone icon to record. Your speech is transcribed on-device, so your voice recording never leaves your phone.',
      },
      {
        title: 'Guided tour narration',
        content: 'The app\'s guided tour uses voice to walk you through features. Your guide literally shows you around while explaining each part of the app. This can be skipped or paused at any time.',
      },
      {
        title: 'Voice settings',
        content: 'In Settings > Voice & Sound, you can control:\n\n• Guide speaks responses — On/Off\n• Voice speed — Slower or faster\n• Voice pitch — Higher or lower\n• Volume — Independent of system volume',
      },
      {
        title: 'Privacy',
        content: 'All voice processing happens on your device:\n• Speech-to-text uses on-device processing\n• Text-to-speech uses on-device synthesis\n• No voice recordings are ever sent to any server\n• Voice print data (for identity) stays encrypted on device',
      },
    ],
  },
  {
    id: 'healthkit',
    emoji: '❤️',
    title: 'HealthKit Integration',
    content: 'Connect Mood Leaf with Apple Health to get deeper insights about how your body and mind interact.',
    subsections: [
      {
        title: 'Setup',
        content: '1. Go to Settings > HealthKit\n2. Tap Enable HealthKit\n3. Select data to share:\n   • Heart Rate (recommended)\n   • Sleep Analysis (recommended)\n   • Steps & Activity\n   • Menstrual Cycle (optional)\n4. Tap Allow when iOS prompts',
      },
      {
        title: 'Heart Rate Data',
        content: '• Current heart rate\n• Resting heart rate (baseline)\n• Heart rate variability (HRV)\n• Recent heart rate trends',
      },
      {
        title: 'Sleep Data',
        content: '• Total sleep duration\n• Sleep quality indicators\n• Awakenings during night\n• Sleep trends over time',
      },
      {
        title: 'Activity Data',
        content: '• Daily steps\n• Exercise minutes\n• Active calories\n• Activity trends',
      },
      {
        title: 'Heart Rate Spike Detection',
        content: 'Mood Leaf monitors for significant spikes:\n1. Baseline tracking — Learns your normal resting HR\n2. Spike detection — Notices when HR goes 30%+ above baseline\n3. Smart notifications — Sends a check-in (max 1 per 30 min)\n4. Journaling prompt — Asks if you want to share what\'s happening',
      },
      {
        title: 'Sleep Impact',
        content: 'When you chat, your guide considers your sleep:\n• Acknowledges poor sleep\n• Notes it might affect how you\'re feeling\n• Doesn\'t assume, just observes',
      },
      {
        title: 'Activity Correlation',
        content: 'Your guide tracks how activity relates to mood:\n• Notes if you\'ve been more/less active than usual\n• May gently suggest movement as self-care\n• Points out patterns on active days',
      },
      {
        title: 'Privacy',
        content: 'Health data stays on your device. Only compressed summaries are shared with AI ("slept 5 hours, elevated HR"). Raw data is never sent. You can disable HealthKit anytime in Settings.',
      },
    ],
  },
  {
    id: 'seeds',
    emoji: '🌱',
    title: 'Seeds Tab',
    content: 'The Seeds tab is where you discover patterns about yourself. We call them "seeds" because insights grow stronger over time, just like plants.',
    subsections: [
      {
        title: 'Finding the Seeds Tab',
        content: 'Look for the 🌰 or 🌱 icon in the bottom navigation bar (between Skills and Insights). When new patterns are discovered, you\'ll see a glowing green badge.',
      },
      {
        title: 'Growth Stages',
        content: 'Each insight has a growth stage showing how established the pattern is:\n\n🌰 Sprouting — Just noticed this pattern, needs more data\n🌱 Growing — Pattern is becoming clearer\n🌿 Flourishing — Strong, consistent pattern\n🌳 Rooted — Core understanding about yourself',
      },
      {
        title: 'Pattern Categories',
        content: 'Seeds can discover many types of patterns:\n\n🌊 Cycles — Recurring patterns (weekly mood dips, monthly rhythms)\n🔗 Connections — How things relate (sleep → mood, food → energy)\n💪 Activities — What activities help or hurt\n🌙 Sleep — Sleep patterns affecting your wellbeing\n🌅 Time — When you feel best during the day\n🏔 Environment — How places affect your mood\n🌀 Momentum — Streak effects and habits\n🌧 Triggers — What triggers certain moods\n💫 Recovery — What helps you bounce back\n🦋 Body-Mind — Physical-emotional connections\n🌱 Growth — Your progress over time\n⚠️ Warnings — Early warning signs',
      },
      {
        title: 'Responding to Seeds',
        content: 'You can react to any insight:\n\n🌱 "This resonates" — The pattern feels accurate\n🤔 "I\'ll watch for this" — You\'re curious to observe\n🍂 "Not quite right" — Doesn\'t match your experience\n\nYour reactions help Mood Leaf learn what insights are meaningful to you.',
      },
      {
        title: 'Data Sources',
        content: 'Mood Leaf analyzes data from multiple sources:\n\n• Twigs (Mood Logs) — Mood ratings, notes, tags\n• Coach Conversations — Topics discussed, themes\n• Calendar Events — Meeting frequency, event types\n• Health Data — Sleep, steps, heart rate\n• Weather — Temperature, conditions, sunlight\n\nAll analysis runs locally on your device.',
      },
      {
        title: 'Your Guide Knows Your Seeds',
        content: 'Your AI guide is aware of your discovered patterns and may mention relevant insights in conversation, celebrate positive patterns you\'ve developed, or reference your data when offering suggestions.',
      },
    ],
  },
  {
    id: 'accountability',
    emoji: '📋',
    title: 'AI Accountability Features',
    content: 'Mood Leaf\'s AI can help hold you accountable by automatically creating trackers, reminders, and alerts based on your conversations. The system is supportive, not preachy—it adapts to your comfort level.',
    subsections: [
      {
        title: 'How It Works',
        content: 'When you mention goals or habits in conversation, the AI can offer to:\n\n• Create Twigs (Quick Logs) — Track habits you want to build or break\n• Create Calendar Events — Set reminders in your phone\'s calendar\n• Create Contacts — Save people to your address book\n• Set Limit Alerts — Get notified when approaching/exceeding limits\n• Drink Pacing — Help pace drinking at social events',
      },
      {
        title: 'Setting Limits',
        content: 'Example: "I want to limit my coffee to 4 cups a day"\n\nThe AI can create a Coffee tracker with a limit of 4 per day and alert you when approaching your limit.\n\nStatus alerts:\n• Approaching — "Heads up: You\'re at 3/4 coffees today"\n• Reached — "You\'ve reached your coffee limit. Nice awareness!"\n• Exceeded — "That\'s 5 coffees today - 1 over your goal. No judgment, just data."',
      },
      {
        title: 'Drink Pacing',
        content: 'A harm reduction tool for pacing alcohol at social events.\n\nHow to use:\n1. Open Skills → Drink Pacing or say "I want to pace my drinking tonight"\n2. Set your interval (how often to be reminded)\n3. Set your max drinks (optional)\n4. Name your event (optional)\n5. Tap "Start Pacing"\n\nYour phone vibrates when it\'s time for your next drink. Tap "Log a Drink" each time you have one.',
      },
      {
        title: 'Adaptive Accountability',
        content: 'The system adapts to your preferences:\n\n• Off — Coach never mentions limits\n• Gentle — Only mentions if you significantly exceed limits\n• Moderate — Normal check-ins when approaching limits\n• Proactive — Active check-ins and progress updates\n\nChange on-the-fly:\n• "Stop reminding me about coffee" → Pauses coffee reminders\n• "Don\'t hold me accountable today" → Pauses all for today\n• "Be more strict with me" → Increases intensity',
      },
      {
        title: 'Privacy',
        content: 'All accountability data stays on your device:\n• Twigs and entries stored locally\n• Calendar events go to YOUR calendar\n• Contacts go to YOUR address book\n• No data sent to external servers',
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getFAQByCategory(category: FAQItem['category']): FAQItem[] {
  return FAQ_CONTENT.filter(item => item.category === category);
}

export function getManualSection(id: string): ManualSection | undefined {
  return USER_MANUAL_CONTENT.find(section => section.id === id);
}
