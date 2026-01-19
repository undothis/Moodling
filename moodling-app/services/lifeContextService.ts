/**
 * Life Context Service
 *
 * Tracks important topics, people, and events across the user's entire
 * journal history. This allows Claude to reference things from years ago
 * without sending all raw entries.
 *
 * Following Moodling Ethics:
 * - Data stays on device
 * - User controls what's tracked
 * - No diagnostic labels
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEntries } from './journalStorage';
import { JournalEntry } from '@/types/JournalEntry';

const LIFE_CONTEXT_KEY = 'moodling_life_context';
const LAST_PROCESSED_KEY = 'moodling_life_context_last_processed';

/**
 * A tracked topic in the user's life
 */
export interface LifeTopic {
  name: string;
  category: 'person' | 'activity' | 'place' | 'event' | 'health' | 'work' | 'relationship' | 'pet' | 'financial' | 'education';
  firstMentioned: string; // ISO date
  lastMentioned: string; // ISO date
  mentionCount: number;
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  notes: string[]; // Brief context snippets (max 3)
}

/**
 * A milestone/significant event
 */
export interface LifeMilestone {
  date: string; // ISO date
  summary: string; // Brief description
  category: 'achievement' | 'loss' | 'change' | 'relationship' | 'health' | 'growth' | 'financial' | 'spiritual' | 'legal';
  relatedTopics: string[];
}

/**
 * Complete life context for a user
 */
export interface LifeContext {
  topics: LifeTopic[];
  milestones: LifeMilestone[];
  journeyStartDate: string; // When they started journaling
  totalEntriesProcessed: number;
  lastUpdated: string;
}

/**
 * Patterns for extracting topics from text
 */
const EXTRACTION_PATTERNS = {
  // People - names often follow these patterns
  person: [
    /\b(?:my|our)\s+(mom|dad|mother|father|brother|sister|grandma|grandpa|grandmother|grandfather|aunt|uncle|cousin|husband|wife|boyfriend|girlfriend|partner|friend|boss|coworker|therapist|doctor|counselor|psychiatrist|son|daughter)\b/gi,
    /\b([A-Z][a-z]+)\s+(?:and I|told me|said|called|texted|messaged)/g,
    /\bwith\s+([A-Z][a-z]+)\b/g,
    /\b([A-Z][a-z]+)'s\s+(?:birthday|house|place|car|dog|cat|funeral|wedding)/g,
    /\b(?:best friend|childhood friend)\s+([A-Z][a-z]+)/gi,
  ],
  // Activities/hobbies
  activity: [
    /\b(?:started|began|tried|practicing|learning|doing|went)\s+([\w\s]+(?:class|lesson|practice|training|yoga|meditation|running|cycling|swimming|painting|writing|reading|gaming|coding|cooking|baking|gardening|hiking|climbing|dancing|gym|workout|exercise|therapy))/gi,
    /\bmy\s+([\w]+)\s+(?:practice|hobby|routine|workout|journey)/gi,
    /\b(?:taking up|picked up|got into)\s+([\w\s]+)/gi,
  ],
  // Places
  place: [
    /\b(?:moved to|visited|went to|at|living in|relocated to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
    /\bin\s+([A-Z][a-z]+(?:,\s*[A-Z]{2})?)\b/g,
    /\b(?:hometown|home town|my city)\s+([A-Z][a-z]+)/gi,
  ],
  // Health events (including mental health)
  health: [
    /\b(?:diagnosed with|started|taking|prescribed)\s+([\w\s]+(?:medication|therapy|treatment|pills|antidepressant|antianxiety))/gi,
    /\b(surgery|hospital|doctor|appointment|checkup|test results|therapist|counselor|psychiatrist|ER|emergency room)/gi,
    /\b(?:struggling with|dealing with|managing)\s+(anxiety|depression|ADHD|bipolar|OCD|PTSD|insomnia|chronic pain)/gi,
    /\b(panic attack|breakdown|mental health|recovery|relapse|sobriety|sober)/gi,
  ],
  // Work/career
  work: [
    /\b(?:new job|started at|working at|got hired|promoted|fired from|quit|laid off|resigned from)\s*([\w\s]+)?/gi,
    /\b(interview|promotion|raise|project|deadline|meeting|salary|bonus|coworker|manager|boss)/gi,
    /\b(?:unemployed|job hunting|job search|career change)/gi,
  ],
  // Relationship events
  relationship: [
    /\b(engaged|married|divorced|broke up|started dating|anniversary|proposal|wedding|separation)/gi,
    /\b(?:met|dating|seeing|in love with)\s+([A-Z][a-z]+)\b/g,
    /\b(?:first date|moved in together|living together)/gi,
  ],
  // Pets
  pet: [
    /\b(?:my|our)\s+(dog|cat|pet|puppy|kitten|bird|fish|hamster|rabbit|bunny)\s+([A-Z][a-z]+)?/gi,
    /\b(?:adopted|rescued|got)\s+(?:a\s+)?(dog|cat|puppy|kitten|pet)/gi,
    /\b([A-Z][a-z]+)\s+(?:my dog|my cat|our dog|our cat)/gi,
    /\bpet\s+([A-Z][a-z]+)/gi,
  ],
  // Financial
  financial: [
    /\b(debt|loan|mortgage|bankruptcy|savings|investment|retirement|credit card)/gi,
    /\b(?:paid off|debt free|financial|money problems|struggling financially)/gi,
    /\b(?:bought a|buying a)\s+(house|car|home|apartment)/gi,
  ],
  // Education
  education: [
    /\b(college|university|school|degree|thesis|dissertation|graduation|scholarship)/gi,
    /\b(?:studying|majoring in|enrolled in)\s+([\w\s]+)/gi,
  ],
};

/**
 * Keywords that suggest milestones
 */
const MILESTONE_KEYWORDS = {
  achievement: [
    'finally', 'accomplished', 'achieved', 'succeeded', 'won', 'finished', 'completed',
    'graduated', 'promoted', 'got the job', 'hired', 'accepted', 'passed', 'first time',
    'personal best', 'milestone', 'scholarship', 'degree', 'certified', 'published',
  ],
  loss: [
    'died', 'passed away', 'funeral', 'lost', 'goodbye', 'end of', 'no longer',
    'grief', 'grieving', 'mourning', 'miscarriage', 'put down', 'euthanized',
    'betrayed', 'ghosted', 'abandoned',
  ],
  change: [
    'moving', 'moved', 'new job', 'started', 'beginning', 'first day', 'last day',
    'quit', 'leaving', 'new city', 'new apartment', 'new house', 'fired', 'laid off',
    'retired', 'coming out', 'transition', 'major decision',
  ],
  relationship: [
    'engaged', 'married', 'divorced', 'broke up', 'met someone', 'anniversary',
    'baby', 'pregnant', 'proposal', 'wedding', 'started dating', 'first date',
    'said I love you', 'moved in together', 'adoption',
  ],
  health: [
    'diagnosed', 'surgery', 'recovered', 'clean', 'sober', 'remission', 'relapse',
    'hospital', 'emergency', 'accident', 'therapy', 'medication', 'treatment',
    'chronic', 'mental health', 'panic attack', 'breakdown', 'rehab',
  ],
  growth: [
    'realized', 'learned', 'understood', 'changed', 'better at', 'no longer afraid',
    'overcame', 'proud', 'breakthrough', 'epiphany', 'forgave', 'let go', 'accepted',
    'boundaries', 'stood up for', 'self-compassion', 'healing',
  ],
  financial: [
    'debt free', 'paid off', 'mortgage', 'bankruptcy', 'raise', 'bonus', 'investment',
    'savings goal', 'financial', 'bought a house', 'bought a car',
  ],
  spiritual: [
    'baptism', 'confirmation', 'conversion', 'faith', 'spiritual awakening',
    'meditation retreat', 'pilgrimage',
  ],
  legal: [
    'custody', 'court', 'lawsuit', 'settlement', 'arrested', 'charges', 'verdict',
  ],
};

/**
 * Extract topics from entry text
 */
function extractTopicsFromText(text: string): Array<{ name: string; category: LifeTopic['category'] }> {
  const topics: Array<{ name: string; category: LifeTopic['category'] }> = [];
  const textLower = text.toLowerCase();

  // Check each category
  for (const [category, patterns] of Object.entries(EXTRACTION_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const extracted = match[1] || match[0];
        if (extracted && extracted.length > 2 && extracted.length < 50) {
          const cleaned = extracted.trim().replace(/[^\w\s]/g, '');
          if (cleaned.length > 2) {
            topics.push({
              name: cleaned,
              category: category as LifeTopic['category'],
            });
          }
        }
      }
    }
  }

  // Also check for explicit mentions of common relationship terms
  const relationshipTerms = ['girlfriend', 'boyfriend', 'partner', 'wife', 'husband', 'fiancé', 'fiancée'];
  for (const term of relationshipTerms) {
    if (textLower.includes(term)) {
      // Try to extract the name that follows
      const nameMatch = text.match(new RegExp(`(?:my\\s+)?${term}[,]?\\s+([A-Z][a-z]+)`, 'i'));
      if (nameMatch) {
        topics.push({ name: `${nameMatch[1]} (${term})`, category: 'person' });
      } else {
        topics.push({ name: term, category: 'relationship' });
      }
    }
  }

  return topics;
}

/**
 * Check if entry represents a milestone
 */
function detectMilestone(entry: JournalEntry): LifeMilestone | null {
  const text = entry.text.toLowerCase();
  const mood = entry.sentiment?.mood || '';

  for (const [category, keywords] of Object.entries(MILESTONE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        // Extract a brief summary (first sentence or 100 chars)
        const firstSentence = entry.text.split(/[.!?]/)[0].trim();
        const summary = firstSentence.length > 100
          ? firstSentence.slice(0, 100) + '...'
          : firstSentence;

        return {
          date: entry.createdAt,
          summary,
          category: category as LifeMilestone['category'],
          relatedTopics: extractTopicsFromText(entry.text).map(t => t.name).slice(0, 3),
        };
      }
    }
  }

  // Also flag very emotional entries as potential milestones
  if (mood.includes('very_') && entry.text.length > 200) {
    const firstSentence = entry.text.split(/[.!?]/)[0].trim();
    return {
      date: entry.createdAt,
      summary: firstSentence.slice(0, 100) + (firstSentence.length > 100 ? '...' : ''),
      category: mood.includes('positive') ? 'growth' : 'change',
      relatedTopics: extractTopicsFromText(entry.text).map(t => t.name).slice(0, 3),
    };
  }

  return null;
}

/**
 * Determine sentiment for a topic based on entry mood
 */
function determineSentiment(mood: string): LifeTopic['sentiment'] {
  if (mood.includes('positive')) return 'positive';
  if (mood.includes('negative')) return 'negative';
  return 'neutral';
}

/**
 * Load existing life context from storage
 */
export async function getLifeContext(): Promise<LifeContext | null> {
  try {
    const data = await AsyncStorage.getItem(LIFE_CONTEXT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load life context:', error);
    return null;
  }
}

/**
 * Save life context to storage
 */
async function saveLifeContext(context: LifeContext): Promise<void> {
  try {
    await AsyncStorage.setItem(LIFE_CONTEXT_KEY, JSON.stringify(context));
    await AsyncStorage.setItem(LAST_PROCESSED_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save life context:', error);
  }
}

/**
 * Process a single entry and update context
 */
function processEntry(entry: JournalEntry, context: LifeContext): void {
  const extractedTopics = extractTopicsFromText(entry.text);
  const mood = entry.sentiment?.mood || 'neutral';
  const entryDate = entry.createdAt;
  const entrySentiment = determineSentiment(mood);

  for (const { name, category } of extractedTopics) {
    // Normalize the name for matching
    const normalizedName = name.toLowerCase().trim();

    // Find existing topic
    const existingIndex = context.topics.findIndex(
      t => t.name.toLowerCase() === normalizedName ||
           t.name.toLowerCase().includes(normalizedName) ||
           normalizedName.includes(t.name.toLowerCase())
    );

    if (existingIndex >= 0) {
      // Update existing topic
      const topic = context.topics[existingIndex];
      topic.lastMentioned = entryDate;
      topic.mentionCount++;

      // Update sentiment (mixed if conflicting)
      if (topic.sentiment !== entrySentiment && topic.sentiment !== 'mixed') {
        if (topic.sentiment !== 'neutral' && entrySentiment !== 'neutral') {
          topic.sentiment = 'mixed';
        } else if (entrySentiment !== 'neutral') {
          topic.sentiment = entrySentiment;
        }
      }

      // Add note if significant (keep max 3)
      if (entry.text.length > 100 && topic.notes.length < 3) {
        const snippet = entry.text.slice(0, 60) + '...';
        if (!topic.notes.includes(snippet)) {
          topic.notes.push(snippet);
        }
      }
    } else {
      // Create new topic
      context.topics.push({
        name,
        category,
        firstMentioned: entryDate,
        lastMentioned: entryDate,
        mentionCount: 1,
        sentiment: entrySentiment,
        notes: entry.text.length > 100 ? [entry.text.slice(0, 60) + '...'] : [],
      });
    }
  }

  // Check for milestones
  const milestone = detectMilestone(entry);
  if (milestone) {
    // Avoid duplicate milestones on same day
    const existingMilestone = context.milestones.find(
      m => m.date.slice(0, 10) === milestone.date.slice(0, 10)
    );
    if (!existingMilestone) {
      context.milestones.push(milestone);
    }
  }

  context.totalEntriesProcessed++;
}

/**
 * Build or update life context from all entries
 */
export async function buildLifeContext(): Promise<LifeContext> {
  const entries = await getAllEntries();

  // Sort by date (oldest first for processing)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Start fresh or load existing
  let context: LifeContext = {
    topics: [],
    milestones: [],
    journeyStartDate: sortedEntries[0]?.createdAt || new Date().toISOString(),
    totalEntriesProcessed: 0,
    lastUpdated: new Date().toISOString(),
  };

  // Process all entries
  for (const entry of sortedEntries) {
    processEntry(entry, context);
  }

  // Sort topics by mention count (most mentioned first)
  context.topics.sort((a, b) => b.mentionCount - a.mentionCount);

  // Keep only top 50 topics to avoid bloat
  context.topics = context.topics.slice(0, 50);

  // Sort milestones by date (newest first)
  context.milestones.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Keep only top 30 milestones
  context.milestones = context.milestones.slice(0, 30);

  await saveLifeContext(context);
  return context;
}

/**
 * Format life context for Claude prompt
 */
export function formatLifeContextForPrompt(context: LifeContext): string {
  const parts: string[] = [];
  const now = new Date();
  const journeyStart = new Date(context.journeyStartDate);
  const monthsJournaling = Math.floor(
    (now.getTime() - journeyStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Journey overview
  if (monthsJournaling > 0) {
    const yearsMonths = monthsJournaling >= 12
      ? `${Math.floor(monthsJournaling / 12)} year${Math.floor(monthsJournaling / 12) > 1 ? 's' : ''}`
      : `${monthsJournaling} month${monthsJournaling > 1 ? 's' : ''}`;
    parts.push(`Journaling journey: ${yearsMonths} (${context.totalEntriesProcessed} entries)`);
  }

  // Key people in their life
  const people = context.topics.filter(t => t.category === 'person').slice(0, 5);
  if (people.length > 0) {
    const peopleStr = people.map(p => {
      const months = getMonthsAgo(p.firstMentioned);
      return `${p.name}${months > 1 ? ` (${months}mo)` : ''}`;
    }).join(', ');
    parts.push(`Key people: ${peopleStr}`);
  }

  // Pets (often deeply important)
  const pets = context.topics.filter(t => t.category === 'pet').slice(0, 3);
  if (pets.length > 0) {
    const petsStr = pets.map(p => {
      const months = getMonthsAgo(p.firstMentioned);
      return `${p.name}${months > 1 ? ` (${months}mo)` : ''}`;
    }).join(', ');
    parts.push(`Pets: ${petsStr}`);
  }

  // Activities/interests
  const activities = context.topics.filter(t => t.category === 'activity').slice(0, 4);
  if (activities.length > 0) {
    const activitiesStr = activities.map(a => {
      const months = getMonthsAgo(a.firstMentioned);
      return `${a.name}${months > 3 ? ` (since ${months}mo ago)` : ''}`;
    }).join(', ');
    parts.push(`Interests/activities: ${activitiesStr}`);
  }

  // Health journey (if mentioned multiple times)
  const healthTopics = context.topics.filter(t => t.category === 'health' && t.mentionCount >= 2).slice(0, 3);
  if (healthTopics.length > 0) {
    const healthStr = healthTopics.map(h => h.name).join(', ');
    parts.push(`Health journey: ${healthStr}`);
  }

  // Recent milestones (last 3)
  const recentMilestones = context.milestones.slice(0, 3);
  if (recentMilestones.length > 0) {
    parts.push('');
    parts.push('Recent milestones:');
    for (const m of recentMilestones) {
      const timeAgo = formatTimeAgo(m.date);
      parts.push(`  • ${timeAgo}: ${m.summary}`);
    }
  }

  // Older significant milestones
  const olderMilestones = context.milestones.slice(3, 6);
  if (olderMilestones.length > 0) {
    parts.push('');
    parts.push('Earlier in their journey:');
    for (const m of olderMilestones) {
      const timeAgo = formatTimeAgo(m.date);
      parts.push(`  • ${timeAgo}: ${m.summary}`);
    }
  }

  // Long-term topics (mentioned for over 3 months)
  const longTermTopics = context.topics.filter(t => {
    const firstMentioned = new Date(t.firstMentioned);
    const lastMentioned = new Date(t.lastMentioned);
    const spanMonths = (lastMentioned.getTime() - firstMentioned.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return spanMonths >= 3 && t.mentionCount >= 3;
  }).slice(0, 5);

  if (longTermTopics.length > 0) {
    parts.push('');
    parts.push('Ongoing themes (tracked over months):');
    for (const t of longTermTopics) {
      const spanMonths = Math.floor(
        (new Date(t.lastMentioned).getTime() - new Date(t.firstMentioned).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      parts.push(`  • ${t.name}: ${spanMonths} months, ${t.mentionCount} mentions (${t.sentiment})`);
    }
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

/**
 * Get months ago from a date
 */
function getMonthsAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

/**
 * Format time ago in a readable way
 */
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;

  const years = Math.floor(daysAgo / 365);
  const remainingMonths = Math.floor((daysAgo % 365) / 30);
  if (remainingMonths > 0) {
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} months ago`;
  }
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Get formatted life context for Claude
 */
export async function getLifeContextForClaude(): Promise<string> {
  let context = await getLifeContext();

  // Build if doesn't exist or is stale
  if (!context || context.totalEntriesProcessed === 0) {
    context = await buildLifeContext();
  }

  return formatLifeContextForPrompt(context);
}

/**
 * Trigger a rebuild of life context (call after new entries)
 */
export async function refreshLifeContext(): Promise<void> {
  await buildLifeContext();
}
