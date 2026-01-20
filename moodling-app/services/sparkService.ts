/**
 * Spark Service
 *
 * Creative prompts and inspiration - the playful side of Mood Leaf.
 * Inspired by Brian Eno and Peter Schmidt's Oblique Strategies cards.
 *
 * Spark = Creativity & Play (vs Fireflies = Wisdom & Support)
 *
 * Categories:
 * - walking: Contemplations for when you're in motion
 * - artists: Creative unblocking for visual creators
 * - musicians: Prompts for sonic exploration
 * - funny: Absurdist humor to break the spell
 * - strange: Weird perspectives to jar you loose
 * - depression: Gentle nudges when everything feels heavy
 * - anxiety: Grounding prompts when your mind is racing
 * - random: Pull from any category
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const FAVORITES_KEY = 'moodling_spark_favorites';
const HISTORY_KEY = 'moodling_spark_history';

/**
 * Spark categories
 */
export type SparkCategory =
  | 'walking'
  | 'artists'
  | 'musicians'
  | 'funny'
  | 'strange'
  | 'depression'
  | 'anxiety'
  | 'random';

/**
 * A single spark card
 */
export interface Spark {
  id: string;
  text: string;
  category: SparkCategory;
  author?: string; // Optional attribution
}

/**
 * All strategies organized by category
 */
const SPARKS: Record<Exclude<SparkCategory, 'random'>, string[]> = {
  depression: [
    // Gentle nudges
    "What would you do if you felt 10% better? Do that thing anyway.",
    "Your brain is lying to you. It's very convincing, but it's still lying.",
    "You don't have to feel motivated to take action. Action can come first.",
    "What's the smallest possible thing you could do right now?",
    "You've survived 100% of your worst days so far.",
    "This feeling is a visitor, not a resident.",
    "What would you tell a friend who felt this way?",
    "You don't have to solve your whole life today. Just today.",
    "Shower. Sometimes that's the whole victory.",
    "The absence of joy is not the presence of failure.",
    "You're not behind. There's no schedule.",
    "Rest is not giving up. Rest is how you continue.",
    "What did you love when you were ten?",
    "Depression wants you isolated. Betray it.",
    "You're not lazy. You're exhausted from fighting a battle no one can see.",
    "Can you find one thing that's not terrible right now?",
    "Your worth is not measured by your productivity.",
    "What would 'good enough' look like today?",
    "The heaviness is real. And it will shift.",
    "You don't have to be positive. You just have to be here.",
    "What's one thing your body needs right now?",
    "Tomorrow you will have tried one more day.",
    "Drink water. It's not magic, but it's something.",
    "You're allowed to have needs.",
    "What if you just did the first 5 minutes?",
    "The opposite of depression isn't happiness. It's vitality. Seek aliveness, not joy.",
    "You're not failing at life. You're having a human experience.",
    "Move your body, even just to shake your hands.",
    "What texture can you touch right now?",
    "You've been strong for so long. You're allowed to not be okay.",
  ],

  anxiety: [
    // Grounding prompts
    "Name five things you can see. You're here, not there.",
    "The worst case scenario you're imagining - when has that actually happened?",
    "Your thoughts are not facts. They're just thoughts.",
    "Put your feet flat on the floor. Feel the ground holding you up.",
    "Breathe out longer than you breathe in.",
    "What's actually happening right now, not in your head?",
    "You've been anxious before. You're still here.",
    "The thing you're worried about - will it matter in 5 years?",
    "Your nervous system is trying to protect you. Thank it, then correct it.",
    "Cold water on your wrists. Try it.",
    "You don't have to figure everything out right now.",
    "What would you do if you knew it would work out?",
    "The uncertainty you fear is also where possibility lives.",
    "You're having an experience. You are not the experience.",
    "Notice three sounds around you. You exist in this moment.",
    "Your anxiety is lying about the odds.",
    "What's the next right thing? Just one thing.",
    "You can't think your way out of this. You have to feel your way through.",
    "Place your hand on your chest. Feel your heart working for you.",
    "The thing you're avoiding - what's the first 2 minutes of it?",
    "You're allowed to take up space.",
    "What would a calm version of you say right now?",
    "Anxiety is excitement without breath. Breathe.",
    "You're not crazy. You're anxious. There's a difference.",
    "This will pass. It always does.",
    "What are you actually afraid of underneath this?",
    "Your body is safe. Your mind disagrees. Listen to your body.",
    "Unclench your jaw. Drop your shoulders. You're holding tension.",
    "You've handled hard things before. You'll handle this too.",
    "Name the feeling. Just name it. That's enough for now.",
  ],

  walking: [
    // Contemplations for motion
    "Walk as if you're not trying to get anywhere.",
    "Find something beautiful that no one else has noticed today.",
    "Match your breath to your steps.",
    "What would this walk look like to a child?",
    "Notice what's changed since the last time you walked here.",
    "Walk like you're leaving all your problems behind you.",
    "Find a color you don't see often. Seek it out.",
    "What's the oldest thing you can see?",
    "Walk slower than feels natural.",
    "If this street could talk, what would it say?",
    "Notice the spaces between things.",
    "Walk as if you've never been outside before.",
    "What's the most interesting shadow you can find?",
    "Find something that's exactly where it should be.",
    "Walk like you're walking for the first time after being sick.",
    "Notice something smaller than your hand.",
    "What would you want to show someone who's never been here?",
    "Walk until you see something that surprises you.",
    "Find evidence of other people's lives.",
    "What would this place sound like at midnight?",
    "Notice the boundaries - where things start and stop.",
    "Walk as if you're looking for something you lost.",
    "What's growing here that nobody planted?",
    "Find something that won't be here in a year.",
    "Walk like you're the main character in a film.",
    "Notice what's trying to survive here.",
    "What would an architect notice that you haven't?",
    "Find something out of place.",
    "Walk as if you're saying goodbye to this route.",
    "What's the most alive thing you can see right now?",
  ],

  artists: [
    // Creative unblocking
    "Make the mistake on purpose.",
    "What would this look like if you made it for a child? For an alien?",
    "Work with your wrong hand for 10 minutes.",
    "What are you trying to avoid making? Make that.",
    "Make it ugly. Intentionally. See what happens.",
    "What would the opposite of this look like?",
    "Remove something you think is essential.",
    "What would this look like if you had to finish in 5 minutes?",
    "Use only materials you can find in this room.",
    "What would you never show anyone? Make that.",
    "Honor your accidents.",
    "What's the cheapest version of this idea?",
    "Make it bigger than it needs to be.",
    "What's missing is what's working.",
    "Start in the middle.",
    "What would your teenage self make?",
    "Embrace the limitation you're resenting.",
    "What would this look like if it were a joke?",
    "Fill a page with your worst ideas.",
    "What's the thing you're embarrassed to want to make?",
    "Take away the thing you started with.",
    "What would someone who hates your work make?",
    "Make it uncomfortable to look at.",
    "What's the version that scares you?",
    "Use a color you never use.",
    "What would this look like as a prototype, not a final piece?",
    "Make the background the subject.",
    "What's the version that takes 10 seconds?",
    "What would you make if no one would ever see it?",
    "Destroy something and use the remains.",
  ],

  musicians: [
    // Sonic exploration
    "What's the note you're afraid to play?",
    "Remove the thing you think is essential.",
    "Play something you'd never play in public.",
    "What does this song need that you're not giving it?",
    "Turn a mistake into a motif.",
    "What would this sound like underwater?",
    "Play as if you're teaching someone who's never heard music.",
    "What's the silence for?",
    "Make it boring on purpose. Find the interest in the boring.",
    "Play something that would embarrass you.",
    "What would a child add to this?",
    "Remove the rhythm. What's left?",
    "What would this sound like in a different room?",
    "Play it too fast. Then too slow. Find the real tempo.",
    "What's the ghost of this song?",
    "Only use notes you can sing.",
    "What would this sound like at 3am?",
    "Play as if you're the last musician on earth.",
    "What would make this worse? Might that also make it better?",
    "Find the drone underneath everything.",
    "What's the version that makes you laugh?",
    "Play to an audience of one person you love.",
    "What's the thing you keep playing that you should stop?",
    "Make it sound broken.",
    "What would this sound like in reverse?",
    "Play as if you're accompanying a film you've never seen.",
    "What's the simplest possible version?",
    "Make the rhythm uncomfortable.",
    "What would someone who hates this genre do?",
    "Play the spaces between the notes.",
  ],

  funny: [
    // Absurdist humor
    "Have you tried being a completely different person?",
    "What if this problem belongs to someone else and you just found it?",
    "Imagine explaining your current situation to a medieval peasant.",
    "What would a golden retriever do? Honestly, try that.",
    "Have you tried turning yourself off and on again?",
    "What if your problems were actually performance art?",
    "Pretend you're an alien pretending to be human. How's that going?",
    "What if this is the before montage in your life movie?",
    "Imagine your anxiety as a small creature you have to carry. Give it a name.",
    "What would happen if you just... didn't?",
    "Consider: maybe the universe is having a weird day too.",
    "What if you treated your thoughts like spam emails?",
    "Imagine your depression is a terrible roommate. What would you say to it?",
    "What would Dolly Parton do? Actually, that's solid advice.",
    "Have you tried lying down on the floor? Sometimes it helps.",
    "What if you're not the main character but a quirky side character?",
    "Imagine your problems as a poorly written TV subplot.",
    "What would happen if you did the thing that's too weird to do?",
    "Consider: cats sleep 16 hours a day and they're doing fine.",
    "What if the answer was 'nothing' and you could just exist?",
    "Pretend you're your own pet. What would your pet need right now?",
    "What would a raccoon do? (Be chaotic, eat garbage, live your truth.)",
    "Have you tried making the situation worse on purpose to see what happens?",
    "What if you just did the absolute weirdest thing right now?",
    "Imagine explaining this to a time traveler from the year 3000.",
    "What would happen if you treated this like an improv scene?",
    "Consider: at some point, someone invented the word 'problematic' and that was a choice.",
    "What if your brain is just a weird little gremlin doing its best?",
    "Pretend you're narrating your own nature documentary.",
    "What would a ghost do? Not your problems. Move through walls. Be spooky.",
  ],

  strange: [
    // Weird perspectives
    "You are a ghost who forgot they died. What unfinished business brought you here?",
    "Describe your current situation as a nature documentary narrator would.",
    "What would your parallel universe self be doing right now?",
    "If your emotions were weather, what's the forecast?",
    "You are an astronaut returning to Earth after 100 years. What surprises you?",
    "What would your life look like as an abstract painting?",
    "You can only communicate through interpretive dance. What are you saying?",
    "What smell describes your mood?",
    "If today were a chapter in a book, what would it be called?",
    "You are dreaming. What does that change?",
    "What would the furniture in this room say about you?",
    "If your problem were a creature, what would it look like?",
    "You are being interviewed about this moment in 50 years. What do you say?",
    "What color is this feeling? What texture?",
    "If you could only speak in questions for an hour, what would you ask?",
    "You are the last human. What do you do next?",
    "What would a tree think of your situation?",
    "If your life were a museum exhibit, what would the placard say?",
    "You wake up and everyone has disappeared. What's your first thought?",
    "What sound does your anxiety make?",
    "If you could send one postcard from this moment, what would it show?",
    "You are an anthropologist studying yourself. What patterns do you notice?",
    "What if you were a symbol? What would you represent?",
    "If this feeling were a place, where would you be?",
    "You can only move in straight lines. How do you get where you need to go?",
    "What would your life be as a haiku?",
    "If your current situation were a door, where would it lead?",
    "You are a time traveler. You have chosen to be here. Why?",
    "What would the moon say about your problems?",
    "You can see the future for 30 seconds. What do you look at?",
  ],
};

/**
 * Get a random strategy from a specific category
 */
export function getRandomSpark(category: SparkCategory): Spark {
  let strategyCategory: Exclude<SparkCategory, 'random'>;

  if (category === 'random') {
    const categories = Object.keys(SPARKS) as Exclude<SparkCategory, 'random'>[];
    strategyCategory = categories[Math.floor(Math.random() * categories.length)];
  } else {
    strategyCategory = category;
  }

  const strategies = SPARKS[strategyCategory];
  const text = strategies[Math.floor(Math.random() * strategies.length)];

  return {
    id: `${strategyCategory}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    category: strategyCategory,
  };
}

/**
 * Get multiple unique strategies from a category
 */
export function getSparks(category: SparkCategory, count: number = 5): Spark[] {
  let sourceCategory: Exclude<SparkCategory, 'random'>;

  if (category === 'random') {
    // For random, pull from all categories
    const allStrategies: Spark[] = [];
    for (const [cat, texts] of Object.entries(SPARKS)) {
      for (const text of texts) {
        allStrategies.push({
          id: `${cat}_${Math.random().toString(36).substr(2, 9)}`,
          text,
          category: cat as Exclude<SparkCategory, 'random'>,
        });
      }
    }

    // Shuffle and return requested count
    const shuffled = allStrategies.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  } else {
    sourceCategory = category;
    const strategies = SPARKS[sourceCategory];
    const shuffled = [...strategies].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, Math.min(count, shuffled.length)).map((text, i) => ({
      id: `${sourceCategory}_${Date.now()}_${i}`,
      text,
      category: sourceCategory,
    }));
  }
}

/**
 * Get all strategies for a category
 */
export function getAllSparksForCategory(category: Exclude<SparkCategory, 'random'>): Spark[] {
  return SPARKS[category].map((text, i) => ({
    id: `${category}_${i}`,
    text,
    category,
  }));
}

/**
 * Get strategy count per category
 */
export function getSparkCounts(): Record<SparkCategory, number> {
  const counts: Record<SparkCategory, number> = {
    depression: SPARKS.depression.length,
    anxiety: SPARKS.anxiety.length,
    walking: SPARKS.walking.length,
    artists: SPARKS.artists.length,
    musicians: SPARKS.musicians.length,
    funny: SPARKS.funny.length,
    strange: SPARKS.strange.length,
    random: Object.values(SPARKS).reduce((sum, arr) => sum + arr.length, 0),
  };
  return counts;
}

/**
 * Save a strategy to favorites
 */
export async function saveToFavorites(spark: Spark): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(FAVORITES_KEY);
    const favorites: Spark[] = existing ? JSON.parse(existing) : [];

    // Don't duplicate
    if (favorites.some(f => f.text === spark.text)) return;

    favorites.push({
      ...spark,
      id: `fav_${Date.now()}`, // New ID for favorite
    });

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorite:', error);
  }
}

/**
 * Remove a strategy from favorites
 */
export async function removeFromFavorites(sparkId: string): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!existing) return;

    const favorites: Spark[] = JSON.parse(existing);
    const filtered = favorites.filter(f => f.id !== sparkId);

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove favorite:', error);
  }
}

/**
 * Get all favorite strategies
 */
export async function getFavorites(): Promise<Spark[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a strategy is favorited
 */
export async function isFavorite(sparkText: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(f => f.text === sparkText);
}

/**
 * Record spark in history (for tracking what resonated)
 */
export async function recordSparkView(spark: Spark): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(HISTORY_KEY);
    const history: { spark: Spark; viewedAt: string }[] = existing
      ? JSON.parse(existing)
      : [];

    history.push({
      spark,
      viewedAt: new Date().toISOString(),
    });

    // Keep last 100
    const trimmed = history.slice(-100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to record spark view:', error);
  }
}

/**
 * Get spark history
 */
export async function getSparkHistory(): Promise<{ spark: Spark; viewedAt: string }[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get category metadata for UI
 */
export function getCategoryMetadata(): Record<SparkCategory, { name: string; description: string; emoji: string }> {
  return {
    depression: {
      name: 'Depression',
      description: 'Gentle nudges when everything feels heavy',
      emoji: '🌧️',
    },
    anxiety: {
      name: 'Anxiety',
      description: 'Grounding prompts when your mind is racing',
      emoji: '🌀',
    },
    walking: {
      name: 'Walking',
      description: 'Contemplations for when you\'re in motion',
      emoji: '🚶',
    },
    artists: {
      name: 'For Artists',
      description: 'Creative unblocking for visual creators',
      emoji: '🎨',
    },
    musicians: {
      name: 'For Musicians',
      description: 'Prompts for sonic exploration',
      emoji: '🎵',
    },
    funny: {
      name: 'Funny',
      description: 'Absurdist humor to break the spell',
      emoji: '😂',
    },
    strange: {
      name: 'Strange',
      description: 'Weird perspectives to jar you loose',
      emoji: '👁️',
    },
    random: {
      name: 'Random',
      description: 'Pull from any category',
      emoji: '🎲',
    },
  };
}

/**
 * Search strategies by text
 */
export function searchSparks(query: string): Spark[] {
  const lowerQuery = query.toLowerCase();
  const results: Spark[] = [];

  for (const [category, strategies] of Object.entries(SPARKS)) {
    for (const text of strategies) {
      if (text.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `search_${category}_${results.length}`,
          text,
          category: category as Exclude<SparkCategory, 'random'>,
        });
      }
    }
  }

  return results;
}

/**
 * Get a strategy appropriate for current mood
 * (Can be called when we detect mood from journal)
 */
export function getSparkForMood(mood: string): Spark {
  const moodLower = mood.toLowerCase();

  if (moodLower.includes('depress') || moodLower.includes('sad') || moodLower.includes('low') || moodLower.includes('hopeless')) {
    return getRandomSpark('depression');
  }

  if (moodLower.includes('anxious') || moodLower.includes('worry') || moodLower.includes('stress') || moodLower.includes('panic')) {
    return getRandomSpark('anxiety');
  }

  if (moodLower.includes('stuck') || moodLower.includes('block') || moodLower.includes('creative')) {
    return getRandomSpark('artists');
  }

  // Default to funny or strange for neutral/unknown moods
  return Math.random() > 0.5 ? getRandomSpark('funny') : getRandomSpark('strange');
}

/**
 * Clear all strategy data (for secure delete)
 */
export async function clearAllSparkData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([FAVORITES_KEY, HISTORY_KEY]);
  } catch (error) {
    console.error('Failed to clear strategy data:', error);
  }
}
