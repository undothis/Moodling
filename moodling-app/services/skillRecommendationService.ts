/**
 * Skill Recommendation Service
 *
 * Analyzes user context (mood, topics, situation) and recommends
 * relevant skills from the Skills toolkit.
 *
 * Used by Coach to proactively suggest helpful skills during conversation.
 */

import { AVAILABLE_SKILLS, Skill, SkillCategory } from '@/types/SkillProgression';

// ============================================
// TYPES
// ============================================

export interface SkillRecommendation {
  skill: Skill;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface RecommendationContext {
  mood?: string;
  topics?: string[];
  recentMessage?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  hasActiveSession?: boolean; // e.g., drink pacing active
}

// ============================================
// KEYWORD MAPPINGS
// ============================================

/**
 * Map keywords/emotions to skill categories
 */
const KEYWORD_TO_CATEGORIES: Record<string, SkillCategory[]> = {
  // Anxiety keywords
  anxious: ['grounding', 'anxiety', 'body'],
  anxiety: ['grounding', 'anxiety', 'body'],
  worried: ['anxiety', 'grounding'],
  worry: ['anxiety', 'grounding'],
  panic: ['crisis', 'grounding', 'body'],
  overwhelmed: ['grounding', 'crisis', 'body'],
  stressed: ['grounding', 'mindfulness', 'body'],
  nervous: ['anxiety', 'grounding'],
  fear: ['anxiety', 'grounding'],
  scared: ['anxiety', 'grounding', 'crisis'],

  // Sleep keywords
  sleep: ['sleep'],
  insomnia: ['sleep'],
  tired: ['sleep', 'self_care'],
  exhausted: ['sleep', 'self_care'],
  'cant sleep': ['sleep'],
  awake: ['sleep'],
  restless: ['sleep', 'grounding'],

  // Focus keywords
  focus: ['focus'],
  distracted: ['focus', 'mindfulness'],
  procrastinating: ['focus'],
  unmotivated: ['focus', 'self_care'],
  overwhelmed: ['focus', 'grounding'],
  scattered: ['focus', 'mindfulness'],

  // Relationship keywords
  relationship: ['relationships', 'conversation_practice'],
  partner: ['relationships', 'conversation_practice'],
  friend: ['relationships', 'conversation_practice'],
  family: ['relationships', 'conversation_practice'],
  conflict: ['relationships', 'conversation_practice'],
  argument: ['relationships', 'conversation_practice'],
  boundary: ['relationships', 'conversation_practice'],
  boundaries: ['relationships', 'conversation_practice'],
  breakup: ['relationships', 'conversation_practice', 'self_care'],
  lonely: ['relationships', 'self_care'],
  isolated: ['relationships', 'self_care'],

  // Difficult conversation keywords
  'hard conversation': ['conversation_practice', 'relationships'],
  'difficult conversation': ['conversation_practice', 'relationships'],
  'need to tell': ['conversation_practice'],
  'how do i say': ['conversation_practice'],
  'asking for': ['conversation_practice'],
  'confronting': ['conversation_practice', 'relationships'],
  apologize: ['conversation_practice'],
  apology: ['conversation_practice'],
  'say no': ['conversation_practice', 'relationships'],
  negotiate: ['conversation_practice'],
  raise: ['conversation_practice'],
  feedback: ['conversation_practice'],

  // Self-care keywords
  sad: ['self_care', 'mindfulness'],
  depressed: ['self_care', 'crisis'],
  down: ['self_care', 'mindfulness'],
  'self-care': ['self_care'],
  'be kind': ['self_care'],
  'hard on myself': ['self_care', 'mindfulness'],
  'inner critic': ['self_care'],
  guilty: ['self_care', 'mindfulness'],
  shame: ['self_care', 'mindfulness'],

  // Mindfulness keywords
  present: ['mindfulness'],
  mindful: ['mindfulness'],
  meditation: ['mindfulness'],
  meditate: ['mindfulness'],
  breathe: ['grounding', 'mindfulness'],
  breathing: ['grounding', 'mindfulness'],
  calm: ['mindfulness', 'grounding'],

  // Crisis keywords
  crisis: ['crisis', 'grounding'],
  emergency: ['crisis'],
  suicidal: ['crisis'],
  'hurt myself': ['crisis'],
  'self-harm': ['crisis'],
  hopeless: ['crisis', 'self_care'],
  'give up': ['crisis', 'self_care'],

  // Body-based keywords
  body: ['body', 'mindfulness'],
  tension: ['body', 'grounding'],
  tight: ['body', 'grounding'],
  physical: ['body'],
  somatic: ['body'],

  // Drinking keywords
  drinking: ['self_care'],
  drink: ['self_care'],
  alcohol: ['self_care'],
  party: ['self_care'],

  // Games/distraction keywords
  distract: ['games'],
  distraction: ['games'],
  bored: ['games', 'self_care'],
  fidget: ['games'],
  game: ['games'],
};

/**
 * Map specific situations to specific skills
 */
const SITUATION_TO_SKILLS: Record<string, string[]> = {
  // Grounding needs
  'panic attack': ['physiological_sigh', 'tipp_skills', 'cold_water', 'grounding_ladder'],
  'anxiety attack': ['physiological_sigh', 'box_breathing', 'five_senses', 'grounding_ladder'],
  'can\'t calm down': ['physiological_sigh', 'vagal_tone', 'tipp_skills'],
  'racing thoughts': ['cognitive_shuffle', 'box_breathing', 'containment'],
  'spiraling': ['five_senses', 'grounding_ladder', 'thought_record'],

  // Sleep needs
  'can\'t sleep': ['478_breathing', 'cognitive_shuffle', 'body_scan_sleep', 'sleep_stories'],
  'mind racing at night': ['worry_journal_night', 'cognitive_shuffle', 'sleep_stories'],
  'bad dream': ['grounding_ladder', 'safe_place_visualization'],
  'nightmare': ['grounding_ladder', 'safe_place_visualization'],

  // Relationship needs
  'fight with partner': ['conflict_cool_down', 'i_statements', 'repair_conversations'],
  'fight with friend': ['conflict_cool_down', 'i_statements', 'confronting_friend'],
  'need to set a boundary': ['boundary_scripts', 'setting_boundaries', 'dear_man'],
  'how to say no': ['boundary_scripts', 'setting_boundaries'],
  'break up': ['ending_relationship', 'self_compassion_break'],
  'need to apologize': ['apologizing', 'repair_conversations'],

  // Conversation practice needs
  'ask for a raise': ['asking_for_raise', 'dear_man'],
  'job interview': ['job_interview'],
  'tell my parents': ['telling_parents'],
  'give feedback': ['giving_feedback', 'i_statements'],

  // Focus needs
  'can\'t focus': ['pomodoro', 'single_tasking', 'brain_dump'],
  'procrastinating': ['two_minute_rule', 'pomodoro'],
  'too many tasks': ['brain_dump', 'task_batching'],

  // Self-care needs
  'being hard on myself': ['self_compassion_break', 'inner_critic_work'],
  'feel worthless': ['self_compassion_break', 'gratitude_practice'],
  'need self-care': ['joy_list', 'pleasure_menu', 'self_compassion_break'],

  // Mindfulness needs
  'want to meditate': ['body_scan', 'mindful_moment', 'loving_kindness'],
  'need to calm down': ['box_breathing', 'physiological_sigh', 'body_scan'],

  // Drinking
  'going to a party': ['drink_pacing'],
  'drinking tonight': ['drink_pacing'],
  'track my drinking': ['drink_pacing'],
  'pace myself': ['drink_pacing'],
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get unlocked skills only
 */
function getUnlockedSkills(): Skill[] {
  // In a real app, this would check actual unlock status
  // For now, return skills that are marked as unlocked by default
  return AVAILABLE_SKILLS.filter(s => s.isUnlocked);
}

/**
 * Find skills by category
 */
function getSkillsByCategory(category: SkillCategory): Skill[] {
  return getUnlockedSkills().filter(s => s.category === category);
}

/**
 * Find skills by ID
 */
function getSkillById(id: string): Skill | undefined {
  return getUnlockedSkills().find(s => s.id === id);
}

/**
 * Analyze text for keywords and return relevant categories
 */
function analyzeTextForCategories(text: string): SkillCategory[] {
  const lowerText = text.toLowerCase();
  const foundCategories = new Set<SkillCategory>();

  for (const [keyword, categories] of Object.entries(KEYWORD_TO_CATEGORIES)) {
    if (lowerText.includes(keyword)) {
      categories.forEach(cat => foundCategories.add(cat));
    }
  }

  return Array.from(foundCategories);
}

/**
 * Analyze text for specific situations and return skill IDs
 */
function analyzeTextForSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundSkills = new Set<string>();

  for (const [situation, skillIds] of Object.entries(SITUATION_TO_SKILLS)) {
    if (lowerText.includes(situation)) {
      skillIds.forEach(id => foundSkills.add(id));
    }
  }

  return Array.from(foundSkills);
}

/**
 * Get skill recommendations based on context
 */
export function getSkillRecommendations(
  context: RecommendationContext,
  maxRecommendations: number = 3
): SkillRecommendation[] {
  const recommendations: SkillRecommendation[] = [];
  const addedSkillIds = new Set<string>();

  // Analyze recent message for specific skills first
  if (context.recentMessage) {
    const specificSkillIds = analyzeTextForSkills(context.recentMessage);
    for (const skillId of specificSkillIds) {
      if (addedSkillIds.has(skillId)) continue;
      const skill = getSkillById(skillId);
      if (skill) {
        recommendations.push({
          skill,
          reason: `This might help with what you're going through`,
          urgency: 'high',
        });
        addedSkillIds.add(skillId);
      }
      if (recommendations.length >= maxRecommendations) break;
    }
  }

  // Analyze for categories
  if (recommendations.length < maxRecommendations && context.recentMessage) {
    const categories = analyzeTextForCategories(context.recentMessage);

    // Prioritize certain categories as high urgency
    const highUrgencyCategories: SkillCategory[] = ['crisis', 'grounding'];

    for (const category of categories) {
      if (recommendations.length >= maxRecommendations) break;

      const categorySkills = getSkillsByCategory(category);
      const urgency = highUrgencyCategories.includes(category) ? 'high' : 'medium';

      for (const skill of categorySkills.slice(0, 2)) {
        if (addedSkillIds.has(skill.id)) continue;
        recommendations.push({
          skill,
          reason: getReasonForCategory(category),
          urgency: urgency as 'high' | 'medium' | 'low',
        });
        addedSkillIds.add(skill.id);
        if (recommendations.length >= maxRecommendations) break;
      }
    }
  }

  // Consider time of day
  if (recommendations.length < maxRecommendations && context.timeOfDay === 'night') {
    const sleepSkills = getSkillsByCategory('sleep');
    for (const skill of sleepSkills.slice(0, 1)) {
      if (addedSkillIds.has(skill.id)) continue;
      recommendations.push({
        skill,
        reason: 'Since it\'s nighttime',
        urgency: 'low',
      });
      addedSkillIds.add(skill.id);
    }
  }

  // Consider mood
  if (recommendations.length < maxRecommendations && context.mood) {
    const moodCategories = analyzeTextForCategories(context.mood);
    for (const category of moodCategories) {
      if (recommendations.length >= maxRecommendations) break;
      const categorySkills = getSkillsByCategory(category);
      for (const skill of categorySkills.slice(0, 1)) {
        if (addedSkillIds.has(skill.id)) continue;
        recommendations.push({
          skill,
          reason: `Based on how you're feeling`,
          urgency: 'medium',
        });
        addedSkillIds.add(skill.id);
      }
    }
  }

  return recommendations.slice(0, maxRecommendations);
}

/**
 * Get a reason string for a category
 */
function getReasonForCategory(category: SkillCategory): string {
  const reasons: Record<SkillCategory, string> = {
    grounding: 'This can help you feel more grounded',
    anxiety: 'This might help with anxious feelings',
    sleep: 'This could help with sleep',
    focus: 'This can help with focus',
    self_care: 'A little self-care might help',
    relationships: 'This might help with the relationship situation',
    mindfulness: 'A mindfulness practice could be good right now',
    games: 'Sometimes a healthy distraction helps',
    crisis: 'This is designed for difficult moments',
    body: 'Your body might benefit from this',
    discovery: 'This might offer some insight',
    conversation_practice: 'You could practice this conversation first',
  };
  return reasons[category] || 'This might be helpful';
}

/**
 * Get skill recommendations formatted for Coach context
 */
export function getSkillRecommendationsForCoach(
  recentMessage: string,
  mood?: string,
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
): string {
  const recommendations = getSkillRecommendations({
    recentMessage,
    mood,
    timeOfDay,
  });

  if (recommendations.length === 0) {
    return '';
  }

  const lines = ['RELEVANT SKILLS (you may suggest these if appropriate):'];
  for (const rec of recommendations) {
    const urgencyMarker = rec.urgency === 'high' ? '⚡' : rec.urgency === 'medium' ? '•' : '○';
    lines.push(`${urgencyMarker} ${rec.skill.emoji} ${rec.skill.name}: ${rec.skill.description}`);
  }
  lines.push('');
  lines.push('Note: Only suggest skills if they fit naturally in the conversation. Don\'t force it.');

  return lines.join('\n');
}

/**
 * Check if a crisis skill should be recommended
 */
export function shouldRecommendCrisisSkill(message: string): boolean {
  const crisisKeywords = [
    'suicidal', 'suicide', 'kill myself', 'end my life', 'want to die',
    'hurt myself', 'self-harm', 'cutting', 'hopeless', 'no point',
    'give up', 'can\'t go on', 'end it all',
  ];

  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Get crisis skill recommendations
 */
export function getCrisisSkillRecommendations(): Skill[] {
  return AVAILABLE_SKILLS.filter(
    s => s.category === 'crisis' && s.isUnlocked
  );
}

// ============================================
// EXPORTS
// ============================================

export default {
  getSkillRecommendations,
  getSkillRecommendationsForCoach,
  shouldRecommendCrisisSkill,
  getCrisisSkillRecommendations,
};
