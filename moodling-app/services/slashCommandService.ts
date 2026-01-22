/**
 * Slash Command Service
 *
 * Parses and handles slash commands in the chat interface.
 * Commands start with "/" and trigger special behaviors like
 * persona switching, skill menus, guided exercises, etc.
 *
 * Following Mood Leaf Ethics:
 * - User has explicit control via commands
 * - Skills build real-world capabilities
 * - No gamification that creates dependency
 *
 * Unit: Slash Command System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CoachPersona,
  PERSONAS,
  getCoachSettings,
  saveCoachSettings,
} from './coachPersonalityService';
import {
  SKILLS,
  EXERCISES,
  SKILL_CATEGORIES,
  getSkillsMenuData,
  getExerciseById,
  getAllSkillProgress,
  SkillMenuItem,
} from './skillsService';
import {
  SUBJECTS,
  getAllSubjects,
  getSubjectById,
  getSubjectsByCategory,
  getNextLesson,
  getAllProgress,
  getCategoryInfo,
  getProgressPercentage,
  SubjectCategory,
} from './teachingService';
import {
  formatCollectionForChat,
  getCollectionSummary,
  getUsageStats,
  getRarityInfo,
  getSkillTypeInfo,
} from './collectionService';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  COMMAND_HISTORY: 'moodleaf_command_history',
  SKILL_PROGRESS: 'moodleaf_skill_progress',
};

// ============================================
// TYPES & INTERFACES
// ============================================

export type CommandCategory =
  | 'persona'    // Switch coach persona
  | 'skill'      // Skills menu and upgrades
  | 'exercise'   // Guided exercises
  | 'power'      // Utility commands
  | 'info'       // Information commands
  | 'secret';    // Easter eggs

export type CommandResultType =
  | 'message'           // Display a message
  | 'persona_switch'    // Changed persona
  | 'menu'              // Show interactive menu
  | 'exercise'          // Start guided exercise
  | 'navigation'        // Navigate to screen
  | 'action'            // Perform action (clear, export, etc.)
  | 'lesson'            // Start a teaching lesson
  | 'error';            // Error occurred

export interface CommandResult {
  type: CommandResultType;
  success: boolean;
  message?: string;
  data?: any;

  // For persona switches
  newPersona?: CoachPersona;
  previousPersona?: CoachPersona;
  isTemporary?: boolean;

  // For menus
  menuType?: 'skills' | 'exercises' | 'help' | 'games' | 'teach';
  menuItems?: MenuItem[];

  // For teaching
  lessonData?: any;

  // For exercises
  exerciseType?: string;
  exerciseConfig?: ExerciseConfig;

  // For navigation
  navigateTo?: string;
  navigationParams?: Record<string, any>;
}

export interface MenuItem {
  id: string;
  label: string;
  emoji: string;
  description?: string;
  isPremium: boolean;
  isLocked: boolean;
  onSelect: () => void | Promise<void>;
}

export interface ExerciseConfig {
  name: string;
  type: 'breathing' | 'grounding' | 'body_scan' | 'thought_challenge';
  steps: ExerciseStep[];
  duration?: number; // in seconds
}

export interface ExerciseStep {
  instruction: string;
  duration?: number; // in seconds
  visualType?: 'circle' | 'text' | 'progress';
  waitForTap?: boolean;
}

export interface SlashCommand {
  name: string;
  aliases: string[];
  description: string;
  category: CommandCategory;
  requiresPremium: boolean;
  usage?: string;
  examples?: string[];
  handler: (args: string[], context: CommandContext) => Promise<CommandResult>;
}

export interface CommandContext {
  currentPersona: CoachPersona;
  isPremium: boolean;
  conversationId?: string;
  messageHistory?: any[];
}

export interface ParsedCommand {
  isCommand: boolean;
  commandName: string;
  args: string[];
  rawInput: string;
}

// ============================================
// COMMAND PARSING
// ============================================

/**
 * Parse a message to check if it's a slash command
 */
export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  // Check if it starts with /
  if (!trimmed.startsWith('/')) {
    return {
      isCommand: false,
      commandName: '',
      args: [],
      rawInput: input,
    };
  }

  // Remove the / and split by spaces
  const withoutSlash = trimmed.slice(1);
  const parts = withoutSlash.split(/\s+/);

  const commandName = parts[0]?.toLowerCase() || '';
  const args = parts.slice(1);

  return {
    isCommand: true,
    commandName,
    args,
    rawInput: input,
  };
}

/**
 * Check if a message is a slash command
 */
export function isSlashCommand(input: string): boolean {
  return input.trim().startsWith('/');
}

// ============================================
// COMMAND REGISTRY
// ============================================

// Map of command names and aliases to their definitions
const commandRegistry = new Map<string, SlashCommand>();

/**
 * Register a command with the registry
 */
function registerCommand(command: SlashCommand): void {
  // Register by main name
  commandRegistry.set(command.name.toLowerCase(), command);

  // Register by aliases
  for (const alias of command.aliases) {
    commandRegistry.set(alias.toLowerCase(), command);
  }
}

/**
 * Get a command from the registry
 */
export function getCommand(name: string): SlashCommand | undefined {
  return commandRegistry.get(name.toLowerCase());
}

/**
 * Get all registered commands
 */
export function getAllCommands(): SlashCommand[] {
  // Get unique commands (not aliases)
  const uniqueCommands = new Set<SlashCommand>();
  commandRegistry.forEach((command) => {
    uniqueCommands.add(command);
  });
  return Array.from(uniqueCommands);
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: CommandCategory): SlashCommand[] {
  return getAllCommands().filter((cmd) => cmd.category === category);
}

// ============================================
// PERSONA COMMANDS
// ============================================

async function handlePersonaSwitch(
  persona: CoachPersona,
  args: string[],
  context: CommandContext
): Promise<CommandResult> {
  const personaDef = PERSONAS[persona];
  if (!personaDef) {
    return {
      type: 'error',
      success: false,
      message: `Unknown persona: ${persona}`,
    };
  }

  const previousPersona = context.currentPersona;
  const isTemporary = args.includes('--temp') || args.includes('-t');

  try {
    // Update coach settings if not temporary
    if (!isTemporary) {
      const settings = await getCoachSettings();
      settings.selectedPersona = persona;
      await saveCoachSettings(settings);
    }

    // Build response message
    const switchMessages: Record<CoachPersona, string> = {
      flint: `Switching to Flint ${personaDef.emoji} — no fluff mode activated. What do you need?`,
      luna: `Luna ${personaDef.emoji} is here. Take a breath. I'm listening.`,
      willow: `Willow ${personaDef.emoji} listening. Take your time.`,
      spark: `Spark ${personaDef.emoji} ready! Let's do this!`,
      clover: `Clover ${personaDef.emoji} here — hey friend, what's up?`,
      ridge: `Ridge ${personaDef.emoji} reporting in. Let's make a plan.`,
      fern: `Fern ${personaDef.emoji} wrapping you in warmth. I'm here for you.`,
    };

    return {
      type: 'persona_switch',
      success: true,
      message: switchMessages[persona],
      newPersona: persona,
      previousPersona,
      isTemporary,
      data: {
        persona: personaDef,
        reason: args.filter((a) => !a.startsWith('-')).join(' ') || undefined,
      },
    };
  } catch (error) {
    return {
      type: 'error',
      success: false,
      message: `Failed to switch persona: ${error}`,
    };
  }
}

// Register persona commands
const personaCommands: Array<{ name: CoachPersona; aliases: string[] }> = [
  { name: 'flint', aliases: ['f', 'direct', 'honest'] },
  { name: 'luna', aliases: ['l', 'calm', 'mindful'] },
  { name: 'willow', aliases: ['w', 'wise', 'sage'] },
  { name: 'spark', aliases: ['s', 'hype', 'energy'] },
  { name: 'clover', aliases: ['c', 'friend', 'bestie'] },
  { name: 'ridge', aliases: ['r', 'coach', 'action'] },
  { name: 'fern', aliases: ['fe', 'gentle', 'soft'] },
];

personaCommands.forEach(({ name, aliases }) => {
  const personaDef = PERSONAS[name];
  registerCommand({
    name,
    aliases,
    description: `Switch to ${personaDef.name} — ${personaDef.tagline}`,
    category: 'persona',
    requiresPremium: false,
    usage: `/${name} [reason] [--temp]`,
    examples: [`/${name}`, `/${name} I need real talk`, `/${name} --temp`],
    handler: async (args, context) => handlePersonaSwitch(name, args, context),
  });
});

// Random persona command
registerCommand({
  name: 'random',
  aliases: ['surprise', 'rng'],
  description: 'Switch to a random persona',
  category: 'persona',
  requiresPremium: false,
  handler: async (args, context) => {
    const personas = Object.keys(PERSONAS) as CoachPersona[];
    const randomPersona = personas[Math.floor(Math.random() * personas.length)];
    return handlePersonaSwitch(randomPersona, args, context);
  },
});

// ============================================
// INFO COMMANDS
// ============================================

registerCommand({
  name: 'help',
  aliases: ['h', '?', 'commands'],
  description: 'Show available commands',
  category: 'info',
  requiresPremium: false,
  handler: async () => {
    const commands = getAllCommands();
    const byCategory: Record<CommandCategory, SlashCommand[]> = {
      persona: [],
      skill: [],
      exercise: [],
      power: [],
      info: [],
      secret: [],
    };

    commands.forEach((cmd) => {
      if (cmd.category !== 'secret') {
        byCategory[cmd.category].push(cmd);
      }
    });

    let helpText = `**Available Commands**\n\n`;

    // Persona commands
    if (byCategory.persona.length > 0) {
      helpText += `**Persona Switches**\n`;
      byCategory.persona.forEach((cmd) => {
        helpText += `\`/${cmd.name}\` — ${cmd.description}\n`;
      });
      helpText += '\n';
    }

    // Skill commands
    if (byCategory.skill.length > 0) {
      helpText += `**Skills & Upgrades**\n`;
      byCategory.skill.forEach((cmd) => {
        helpText += `\`/${cmd.name}\` — ${cmd.description}\n`;
      });
      helpText += '\n';
    }

    // Exercise commands
    if (byCategory.exercise.length > 0) {
      helpText += `**Guided Exercises**\n`;
      byCategory.exercise.forEach((cmd) => {
        helpText += `\`/${cmd.name}\` — ${cmd.description}\n`;
      });
      helpText += '\n';
    }

    // Info commands
    if (byCategory.info.length > 0) {
      helpText += `**Information**\n`;
      byCategory.info.forEach((cmd) => {
        helpText += `\`/${cmd.name}\` — ${cmd.description}\n`;
      });
      helpText += '\n';
    }

    // Power commands
    if (byCategory.power.length > 0) {
      helpText += `**Utilities**\n`;
      byCategory.power.forEach((cmd) => {
        helpText += `\`/${cmd.name}\` — ${cmd.description}\n`;
      });
    }

    return {
      type: 'message',
      success: true,
      message: helpText,
    };
  },
});

registerCommand({
  name: 'status',
  aliases: ['info', 'me'],
  description: 'Show your current status',
  category: 'info',
  requiresPremium: false,
  handler: async (args, context) => {
    const personaDef = PERSONAS[context.currentPersona];

    let statusText = `**Your Status**\n\n`;
    statusText += `**Current Coach:** ${personaDef.emoji} ${personaDef.name}\n`;
    statusText += `**Subscription:** ${context.isPremium ? 'Premium' : 'Free'}\n`;

    return {
      type: 'message',
      success: true,
      message: statusText,
    };
  },
});

// ============================================
// SKILL COMMANDS
// ============================================

registerCommand({
  name: 'skills',
  aliases: ['skill'],
  description: 'Open the skills menu (use subcommands: info, store, collection, manage)',
  category: 'skill',
  requiresPremium: false,
  usage: '/skills [subcommand]',
  examples: ['/skills', '/skills info', '/skills store', '/skills collection', '/skills manage'],
  handler: async (args, context) => {
    const menuData = await getSkillsMenuData(context.isPremium);
    const allProgress = await getAllSkillProgress();

    const subCommand = args[0]?.toLowerCase();

    // /skills info - Show activity tracking
    if (subCommand === 'info' || subCommand === 'list') {
      let infoText = `📋 Your Skills\n`;
      infoText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      let totalSkills = 0;
      let activeSkills = 0;

      for (const category of menuData.categories) {
        const skills = menuData.skillsByCategory[category.id];
        if (skills.length === 0) continue;

        infoText += `${category.emoji} ${category.name}\n`;

        for (const item of skills) {
          totalSkills++;
          const isActive = item.progress.timesUsed > 0;
          if (isActive) activeSkills++;

          const statusIcon = isActive ? '✅' : '○';
          const timesUsed = item.progress.timesUsed;
          const lastUsed = item.progress.lastUsed
            ? new Date(item.progress.lastUsed).toLocaleDateString()
            : 'Never';

          infoText += `   ${statusIcon} ${item.skill.emoji} ${item.skill.name}\n`;
          infoText += `      Used: ${timesUsed}x  |  Last: ${lastUsed}\n`;
        }
        infoText += '\n';
      }

      infoText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      infoText += `📊 Summary: ${activeSkills}/${totalSkills} skills practiced\n`;
      infoText += `\nOther commands: /skills store, /skills manage`;

      return {
        type: 'menu',
        success: true,
        message: infoText,
        menuType: 'skills',
        data: menuData,
      };
    }

    // /skills store - Show skills available to unlock
    if (subCommand === 'store' || subCommand === 'shop' || subCommand === 'upgrade') {
      let storeText = `🛒 Skills Store\n`;
      storeText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const freeSkills = [];
      const premiumSkills = [];

      for (const category of menuData.categories) {
        for (const item of menuData.skillsByCategory[category.id]) {
          if (item.skill.tier === 'free') {
            freeSkills.push(item);
          } else {
            premiumSkills.push(item);
          }
        }
      }

      storeText += `FREE SKILLS (${freeSkills.length})\n`;
      for (const item of freeSkills) {
        const level = item.progress.level;
        storeText += `   ${item.skill.emoji} ${item.skill.name} — Lv ${level}/${item.skill.maxLevel}\n`;
      }

      storeText += `\nPREMIUM SKILLS (${premiumSkills.length})\n`;
      for (const item of premiumSkills) {
        const lockIcon = item.isLocked ? '🔒 ' : '';
        storeText += `   ${lockIcon}${item.skill.emoji} ${item.skill.name}\n`;
      }

      if (!context.isPremium) {
        storeText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        storeText += `⭐ Upgrade to Premium to unlock all skills!\n`;
      }

      return {
        type: 'menu',
        success: true,
        message: storeText,
        menuType: 'skills',
        data: { freeSkills, premiumSkills },
      };
    }

    // /skills collection - Show unlocked/discovered items
    if (subCommand === 'collection' || subCommand === 'collected') {
      const collectionText = await formatCollectionForChat();
      return {
        type: 'menu',
        success: true,
        message: collectionText,
        menuType: 'skills',
      };
    }

    // /skills manage - Navigate to management screen
    if (subCommand === 'manage' || subCommand === 'settings' || subCommand === 'toggle') {
      return {
        type: 'navigation',
        success: true,
        message: '⚙️ Opening Skills Manager...\n\nEnable or disable skills to customize your menus.',
        navigateTo: '/skills/manage',
      };
    }

    // /skills help - Show available subcommands
    if (subCommand === 'help') {
      let helpText = `🎯 Skills Commands\n`;
      helpText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      helpText += `/skills — Browse all skills\n`;
      helpText += `/skills info — View your activity\n`;
      helpText += `/skills store — Browse available skills\n`;
      helpText += `/skills collection — View unlocked items\n`;
      helpText += `/skills manage — Enable/disable skills\n`;

      return {
        type: 'message',
        success: true,
        message: helpText,
      };
    }

    // Default: Show browse menu
    let menuText = `✨ Skills & Exercises\n`;
    menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const category of menuData.categories) {
      const skills = menuData.skillsByCategory[category.id];
      if (skills.length === 0) continue;

      menuText += `${category.emoji} ${category.name.toUpperCase()}\n`;

      for (const item of skills) {
        const filledDots = item.progress.level;
        const emptyDots = item.skill.maxLevel - item.progress.level;
        const progressBar = '■'.repeat(filledDots) + '□'.repeat(emptyDots);
        const lockIcon = item.isLocked ? ' 🔒' : '';
        menuText += `   ${item.skill.emoji} ${item.skill.name}${lockIcon}  [${progressBar}]\n`;
      }
      menuText += '\n';
    }

    menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    menuText += `⚡ Quick Start\n`;
    menuText += `   /breathe — Breathing exercise\n`;
    menuText += `   /ground — 5-4-3-2-1 grounding\n`;
    menuText += `   /calm — Auto-pick technique\n`;
    menuText += `\n💡 Type /skills help for more options`;

    if (!context.isPremium) {
      menuText += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      menuText += `⭐ Unlock All: /skills store\n`;
    }

    return {
      type: 'menu',
      success: true,
      message: menuText,
      menuType: 'skills',
      data: menuData,
    };
  },
});

// ============================================
// EXERCISE COMMANDS
// ============================================

// Map of breathing exercise aliases to exercise IDs
const BREATHING_ALIASES: Record<string, string> = {
  'box': 'box_breathing',
  '4444': 'box_breathing',
  '478': '478_breathing',
  '4-7-8': '478_breathing',
  'sleep': '478_breathing',
  'coherent': 'coherent_breathing',
  'hrv': 'coherent_breathing',
  'sigh': 'physiological_sigh',
  'quick': 'physiological_sigh',
};

registerCommand({
  name: 'breathe',
  aliases: ['breath', 'breathing'],
  description: 'Start a breathing exercise',
  category: 'exercise',
  requiresPremium: false,
  usage: '/breathe [type]',
  examples: ['/breathe', '/breathe box', '/breathe 478', '/breathe sigh'],
  handler: async (args, context) => {
    const exerciseArg = args[0]?.toLowerCase() || 'box';
    const exerciseId = BREATHING_ALIASES[exerciseArg] || 'box_breathing';

    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
      return {
        type: 'error',
        success: false,
        message: `Unknown breathing exercise: ${exerciseArg}\n\nTry: box, 478, sigh, coherent`,
      };
    }

    // Check premium
    if (exercise.tier === 'premium' && !context.isPremium) {
      return {
        type: 'error',
        success: false,
        message: `${exercise.emoji} ${exercise.name} is a premium exercise.\n\nType /skills to see upgrade options.\n\nTry /breathe box or /breathe sigh for free alternatives.`,
      };
    }

    // Convert to ExerciseConfig format
    const config: ExerciseConfig = {
      name: exercise.name,
      type: exercise.type as any,
      duration: exercise.duration,
      steps: exercise.steps.map((s) => ({
        instruction: s.instruction,
        duration: s.duration,
        visualType: s.visualType === 'circle_expand' || s.visualType === 'circle_shrink' ? 'circle' : s.visualType,
        waitForTap: !s.duration,
      })),
    };

    return {
      type: 'exercise',
      success: true,
      message: `${exercise.emoji} **${exercise.name}**\n\n${exercise.description}\n\n_Starting in 3 seconds..._`,
      exerciseType: 'breathing',
      exerciseConfig: config,
      data: { exercise },
    };
  },
});

registerCommand({
  name: 'ground',
  aliases: ['grounding', '54321'],
  description: 'Start a grounding exercise (5-4-3-2-1)',
  category: 'exercise',
  requiresPremium: false,
  handler: async () => {
    const exercise = getExerciseById('54321_grounding');
    if (!exercise) {
      return {
        type: 'error',
        success: false,
        message: 'Exercise not found',
      };
    }

    const config: ExerciseConfig = {
      name: exercise.name,
      type: 'grounding',
      duration: exercise.duration,
      steps: exercise.steps.map((s) => ({
        instruction: s.instruction,
        duration: s.duration,
        visualType: s.visualType === 'text' ? 'text' : 'progress',
        waitForTap: !s.duration,
      })),
    };

    return {
      type: 'exercise',
      success: true,
      message: `${exercise.emoji} **${exercise.name}**\n\n${exercise.description}\n\nTap to continue through each step.`,
      exerciseType: 'grounding',
      exerciseConfig: config,
      data: { exercise },
    };
  },
});

registerCommand({
  name: 'body',
  aliases: ['bodyscan', 'scan'],
  description: 'Start a body scan exercise',
  category: 'exercise',
  requiresPremium: false,
  handler: async () => {
    const exercise = getExerciseById('quick_body_scan');
    if (!exercise) {
      return {
        type: 'error',
        success: false,
        message: 'Exercise not found',
      };
    }

    const config: ExerciseConfig = {
      name: exercise.name,
      type: 'body_scan',
      duration: exercise.duration,
      steps: exercise.steps.map((s) => ({
        instruction: s.instruction,
        duration: s.duration,
        visualType: 'text',
        waitForTap: !s.duration,
      })),
    };

    return {
      type: 'exercise',
      success: true,
      message: `${exercise.emoji} **${exercise.name}**\n\n${exercise.description}`,
      exerciseType: 'body_scan',
      exerciseConfig: config,
      data: { exercise },
    };
  },
});

registerCommand({
  name: 'calm',
  aliases: ['relax', 'chill'],
  description: 'Auto-pick a calming technique based on what you need',
  category: 'exercise',
  requiresPremium: false,
  handler: async (args, context) => {
    // Pick based on quick exercises
    const quickExercises = EXERCISES.filter(
      (e) => e.tags.includes('quick') && (e.tier === 'free' || context.isPremium)
    );

    if (quickExercises.length === 0) {
      return {
        type: 'error',
        success: false,
        message: 'No quick exercises available.',
      };
    }

    const exercise = quickExercises[Math.floor(Math.random() * quickExercises.length)];

    const config: ExerciseConfig = {
      name: exercise.name,
      type: exercise.type as any,
      duration: exercise.duration,
      steps: exercise.steps.map((s) => ({
        instruction: s.instruction,
        duration: s.duration,
        visualType: s.visualType === 'circle_expand' || s.visualType === 'circle_shrink' ? 'circle' : s.visualType,
        waitForTap: !s.duration,
      })),
    };

    return {
      type: 'exercise',
      success: true,
      message: `Let's try **${exercise.name}** ${exercise.emoji}\n\n${exercise.description}`,
      exerciseType: exercise.type,
      exerciseConfig: config,
      data: { exercise },
    };
  },
});

registerCommand({
  name: 'prep',
  aliases: ['prepare', 'event'],
  description: 'Prepare for an upcoming social event',
  category: 'exercise',
  requiresPremium: false,
  handler: async () => {
    const exercise = getExerciseById('event_prep');
    if (!exercise) {
      return {
        type: 'error',
        success: false,
        message: 'Exercise not found',
      };
    }

    const config: ExerciseConfig = {
      name: exercise.name,
      type: 'social_prep',
      duration: exercise.duration,
      steps: exercise.steps.map((s) => ({
        instruction: s.instruction,
        duration: s.duration,
        visualType: 'text',
        waitForTap: !s.duration,
      })),
    };

    return {
      type: 'exercise',
      success: true,
      message: `${exercise.emoji} **${exercise.name}**\n\nLet's mentally prepare for what's coming up.`,
      exerciseType: 'social_prep',
      exerciseConfig: config,
      data: { exercise },
    };
  },
});

// ============================================
// GAMES COMMANDS
// ============================================

export interface Game {
  id: string;
  name: string;
  emoji: string;
  description: string;
  purpose: string;
  tier: 'free' | 'premium';
  category: 'grounding' | 'calming' | 'skill_building' | 'fidget';
}

export const GAMES: Game[] = [
  // ========== GROUNDING GAMES ==========
  {
    id: 'breathing_bubble',
    name: 'Breathing Bubble',
    emoji: '🫧',
    description: 'Pop bubbles by breathing at the right rhythm',
    purpose: 'Makes breathing exercises fun and engaging',
    tier: 'free',
    category: 'grounding',
  },
  {
    id: 'grounding_quest',
    name: 'Grounding Quest',
    emoji: '🔍',
    description: 'Scavenger hunt: find things matching prompts around you',
    purpose: 'Gamified 5-4-3-2-1 grounding',
    tier: 'free',
    category: 'grounding',
  },
  {
    id: 'i_spy_ai',
    name: 'I Spy (AI Camera)',
    emoji: '📷',
    description: 'Point camera around — AI spots objects for you to find',
    purpose: 'Uses ML to create real grounding scavenger hunts',
    tier: 'premium',
    category: 'grounding',
  },
  {
    id: 'color_finder',
    name: 'Color Finder',
    emoji: '🎯',
    description: 'Camera detects colors — find 5 blue things, 4 red things...',
    purpose: 'Visual grounding with real environment',
    tier: 'premium',
    category: 'grounding',
  },
  {
    id: 'texture_hunt',
    name: 'Texture Hunt',
    emoji: '🖐️',
    description: 'Find and photograph textures: smooth, rough, soft, bumpy',
    purpose: 'Tactile grounding through visual search',
    tier: 'premium',
    category: 'grounding',
  },

  // ========== CALMING GAMES ==========
  {
    id: 'color_sort',
    name: 'Color Sort',
    emoji: '🎨',
    description: 'Sort colored objects into matching buckets',
    purpose: 'Calming, mindful distraction',
    tier: 'free',
    category: 'calming',
  },
  {
    id: 'calm_puzzles',
    name: 'Calm Puzzles',
    emoji: '🧩',
    description: 'Simple jigsaw puzzles with nature images',
    purpose: 'Mindful focus and flow state',
    tier: 'free',
    category: 'calming',
  },
  {
    id: 'mood_coloring',
    name: 'Mood Coloring',
    emoji: '🖍️',
    description: 'Color mandalas and patterns',
    purpose: 'Art therapy and self-expression',
    tier: 'free',
    category: 'calming',
  },
  {
    id: 'zen_garden',
    name: 'Zen Garden',
    emoji: '🪨',
    description: 'Rake sand patterns, place stones, create calm',
    purpose: 'Meditative, open-ended creativity',
    tier: 'premium',
    category: 'calming',
  },
  {
    id: 'flow_drawing',
    name: 'Flow Drawing',
    emoji: '✨',
    description: 'Draw with particles that flow like water',
    purpose: 'Mesmerizing, calming visual feedback',
    tier: 'free',
    category: 'calming',
  },

  // ========== SKILL BUILDING GAMES ==========
  {
    id: 'gratitude_wheel',
    name: 'Gratitude Wheel',
    emoji: '🎡',
    description: 'Spin the wheel and express gratitude for random categories',
    purpose: 'Builds gratitude practice through play',
    tier: 'free',
    category: 'skill_building',
  },
  {
    id: 'emotion_match',
    name: 'Emotion Match',
    emoji: '🎭',
    description: 'Match emotion faces with feeling words',
    purpose: 'Expands emotional vocabulary',
    tier: 'free',
    category: 'skill_building',
  },
  {
    id: 'word_garden',
    name: 'Word Garden',
    emoji: '🌸',
    description: 'Plant positive words and watch them bloom',
    purpose: 'Reinforces positive self-talk',
    tier: 'free',
    category: 'skill_building',
  },
  {
    id: 'thought_catcher',
    name: 'Thought Catcher',
    emoji: '🦋',
    description: 'Catch helpful thoughts, let unhelpful ones float by',
    purpose: 'Visualizes CBT defusion technique',
    tier: 'premium',
    category: 'skill_building',
  },
  {
    id: 'emotion_detective',
    name: 'Emotion Detective',
    emoji: '🕵️',
    description: 'Read scenarios, identify the emotions involved',
    purpose: 'Builds empathy and emotional intelligence',
    tier: 'premium',
    category: 'skill_building',
  },

  // ========== FIDGET TOOLS ==========
  {
    id: 'fidget_pad',
    name: 'Fidget Pad',
    emoji: '🔘',
    description: 'Digital fidget toys: bubble wrap, sliders, spinners',
    purpose: 'Quick anxiety relief and grounding',
    tier: 'free',
    category: 'fidget',
  },
  {
    id: 'bubble_wrap',
    name: 'Bubble Wrap',
    emoji: '🔵',
    description: 'Endless bubble wrap to pop — with haptic feedback',
    purpose: 'Satisfying, repetitive stress relief',
    tier: 'free',
    category: 'fidget',
  },
  {
    id: 'spinner',
    name: 'Fidget Spinner',
    emoji: '🌀',
    description: 'Flick to spin, watch it go, feel the calm',
    purpose: 'Visual focus point for anxiety',
    tier: 'free',
    category: 'fidget',
  },

  // ========== CLASSIC GAMES (Mindful Versions) ==========
  {
    id: 'mindful_snake',
    name: 'Mindful Snake',
    emoji: '🐍',
    description: 'Classic snake, but slower and set to calming music',
    purpose: 'Flow state through simple gameplay',
    tier: 'free',
    category: 'calming',
  },
  {
    id: 'zen_tetris',
    name: 'Zen Blocks',
    emoji: '🧱',
    description: 'Tetris with no pressure — blocks fall slowly, no game over',
    purpose: 'Satisfying pattern completion without stress',
    tier: 'free',
    category: 'calming',
  },
  {
    id: 'mindful_sudoku',
    name: 'Calm Sudoku',
    emoji: '🔢',
    description: 'Sudoku puzzles with hints and no timer',
    purpose: 'Logical focus that quiets anxious thoughts',
    tier: 'free',
    category: 'calming',
  },
  {
    id: 'gentle_pong',
    name: 'Gentle Pong',
    emoji: '🏓',
    description: 'Slow-motion pong with relaxing visuals',
    purpose: 'Gentle hand-eye coordination',
    tier: 'free',
    category: 'calming',
  },
  {
    id: 'memory_garden',
    name: 'Memory Garden',
    emoji: '🌷',
    description: 'Match pairs of flowers to grow a garden',
    purpose: 'Memory exercise with beautiful reward',
    tier: 'free',
    category: 'skill_building',
  },

  // ========== AR/CAMERA GAMES ==========
  {
    id: 'nature_spotter',
    name: 'Nature Spotter',
    emoji: '🌿',
    description: 'AI identifies plants and animals around you',
    purpose: 'Gets you outside and noticing nature',
    tier: 'premium',
    category: 'grounding',
  },
  {
    id: 'cloud_shapes',
    name: 'Cloud Shapes',
    emoji: '☁️',
    description: 'Point at clouds — AI suggests what shapes they could be',
    purpose: 'Encourages looking up, imagination',
    tier: 'premium',
    category: 'grounding',
  },
  {
    id: 'gratitude_lens',
    name: 'Gratitude Lens',
    emoji: '📸',
    description: 'Photograph things you\'re grateful for, build a collection',
    purpose: 'Visual gratitude journal',
    tier: 'premium',
    category: 'skill_building',
  },
];

registerCommand({
  name: 'games',
  aliases: ['game', 'play', 'fun'],
  description: 'Browse mindful games and activities',
  category: 'skill',
  requiresPremium: false,
  handler: async (args, context) => {
    const availableGames = GAMES.filter(
      (g) => g.tier === 'free' || context.isPremium
    );
    const lockedGames = GAMES.filter(
      (g) => g.tier === 'premium' && !context.isPremium
    );

    let menuText = `**🎮 Mindful Games**\n\n`;
    menuText += `_Games designed to calm, ground, and build skills — not to addict._\n\n`;

    // Group by category
    const categories = ['grounding', 'calming', 'skill_building', 'fidget'] as const;
    const categoryNames: Record<string, string> = {
      grounding: '🦶 Grounding Games',
      calming: '🌊 Calming Activities',
      skill_building: '🧠 Skill Builders',
      fidget: '🔘 Fidget Tools',
    };

    for (const cat of categories) {
      const games = availableGames.filter((g) => g.category === cat);
      if (games.length === 0) continue;

      menuText += `**${categoryNames[cat]}**\n`;
      for (const game of games) {
        menuText += `  ${game.emoji} **${game.name}**\n`;
        menuText += `     _${game.description}_\n`;
      }
      menuText += '\n';
    }

    if (lockedGames.length > 0 && !context.isPremium) {
      menuText += `**🔒 Premium Games**\n`;
      for (const game of lockedGames) {
        menuText += `  ${game.emoji} ${game.name}\n`;
      }
      menuText += `\n_Upgrade to unlock all games._\n`;
    }

    menuText += `\n_Games coming soon! For now, try \`/breathe\` or \`/ground\`._`;

    return {
      type: 'menu',
      success: true,
      message: menuText,
      menuType: 'games' as any,
      data: { games: GAMES, availableGames, lockedGames },
    };
  },
});

registerCommand({
  name: 'fidget',
  aliases: ['bubble', 'pop'],
  description: 'Open the fidget pad for quick relief',
  category: 'skill',
  requiresPremium: false,
  handler: async () => {
    return {
      type: 'navigation',
      success: true,
      message: '🔘 Opening Fidget Pad...\n\n_Tap, swipe, and interact to ground yourself._',
      navigateTo: '/games/fidget',
      data: { gameId: 'fidget_pad' },
    };
  },
});

// ============================================
// TEACHING COMMANDS
// ============================================

registerCommand({
  name: 'teach',
  aliases: ['learn', 'study', 'lesson'],
  description: 'Browse subjects to learn',
  category: 'skill',
  requiresPremium: false,
  usage: '/teach [subject]',
  examples: ['/teach', '/teach spanish', '/teach cbt'],
  handler: async (args, context) => {
    const subjectArg = args[0]?.toLowerCase();

    // If no subject specified, show all subjects
    if (!subjectArg) {
      const subjects = getAllSubjects();
      const progress = await getAllProgress();

      let menuText = `**📚 Learn Something New**\n\n`;
      menuText += `_Your coach can teach you. No pressure, no grades—just learning._\n\n`;

      // Group by category
      const categories: SubjectCategory[] = ['language', 'mindfulness', 'psychology', 'wellness', 'life_skills'];

      for (const cat of categories) {
        const catSubjects = getSubjectsByCategory(cat);
        if (catSubjects.length === 0) continue;

        const catInfo = getCategoryInfo(cat);
        menuText += `**${catInfo.emoji} ${catInfo.name}**\n`;

        for (const subject of catSubjects) {
          const subProgress = progress[subject.id];
          const pct = getProgressPercentage(subject, subProgress);
          const lockIcon = subject.tier === 'premium' && !context.isPremium ? ' 🔒' : '';
          const progressBar = pct > 0 ? ` (${pct}%)` : '';

          menuText += `  ${subject.emoji} **${subject.name}**${lockIcon}${progressBar}\n`;
          menuText += `     _${subject.description}_\n`;
          menuText += `     \`/teach ${subject.id}\`\n`;
        }
        menuText += '\n';
      }

      menuText += `_Start learning: \`/teach spanish\` or \`/teach meditation_basics\`_`;

      return {
        type: 'menu',
        success: true,
        message: menuText,
        menuType: 'teach',
        data: { subjects, progress },
      };
    }

    // Find the subject
    const subject = getSubjectById(subjectArg);
    if (!subject) {
      // Try fuzzy match
      const allSubjects = getAllSubjects();
      const matches = allSubjects.filter(
        (s) => s.id.includes(subjectArg) || s.name.toLowerCase().includes(subjectArg)
      );

      if (matches.length === 1) {
        return handleTeachSubject(matches[0], context);
      }

      if (matches.length > 1) {
        let suggestions = `Multiple subjects match "${subjectArg}":\n\n`;
        matches.forEach((m) => {
          suggestions += `  ${m.emoji} **${m.name}** — \`/teach ${m.id}\`\n`;
        });
        return {
          type: 'message',
          success: true,
          message: suggestions,
        };
      }

      return {
        type: 'error',
        success: false,
        message: `Subject "${subjectArg}" not found.\n\nType \`/teach\` to see all available subjects.`,
      };
    }

    return handleTeachSubject(subject, context);
  },
});

async function handleTeachSubject(subject: any, context: CommandContext): Promise<CommandResult> {
  // Check premium
  if (subject.tier === 'premium' && !context.isPremium) {
    return {
      type: 'error',
      success: false,
      message: `${subject.emoji} **${subject.name}** is a premium subject.\n\nUpgrade to unlock all subjects, or try these free alternatives:\n\n  🇪🇸 Spanish — \`/teach spanish\`\n  🇫🇷 French — \`/teach french\`\n  🧘 Meditation — \`/teach meditation_basics\`\n  🧠 CBT — \`/teach cbt_basics\``,
    };
  }

  const progress = await getAllProgress();
  const subProgress = progress[subject.id];
  const nextLesson = await getNextLesson(subject.id);

  let menuText = `${subject.emoji} **${subject.name}**\n\n`;
  menuText += `_${subject.description}_\n\n`;

  if (subProgress) {
    const pct = getProgressPercentage(subject, subProgress);
    menuText += `**Progress:** ${pct}% (${subProgress.lessonsCompleted}/${subject.totalLessons} lessons)\n`;
    if (subProgress.lastPracticed) {
      const lastDate = new Date(subProgress.lastPracticed).toLocaleDateString();
      menuText += `**Last practiced:** ${lastDate}\n`;
    }
    menuText += '\n';
  }

  if (subject.lessons && subject.lessons.length > 0) {
    menuText += `**Lessons:**\n`;
    subject.lessons.slice(0, 5).forEach((lesson: any, i: number) => {
      const isCompleted = subProgress?.lessons?.[lesson.id]?.completed;
      const check = isCompleted ? '✓' : '○';
      const isCurrent = nextLesson?.id === lesson.id;
      const marker = isCurrent ? '→ ' : '  ';
      menuText += `${marker}${check} ${lesson.title} (${lesson.duration}min)\n`;
    });

    if (subject.lessons.length > 5) {
      menuText += `  _...and ${subject.lessons.length - 5} more lessons_\n`;
    }
  }

  if (nextLesson) {
    menuText += `\n**Next up:** ${nextLesson.title}\n`;
    menuText += `_${nextLesson.description}_\n\n`;
    menuText += `Ready to start? Just say "yes" or "let's begin" 🌱`;
  } else if (subProgress && subProgress.lessonsCompleted === subject.totalLessons) {
    menuText += `\n🎉 **You've completed all lessons!**\n`;
    menuText += `Want to review any topic? Just ask!`;
  }

  return {
    type: 'lesson',
    success: true,
    message: menuText,
    data: { subject, progress: subProgress, nextLesson },
    lessonData: { subject, nextLesson },
  };
}

// Language-specific shortcuts
const languageShortcuts = [
  { name: 'spanish', id: 'spanish', emoji: '🇪🇸' },
  { name: 'french', id: 'french', emoji: '🇫🇷' },
  { name: 'japanese', id: 'japanese', emoji: '🇯🇵' },
  { name: 'mandarin', id: 'mandarin', emoji: '🇨🇳' },
  { name: 'chinese', id: 'mandarin', emoji: '🇨🇳' },
];

languageShortcuts.forEach(({ name, id, emoji }) => {
  registerCommand({
    name,
    aliases: [],
    description: `Learn ${name.charAt(0).toUpperCase() + name.slice(1)}`,
    category: 'skill',
    requiresPremium: false,
    handler: async (args, context) => {
      const subject = getSubjectById(id);
      if (!subject) {
        return {
          type: 'error',
          success: false,
          message: `Subject ${name} not found`,
        };
      }
      return handleTeachSubject(subject, context);
    },
  });
});

// ============================================
// COLLECTION COMMANDS
// ============================================

registerCommand({
  name: 'collection',
  aliases: ['artifacts', 'inventory', 'bag'],
  description: 'View your collected artifacts, titles, and unlocks',
  category: 'info',
  requiresPremium: false,
  handler: async () => {
    const collectionText = await formatCollectionForChat();
    return {
      type: 'menu',
      success: true,
      message: collectionText,
      menuType: 'skills' as any,
    };
  },
});

registerCommand({
  name: 'stats',
  aliases: ['mystats', 'progress'],
  description: 'View your activity stats and patterns',
  category: 'info',
  requiresPremium: false,
  handler: async () => {
    const stats = await getUsageStats();
    const summary = await getCollectionSummary();

    let text = `**📊 YOUR STATS**\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Activity breakdown
    text += `**Activities**\n`;
    text += `  🌬️ Breathing: ${stats.breathingCount} sessions\n`;
    text += `  🦶 Grounding: ${stats.groundingCount} sessions\n`;
    text += `  📝 Journaling: ${stats.journalCount} entries\n`;
    text += `  🔍 Body Scans: ${stats.bodyScansCount} sessions\n`;
    text += `  🧠 Thought Challenges: ${stats.thoughtChallengeCount} sessions\n`;
    text += `  🎮 Games Played: ${stats.gamesPlayedCount}\n`;
    text += `  📚 Lessons: ${stats.lessonsCompletedCount}\n\n`;

    // Overall stats
    text += `**Overall**\n`;
    text += `  📅 Days Active: ${stats.uniqueDaysUsed.length}\n`;
    text += `  🔄 Total Sessions: ${stats.totalSessions}\n`;

    if (stats.favoriteActivity) {
      text += `  ⭐ Favorite: ${stats.favoriteActivity}\n`;
    }

    // Time of day patterns
    text += `\n**When You Practice**\n`;
    text += `  🌅 Morning: ${stats.morningSessionCount}\n`;
    text += `  🌆 Evening: ${stats.eveningSessionCount}\n`;
    text += `  🌙 Night: ${stats.nightSessionCount}\n`;

    // Personas
    if (stats.personasUsed.length > 0) {
      text += `\n**Coaches Met:** ${stats.personasUsed.length}/7\n`;
    }

    // Collection summary
    text += `\n**Collection:** ${summary.totalDiscovered}/${summary.totalAvailable} discovered\n`;

    text += `\n_Type \`/collection\` to see your artifacts._`;

    return {
      type: 'message',
      success: true,
      message: text,
    };
  },
});

// ============================================
// POWER COMMANDS
// ============================================

registerCommand({
  name: 'clear',
  aliases: ['cls', 'reset'],
  description: 'Clear conversation history',
  category: 'power',
  requiresPremium: false,
  handler: async () => {
    return {
      type: 'action',
      success: true,
      message: 'Conversation cleared. Fresh start!',
      data: { action: 'clear_conversation' },
    };
  },
});

registerCommand({
  name: 'settings',
  aliases: ['config', 'preferences'],
  description: 'Open coach settings',
  category: 'power',
  requiresPremium: false,
  handler: async () => {
    return {
      type: 'navigation',
      success: true,
      message: 'Opening settings...',
      navigateTo: '/coach/settings',
    };
  },
});

registerCommand({
  name: 'modes',
  aliases: ['mode', 'enhance', 'skills-mode'],
  description: 'Open coach modes picker to enhance how the coach helps you',
  category: 'power',
  requiresPremium: false,
  handler: async () => {
    return {
      type: 'action',
      success: true,
      message: '✨ Opening Coach Modes...\n\nSelect modes to enhance how I help you — breathing guides, CBT techniques, mindfulness, and more.',
      data: { action: 'show_modes_picker' },
    };
  },
});

registerCommand({
  name: 'tour',
  aliases: ['walkthrough', 'guide', 'show-around'],
  description: 'Start the guided tour of the app',
  category: 'power',
  requiresPremium: false,
  usage: '/tour [reset]',
  examples: ['/tour', '/tour reset'],
  handler: async (args) => {
    if (args[0] === 'reset') {
      return {
        type: 'action',
        success: true,
        message: '🔄 Tour reset! You can now take it again.',
        data: { action: 'reset_tour' },
      };
    }
    return {
      type: 'action',
      success: true,
      message: '🗺️ Starting guided tour...\n\nI\'ll walk you through all the features!',
      data: { action: 'start_tour' },
    };
  },
});

// ============================================
// SECRET COMMANDS (Easter Eggs)
// ============================================

registerCommand({
  name: 'love',
  aliases: ['heart'],
  description: 'A little reminder',
  category: 'secret',
  requiresPremium: false,
  handler: async () => {
    const messages = [
      "You're doing better than you think. 💚",
      "Hey. You matter. That's not nothing. 💚",
      "The fact that you're here, trying? That's strength. 💚",
      "You deserve the kindness you give others. 💚",
      "Progress isn't always visible. But you're making it. 💚",
    ];
    return {
      type: 'message',
      success: true,
      message: messages[Math.floor(Math.random() * messages.length)],
    };
  },
});

registerCommand({
  name: 'hug',
  aliases: ['hugs'],
  description: 'Virtual hug',
  category: 'secret',
  requiresPremium: false,
  handler: async () => {
    return {
      type: 'message',
      success: true,
      message: `*wraps you in a warm virtual hug* 🤗\n\nYou're not alone in this.`,
    };
  },
});

registerCommand({
  name: 'wisdom',
  aliases: ['quote', 'inspire'],
  description: 'Random wisdom',
  category: 'secret',
  requiresPremium: false,
  handler: async () => {
    const wisdoms = [
      "You don't have to feel ready to start. You just have to start.",
      "The only way out is through — but you don't have to rush.",
      "Your nervous system is trying to protect you. Thank it, then correct it.",
      "What would you do if you felt 10% better? Do that thing anyway.",
      "Rest is not a reward for productivity. It's a requirement for life.",
      "You're not behind. You're on your own timeline.",
      "Feelings are visitors. Let them come and go.",
    ];
    return {
      type: 'message',
      success: true,
      message: `💡 ${wisdoms[Math.floor(Math.random() * wisdoms.length)]}`,
    };
  },
});

// ============================================
// COMMAND EXECUTION
// ============================================

/**
 * Execute a slash command
 */
export async function executeCommand(
  input: string,
  context: CommandContext
): Promise<CommandResult> {
  const parsed = parseCommand(input);

  if (!parsed.isCommand) {
    return {
      type: 'error',
      success: false,
      message: 'Not a valid command',
    };
  }

  const command = getCommand(parsed.commandName);

  if (!command) {
    // Suggest similar commands
    const allCommands = getAllCommands();
    const suggestions = allCommands
      .filter((cmd) =>
        cmd.name.includes(parsed.commandName) ||
        cmd.aliases.some((a) => a.includes(parsed.commandName))
      )
      .slice(0, 3)
      .map((cmd) => `/${cmd.name}`);

    let errorMessage = `Unknown command: /${parsed.commandName}`;
    if (suggestions.length > 0) {
      errorMessage += `\n\nDid you mean: ${suggestions.join(', ')}?`;
    }
    errorMessage += `\n\nType /help to see all commands.`;

    return {
      type: 'error',
      success: false,
      message: errorMessage,
    };
  }

  // Check premium requirement
  if (command.requiresPremium && !context.isPremium) {
    return {
      type: 'error',
      success: false,
      message: `/${command.name} requires a premium subscription.\n\nType /skills to see upgrade options.`,
    };
  }

  // Execute the command
  try {
    const result = await command.handler(parsed.args, context);

    // Log command to history
    await logCommandUsage(parsed.commandName, parsed.args, result.success);

    return result;
  } catch (error) {
    console.error(`Command execution error for /${parsed.commandName}:`, error);
    return {
      type: 'error',
      success: false,
      message: `Something went wrong running /${parsed.commandName}. Try again?`,
    };
  }
}

// ============================================
// COMMAND HISTORY
// ============================================

interface CommandHistoryEntry {
  command: string;
  args: string[];
  timestamp: string;
  success: boolean;
}

async function logCommandUsage(
  command: string,
  args: string[],
  success: boolean
): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.COMMAND_HISTORY);
    const history: CommandHistoryEntry[] = historyJson ? JSON.parse(historyJson) : [];

    history.unshift({
      command,
      args,
      timestamp: new Date().toISOString(),
      success,
    });

    // Keep only last 50 commands
    const trimmedHistory = history.slice(0, 50);

    await AsyncStorage.setItem(
      STORAGE_KEYS.COMMAND_HISTORY,
      JSON.stringify(trimmedHistory)
    );
  } catch (error) {
    console.error('Failed to log command usage:', error);
  }
}

/**
 * Get command history
 */
export async function getCommandHistory(): Promise<CommandHistoryEntry[]> {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.COMMAND_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Failed to get command history:', error);
    return [];
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the slash command service
 * This ensures all commands are registered and ready to use
 */
export function initializeSlashCommands(): void {
  // Commands are registered at module load time via registerCommand calls above
  // This function exists to ensure the module is imported and initialized
  const commandCount = commandRegistry.size;
  console.log(`[SlashCommands] Initialized with ${commandCount} commands`);

  // Verify critical commands are registered
  const criticalCommands = ['skills', 'help', 'breathe', 'ground', 'games', 'collection'];
  for (const cmd of criticalCommands) {
    if (!commandRegistry.has(cmd)) {
      console.error(`[SlashCommands] CRITICAL: Command '${cmd}' not registered!`);
    }
  }
}

/**
 * Get a debug summary of all registered commands
 */
export function getRegisteredCommandsDebug(): string[] {
  return Array.from(commandRegistry.keys()).sort();
}

// Auto-initialize when module is imported
const commandCount = commandRegistry.size;
if (commandCount > 0) {
  console.log(`[SlashCommands] ${commandCount} commands registered`);
}

// ============================================
// EXPORTS
// ============================================

export {
  registerCommand,
  STORAGE_KEYS as COMMAND_STORAGE_KEYS,
};
