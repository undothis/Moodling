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
  category: 'person' | 'activity' | 'place' | 'event' | 'health' | 'work' | 'relationship' | 'pet' | 'financial' | 'education' | 'profession' | 'identity' | 'coping' | 'temporal';
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
 * Extracted entity with structured data
 */
export interface ExtractedEntity {
  type: 'person' | 'age' | 'location' | 'medication' | 'duration' | 'sobriety';
  value: string;
  detail?: string; // e.g., dosage for medication, role for person
  firstMentioned: string;
  lastMentioned: string;
  mentionCount: number;
}

/**
 * Coping pattern tracking
 */
export interface CopingPattern {
  mechanism: string;
  type: 'healthy' | 'unhealthy';
  frequency: number;
  lastMentioned: string;
}

/**
 * Temporal pattern (recurring emotional states)
 */
export interface TemporalPattern {
  trigger: string; // e.g., "Sunday evenings", "holidays", "winter"
  response: string; // e.g., "anxiety", "sadness"
  frequency: number;
}

/**
 * Severity tracking for distress levels over time
 */
export interface SeveritySnapshot {
  date: string;
  level: 'crisis' | 'high' | 'moderate' | 'low' | 'positive';
  indicators: string[];
}

/**
 * Complete life context for a user
 */
export interface LifeContext {
  topics: LifeTopic[];
  milestones: LifeMilestone[];
  entities: ExtractedEntity[];
  copingPatterns: CopingPattern[];
  temporalPatterns: TemporalPattern[];
  recentSeverity: SeveritySnapshot[];
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
  // Professions
  profession: [
    /\b(?:i'm a|i am a|work as a|working as a|my job as a)\s+([\w\s]+(?:nurse|doctor|teacher|engineer|developer|manager|therapist|lawyer|accountant|designer|analyst|consultant|writer|artist))/gi,
    /\b(nurse|nursing|RN|LPN|doctor|physician|surgeon|resident|paramedic|EMT|pharmacist|dentist)/gi,
    /\b(software engineer|developer|programmer|web developer|data scientist|product manager|UX designer)/gi,
    /\b(teacher|professor|educator|instructor|tutor|principal)/gi,
    /\b(server|bartender|barista|retail|customer service|cashier|sales)/gi,
    /\b(construction|carpenter|electrician|plumber|mechanic|HVAC|welder|truck driver)/gi,
    /\b(accountant|CPA|financial advisor|banker|consultant|analyst|marketing|HR|recruiter)/gi,
    /\b(artist|graphic designer|photographer|videographer|writer|journalist|musician|actor)/gi,
    /\b(lawyer|attorney|paralegal|police officer|firefighter|military|veteran)/gi,
    /\b(flight attendant|pilot|chef|cook|stay-at-home|SAHM|SAHD|caregiver|nanny|freelance)/gi,
  ],
  // Identity
  identity: [
    /\b(?:i'm|i am)\s+(gay|lesbian|bisexual|pansexual|asexual|queer|non-binary|transgender|trans)/gi,
    /\b(coming out|came out|transition|transitioning|LGBTQ)/gi,
    /\b(?:i have|diagnosed with)\s+(ADHD|autism|ASD|dyslexia)/gi,
    /\b(neurodivergent|on the spectrum|autistic)/gi,
  ],
  // Coping mechanisms
  coping: [
    // Healthy coping
    /\b(therapy|journaling|meditation|exercise|yoga|breathing exercises|grounding|mindfulness)/gi,
    /\b(?:talking to|reaching out|asking for help|support system|support group)/gi,
    /\b(self-care|taking care of myself|boundaries|saying no|mental health day)/gi,
    /\b(healthy habits|routine|sleep schedule|rest|break|time off)/gi,
    // Unhealthy coping
    /\b(avoiding|numbing|escaping|isolating|withdrawing)/gi,
    /\b(doom scrolling|doomscrolling|binge|bingeing|retail therapy)/gi,
    /\b(stress eating|overeating|not eating|not sleeping)/gi,
    /\b(drinking more|smoking more|using more|bottling up)/gi,
  ],
  // Temporal patterns
  temporal: [
    /\b(Sunday scaries|Monday blues|midweek slump)/gi,
    /\b(every morning|every night|every day|every week|every month)/gi,
    /\b(this time of year|seasonal|around this time)/gi,
    /\b(anniversary|birthday|holiday|Christmas|Thanksgiving|New Year)/gi,
    /\b(?:for|been)\s+(\d+)\s+(days?|weeks?|months?|years?)/gi,
    /\b(?:since)\s+(January|February|March|April|May|June|July|August|September|October|November|December|\d{4})/gi,
  ],
};

/**
 * Entity extraction patterns for structured data
 */
const ENTITY_PATTERNS = {
  // Named person: "my therapist Dr. Chen", "my partner Sarah"
  namedPerson: /\b(?:my\s+)?(mom|dad|partner|husband|wife|brother|sister|friend|boss|therapist|doctor|girlfriend|boyfriend)\s+([A-Z][a-z]+)/gi,

  // Age mentions: "I'm 34", "turned 30"
  age: /\b(?:i'm|i am|turned|turning)\s+(\d{1,2})\b/gi,

  // Duration: "for 3 years", "been 6 months"
  duration: /\b(?:for|been)\s+(\d+)\s+(days?|weeks?|months?|years?)/gi,

  // Date mentions: "since March 2023", "back in 2019"
  dateMention: /\b(?:since|in|around|back in|last)\s+(January|February|March|April|May|June|July|August|September|October|November|December|\d{4}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gi,

  // Medication with dosage: "50mg of Lexapro", "100mg Zoloft"
  medicationDosage: /\b(\d+)\s*(?:mg|milligrams?)\s+(?:of\s+)?([A-Za-z]+)/gi,

  // Location: "live in Austin", "moved to Seattle"
  location: /\b(?:live in|moved to|from|living in|relocated to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/gi,

  // Sobriety/recovery duration: "6 months sober", "2 years clean"
  sobrietyDuration: /\b(\d+)\s+(days?|weeks?|months?|years?)\s+(sober|clean|in recovery)/gi,

  // Relationship duration: "married for 5 years", "together for 2 years"
  relationshipDuration: /\b(?:married|together|dating)\s+(?:for\s+)?(\d+)\s+(days?|weeks?|months?|years?)/gi,
};

/**
 * Severity markers for distress level detection
 */
const SEVERITY_MARKERS = {
  crisis: [
    'crisis', 'emergency', 'can\'t cope', 'falling apart', 'rock bottom',
    'suicidal', 'want to die', 'don\'t want to be here', 'end my life',
    'self-harm', 'hurting myself', 'cutting', 'need help now',
    'unbearable', 'can\'t take it', 'breaking point',
  ],
  high: [
    'desperate', 'hopeless', 'helpless', 'paralyzed', 'shutting down',
    'dissociating', 'numb', 'completely overwhelmed', 'at my limit',
    'don\'t know what to do', 'falling apart', 'breakdown',
  ],
  moderate: [
    'struggling', 'overwhelmed', 'stressed', 'anxious', 'worried',
    'frustrated', 'upset', 'sad', 'down', 'low', 'scared', 'afraid',
    'exhausted', 'drained', 'burnt out', 'stuck', 'lost', 'confused',
  ],
  low: [
    'bit stressed', 'little worried', 'somewhat', 'kind of', 'a bit',
    'manageable', 'okay', 'fine', 'alright', 'getting by', 'managing',
    'could be worse', 'hanging in there',
  ],
  positive: [
    'happy', 'excited', 'proud', 'grateful', 'hopeful', 'optimistic',
    'relieved', 'peaceful', 'calm', 'content', 'joyful', 'amazing',
    'better', 'improving', 'progress', 'breakthrough', 'confident',
    'strong', 'capable', 'resilient', 'loved', 'supported',
  ],
};

/**
 * Healthy vs unhealthy coping categorization
 */
const COPING_CATEGORIES = {
  healthy: [
    'therapy', 'journaling', 'meditation', 'exercise', 'yoga', 'walking',
    'breathing exercises', 'grounding', 'mindfulness', 'self-care',
    'talking to', 'reaching out', 'asking for help', 'support system',
    'boundaries', 'saying no', 'rest', 'break', 'time off', 'routine',
    'healthy habits', 'sleep schedule',
  ],
  unhealthy: [
    'avoiding', 'numbing', 'escaping', 'isolating', 'withdrawing',
    'doom scrolling', 'doomscrolling', 'binge', 'bingeing', 'retail therapy',
    'stress eating', 'overeating', 'not eating', 'not sleeping',
    'drinking more', 'smoking more', 'using more', 'bottling up',
    'lashing out', 'snapping', 'compulsive', 'obsessing',
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
 * Detect severity level from entry text
 */
function detectSeverity(text: string): SeveritySnapshot['level'] | null {
  const lower = text.toLowerCase();

  // Check in order of severity (most severe first)
  for (const marker of SEVERITY_MARKERS.crisis) {
    if (lower.includes(marker)) return 'crisis';
  }
  for (const marker of SEVERITY_MARKERS.high) {
    if (lower.includes(marker)) return 'high';
  }
  for (const marker of SEVERITY_MARKERS.positive) {
    if (lower.includes(marker)) return 'positive';
  }
  for (const marker of SEVERITY_MARKERS.moderate) {
    if (lower.includes(marker)) return 'moderate';
  }
  for (const marker of SEVERITY_MARKERS.low) {
    if (lower.includes(marker)) return 'low';
  }

  return null;
}

/**
 * Extract coping mechanisms from entry text
 */
function extractCopingMechanisms(text: string): Array<{ mechanism: string; type: 'healthy' | 'unhealthy' }> {
  const lower = text.toLowerCase();
  const found: Array<{ mechanism: string; type: 'healthy' | 'unhealthy' }> = [];

  for (const mechanism of COPING_CATEGORIES.healthy) {
    if (lower.includes(mechanism)) {
      found.push({ mechanism, type: 'healthy' });
    }
  }
  for (const mechanism of COPING_CATEGORIES.unhealthy) {
    if (lower.includes(mechanism)) {
      found.push({ mechanism, type: 'unhealthy' });
    }
  }

  return found;
}

/**
 * Extract named entities from entry text
 */
function extractEntities(text: string, entryDate: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // Extract named people: "my therapist Dr. Chen"
  let match;
  const personRegex = new RegExp(ENTITY_PATTERNS.namedPerson.source, 'gi');
  while ((match = personRegex.exec(text)) !== null) {
    if (match[2]) {
      entities.push({
        type: 'person',
        value: match[2],
        detail: match[1], // role (therapist, partner, etc.)
        firstMentioned: entryDate,
        lastMentioned: entryDate,
        mentionCount: 1,
      });
    }
  }

  // Extract age
  const ageRegex = new RegExp(ENTITY_PATTERNS.age.source, 'gi');
  while ((match = ageRegex.exec(text)) !== null) {
    if (match[1]) {
      entities.push({
        type: 'age',
        value: match[1],
        firstMentioned: entryDate,
        lastMentioned: entryDate,
        mentionCount: 1,
      });
    }
  }

  // Extract locations
  const locationRegex = new RegExp(ENTITY_PATTERNS.location.source, 'gi');
  while ((match = locationRegex.exec(text)) !== null) {
    if (match[1]) {
      entities.push({
        type: 'location',
        value: match[1],
        firstMentioned: entryDate,
        lastMentioned: entryDate,
        mentionCount: 1,
      });
    }
  }

  // Extract medication with dosage
  const medRegex = new RegExp(ENTITY_PATTERNS.medicationDosage.source, 'gi');
  while ((match = medRegex.exec(text)) !== null) {
    if (match[1] && match[2]) {
      entities.push({
        type: 'medication',
        value: match[2],
        detail: `${match[1]}mg`,
        firstMentioned: entryDate,
        lastMentioned: entryDate,
        mentionCount: 1,
      });
    }
  }

  // Extract sobriety duration
  const sobrietyRegex = new RegExp(ENTITY_PATTERNS.sobrietyDuration.source, 'gi');
  while ((match = sobrietyRegex.exec(text)) !== null) {
    if (match[1] && match[2]) {
      entities.push({
        type: 'sobriety',
        value: `${match[1]} ${match[2]} ${match[3] || 'sober'}`,
        firstMentioned: entryDate,
        lastMentioned: entryDate,
        mentionCount: 1,
      });
    }
  }

  return entities;
}

/**
 * Update context with extracted entities
 */
function updateEntities(context: LifeContext, newEntities: ExtractedEntity[]): void {
  for (const newEntity of newEntities) {
    const existing = context.entities.find(
      e => e.type === newEntity.type && e.value.toLowerCase() === newEntity.value.toLowerCase()
    );
    if (existing) {
      existing.lastMentioned = newEntity.lastMentioned;
      existing.mentionCount++;
      if (newEntity.detail) existing.detail = newEntity.detail;
    } else {
      context.entities.push(newEntity);
    }
  }
}

/**
 * Update coping patterns in context
 */
function updateCopingPatterns(context: LifeContext, mechanisms: Array<{ mechanism: string; type: 'healthy' | 'unhealthy' }>, entryDate: string): void {
  for (const { mechanism, type } of mechanisms) {
    const existing = context.copingPatterns.find(c => c.mechanism === mechanism);
    if (existing) {
      existing.frequency++;
      existing.lastMentioned = entryDate;
    } else {
      context.copingPatterns.push({
        mechanism,
        type,
        frequency: 1,
        lastMentioned: entryDate,
      });
    }
  }
}

/**
 * Update severity tracking
 */
function updateSeverity(context: LifeContext, level: SeveritySnapshot['level'], entryDate: string, indicators: string[]): void {
  // Keep last 10 severity snapshots
  context.recentSeverity.push({
    date: entryDate,
    level,
    indicators: indicators.slice(0, 3),
  });
  if (context.recentSeverity.length > 10) {
    context.recentSeverity = context.recentSeverity.slice(-10);
  }
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

  // Extract and update entities (names, ages, locations, medications)
  const entities = extractEntities(entry.text, entryDate);
  updateEntities(context, entities);

  // Extract and update coping patterns
  const copingMechanisms = extractCopingMechanisms(entry.text);
  updateCopingPatterns(context, copingMechanisms, entryDate);

  // Detect and track severity
  const severity = detectSeverity(entry.text);
  if (severity) {
    const indicators = entry.text.slice(0, 100).split(/[.!?]/)[0];
    updateSeverity(context, severity, entryDate, [indicators]);
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
    entities: [],
    copingPatterns: [],
    temporalPatterns: [],
    recentSeverity: [],
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

  // Profession (if detected)
  const profession = context.topics.filter(t => t.category === 'profession').slice(0, 1);
  if (profession.length > 0) {
    parts.push(`Profession: ${profession[0].name}`);
  }

  // Identity (neurodivergence, LGBTQ+)
  const identity = context.topics.filter(t => t.category === 'identity').slice(0, 3);
  if (identity.length > 0) {
    const identityStr = identity.map(i => i.name).join(', ');
    parts.push(`Identity: ${identityStr}`);
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

  // Named entities (specific people, locations, medications)
  if (context.entities && context.entities.length > 0) {
    const namedPeople = context.entities.filter(e => e.type === 'person' && e.detail).slice(0, 3);
    if (namedPeople.length > 0) {
      const peopleStr = namedPeople.map(p => `${p.value} (${p.detail})`).join(', ');
      parts.push(`Named people: ${peopleStr}`);
    }

    const location = context.entities.find(e => e.type === 'location');
    if (location) {
      parts.push(`Location: ${location.value}`);
    }

    const age = context.entities.find(e => e.type === 'age');
    if (age) {
      parts.push(`Age: ${age.value}`);
    }

    const medications = context.entities.filter(e => e.type === 'medication').slice(0, 3);
    if (medications.length > 0) {
      const medStr = medications.map(m => m.detail ? `${m.value} (${m.detail})` : m.value).join(', ');
      parts.push(`Medications: ${medStr}`);
    }

    const sobriety = context.entities.find(e => e.type === 'sobriety');
    if (sobriety) {
      parts.push(`Recovery: ${sobriety.value}`);
    }
  }

  // Coping patterns
  if (context.copingPatterns && context.copingPatterns.length > 0) {
    const healthyCoping = context.copingPatterns.filter(c => c.type === 'healthy').slice(0, 3);
    const unhealthyCoping = context.copingPatterns.filter(c => c.type === 'unhealthy').slice(0, 3);

    if (healthyCoping.length > 0) {
      const healthyStr = healthyCoping.map(c => c.mechanism).join(', ');
      parts.push(`Healthy coping: ${healthyStr}`);
    }
    if (unhealthyCoping.length > 0) {
      const unhealthyStr = unhealthyCoping.map(c => c.mechanism).join(', ');
      parts.push(`Coping challenges: ${unhealthyStr}`);
    }
  }

  // Recent severity/emotional trend
  if (context.recentSeverity && context.recentSeverity.length > 0) {
    const recent = context.recentSeverity.slice(-3);
    const levels = recent.map(s => s.level);

    // Summarize trend
    const hasCrisis = levels.includes('crisis');
    const hasHigh = levels.includes('high');
    const hasPositive = levels.includes('positive');

    if (hasCrisis || hasHigh) {
      parts.push(`Recent emotional state: Struggling (${hasCrisis ? 'crisis moments' : 'high distress'})`);
    } else if (hasPositive) {
      parts.push(`Recent emotional state: Doing well (positive entries recently)`);
    } else {
      const avgLevel = levels[levels.length - 1] || 'moderate';
      parts.push(`Recent emotional state: ${avgLevel}`);
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
