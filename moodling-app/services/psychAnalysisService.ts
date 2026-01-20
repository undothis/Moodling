/**
 * Mood Leaf - Psychological Analysis Service
 *
 * Analyzes journal entries for psychological patterns and builds
 * a comprehensive psychological profile over time.
 *
 * AI INTEGRATION:
 * 1. Each entry is analyzed for patterns (cognitive distortions, defenses, etc.)
 * 2. Profile is updated incrementally (weighted by recency)
 * 3. Compressed profile is included in Claude API context
 * 4. Enables personalized, psychologically-informed responses
 *
 * This is the "WHY" layer - understanding not just what happened,
 * but why patterns emerge and how to help.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  // Types
  CognitiveDistortion,
  DefenseMechanism,
  DefenseLevel,
  AttachmentStyle,
  EmotionRegulationStrategy,
  PolyvagalState,
  Mindset,
  SchwartzValue,
  PermaElement,
  GriefStyle,
  MoneyScript,
  GottmanHorseman,
  PsychologicalProfile,
  DEFAULT_PSYCHOLOGICAL_PROFILE,
  // Patterns
  COGNITIVE_DISTORTION_PATTERNS,
  DEFENSE_MECHANISM_PATTERNS,
  ATTACHMENT_PATTERNS,
  LOCUS_OF_CONTROL_PATTERNS,
  EMOTION_REGULATION_PATTERNS,
  POLYVAGAL_PATTERNS,
  MINDSET_PATTERNS,
  VALUES_PATTERNS,
  PERMA_PATTERNS,
  GRIEF_STYLE_PATTERNS,
  MONEY_SCRIPT_PATTERNS,
  GOTTMAN_PATTERNS,
} from './psychTypes';

const STORAGE_KEY = 'moodleaf_psychological_profile';

// ============================================
// ANALYSIS RESULT TYPES
// ============================================

export interface EntryAnalysis {
  // What was detected
  cognitiveDistortions: {
    distortion: CognitiveDistortion;
    matches: string[];
    confidence: number;
  }[];

  defenseMechanisms: {
    mechanism: DefenseMechanism;
    matches: string[];
  }[];

  attachmentSignals: {
    style: AttachmentStyle;
    matches: string[];
  }[];

  locusSignals: {
    type: 'internal' | 'external';
    matches: string[];
  }[];

  regulationStrategies: {
    strategy: EmotionRegulationStrategy;
    matches: string[];
  }[];

  polyvagalState: {
    state: PolyvagalState;
    matches: string[];
    confidence: number;
  } | null;

  mindsetSignals: {
    type: Mindset;
    matches: string[];
  }[];

  valuesDetected: {
    value: SchwartzValue;
    matches: string[];
  }[];

  permaElements: {
    element: PermaElement;
    matches: string[];
  }[];

  griefSignals: {
    style: GriefStyle;
    matches: string[];
  }[];

  moneySignals: {
    script: MoneyScript;
    matches: string[];
  }[];

  gottmanSignals: {
    horseman: GottmanHorseman;
    matches: string[];
  }[];

  // Insights generated
  alerts: {
    type: 'distortion' | 'pattern' | 'concern' | 'positive';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

// ============================================
// ANALYSIS ENGINE
// ============================================

class PsychAnalysisService {
  private profile: PsychologicalProfile = DEFAULT_PSYCHOLOGICAL_PROFILE;
  private initialized = false;

  /**
   * Initialize service and load stored profile
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.profile = JSON.parse(stored);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load psychological profile:', error);
      this.profile = DEFAULT_PSYCHOLOGICAL_PROFILE;
      this.initialized = true;
    }
  }

  /**
   * Save profile to storage
   */
  private async saveProfile(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch (error) {
      console.error('Failed to save psychological profile:', error);
    }
  }

  /**
   * Main analysis function - analyzes text for all psychological patterns
   */
  analyzeEntry(text: string): EntryAnalysis {
    const lowerText = text.toLowerCase();

    return {
      cognitiveDistortions: this.detectCognitiveDistortions(lowerText, text),
      defenseMechanisms: this.detectDefenseMechanisms(lowerText),
      attachmentSignals: this.detectAttachmentSignals(lowerText),
      locusSignals: this.detectLocusSignals(lowerText),
      regulationStrategies: this.detectRegulationStrategies(lowerText),
      polyvagalState: this.detectPolyvagalState(lowerText),
      mindsetSignals: this.detectMindsetSignals(lowerText),
      valuesDetected: this.detectValues(lowerText),
      permaElements: this.detectPermaElements(lowerText),
      griefSignals: this.detectGriefSignals(lowerText),
      moneySignals: this.detectMoneySignals(lowerText),
      gottmanSignals: this.detectGottmanSignals(lowerText),
      alerts: [], // Populated after all detection
    };
  }

  /**
   * Analyze entry AND update profile
   */
  async analyzeAndUpdateProfile(text: string, entryId: string): Promise<EntryAnalysis> {
    await this.initialize();

    const analysis = this.analyzeEntry(text);

    // Generate alerts based on analysis
    analysis.alerts = this.generateAlerts(analysis);

    // Update profile with new data
    this.updateProfileFromAnalysis(analysis, entryId);

    // Save updated profile
    await this.saveProfile();

    return analysis;
  }

  // ============================================
  // DETECTION METHODS
  // ============================================

  private detectCognitiveDistortions(lowerText: string, originalText: string): EntryAnalysis['cognitiveDistortions'] {
    const results: EntryAnalysis['cognitiveDistortions'] = [];

    for (const [distortion, patterns] of Object.entries(COGNITIVE_DISTORTION_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          // Find the actual phrase containing the keyword
          const regex = new RegExp(`[^.]*\\b${keyword}\\b[^.]*`, 'gi');
          const found = originalText.match(regex);
          if (found) {
            matches.push(...found.map(m => m.trim()));
          }
        }
      }

      if (matches.length > 0) {
        results.push({
          distortion: distortion as CognitiveDistortion,
          matches: [...new Set(matches)], // Dedupe
          confidence: Math.min(matches.length / 3, 1), // More matches = higher confidence
        });
      }
    }

    return results;
  }

  private detectDefenseMechanisms(lowerText: string): EntryAnalysis['defenseMechanisms'] {
    const results: EntryAnalysis['defenseMechanisms'] = [];

    for (const [mechanism, patterns] of Object.entries(DEFENSE_MECHANISM_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          mechanism: mechanism as DefenseMechanism,
          matches,
        });
      }
    }

    return results;
  }

  private detectAttachmentSignals(lowerText: string): EntryAnalysis['attachmentSignals'] {
    const results: EntryAnalysis['attachmentSignals'] = [];

    for (const [style, patterns] of Object.entries(ATTACHMENT_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          style: style as AttachmentStyle,
          matches,
        });
      }
    }

    return results;
  }

  private detectLocusSignals(lowerText: string): EntryAnalysis['locusSignals'] {
    const results: EntryAnalysis['locusSignals'] = [];

    for (const [locus, patterns] of Object.entries(LOCUS_OF_CONTROL_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          type: locus as 'internal' | 'external',
          matches,
        });
      }
    }

    return results;
  }

  private detectRegulationStrategies(lowerText: string): EntryAnalysis['regulationStrategies'] {
    const results: EntryAnalysis['regulationStrategies'] = [];

    for (const [strategy, patterns] of Object.entries(EMOTION_REGULATION_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          strategy: strategy as EmotionRegulationStrategy,
          matches,
        });
      }
    }

    return results;
  }

  private detectPolyvagalState(lowerText: string): EntryAnalysis['polyvagalState'] {
    let bestMatch: { state: PolyvagalState; matches: string[]; confidence: number } | null = null;

    for (const [state, patterns] of Object.entries(POLYVAGAL_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        const confidence = matches.length / patterns.keywords.length;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            state: state as PolyvagalState,
            matches,
            confidence,
          };
        }
      }
    }

    return bestMatch;
  }

  private detectMindsetSignals(lowerText: string): EntryAnalysis['mindsetSignals'] {
    const results: EntryAnalysis['mindsetSignals'] = [];

    for (const [mindset, patterns] of Object.entries(MINDSET_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          type: mindset as Mindset,
          matches,
        });
      }
    }

    return results;
  }

  private detectValues(lowerText: string): EntryAnalysis['valuesDetected'] {
    const results: EntryAnalysis['valuesDetected'] = [];

    for (const [value, patterns] of Object.entries(VALUES_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          value: value as SchwartzValue,
          matches,
        });
      }
    }

    return results;
  }

  private detectPermaElements(lowerText: string): EntryAnalysis['permaElements'] {
    const results: EntryAnalysis['permaElements'] = [];

    for (const [element, patterns] of Object.entries(PERMA_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          element: element as PermaElement,
          matches,
        });
      }
    }

    return results;
  }

  private detectGriefSignals(lowerText: string): EntryAnalysis['griefSignals'] {
    const results: EntryAnalysis['griefSignals'] = [];

    for (const [style, patterns] of Object.entries(GRIEF_STYLE_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          style: style as GriefStyle,
          matches,
        });
      }
    }

    return results;
  }

  private detectMoneySignals(lowerText: string): EntryAnalysis['moneySignals'] {
    const results: EntryAnalysis['moneySignals'] = [];

    for (const [script, patterns] of Object.entries(MONEY_SCRIPT_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          script: script as MoneyScript,
          matches,
        });
      }
    }

    return results;
  }

  private detectGottmanSignals(lowerText: string): EntryAnalysis['gottmanSignals'] {
    const results: EntryAnalysis['gottmanSignals'] = [];

    for (const [horseman, patterns] of Object.entries(GOTTMAN_PATTERNS)) {
      const matches: string[] = [];

      for (const keyword of patterns.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      if (matches.length > 0) {
        results.push({
          horseman: horseman as GottmanHorseman,
          matches,
        });
      }
    }

    return results;
  }

  // ============================================
  // GENTLE SUGGESTION GENERATION
  // ============================================

  /**
   * Generate warm, gentle suggestions (NOT clinical labels).
   * These are optional prompts the user can choose to explore.
   * Never labeling, always offering.
   */
  private generateAlerts(analysis: EntryAnalysis): EntryAnalysis['alerts'] {
    const alerts: EntryAnalysis['alerts'] = [];

    // Thinking pattern suggestions (gentle, no labels)
    for (const distortion of analysis.cognitiveDistortions) {
      if (distortion.confidence > 0.5) {
        const gentleSuggestions: Record<CognitiveDistortion, string> = {
          all_or_nothing: 'Sometimes our minds jump to extremes. What might a middle ground look like here?',
          catastrophizing: 'It sounds like this feels really big right now. What would you tell a friend in this situation?',
          mind_reading: 'It\'s so easy to assume what others think. Have you had a chance to check in with them?',
          fortune_telling: 'The future can feel certain when we\'re worried. What possibilities might we be missing?',
          should_statements: 'There\'s a lot of pressure in that "should." What if you gave yourself some grace here?',
          emotional_reasoning: 'Feelings are so real. And sometimes they\'re messengers, not facts. What might this feeling be trying to tell you?',
          labeling: 'That\'s a strong word you used. What happened that made you feel that way?',
          personalization: 'It\'s kind to care so much. How much of this is really within your control?',
          magnification: 'This sounds really heavy. If you zoom out a bit, what else is true?',
          minimization: 'You mentioned something positive but brushed past it. What if it actually matters?',
          filtering: 'Sounds like one part is sticking with you. What else happened that might be worth noticing?',
          disqualifying_positive: 'You explained away something good. What if you let yourself feel it?',
        };

        alerts.push({
          type: 'distortion',
          message: gentleSuggestions[distortion.distortion],
          severity: distortion.confidence > 0.8 ? 'medium' : 'low',
        });
      }
    }

    // Body awareness suggestions (for nervous system states)
    if (analysis.polyvagalState?.state === 'sympathetic' && analysis.polyvagalState.confidence > 0.5) {
      alerts.push({
        type: 'pattern',
        message: 'Your body might be running a bit hot right now. Sometimes a few slow breaths can help things settle.',
        severity: 'low',
      });
    }

    if (analysis.polyvagalState?.state === 'dorsal_vagal' && analysis.polyvagalState.confidence > 0.5) {
      alerts.push({
        type: 'concern',
        message: 'It sounds like things feel pretty heavy or far away. That makes sense given what you\'re going through. Would something small and grounding help - like naming five things you can see?',
        severity: 'medium',
      });
    }

    // Relationship awareness (gentle, not labeling)
    const anxiousSignals = analysis.attachmentSignals.filter(s => s.style === 'anxious');
    if (anxiousSignals.length > 0 && anxiousSignals[0].matches.length >= 2) {
      alerts.push({
        type: 'pattern',
        message: 'Waiting for connection can feel so uncertain. You\'re not alone in that.',
        severity: 'low',
      });
    }

    // Positive acknowledgment
    if (analysis.permaElements.length >= 2) {
      const positiveMessages = [
        'There\'s something good here worth noticing.',
        'I see some brightness in this. That matters.',
        'Even in hard times, you found something meaningful.',
      ];
      alerts.push({
        type: 'positive',
        message: positiveMessages[Math.floor(Math.random() * positiveMessages.length)],
        severity: 'low',
      });
    }

    // Growth mindset encouragement
    if (analysis.mindsetSignals.find(s => s.type === 'growth' && s.matches.length >= 2)) {
      alerts.push({
        type: 'positive',
        message: 'I love that you see this as something you can grow through.',
        severity: 'low',
      });
    }

    // Healthy coping acknowledgment
    const adaptiveStrategies = analysis.regulationStrategies.filter(s =>
      EMOTION_REGULATION_PATTERNS[s.strategy].adaptive
    );
    if (adaptiveStrategies.length >= 1) {
      alerts.push({
        type: 'positive',
        message: 'The way you\'re handling this shows real wisdom.',
        severity: 'low',
      });
    }

    // Relationship communication (gentle framing)
    for (const gottman of analysis.gottmanSignals) {
      const gentleGottman: Record<GottmanHorseman, string> = {
        criticism: 'When we\'re frustrated, it\'s easy to focus on what\'s wrong with someone else. What need might be underneath this?',
        contempt: 'Strong feelings here. What would it look like to express this differently?',
        defensiveness: 'It\'s natural to protect ourselves. What might they be trying to say underneath their words?',
        stonewalling: 'Sometimes we need to step away. Is there a way to come back to this when it feels safer?',
      };

      alerts.push({
        type: 'pattern',
        message: gentleGottman[gottman.horseman],
        severity: 'low',
      });
    }

    // Maladaptive coping awareness (very gentle)
    const maladaptiveStrategies = analysis.regulationStrategies.filter(s =>
      !EMOTION_REGULATION_PATTERNS[s.strategy].adaptive
    );
    if (maladaptiveStrategies.length >= 2) {
      alerts.push({
        type: 'pattern',
        message: 'It sounds like you\'re working hard to manage some difficult feelings. That makes sense. Are there other things that have helped before?',
        severity: 'low',
      });
    }

    return alerts;
  }

  // ============================================
  // PROFILE UPDATE
  // ============================================

  private updateProfileFromAnalysis(analysis: EntryAnalysis, _entryId: string): void {
    const now = new Date().toISOString();
    this.profile.lastUpdated = now;
    this.profile.entryCount++;

    // Update cognitive distortions
    for (const distortion of analysis.cognitiveDistortions) {
      const existing = this.profile.cognitiveDistortions.find(
        d => d.pattern === distortion.distortion
      );
      if (existing) {
        existing.frequency++;
        existing.lastSeen = now;
        existing.examples = [...existing.examples, ...distortion.matches].slice(-5);
      } else {
        this.profile.cognitiveDistortions.push({
          pattern: distortion.distortion,
          frequency: 1,
          lastSeen: now,
          examples: distortion.matches.slice(0, 3),
        });
      }
    }

    // Update defense mechanisms
    for (const defense of analysis.defenseMechanisms) {
      const existing = this.profile.defenseMechanisms.find(
        d => d.mechanism === defense.mechanism
      );
      if (existing) {
        existing.frequency++;
        existing.lastSeen = now;
      } else {
        this.profile.defenseMechanisms.push({
          mechanism: defense.mechanism,
          frequency: 1,
          lastSeen: now,
        });
      }
    }

    // Update defense level (weighted by frequency)
    this.updateDefenseLevel();

    // Update attachment style
    this.updateAttachmentStyle(analysis.attachmentSignals);

    // Update locus of control
    this.updateLocusOfControl(analysis.locusSignals);

    // Update regulation strategies
    this.updateRegulationStrategies(analysis.regulationStrategies);

    // Update polyvagal state history
    if (analysis.polyvagalState) {
      this.profile.stateHistory.push({
        state: analysis.polyvagalState.state,
        timestamp: now,
      });
      // Keep last 30 states
      this.profile.stateHistory = this.profile.stateHistory.slice(-30);
      this.profile.predominantState = this.calculatePredominantState();
    }

    // Update mindset
    this.updateMindset(analysis.mindsetSignals);

    // Update values
    this.updateValues(analysis.valuesDetected);

    // Update PERMA scores
    this.updatePermaScores(analysis.permaElements);

    // Update Gottman patterns
    this.updateGottmanPatterns(analysis.gottmanSignals);
  }

  private updateDefenseLevel(): void {
    let matureCount = 0;
    let neuroticCount = 0;
    let immatureCount = 0;

    for (const defense of this.profile.defenseMechanisms) {
      const pattern = DEFENSE_MECHANISM_PATTERNS[defense.mechanism];
      const weight = defense.frequency;
      if (pattern.level === 'mature') matureCount += weight;
      else if (pattern.level === 'neurotic') neuroticCount += weight;
      else immatureCount += weight;
    }

    const total = matureCount + neuroticCount + immatureCount;
    if (total === 0) return;

    if (matureCount / total > 0.5) this.profile.defenseLevel = 'mature';
    else if (immatureCount / total > 0.4) this.profile.defenseLevel = 'immature';
    else this.profile.defenseLevel = 'neurotic';
  }

  private updateAttachmentStyle(signals: EntryAnalysis['attachmentSignals']): void {
    // Simple: most frequent style wins, but needs multiple signals for confidence
    const counts: Record<AttachmentStyle, number> = {
      secure: 0, anxious: 0, avoidant: 0, disorganized: 0
    };

    for (const signal of signals) {
      counts[signal.style] += signal.matches.length;
    }

    const entries = Object.entries(counts) as [AttachmentStyle, number][];
    const sorted = entries.sort((a, b) => b[1] - a[1]);

    if (sorted[0][1] > 0) {
      // Slowly update style (weighted average)
      const newStyle = sorted[0][0];
      const newConfidence = Math.min(sorted[0][1] / 5, 1);

      if (newConfidence > this.profile.attachmentConfidence) {
        this.profile.attachmentStyle = newStyle;
        this.profile.attachmentConfidence = newConfidence * 0.7 + this.profile.attachmentConfidence * 0.3;
      }
    }
  }

  private updateLocusOfControl(signals: EntryAnalysis['locusSignals']): void {
    let internalSignals = 0;
    let externalSignals = 0;

    for (const signal of signals) {
      if (signal.type === 'internal') internalSignals += signal.matches.length;
      else externalSignals += signal.matches.length;
    }

    const total = internalSignals + externalSignals;
    if (total === 0) return;

    // Weighted update
    const newInternal = internalSignals / total;
    const newExternal = externalSignals / total;

    this.profile.locusOfControl.internal = this.profile.locusOfControl.internal * 0.8 + newInternal * 0.2;
    this.profile.locusOfControl.external = this.profile.locusOfControl.external * 0.8 + newExternal * 0.2;
  }

  private updateRegulationStrategies(strategies: EntryAnalysis['regulationStrategies']): void {
    for (const strat of strategies) {
      const existing = this.profile.regulationStrategies.find(s => s.strategy === strat.strategy);
      if (existing) {
        existing.frequency++;
      } else {
        this.profile.regulationStrategies.push({
          strategy: strat.strategy,
          frequency: 1,
        });
      }
    }

    // Calculate adaptive ratio
    let adaptive = 0;
    let maladaptive = 0;
    for (const strat of this.profile.regulationStrategies) {
      const pattern = EMOTION_REGULATION_PATTERNS[strat.strategy];
      if (pattern.adaptive) adaptive += strat.frequency;
      else maladaptive += strat.frequency;
    }
    const total = adaptive + maladaptive;
    if (total > 0) {
      this.profile.adaptiveRatio = adaptive / total;
    }
  }

  private calculatePredominantState(): PolyvagalState {
    const recent = this.profile.stateHistory.slice(-10);
    const counts: Record<PolyvagalState, number> = {
      ventral_vagal: 0, sympathetic: 0, dorsal_vagal: 0
    };

    for (const entry of recent) {
      counts[entry.state]++;
    }

    const entries = Object.entries(counts) as [PolyvagalState, number][];
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }

  private updateMindset(signals: EntryAnalysis['mindsetSignals']): void {
    let fixedSignals = 0;
    let growthSignals = 0;

    for (const signal of signals) {
      if (signal.type === 'fixed') fixedSignals += signal.matches.length;
      else growthSignals += signal.matches.length;
    }

    const total = fixedSignals + growthSignals;
    if (total === 0) return;

    const newFixed = fixedSignals / total;
    const newGrowth = growthSignals / total;

    this.profile.mindset.fixed = this.profile.mindset.fixed * 0.8 + newFixed * 0.2;
    this.profile.mindset.growth = this.profile.mindset.growth * 0.8 + newGrowth * 0.2;
  }

  private updateValues(values: EntryAnalysis['valuesDetected']): void {
    // Track value frequencies
    const valueCounts: Partial<Record<SchwartzValue, number>> = {};

    for (const val of values) {
      valueCounts[val.value] = (valueCounts[val.value] || 0) + val.matches.length;
    }

    // Get top 3 values
    const sorted = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sorted.length > 0) {
      this.profile.topValues = sorted.map(([v]) => v as SchwartzValue);
    }
  }

  private updatePermaScores(elements: EntryAnalysis['permaElements']): void {
    // Slight boost for detected elements
    for (const element of elements) {
      const current = this.profile.permaScores[element.element];
      this.profile.permaScores[element.element] = Math.min(1, current * 0.9 + 0.15);
    }

    // Slight decay for non-detected elements
    for (const key of Object.keys(this.profile.permaScores) as PermaElement[]) {
      if (!elements.find(e => e.element === key)) {
        this.profile.permaScores[key] = Math.max(0, this.profile.permaScores[key] * 0.98);
      }
    }
  }

  private updateGottmanPatterns(signals: EntryAnalysis['gottmanSignals']): void {
    for (const signal of signals) {
      const existing = this.profile.gottmanPatterns.find(p => p.horseman === signal.horseman);
      if (existing) {
        existing.frequency++;
      } else {
        this.profile.gottmanPatterns.push({
          horseman: signal.horseman,
          frequency: 1,
        });
      }
    }
  }

  // ============================================
  // COMPRESSED CONTEXT FOR CLAUDE API
  // ============================================

  /**
   * Generate compressed psychological context for Claude API calls.
   * This is the key integration point - psychological understanding
   * informs AI responses.
   */
  async getCompressedContext(): Promise<string> {
    await this.initialize();

    if (this.profile.entryCount === 0) {
      return 'No psychological profile established yet.';
    }

    const lines: string[] = [];
    lines.push('=== PSYCHOLOGICAL PROFILE ===');
    lines.push(`Based on ${this.profile.entryCount} entries\n`);

    // Top cognitive distortions
    const topDistortions = this.profile.cognitiveDistortions
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    if (topDistortions.length > 0) {
      lines.push('THINKING PATTERNS:');
      for (const d of topDistortions) {
        const name = d.pattern.replace(/_/g, ' ');
        lines.push(`- Tends toward ${name} (seen ${d.frequency}x)`);
      }
      lines.push('');
    }

    // Defense level
    lines.push(`COPING STYLE: ${this.profile.defenseLevel} defenses`);
    const topDefenses = this.profile.defenseMechanisms
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 2);
    for (const d of topDefenses) {
      lines.push(`- Uses ${d.mechanism.replace(/_/g, ' ')}`);
    }
    lines.push('');

    // Attachment
    if (this.profile.attachmentConfidence > 0.3) {
      lines.push(`ATTACHMENT: ${this.profile.attachmentStyle} style (${Math.round(this.profile.attachmentConfidence * 100)}% confidence)`);
      lines.push('');
    }

    // Locus of control
    const locusDirection = this.profile.locusOfControl.internal > this.profile.locusOfControl.external
      ? 'internal' : 'external';
    lines.push(`AGENCY: Leans ${locusDirection} locus of control`);
    lines.push('');

    // Mindset
    const mindsetDirection = this.profile.mindset.growth > this.profile.mindset.fixed
      ? 'growth' : 'fixed';
    lines.push(`MINDSET: Leans ${mindsetDirection}`);
    lines.push('');

    // Values
    if (this.profile.topValues.length > 0) {
      lines.push(`CORE VALUES: ${this.profile.topValues.join(', ')}`);
      lines.push('');
    }

    // Nervous system
    lines.push(`NERVOUS SYSTEM: Predominantly ${this.profile.predominantState.replace(/_/g, ' ')}`);
    lines.push('');

    // Emotion regulation
    if (this.profile.regulationStrategies.length > 0) {
      const adaptivePercent = Math.round(this.profile.adaptiveRatio * 100);
      lines.push(`EMOTION REGULATION: ${adaptivePercent}% adaptive strategies`);
      lines.push('');
    }

    // PERMA well-being
    const avgPerma = Object.values(this.profile.permaScores).reduce((a, b) => a + b, 0) / 5;
    lines.push(`WELL-BEING (PERMA): ${Math.round(avgPerma * 100)}% average`);

    // Recommendations for Claude
    lines.push('\n=== COMMUNICATION RECOMMENDATIONS ===');

    if (topDistortions.find(d => d.pattern === 'catastrophizing')) {
      lines.push('- Gently challenge worst-case thinking');
    }
    if (topDistortions.find(d => d.pattern === 'all_or_nothing')) {
      lines.push('- Help find middle ground/nuance');
    }
    if (this.profile.attachmentStyle === 'anxious') {
      lines.push('- Provide extra reassurance and validation');
    }
    if (this.profile.attachmentStyle === 'avoidant') {
      lines.push('- Respect need for space, don\'t push for closeness');
    }
    if (this.profile.defenseLevel === 'immature') {
      lines.push('- Be patient with defenses, don\'t confront directly');
    }
    if (this.profile.mindset.fixed > 0.6) {
      lines.push('- Frame challenges as learning opportunities');
    }
    if (this.profile.predominantState === 'sympathetic') {
      lines.push('- Help with grounding and calming');
    }
    if (this.profile.predominantState === 'dorsal_vagal') {
      lines.push('- Very gentle approach, small steps, validate shutdown');
    }

    return lines.join('\n');
  }

  /**
   * Get full profile (for debugging/insights screen)
   */
  async getProfile(): Promise<PsychologicalProfile> {
    await this.initialize();
    return { ...this.profile };
  }

  /**
   * Reset profile (for testing or user request)
   */
  async resetProfile(): Promise<void> {
    this.profile = DEFAULT_PSYCHOLOGICAL_PROFILE;
    await this.saveProfile();
  }
}

// Export singleton instance
export const psychAnalysisService = new PsychAnalysisService();
