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
 * Comprehensive mappings so coach can suggest relevant skills
 */
const SITUATION_TO_SKILLS: Record<string, string[]> = {
  // ============================================
  // GROUNDING & PANIC
  // ============================================
  'panic attack': ['physiological_sigh', 'tipp_skills', 'cold_water', 'grounding_ladder'],
  'anxiety attack': ['physiological_sigh', 'box_breathing', 'five_senses', 'grounding_ladder'],
  'can\'t calm down': ['physiological_sigh', 'vagal_tone', 'tipp_skills'],
  'racing thoughts': ['cognitive_shuffle', 'box_breathing', 'containment'],
  'spiraling': ['five_senses', 'grounding_ladder', 'thought_record'],
  'freaking out': ['physiological_sigh', 'box_breathing', 'five_senses'],
  'losing it': ['tipp_skills', 'cold_water', 'grounding_ladder'],
  'can\'t breathe': ['physiological_sigh', 'box_breathing', '478_breathing'],
  'heart racing': ['physiological_sigh', 'vagal_tone', 'box_breathing'],
  'feel unreal': ['five_senses', 'grounding_ladder', 'grounding_objects'],
  'dissociating': ['five_senses', 'grounding_ladder', 'cold_water'],
  'out of body': ['five_senses', 'grounding_objects', 'cold_water'],
  'need to ground': ['five_senses', 'grounding_objects', 'grounding_ladder'],
  'feel disconnected': ['five_senses', 'butterfly_hug', 'grounding_objects'],
  'hyperventilating': ['physiological_sigh', 'box_breathing', '478_breathing'],
  'shaking': ['shake_it_out', 'butterfly_hug', 'vagal_tone'],
  'trembling': ['shake_it_out', 'butterfly_hug', 'tipp_skills'],

  // ============================================
  // ANXIETY & WORRY
  // ============================================
  'so anxious': ['box_breathing', 'physiological_sigh', 'worry_time'],
  'really anxious': ['box_breathing', 'thought_challenging', 'containment'],
  'anxiety is bad': ['tipp_skills', 'physiological_sigh', 'grounding_ladder'],
  'worried about': ['worry_time', 'thought_challenging', 'containment'],
  'can\'t stop worrying': ['worry_time', 'containment', 'thought_challenging'],
  'overthinking': ['cognitive_shuffle', 'thought_challenging', 'containment'],
  'what if': ['worst_case_best_case', 'thought_challenging', 'fact_vs_feeling'],
  'catastrophizing': ['worst_case_best_case', 'thought_challenging', 'cognitive_distortions'],
  'worst case': ['worst_case_best_case', 'thought_challenging'],
  'afraid of': ['anxiety_ladder', 'worst_case_best_case', 'thought_challenging'],
  'scared of': ['anxiety_ladder', 'thought_challenging', 'containment'],
  'nervous about': ['box_breathing', 'thought_challenging', 'worst_case_best_case'],
  'dread': ['thought_challenging', 'worst_case_best_case', 'containment'],
  'uncertain': ['uncertainty_tolerance', 'thought_challenging'],
  'don\'t know what will happen': ['uncertainty_tolerance', 'containment'],
  'fear of unknown': ['uncertainty_tolerance', 'worst_case_best_case'],
  'intrusive thoughts': ['containment', 'cognitive_shuffle', 'thought_record'],
  'obsessing': ['containment', 'thought_challenging', 'worry_time'],

  // ============================================
  // SLEEP
  // ============================================
  'can\'t sleep': ['478_breathing', 'cognitive_shuffle', 'body_scan_sleep', 'sleep_stories'],
  'trouble sleeping': ['sleep_hygiene', '478_breathing', 'body_scan_sleep'],
  'insomnia': ['cognitive_shuffle', '478_breathing', 'sleep_stories'],
  'wide awake': ['cognitive_shuffle', '478_breathing', 'body_scan_sleep'],
  'mind racing at night': ['worry_journal_night', 'cognitive_shuffle', 'sleep_stories'],
  'bad dream': ['grounding_ladder', 'safe_place_visualization'],
  'nightmare': ['grounding_ladder', 'safe_place_visualization'],
  'night terror': ['grounding_ladder', 'safe_place_visualization', 'five_senses'],
  'woke up anxious': ['grounding_ladder', 'box_breathing', 'safe_place_visualization'],
  'can\'t fall asleep': ['478_breathing', 'cognitive_shuffle', 'body_scan_sleep'],
  'can\'t stay asleep': ['worry_journal_night', '478_breathing', 'sleep_stories'],
  'sleep problems': ['sleep_hygiene', '478_breathing', 'cognitive_shuffle'],
  'tired but wired': ['478_breathing', 'body_scan_sleep', 'sleep_stories'],
  'need to relax': ['body_scan_sleep', 'sleep_stories', 'ambient_sounds'],
  'need background noise': ['ambient_sounds', 'sleep_stories', 'old_time_radio'],
  'white noise': ['ambient_sounds'],
  'wind down': ['wind_down', 'sleep_hygiene', '478_breathing'],
  'bedtime routine': ['wind_down', 'sleep_hygiene'],
  'sleep better': ['sleep_hygiene', 'wind_down', '478_breathing'],

  // ============================================
  // FOCUS & PRODUCTIVITY
  // ============================================
  'can\'t focus': ['pomodoro', 'single_tasking', 'brain_dump'],
  'can\'t concentrate': ['pomodoro', 'single_tasking', 'environment_design'],
  'distracted': ['single_tasking', 'pomodoro', 'environment_design'],
  'procrastinating': ['two_minute_rule', 'pomodoro', 'brain_dump'],
  'putting things off': ['two_minute_rule', 'pomodoro'],
  'avoiding': ['two_minute_rule', 'brain_dump'],
  'too many tasks': ['brain_dump', 'task_batching', 'pomodoro'],
  'overwhelmed with work': ['brain_dump', 'task_batching', 'energy_mapping'],
  'don\'t know where to start': ['brain_dump', 'two_minute_rule', 'task_batching'],
  'productivity': ['pomodoro', 'task_batching', 'energy_mapping'],
  'get things done': ['pomodoro', 'two_minute_rule', 'task_batching'],
  'be productive': ['pomodoro', 'energy_mapping', 'environment_design'],
  'work from home': ['environment_design', 'pomodoro', 'single_tasking'],
  'no motivation': ['two_minute_rule', 'behavioral_activation', 'energy_mapping'],
  'unmotivated': ['two_minute_rule', 'behavioral_activation', 'brain_dump'],
  'low energy': ['energy_mapping', 'energy_budget', 'behavioral_activation'],
  'exhausted': ['energy_budget', 'energy_mapping', 'self_compassion_break'],
  'burned out': ['energy_budget', 'self_compassion_break', 'needs_inventory'],
  'burnout': ['energy_budget', 'needs_inventory', 'self_compassion_break'],

  // ============================================
  // SELF-CARE & SELF-COMPASSION
  // ============================================
  'being hard on myself': ['self_compassion_break', 'inner_critic_work'],
  'too hard on myself': ['self_compassion_break', 'inner_critic_work'],
  'self critical': ['inner_critic_work', 'self_compassion_break'],
  'inner critic': ['inner_critic_work', 'self_compassion_break'],
  'hate myself': ['self_compassion_break', 'inner_critic_work', 'loving_kindness'],
  'feel worthless': ['self_compassion_break', 'gratitude_practice', 'inner_critic_work'],
  'not good enough': ['self_compassion_break', 'inner_critic_work', 'values_clarification'],
  'imposter': ['self_compassion_break', 'thought_challenging', 'inner_critic_work'],
  'need self-care': ['joy_list', 'pleasure_menu', 'self_compassion_break'],
  'self care': ['joy_list', 'pleasure_menu', 'needs_inventory'],
  'treat myself': ['pleasure_menu', 'joy_list'],
  'feel guilty': ['self_compassion_break', 'thought_challenging'],
  'ashamed': ['self_compassion_break', 'loving_kindness'],
  'shame': ['self_compassion_break', 'loving_kindness', 'rain_technique'],
  'grateful': ['gratitude_practice'],
  'gratitude': ['gratitude_practice'],
  'thankful': ['gratitude_practice'],
  'what matters': ['values_clarification', 'needs_inventory'],
  'my values': ['values_clarification'],
  'what I need': ['needs_inventory', 'values_clarification'],
  'my needs': ['needs_inventory'],
  'depleted': ['energy_budget', 'needs_inventory', 'self_compassion_break'],
  'running on empty': ['energy_budget', 'needs_inventory'],

  // ============================================
  // RELATIONSHIPS
  // ============================================
  'fight with partner': ['conflict_cool_down', 'i_statements', 'repair_conversations'],
  'fight with friend': ['conflict_cool_down', 'i_statements', 'confronting_friend'],
  'had a fight': ['conflict_cool_down', 'repair_conversations'],
  'argument': ['conflict_cool_down', 'i_statements'],
  'disagreement': ['i_statements', 'active_listening'],
  'need to set a boundary': ['boundary_scripts', 'setting_boundaries', 'dear_man'],
  'how to say no': ['boundary_scripts', 'setting_boundaries'],
  'saying no': ['boundary_scripts', 'setting_boundaries'],
  'can\'t say no': ['boundary_scripts', 'setting_boundaries', 'dear_man'],
  'people pleasing': ['boundary_scripts', 'setting_boundaries', 'needs_inventory'],
  'break up': ['ending_relationship', 'self_compassion_break'],
  'breaking up': ['ending_relationship', 'self_compassion_break'],
  'end relationship': ['ending_relationship'],
  'end the relationship': ['ending_relationship'],
  'need to apologize': ['apologizing', 'repair_conversations'],
  'say sorry': ['apologizing', 'repair_conversations'],
  'made a mistake': ['apologizing', 'self_compassion_break'],
  'hurt someone': ['apologizing', 'repair_conversations', 'self_compassion_break'],
  'relationship problems': ['i_statements', 'active_listening', 'repair_conversations'],
  'partner issues': ['i_statements', 'conflict_cool_down', 'repair_conversations'],
  'communication issues': ['i_statements', 'active_listening', 'nvc_practice'],
  'not being heard': ['i_statements', 'dear_man', 'active_listening'],
  'feel unheard': ['i_statements', 'dear_man'],
  'support system': ['support_network_map'],
  'who can I call': ['support_network_map'],
  'feel alone': ['support_network_map', 'loving_kindness'],
  'lonely': ['support_network_map', 'loving_kindness', 'self_compassion_break'],
  'isolated': ['support_network_map', 'behavioral_activation'],

  // ============================================
  // CONVERSATION PRACTICE
  // ============================================
  'ask for a raise': ['asking_for_raise', 'dear_man'],
  'salary negotiation': ['asking_for_raise', 'dear_man'],
  'negotiate salary': ['asking_for_raise', 'dear_man'],
  'job interview': ['job_interview'],
  'interview prep': ['job_interview'],
  'preparing for interview': ['job_interview'],
  'tell my parents': ['telling_parents'],
  'tell my family': ['telling_parents'],
  'come out': ['telling_parents', 'setting_boundaries'],
  'give feedback': ['giving_feedback', 'i_statements'],
  'give criticism': ['giving_feedback', 'i_statements'],
  'constructive feedback': ['giving_feedback', 'i_statements'],
  'confront': ['confronting_friend', 'i_statements', 'dear_man'],
  'confrontation': ['confronting_friend', 'i_statements'],
  'difficult conversation': ['conversation_practice', 'dear_man', 'i_statements'],
  'hard conversation': ['conversation_practice', 'dear_man'],
  'tough conversation': ['conversation_practice', 'dear_man'],
  'practice conversation': ['conversation_practice'],
  'roleplay': ['conversation_practice'],
  'ask for help': ['asking_for_help', 'dear_man'],
  'need help': ['asking_for_help'],
  'nonviolent communication': ['nvc_practice', 'i_statements'],
  'nvc': ['nvc_practice'],
  'communicate better': ['nvc_practice', 'i_statements', 'active_listening'],
  'express myself': ['i_statements', 'nvc_practice'],
  'express feelings': ['i_statements', 'nvc_practice', 'emotional_labeling'],

  // ============================================
  // MINDFULNESS
  // ============================================
  'want to meditate': ['body_scan', 'mindful_moment', 'loving_kindness'],
  'meditation': ['body_scan', 'mindful_moment', 'loving_kindness'],
  'meditate': ['body_scan', 'mindful_moment', 'loving_kindness'],
  'mindfulness': ['mindful_moment', 'body_scan', 'open_awareness'],
  'need to calm down': ['box_breathing', 'physiological_sigh', 'body_scan'],
  'be present': ['mindful_moment', 'open_awareness', 'noting_practice'],
  'stay present': ['mindful_moment', 'noting_practice'],
  'in the moment': ['mindful_moment', 'open_awareness'],
  'body awareness': ['body_scan', 'somatic_tracking'],
  'scan my body': ['body_scan', 'body_scan_sleep'],
  'self compassion': ['loving_kindness', 'self_compassion_break'],
  'metta': ['loving_kindness'],
  'loving kindness': ['loving_kindness'],
  'noting': ['noting_practice'],
  'observe thoughts': ['noting_practice', 'open_awareness'],
  'watch thoughts': ['noting_practice', 'open_awareness'],
  'mindful eating': ['mindful_eating'],
  'eat mindfully': ['mindful_eating'],
  'walking meditation': ['walking_meditation'],
  'mindful walk': ['walking_meditation'],
  'rain meditation': ['rain_technique'],
  'recognize allow': ['rain_technique'],

  // ============================================
  // BODY & SOMATIC
  // ============================================
  'tension': ['body_scan', 'shake_it_out', 'somatic_tracking'],
  'tight muscles': ['body_scan', 'shake_it_out'],
  'holding tension': ['body_scan', 'shake_it_out', 'somatic_tracking'],
  'body feels': ['somatic_tracking', 'body_scan'],
  'feel in my body': ['somatic_tracking', 'body_scan', 'emotional_labeling'],
  'physical symptoms': ['somatic_tracking', 'vagal_tone'],
  'somatic': ['somatic_tracking', 'body_scan'],
  'shake off': ['shake_it_out'],
  'release tension': ['shake_it_out', 'body_scan'],
  'nervous system': ['vagal_tone', 'physiological_sigh'],
  'vagus nerve': ['vagal_tone'],
  'calm nervous system': ['vagal_tone', 'physiological_sigh', 'cold_water'],

  // ============================================
  // EMOTIONS & URGES
  // ============================================
  'urge': ['urge_surfing', 'opposite_action'],
  'craving': ['urge_surfing', 'opposite_action'],
  'impulse': ['urge_surfing', 'wise_mind'],
  'want to do something bad': ['urge_surfing', 'opposite_action', 'wise_mind'],
  'feeling intense': ['urge_surfing', 'tipp_skills', 'opposite_action'],
  'strong emotion': ['emotional_labeling', 'rain_technique', 'urge_surfing'],
  'identify emotion': ['emotional_labeling'],
  'what am I feeling': ['emotional_labeling', 'somatic_tracking'],
  'name my feelings': ['emotional_labeling'],
  'emotional': ['emotional_labeling', 'rain_technique'],
  'overwhelming emotion': ['tipp_skills', 'urge_surfing', 'opposite_action'],

  // ============================================
  // CRISIS & DISTRESS
  // ============================================
  'crisis': ['safety_plan', 'grounding_ladder', 'tipp_skills'],
  'emergency': ['safety_plan', 'tipp_skills'],
  'suicidal': ['safety_plan', 'crisis_support'],
  'hurt myself': ['safety_plan', 'crisis_support', 'tipp_skills'],
  'self-harm': ['safety_plan', 'tipp_skills', 'opposite_action'],
  'hopeless': ['safety_plan', 'self_compassion_break', 'loving_kindness'],
  'give up': ['safety_plan', 'self_compassion_break'],
  'can\'t take it': ['tipp_skills', 'grounding_ladder', 'distress_tolerance_kit'],
  'can\'t handle': ['tipp_skills', 'distress_tolerance_kit', 'grounding_ladder'],
  'too much': ['tipp_skills', 'distress_tolerance_kit'],
  'falling apart': ['grounding_ladder', 'tipp_skills', 'self_compassion_break'],
  'breaking down': ['grounding_ladder', 'tipp_skills', 'safety_plan'],
  'at my limit': ['tipp_skills', 'distress_tolerance_kit', 'window_tolerance'],
  'window of tolerance': ['window_tolerance', 'tipp_skills'],
  'dysregulated': ['tipp_skills', 'vagal_tone', 'window_tolerance'],
  'out of control': ['tipp_skills', 'grounding_ladder', 'opposite_action'],
  'distress tolerance': ['distress_tolerance_kit', 'tipp_skills'],
  'coping kit': ['distress_tolerance_kit'],
  'opposite action': ['opposite_action'],
  'do the opposite': ['opposite_action'],
  'radical acceptance': ['radical_acceptance'],
  'accept it': ['radical_acceptance', 'wise_mind'],
  'can\'t change': ['radical_acceptance'],
  'wise mind': ['wise_mind'],
  'emotion mind': ['wise_mind', 'opposite_action'],
  'reasonable mind': ['wise_mind'],

  // ============================================
  // COGNITIVE / THINKING
  // ============================================
  'thinking patterns': ['thought_record', 'cognitive_distortions'],
  'thought record': ['thought_record'],
  'track my thoughts': ['thought_record'],
  'negative thoughts': ['thought_challenging', 'thought_record', 'cognitive_distortions'],
  'cognitive distortion': ['cognitive_distortions', 'thought_challenging'],
  'black and white thinking': ['cognitive_distortions', 'thought_challenging'],
  'all or nothing': ['cognitive_distortions', 'thought_challenging'],
  'mind reading': ['cognitive_distortions', 'thought_challenging'],
  'fortune telling': ['cognitive_distortions', 'worst_case_best_case'],
  'should statements': ['cognitive_distortions', 'self_compassion_break'],
  'labeling': ['cognitive_distortions', 'emotional_labeling'],
  'personalization': ['cognitive_distortions', 'thought_challenging'],
  'stuck in my head': ['cognitive_shuffle', 'thought_challenging', 'mindful_moment'],

  // ============================================
  // HABITS
  // ============================================
  'build a habit': ['habit_stacking', 'implementation_intentions', 'habit_timer'],
  'new habit': ['habit_stacking', 'implementation_intentions', 'habit_timer'],
  'habit': ['habit_stacking', 'habit_timer', 'implementation_intentions'],
  'routine': ['habit_stacking', 'implementation_intentions'],
  'make it stick': ['habit_stacking', 'implementation_intentions'],
  'track habit': ['habit_timer'],
  'habit tracker': ['habit_timer'],
  'timer for habit': ['habit_timer'],
  'break a habit': ['habit_timer', 'urge_surfing', 'opposite_action'],
  'bad habit': ['habit_timer', 'urge_surfing', 'implementation_intentions'],
  'stop a habit': ['habit_timer', 'urge_surfing', 'opposite_action'],
  'habit stacking': ['habit_stacking'],
  'stack habits': ['habit_stacking'],
  'if then': ['implementation_intentions'],
  'implementation intention': ['implementation_intentions'],
  'when then': ['implementation_intentions'],

  // ============================================
  // DRINKING (comprehensive)
  // ============================================
  'going to a party': ['drink_pacing'],
  'drinking tonight': ['drink_pacing'],
  'track my drinking': ['drink_pacing'],
  'pace myself': ['drink_pacing'],
  'drink too much': ['drink_pacing'],
  'drinking too much': ['drink_pacing'],
  'drinking problem': ['drink_pacing'],
  'problem with drinking': ['drink_pacing'],
  'problem with alcohol': ['drink_pacing'],
  'alcohol problem': ['drink_pacing'],
  'control my drinking': ['drink_pacing'],
  'cut back on drinking': ['drink_pacing'],
  'cut back drinking': ['drink_pacing'],
  'drink less': ['drink_pacing'],
  'drinking less': ['drink_pacing'],
  'reduce drinking': ['drink_pacing'],
  'reduce my drinking': ['drink_pacing'],
  'binge drinking': ['drink_pacing'],
  'heavy drinking': ['drink_pacing'],
  'overdrinking': ['drink_pacing'],
  'over drinking': ['drink_pacing'],
  'too many drinks': ['drink_pacing'],
  'had too much': ['drink_pacing'],
  'want to drink': ['drink_pacing', 'urge_surfing'],
  'urge to drink': ['drink_pacing', 'urge_surfing'],
  'craving alcohol': ['drink_pacing', 'urge_surfing'],
  'craving a drink': ['drink_pacing', 'urge_surfing'],
  'struggle with alcohol': ['drink_pacing'],
  'struggle with drinking': ['drink_pacing'],
  'moderate drinking': ['drink_pacing'],
  'moderate my drinking': ['drink_pacing'],
  'help with drinking': ['drink_pacing'],
  'help with alcohol': ['drink_pacing'],
  'sober': ['drink_pacing', 'urge_surfing'],
  'staying sober': ['drink_pacing', 'urge_surfing'],
  'not drink': ['drink_pacing', 'urge_surfing'],
  'stop drinking': ['drink_pacing', 'urge_surfing'],
  'quit drinking': ['drink_pacing', 'urge_surfing'],
  'alcoholic': ['drink_pacing', 'support_network_map'],
  'aa': ['support_network_map', 'drink_pacing'],
  'recovery': ['drink_pacing', 'support_network_map', 'self_compassion_break'],

  // ============================================
  // GAMES & DISTRACTION
  // ============================================
  'need a distraction': ['asteroids', 'retro_snake', 'bubble_wrap'],
  'distract me': ['asteroids', 'retro_snake', 'fidget_pad'],
  'bored': ['asteroids', 'retro_snake', 'game_2048'],
  'play a game': ['asteroids', 'retro_snake', 'game_2048'],
  'fidget': ['fidget_pad', 'bubble_wrap'],
  'restless hands': ['fidget_pad', 'bubble_wrap'],
  'something to do with hands': ['fidget_pad', 'bubble_wrap', 'kinetic_sand'],
  'calming activity': ['zen_blocks', 'breathing_orb', 'water_ripples'],
  'relax with': ['zen_blocks', 'sand_flow', 'water_ripples'],
  'satisfying': ['bubble_wrap', 'kinetic_sand', 'sand_flow'],

  // ============================================
  // DBT SKILLS
  // ============================================
  'dbt': ['wise_mind', 'opposite_action', 'radical_acceptance', 'dear_man'],
  'dialectical': ['wise_mind', 'radical_acceptance'],
  'interpersonal effectiveness': ['dear_man', 'validation_levels'],
  'validation': ['validation_levels', 'active_listening'],
  'validate': ['validation_levels'],
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

  const lines = ['RELEVANT SKILLS (available to suggest when timing is right):'];
  for (const rec of recommendations) {
    const urgencyMarker = rec.urgency === 'high' ? '⚡' : rec.urgency === 'medium' ? '•' : '○';
    lines.push(`${urgencyMarker} ${rec.skill.emoji} ${rec.skill.name}: ${rec.skill.description}`);
  }
  lines.push('');
  lines.push('IMPORTANT TIMING GUIDANCE:');
  lines.push('- FIRST: Listen, validate, and empathize. Be a compassionate listener before anything else.');
  lines.push('- WAIT: Let the person feel heard. Don\'t rush to solutions.');
  lines.push('- THEN: When the moment feels right (after they\'ve shared and feel understood), gently mention a skill that might help.');
  lines.push('- HOW: Frame it as an option, not a prescription: "When you\'re ready, there\'s a skill called X that might help with this..."');
  lines.push('- NEVER: Jump straight to suggesting skills. That feels dismissive of their feelings.');

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
