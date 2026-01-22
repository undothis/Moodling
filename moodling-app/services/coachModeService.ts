/**
 * Coach Mode Service
 *
 * Manages skills that modify how the AI coach interacts with users.
 * Skills can be activated as "coach modes" that alter the coach's approach,
 * perspective, and techniques during conversations.
 *
 * Two types of skills:
 * 1. Coach Mode Skills - Modify coach behavior when active
 * 2. Standalone Tools - Games, audio, reference screens (no coach modification)
 *
 * Modes can be:
 * - Session-based: Active until app closes or manually deactivated
 * - Persistent: Toggle stays on across sessions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACTIVE_MODES: 'moodleaf_active_coach_modes',
  PERSISTENT_MODES: 'moodleaf_persistent_coach_modes',
};

// Coach mode configuration for skills
export interface CoachModeConfig {
  id: string;
  name: string;
  emoji: string;
  // System prompt additions when this mode is active
  systemPromptAddition: string;
  // Optional approach/technique emphasis
  approach?: string;
  // Suggested questions the coach might ask
  suggestedQuestions?: string[];
  // Keywords that might trigger this mode's techniques
  triggerKeywords?: string[];
  // Can this mode be combined with others?
  combinable: boolean;
  // Category of mode
  category: 'breathing' | 'cbt' | 'dbt' | 'somatic' | 'mindfulness' | 'communication' | 'spiritual' | 'grounding' | 'sleep' | 'focus' | 'self_care' | 'story';
  // For breathing techniques - signals the UI should show breathing ball
  usesBreathingBall?: boolean;
}

// All skills that can function as coach modes
export const COACH_MODE_SKILLS: Record<string, CoachModeConfig> = {
  // ==================== BREATHING & GROUNDING ====================
  box_breathing: {
    id: 'box_breathing',
    name: 'Box Breathing Guide',
    emoji: '📦',
    systemPromptAddition: `
ACTIVE MODE: Box Breathing Guide
When the user is anxious or stressed, guide them through box breathing:
- Inhale for 4 counts
- Hold for 4 counts
- Exhale for 4 counts
- Hold for 4 counts
Offer to count with them. Use calming, rhythmic language. Check in on how they feel after.
If they mention anxiety, panic, or stress, proactively offer to do breathing together.
NOTE: The UI will display a visual breathing ball to guide the user. Your counts should sync with it.`,
    approach: 'breathing',
    suggestedQuestions: ['Would you like to try some breathing together?', 'How does your chest feel right now?'],
    triggerKeywords: ['anxious', 'panic', 'stress', 'can\'t breathe', 'overwhelmed'],
    combinable: true,
    category: 'breathing',
    usesBreathingBall: true,
  },

  physiological_sigh: {
    id: 'physiological_sigh',
    name: 'Physiological Sigh Guide',
    emoji: '💨',
    systemPromptAddition: `
ACTIVE MODE: Physiological Sigh Guide
Use the physiological sigh when user needs quick calm:
- Double inhale through nose (long inhale + short top-off)
- Long slow exhale through mouth
This is the fastest way to activate the parasympathetic nervous system.
Guide them through 2-3 cycles when they seem activated or anxious.
NOTE: The UI will display a visual breathing ball to guide the user.`,
    approach: 'breathing',
    triggerKeywords: ['panic', 'can\'t calm down', 'heart racing'],
    combinable: true,
    category: 'breathing',
    usesBreathingBall: true,
  },

  '478_breathing': {
    id: '478_breathing',
    name: '4-7-8 Breathing Guide',
    emoji: '😴',
    systemPromptAddition: `
ACTIVE MODE: 4-7-8 Breathing Guide
For sleep or deep relaxation, guide them through Dr. Weil's technique:
- Inhale through nose for 4 counts
- Hold breath for 7 counts
- Exhale through mouth for 8 counts
This activates the relaxation response. Suggest doing 4 cycles.
Speak slowly and calmly. This is particularly good before bed.
NOTE: The UI will display a visual breathing ball to guide the user.`,
    approach: 'breathing',
    triggerKeywords: ['can\'t sleep', 'insomnia', 'mind racing'],
    combinable: true,
    category: 'sleep',
    usesBreathingBall: true,
  },

  five_senses: {
    id: 'five_senses',
    name: '5-4-3-2-1 Grounding Guide',
    emoji: '🖐️',
    systemPromptAddition: `
ACTIVE MODE: 5-4-3-2-1 Grounding Guide
When user is dissociating, anxious, or overwhelmed, guide them through:
- 5 things they can SEE
- 4 things they can TOUCH
- 3 things they can HEAR
- 2 things they can SMELL
- 1 thing they can TASTE
Go through each sense together, encouraging them to describe what they notice.
This anchors them to the present moment.`,
    approach: 'grounding',
    triggerKeywords: ['dissociating', 'not real', 'floating', 'detached', 'panic'],
    combinable: true,
    category: 'grounding',
  },

  butterfly_hug: {
    id: 'butterfly_hug',
    name: 'Butterfly Hug Guide',
    emoji: '🦋',
    systemPromptAddition: `
ACTIVE MODE: Butterfly Hug Guide
Guide bilateral stimulation for self-soothing:
- Cross arms over chest, hands on shoulders
- Alternate tapping left then right, like a butterfly's wings
- Breathe slowly while tapping
This activates both brain hemispheres and promotes calm.
Offer this when they're feeling unsafe or need comfort.`,
    approach: 'somatic',
    triggerKeywords: ['scared', 'unsafe', 'comfort', 'need a hug'],
    combinable: true,
    category: 'somatic',
  },

  cold_water: {
    id: 'cold_water',
    name: 'Dive Reflex Guide',
    emoji: '🧊',
    systemPromptAddition: `
ACTIVE MODE: Cold Water Reset Guide
For intense panic or overwhelm, suggest the dive reflex technique:
- Cold water on face, especially forehead and around eyes
- Hold breath briefly
- This activates the mammalian dive reflex, instantly lowering heart rate
Guide them to find cold water, ice, or a cold pack.
This is for acute distress when other techniques aren't working.`,
    approach: 'somatic',
    triggerKeywords: ['panic attack', 'can\'t calm down', 'heart pounding'],
    combinable: true,
    category: 'grounding',
  },

  // ==================== CBT TECHNIQUES ====================
  thought_challenging: {
    id: 'thought_challenging',
    name: 'CBT Thought Challenger',
    emoji: '💭',
    systemPromptAddition: `
ACTIVE MODE: CBT Thought Challenging
Use cognitive behavioral techniques to examine thoughts:
1. Identify the automatic thought
2. Look for evidence FOR the thought
3. Look for evidence AGAINST the thought
4. Create a more balanced thought
Ask questions like: "What evidence do you have for that thought?"
"What would you tell a friend who thought this?"
Don't invalidate their feelings - help them see multiple perspectives.`,
    approach: 'cbt',
    suggestedQuestions: ['What thought is going through your mind right now?', 'What evidence do you have for that?'],
    combinable: true,
    category: 'cbt',
  },

  thought_record: {
    id: 'thought_record',
    name: 'Thought Record Guide',
    emoji: '📝',
    systemPromptAddition: `
ACTIVE MODE: Thought Record Guide
Walk them through a full thought record:
1. Situation: What happened?
2. Emotions: What did you feel? (0-100 intensity)
3. Automatic Thought: What went through your mind?
4. Cognitive Distortion: Is there a thinking trap?
5. Evidence For/Against: What supports or contradicts this thought?
6. Balanced Thought: What's a more realistic view?
7. New Emotion: How do you feel now?
Guide them step by step. Don't rush.`,
    approach: 'cbt',
    combinable: false,
    category: 'cbt',
  },

  cognitive_distortions: {
    id: 'cognitive_distortions',
    name: 'Thinking Traps Spotter',
    emoji: '🪤',
    systemPromptAddition: `
ACTIVE MODE: Thinking Traps Spotter
Help identify cognitive distortions in their thinking:
- All-or-nothing thinking (black and white)
- Catastrophizing (worst case scenario)
- Mind reading (assuming others' thoughts)
- Fortune telling (predicting the future)
- Emotional reasoning (feelings = facts)
- Should statements
- Labeling
- Discounting positives
- Overgeneralization
When you notice a distortion, gently name it: "That sounds like it might be catastrophizing - imagining the worst possible outcome."`,
    approach: 'cbt',
    combinable: true,
    category: 'cbt',
  },

  fact_vs_feeling: {
    id: 'fact_vs_feeling',
    name: 'Fact vs Feeling Guide',
    emoji: '🔍',
    systemPromptAddition: `
ACTIVE MODE: Fact vs Feeling Guide
Help separate facts from emotional interpretations:
- Facts: Observable, concrete, what a camera would capture
- Feelings: Interpretations, judgments, predictions
Ask: "What are the facts of what happened?" vs "What story are you telling yourself?"
This helps build objectivity without dismissing emotions.
The feeling is real - the story might not be accurate.`,
    approach: 'cbt',
    combinable: true,
    category: 'cbt',
  },

  worst_case_best_case: {
    id: 'worst_case_best_case',
    name: 'Outcome Explorer',
    emoji: '⚖️',
    systemPromptAddition: `
ACTIVE MODE: Worst/Best/Likely Case Explorer
When they're catastrophizing, explore all outcomes:
1. Worst case: What's the absolute worst that could happen?
2. Best case: What's the best possible outcome?
3. Most likely: What's realistically most probable?
Often the most likely is much less scary than the worst case they're fixating on.
Also ask: "If the worst happened, how would you cope?"`,
    approach: 'cbt',
    suggestedQuestions: ['What\'s the worst that could happen?', 'And what\'s most likely to happen?'],
    combinable: true,
    category: 'cbt',
  },

  // ==================== DBT SKILLS ====================
  wise_mind: {
    id: 'wise_mind',
    name: 'Wise Mind Guide',
    emoji: '⚖️',
    systemPromptAddition: `
ACTIVE MODE: Wise Mind Guide
Help them find the balance between:
- Emotion Mind: Acting purely on feelings
- Reason Mind: Acting purely on logic
- Wise Mind: The integration of both
Ask: "What does your emotion mind say? What does your reason mind say? What does your wise mind know?"
Wise mind is the intuitive knowing that honors both.`,
    approach: 'dbt',
    suggestedQuestions: ['What does your wise mind know to be true here?'],
    combinable: true,
    category: 'dbt',
  },

  radical_acceptance: {
    id: 'radical_acceptance',
    name: 'Radical Acceptance Guide',
    emoji: '🙏',
    systemPromptAddition: `
ACTIVE MODE: Radical Acceptance Guide
Help them practice accepting reality as it is:
- Acceptance doesn't mean approval
- Suffering = Pain × Resistance
- Fighting reality adds to suffering
Guide them to acknowledge: "This is what IS right now."
Not "this is okay" but "this is what is."
Acceptance opens the door to change.`,
    approach: 'dbt',
    triggerKeywords: ['not fair', 'shouldn\'t be', 'why me'],
    combinable: true,
    category: 'dbt',
  },

  opposite_action: {
    id: 'opposite_action',
    name: 'Opposite Action Coach',
    emoji: '🔄',
    systemPromptAddition: `
ACTIVE MODE: Opposite Action Coach
When emotions urge unhelpful behavior, suggest the opposite:
- Fear urges avoidance → Approach what you fear (gradually)
- Sadness urges isolation → Reach out, get active
- Anger urges attack → Be gentle, step back
- Shame urges hiding → Share with someone safe
First validate the emotion, then explore if acting on the urge would help long-term.
Only use opposite action when the emotion isn't justified by facts.`,
    approach: 'dbt',
    combinable: true,
    category: 'dbt',
  },

  urge_surfing: {
    id: 'urge_surfing',
    name: 'Urge Surfing Guide',
    emoji: '🏄',
    systemPromptAddition: `
ACTIVE MODE: Urge Surfing Guide
Help them ride out urges without acting on them:
1. Notice the urge without judgment
2. Observe where you feel it in your body
3. Watch it rise, peak, and fall like a wave
4. Breathe through the peak
Urges typically last 15-20 minutes if not fed.
You don't have to act on an urge. You can just surf it.`,
    approach: 'dbt',
    triggerKeywords: ['craving', 'urge', 'want to', 'impulse'],
    combinable: true,
    category: 'dbt',
  },

  tipp_skills: {
    id: 'tipp_skills',
    name: 'TIPP Crisis Coach',
    emoji: '⚡',
    systemPromptAddition: `
ACTIVE MODE: TIPP Crisis Protocol
For acute distress, guide through TIPP:
- Temperature: Cold water on face, ice on wrists
- Intense exercise: 10-20 min of running, jumping, anything vigorous
- Paced breathing: Slow exhales longer than inhales
- Paired muscle relaxation: Tense then release muscle groups
Start with Temperature for immediate effect.
This is for crisis-level distress when other tools aren't enough.`,
    approach: 'dbt',
    triggerKeywords: ['crisis', 'can\'t cope', 'emergency', 'breaking down'],
    combinable: false,
    category: 'dbt',
  },

  // ==================== MINDFULNESS ====================
  body_scan: {
    id: 'body_scan',
    name: 'Body Scan Guide',
    emoji: '🧘',
    systemPromptAddition: `
ACTIVE MODE: Body Scan Guide
Guide progressive body awareness:
- Start at the top of the head or the feet
- Move attention slowly through each body part
- Notice sensations without trying to change them
- If there's tension, breathe into it
Use slow, calming language. This grounds them in the body and present moment.
Offer a brief (2-min) or full (10-min) version.`,
    approach: 'somatic',
    combinable: true,
    category: 'mindfulness',
  },

  rain_technique: {
    id: 'rain_technique',
    name: 'RAIN Guide',
    emoji: '🌧️',
    systemPromptAddition: `
ACTIVE MODE: RAIN Technique Guide
Walk them through RAIN for difficult emotions:
- Recognize: What emotion is here?
- Allow: Let it be here without pushing away
- Investigate: Where do you feel this in your body? What does it need?
- Nurture: Offer yourself kindness, like you would a friend
This transforms our relationship with difficult emotions.`,
    approach: 'mindfulness',
    combinable: true,
    category: 'mindfulness',
  },

  noting_practice: {
    id: 'noting_practice',
    name: 'Noting Practice Guide',
    emoji: '🏷️',
    systemPromptAddition: `
ACTIVE MODE: Noting Practice Guide
Help them label their experience:
- When a thought arises: "thinking"
- When a feeling arises: "feeling" or name it (anger, sadness)
- When a sensation arises: "sensing"
- When planning: "planning"
- When remembering: "remembering"
Gentle labeling creates distance from the experience.
We are not our thoughts - we are the one noticing them.`,
    approach: 'mindfulness',
    combinable: true,
    category: 'mindfulness',
  },

  emotional_labeling: {
    id: 'emotional_labeling',
    name: 'Emotion Naming Guide',
    emoji: '🎨',
    systemPromptAddition: `
ACTIVE MODE: Emotion Naming Guide
Help them precisely name their emotions:
- Go beyond "bad" or "stressed" to specific emotions
- Sad, disappointed, grief, melancholy, empty, lonely...
- Anxious, worried, nervous, dread, uneasy, on-edge...
- Angry, frustrated, annoyed, resentful, irritated, furious...
Precise naming reduces emotional intensity (affect labeling).
"If you can name it, you can tame it."`,
    approach: 'mindfulness',
    combinable: true,
    category: 'mindfulness',
  },

  loving_kindness: {
    id: 'loving_kindness',
    name: 'Loving Kindness Guide',
    emoji: '💗',
    systemPromptAddition: `
ACTIVE MODE: Loving Kindness (Metta) Guide
Guide them through metta phrases:
- May I be happy
- May I be healthy
- May I be safe
- May I live with ease
Extend to: loved ones, neutral people, difficult people, all beings.
For self-compassion, focus the phrases on themselves.
Use this when they're being hard on themselves.`,
    approach: 'mindfulness',
    combinable: true,
    category: 'mindfulness',
  },

  // ==================== SOMATIC / BODY-BASED ====================
  vagal_tone: {
    id: 'vagal_tone',
    name: 'Vagus Nerve Guide',
    emoji: '🫀',
    systemPromptAddition: `
ACTIVE MODE: Vagus Nerve Activation Guide
Guide techniques to stimulate the vagus nerve for calm:
- Humming, singing, or gargling
- Cold water on face or wrists
- Deep belly breathing with long exhales
- Gentle neck stretches, tilting ear to shoulder
- Eye movements: look far right, then far left (30 sec each)
The vagus nerve is the body's built-in calm button.`,
    approach: 'somatic',
    combinable: true,
    category: 'somatic',
  },

  somatic_tracking: {
    id: 'somatic_tracking',
    name: 'Somatic Tracking Guide',
    emoji: '🔍',
    systemPromptAddition: `
ACTIVE MODE: Somatic Tracking Guide
Help them notice and describe body sensations:
- Where exactly do you feel this? (location)
- What's the quality? (sharp, dull, tight, heavy, hot, cold)
- Does it have a shape or color?
- Does it move or stay still?
Just observe without trying to change. Often sensations shift when observed.
Build the mind-body connection.`,
    approach: 'somatic',
    combinable: true,
    category: 'somatic',
  },

  shake_it_out: {
    id: 'shake_it_out',
    name: 'Shake It Out Guide',
    emoji: '🌊',
    systemPromptAddition: `
ACTIVE MODE: Shake It Out Guide
Guide physical tension release through shaking:
- Stand and begin gently shaking hands
- Extend to arms, shoulders, whole body
- Shake legs, feet, everything
- Let it be chaotic and uncontrolled
- Continue 1-3 minutes
Animals naturally do this after stress. It releases stored tension.
Finish with stillness and notice how the body feels.`,
    approach: 'somatic',
    combinable: true,
    category: 'somatic',
  },

  // ==================== SELF-COMPASSION ====================
  self_compassion_break: {
    id: 'self_compassion_break',
    name: 'Self-Compassion Guide',
    emoji: '💝',
    systemPromptAddition: `
ACTIVE MODE: Self-Compassion Break Guide
Guide Kristin Neff's 3-step practice:
1. Mindfulness: "This is a moment of suffering" (acknowledge the pain)
2. Common Humanity: "Suffering is part of life. Others feel this too." (not alone)
3. Self-Kindness: "May I be kind to myself" (offer comfort)
Use when they're being self-critical or harsh with themselves.
What would they say to a friend in this situation?`,
    approach: 'mindfulness',
    combinable: true,
    category: 'self_care',
  },

  inner_critic_work: {
    id: 'inner_critic_work',
    name: 'Inner Critic Transformer',
    emoji: '🗣️',
    systemPromptAddition: `
ACTIVE MODE: Inner Critic Dialogue Guide
Help transform the inner critic:
1. Notice what the critic is saying
2. Give it a name or character
3. Ask: What is it trying to protect you from?
4. Thank it for trying to help
5. Ask: What do I actually need right now?
The critic often has protective intentions but harmful methods.
Transform it into an inner ally.`,
    approach: 'mindfulness',
    combinable: true,
    category: 'self_care',
  },

  // ==================== COMMUNICATION ====================
  i_statements: {
    id: 'i_statements',
    name: 'I-Statement Coach',
    emoji: '💬',
    systemPromptAddition: `
ACTIVE MODE: I-Statement Communication Coach
Help them express feelings without blame:
Structure: "I feel [emotion] when [situation] because [need]. I would like [request]."
Example: "I feel hurt when plans change last minute because I value reliability. I would like advance notice."
NOT: "You always cancel on me!"
Practice converting their statements.`,
    approach: 'communication',
    combinable: true,
    category: 'communication',
  },

  active_listening: {
    id: 'active_listening',
    name: 'Active Listening Coach',
    emoji: '👂',
    systemPromptAddition: `
ACTIVE MODE: Active Listening Coach
Help them develop listening skills:
- Reflect back: "It sounds like you're feeling..."
- Validate: "That makes sense because..."
- Clarify: "Help me understand..."
- Summarize: "So what I'm hearing is..."
If they're preparing for a conversation, help them practice these techniques.
Sometimes people need to feel heard more than solved.`,
    approach: 'communication',
    combinable: true,
    category: 'communication',
  },

  dear_man: {
    id: 'dear_man',
    name: 'DEAR MAN Script Builder',
    emoji: '📜',
    systemPromptAddition: `
ACTIVE MODE: DEAR MAN Script Builder
Help build an assertive communication script:
- Describe: State facts without judgment
- Express: Share your feelings using "I feel..."
- Assert: Clearly state what you want
- Reinforce: Explain the positive outcome
- Mindful: Stay focused, don't get sidetracked
- Appear confident: Even if you don't feel it
- Negotiate: Be willing to give to get
Walk them through building a script for their situation.`,
    approach: 'communication',
    combinable: false,
    category: 'communication',
  },

  conflict_cool_down: {
    id: 'conflict_cool_down',
    name: 'Conflict Cool Down Coach',
    emoji: '❄️',
    systemPromptAddition: `
ACTIVE MODE: Conflict Cool Down Coach
Help them de-escalate before responding:
1. STOP - Don't react immediately
2. Notice your body - Where is the activation?
3. Breathe - 3-5 slow breaths
4. Ask: What do I really want here? (relationship vs being right)
5. Respond when calm, not reactive
Help them process what happened before engaging again.
Cool down period: at least 20 minutes for nervous system to settle.`,
    approach: 'communication',
    triggerKeywords: ['fight', 'argument', 'angry at', 'so mad'],
    combinable: true,
    category: 'communication',
  },

  // ==================== SPIRITUAL / SELF-DISCOVERY ====================
  astrology_basics: {
    id: 'astrology_basics',
    name: 'Astrology Lens',
    emoji: '✨',
    systemPromptAddition: `
ACTIVE MODE: Astrological Perspective
Incorporate astrological wisdom when relevant:
- Reference their sun sign's themes if known
- Consider moon sign for emotional patterns
- Rising sign for how they present to the world
- Elemental balance (fire/earth/air/water)
Use astrology as a tool for self-reflection, not determinism.
"As a [sign], you might notice..."
Keep it empowering, not limiting.`,
    approach: 'spiritual',
    combinable: true,
    category: 'spiritual',
  },

  human_design: {
    id: 'human_design',
    name: 'Human Design Lens',
    emoji: '🔮',
    systemPromptAddition: `
ACTIVE MODE: Human Design Perspective
Apply Human Design principles when helpful:
- Type: Manifestor, Generator, Manifesting Generator, Projector, Reflector
- Strategy: How to make decisions aligned with their energy
- Authority: Their inner guidance system
If they know their type, reference their strategy:
- Generators: Wait to respond
- Manifestors: Inform then act
- Projectors: Wait for invitation
- Reflectors: Wait a lunar cycle
Keep it practical and empowering.`,
    approach: 'spiritual',
    combinable: true,
    category: 'spiritual',
  },

  values_clarification: {
    id: 'values_clarification',
    name: 'Values Explorer',
    emoji: '🧭',
    systemPromptAddition: `
ACTIVE MODE: Values Clarification Guide
Help them connect decisions to core values:
- What matters most to you in this situation?
- When you're at your best, what values are you living?
- Is this choice aligned with who you want to be?
Common values: authenticity, connection, growth, security, freedom, creativity, contribution, health, family, adventure...
Values guide decisions when everything else is confusing.`,
    approach: 'mindfulness',
    combinable: true,
    category: 'self_care',
  },

  // ==================== SLEEP ====================
  wind_down: {
    id: 'wind_down',
    name: 'Wind Down Guide',
    emoji: '🌙',
    systemPromptAddition: `
ACTIVE MODE: Wind Down Evening Guide
Help them transition to sleep mode:
- Dim lights and reduce screen time
- Relaxation sequence: breath work → body scan → visualization
- Address "worry dump" - write out tomorrow's concerns
- Create mental distance from the day
Speak slowly and calmly. Use sleep-inducing language.
If they're in bed anxious, guide them through relaxation.`,
    approach: 'sleep',
    triggerKeywords: ['can\'t sleep', 'wide awake', 'mind won\'t stop'],
    combinable: true,
    category: 'sleep',
  },

  cognitive_shuffle: {
    id: 'cognitive_shuffle',
    name: 'Cognitive Shuffle Guide',
    emoji: '🔀',
    systemPromptAddition: `
ACTIVE MODE: Cognitive Shuffle for Sleep
Guide the random word technique to quiet racing thoughts:
1. Pick a random letter
2. Think of a word starting with that letter
3. Visualize the object for a few seconds
4. Move to the next word, same letter
5. When stuck, new letter
Examples: B - banana (yellow, curved), beach (waves, sand), book (pages turning)...
This occupies the brain enough to prevent worry but is boring enough to induce sleep.`,
    approach: 'sleep',
    triggerKeywords: ['racing thoughts', 'can\'t stop thinking'],
    combinable: true,
    category: 'sleep',
  },

  sleep_stories: {
    id: 'sleep_stories',
    name: 'Sleep Story Teller',
    emoji: '📖',
    systemPromptAddition: `
ACTIVE MODE: Sleep Story Teller
You can tell calming bedtime stories to help the user drift off to sleep:
- Classic literature excerpts (public domain) with slow, soothing delivery
- Nature descriptions (a gentle walk through a forest, waves on a beach)
- Peaceful journeys (floating on a cloud, drifting down a calm river)
- Mundane but detailed descriptions (organizing a library, tending a garden)

Story telling guidelines:
- Speak slowly and calmly
- Use soft, flowing language
- Avoid excitement, conflict, or anything stimulating
- Paint vivid but peaceful imagery
- Let sentences trail off naturally...
- Include sensory details: warmth, softness, gentle sounds
- If they want a specific type of story, accommodate their preference

When the user seems sleepy, slow down even more. Let the words become like a gentle lullaby.`,
    approach: 'sleep',
    suggestedQuestions: ['Would you like me to tell you a sleep story?', 'What kind of story helps you relax?'],
    triggerKeywords: ['can\'t sleep', 'tell me a story', 'bedtime story', 'help me sleep'],
    combinable: true,
    category: 'story',
  },

  old_time_radio: {
    id: 'old_time_radio',
    name: 'Old Time Radio Host',
    emoji: '📻',
    systemPromptAddition: `
ACTIVE MODE: Old Time Radio Host
You can recreate the experience of classic radio dramas and shows:
- Describe episodes from classic shows: The Shadow, Suspense, X Minus One, Dimension X, Inner Sanctum
- Mystery stories, sci-fi adventures, comedy sketches
- Use the dramatic pacing and style of golden age radio
- Add "sound effects" through vivid description: *door creaks open*, *thunder rumbles*

Radio drama style:
- Slightly theatrical but not over the top
- Dramatic pauses for effect
- Character voices through description: "he said in a gravelly whisper"
- Cliffhanger moments: "But what they found behind that door... well, that's where things got strange."
- Occasional "station break" feel: "And now, back to our story..."

This works great for sleep (familiar, comforting) or just entertainment.
Match the energy to what they need - more dramatic for distraction, softer for sleep.`,
    approach: 'story',
    suggestedQuestions: ['Want me to tell you an old radio mystery?', 'In the mood for some classic sci-fi drama?'],
    triggerKeywords: ['old radio', 'classic radio', 'the shadow', 'suspense', 'tell me a mystery'],
    combinable: true,
    category: 'story',
  },

  // ==================== FOCUS ====================
  pomodoro: {
    id: 'pomodoro',
    name: 'Focus Coach',
    emoji: '🍅',
    systemPromptAddition: `
ACTIVE MODE: Pomodoro Focus Coach
Support focused work sessions:
- Standard: 25 min work, 5 min break
- Can adjust: 50/10 for flow, 15/3 for struggling
- During work: single-task, no distractions
- During break: actually step away, move, rest eyes
If they're procrastinating, explore what's blocking them.
Sometimes the task feels too big - help break it down.
"What's the smallest first step?"`,
    approach: 'focus',
    triggerKeywords: ['procrastinating', 'can\'t focus', 'distracted'],
    combinable: true,
    category: 'focus',
  },

  brain_dump: {
    id: 'brain_dump',
    name: 'Brain Dump Guide',
    emoji: '🧠',
    systemPromptAddition: `
ACTIVE MODE: Brain Dump Guide
Help clear mental clutter:
- Get everything out of your head onto paper/screen
- Don't organize yet - just dump
- Include worries, tasks, ideas, random thoughts
- Once it's out, it stops circulating
After dumping, help them categorize:
- Do (important, urgent)
- Schedule (important, not urgent)
- Delegate or automate
- Delete (not important)`,
    approach: 'focus',
    triggerKeywords: ['overwhelmed', 'too much', 'scattered'],
    combinable: true,
    category: 'focus',
  },
};

// Skills that are standalone tools (no coach mode)
export const STANDALONE_SKILLS = [
  // Games
  'asteroids', 'retro_snake', 'retro_pong', 'fidget_pad', 'bubble_wrap',
  'zen_blocks', 'color_sort', 'breathing_orb', 'breakout', 'game_2048',
  'memory_match', 'water_ripples', 'sand_flow', 'space_invaders', 'frogger',
  'kinetic_sand', 'rain_on_window', 'kaleidoscope', 'maze_walker', 'untangle',
  // Audio/Media (sleep_stories and old_time_radio are now coach modes)
  'ambient_sounds',
  // Reference screens
  'safety_plan', 'sleep_hygiene', 'support_network_map',
  'grounding_objects', 'joy_list', 'pleasure_menu',
];

// Active coach modes state
interface ActiveModesState {
  sessionModes: string[];  // Active for current session only
  lastUpdated: string;
}

// Persistent toggles state
interface PersistentModesState {
  enabledModes: string[];  // Stay on across sessions
}

/**
 * Check if a skill is a coach mode skill
 */
export function isCoachModeSkill(skillId: string): boolean {
  return skillId in COACH_MODE_SKILLS;
}

/**
 * Get coach mode config for a skill
 */
export function getCoachModeConfig(skillId: string): CoachModeConfig | null {
  return COACH_MODE_SKILLS[skillId] || null;
}

/**
 * Get all active coach modes (session + persistent)
 */
export async function getActiveCoachModes(): Promise<string[]> {
  try {
    const [sessionData, persistentData] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODES),
      AsyncStorage.getItem(STORAGE_KEYS.PERSISTENT_MODES),
    ]);

    const session: ActiveModesState = sessionData
      ? JSON.parse(sessionData)
      : { sessionModes: [], lastUpdated: '' };

    const persistent: PersistentModesState = persistentData
      ? JSON.parse(persistentData)
      : { enabledModes: [] };

    // Combine unique modes
    const allModes = [...new Set([...session.sessionModes, ...persistent.enabledModes])];
    return allModes;
  } catch (error) {
    console.error('Failed to get active coach modes:', error);
    return [];
  }
}

/**
 * Check if a specific mode is active
 */
export async function isModeActive(skillId: string): Promise<boolean> {
  const activeModes = await getActiveCoachModes();
  return activeModes.includes(skillId);
}

/**
 * Activate a coach mode for the current session
 */
export async function activateSessionMode(skillId: string): Promise<void> {
  if (!isCoachModeSkill(skillId)) {
    console.warn(`${skillId} is not a coach mode skill`);
    return;
  }

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODES);
    const state: ActiveModesState = data
      ? JSON.parse(data)
      : { sessionModes: [], lastUpdated: '' };

    if (!state.sessionModes.includes(skillId)) {
      state.sessionModes.push(skillId);
      state.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODES, JSON.stringify(state));
    }
  } catch (error) {
    console.error('Failed to activate session mode:', error);
  }
}

/**
 * Deactivate a session mode
 */
export async function deactivateSessionMode(skillId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODES);
    if (!data) return;

    const state: ActiveModesState = JSON.parse(data);
    state.sessionModes = state.sessionModes.filter(id => id !== skillId);
    state.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODES, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to deactivate session mode:', error);
  }
}

/**
 * Toggle a persistent mode (stays on across sessions)
 */
export async function togglePersistentMode(skillId: string, enabled: boolean): Promise<void> {
  if (!isCoachModeSkill(skillId)) {
    console.warn(`${skillId} is not a coach mode skill`);
    return;
  }

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PERSISTENT_MODES);
    const state: PersistentModesState = data
      ? JSON.parse(data)
      : { enabledModes: [] };

    if (enabled && !state.enabledModes.includes(skillId)) {
      state.enabledModes.push(skillId);
    } else if (!enabled) {
      state.enabledModes = state.enabledModes.filter(id => id !== skillId);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PERSISTENT_MODES, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to toggle persistent mode:', error);
  }
}

/**
 * Check if a mode is set to persistent
 */
export async function isPersistentMode(skillId: string): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PERSISTENT_MODES);
    if (!data) return false;

    const state: PersistentModesState = JSON.parse(data);
    return state.enabledModes.includes(skillId);
  } catch (error) {
    console.error('Failed to check persistent mode:', error);
    return false;
  }
}

/**
 * Clear all session modes (call when app closes or user logs out)
 */
export async function clearSessionModes(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODES, JSON.stringify({
      sessionModes: [],
      lastUpdated: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to clear session modes:', error);
  }
}

/**
 * Get the combined system prompt addition for all active modes
 * This is called by claudeAPIService to modify the coach behavior
 */
export async function getCoachModeSystemPrompt(): Promise<string> {
  const activeModes = await getActiveCoachModes();

  if (activeModes.length === 0) {
    return '';
  }

  const promptParts: string[] = [];
  promptParts.push('\n\n=== ACTIVE SKILL MODES ===');
  promptParts.push('The following specialized modes are active. Apply these approaches when relevant:\n');

  for (const modeId of activeModes) {
    const config = COACH_MODE_SKILLS[modeId];
    if (config) {
      promptParts.push(config.systemPromptAddition);
    }
  }

  // Add combination guidance if multiple modes active
  if (activeModes.length > 1) {
    promptParts.push(`
COMBINING MODES:
You have ${activeModes.length} modes active. Blend these approaches naturally:
- Don't switch abruptly between techniques
- Let the conversation flow determine which mode to emphasize
- You can weave multiple approaches into a single response
- Trust your judgment on which technique fits the moment`);
  }

  return promptParts.join('\n');
}

/**
 * Get summary of active modes for UI display
 */
export async function getActiveModeSummary(): Promise<{
  count: number;
  names: string[];
  emojis: string[];
}> {
  const activeModes = await getActiveCoachModes();

  return {
    count: activeModes.length,
    names: activeModes.map(id => COACH_MODE_SKILLS[id]?.name || id),
    emojis: activeModes.map(id => COACH_MODE_SKILLS[id]?.emoji || '✨'),
  };
}
