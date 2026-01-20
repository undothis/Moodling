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
    answer: 'Fireflies are gentle bits of wisdom that float around your tree. Tap them for personalized insights based on your journey.',
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
    question: 'Can I change my chronotype over time?',
    answer: 'Yes! If you\'re a night owl wanting to become more of a morning person, your guide can help you gradually shift. It will adjust energy and encouragement to support your transition, gently nudging earlier wind-downs and celebrating morning wins.',
  },
  {
    category: 'guide',
    question: 'Does the guide help with jet lag?',
    answer: 'After travel, your guide notices when your rhythm is off and adjusts accordingly. It won\'t pressure you to be energetic when you\'re exhausted, and it can offer tips to help you readjust to your new time zone gradually.',
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
    content: 'Your AI guide is available for coaching conversations whenever you need support or want to process something.',
    subsections: [
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
    title: 'Fireflies',
    content: 'Fireflies are gentle bits of wisdom that float around your tree. They\'re personalized based on your journey, psychological patterns, and current context.',
    subsections: [
      {
        title: 'How they work',
        content: 'Tap a firefly to receive wisdom. They draw from your journal patterns, life context, and psychological profile to offer relevant insights.',
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
