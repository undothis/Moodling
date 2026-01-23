/**
 * Model Version Control Service
 *
 * Git-style version control for AI models with multiple safety layers.
 * Ensures the AI can never get permanently "stuck" in a bad state.
 *
 * Features:
 * - Version history (like git commits)
 * - Branching (experimental vs stable)
 * - Rollback to any previous version
 * - Safety gates before deployment
 * - Automatic rollback triggers
 * - A/B testing before promotion
 * - Drift detection
 * - Full audit trail
 *
 * Safety Philosophy:
 * - NEVER auto-deploy without testing
 * - ALWAYS keep at least 3 previous versions
 * - AUTO-ROLLBACK if quality drops below threshold
 * - REQUIRE human approval for production
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  MODEL_VERSIONS: 'moodleaf_model_versions',
  ACTIVE_MODEL: 'moodleaf_active_model',
  STAGING_MODEL: 'moodleaf_staging_model',
  VERSION_HISTORY: 'moodleaf_version_history',
  SAFETY_CONFIG: 'moodleaf_safety_config',
  AB_TEST_RESULTS: 'moodleaf_ab_test_results',
  ROLLBACK_LOG: 'moodleaf_rollback_log',
  QUALITY_SNAPSHOTS: 'moodleaf_quality_snapshots',
  DEPLOYMENT_GATES: 'moodleaf_deployment_gates',
};

// ============================================
// TYPES
// ============================================

export interface ModelVersion {
  id: string;
  version: string;              // Semantic versioning: "1.2.3"
  name: string;                 // Human-readable: "Added humor insights"
  description: string;

  // Git-like metadata
  parentVersion: string | null; // Previous version (like git parent commit)
  branch: 'main' | 'experimental' | 'hotfix';
  tags: string[];               // e.g., ['stable', 'tested', 'production']

  // Training info
  trainingData: {
    insightIds: string[];       // Which insights trained this version
    insightCount: number;
    categories: string[];       // What categories were included
    dateRange: { from: string; to: string };
  };

  // Model artifacts (paths or references)
  modelPath: string;            // Path to model files
  configPath: string;           // Path to config
  tokenizerPath: string;        // Path to tokenizer

  // Quality metrics at time of creation
  metrics: ModelMetrics;

  // Status
  status: 'draft' | 'testing' | 'staged' | 'production' | 'retired' | 'rolled_back';

  // Timestamps
  createdAt: string;
  testedAt?: string;
  stagedAt?: string;
  deployedAt?: string;
  retiredAt?: string;

  // Safety
  safetyChecks: SafetyCheckResult[];
  humanApproval?: {
    approvedBy: string;
    approvedAt: string;
    notes: string;
  };
}

export interface ModelMetrics {
  // Quality scores (0-100)
  overallQuality: number;
  humanessScore: number;
  empathyScore: number;
  accuracyScore: number;
  safetyScore: number;

  // Comparison to previous
  qualityDelta: number;         // +5 = 5% better than previous

  // A/B test results (if available)
  abTestWinRate?: number;       // % of times this beat previous version
  abTestSampleSize?: number;

  // Performance
  avgResponseTime: number;      // ms
  tokensPerResponse: number;
}

export interface SafetyCheckResult {
  checkName: string;
  passed: boolean;
  score: number;
  threshold: number;
  message: string;
  checkedAt: string;
}

export interface DeploymentGate {
  name: string;
  description: string;
  required: boolean;
  type: 'automatic' | 'manual';
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  result?: any;
  checkedAt?: string;
}

export interface ABTestSession {
  id: string;
  versionA: string;             // Control (current production)
  versionB: string;             // Challenger (staged version)
  startedAt: string;
  completedAt?: string;

  comparisons: ABComparison[];

  results: {
    versionAWins: number;
    versionBWins: number;
    ties: number;
    totalComparisons: number;
    winRate: number;            // % for version B
    confidence: number;         // Statistical confidence
  };

  recommendation: 'promote' | 'reject' | 'needs_more_data';
}

export interface ABComparison {
  id: string;
  prompt: string;
  responseA: string;
  responseB: string;
  winner: 'A' | 'B' | 'tie';
  reason?: string;
  ratedBy: 'human' | 'auto';
  ratedAt: string;
}

export interface RollbackEvent {
  id: string;
  fromVersion: string;
  toVersion: string;
  reason: 'manual' | 'auto_quality' | 'auto_safety' | 'auto_drift';
  trigger: string;              // What triggered the rollback
  details: string;
  performedAt: string;
  performedBy: 'system' | 'human';
}

export interface QualitySnapshot {
  id: string;
  versionId: string;
  timestamp: string;
  metrics: ModelMetrics;
  sampleSize: number;           // How many interactions measured
}

export interface SafetyConfig {
  // Auto-rollback thresholds
  autoRollbackEnabled: boolean;
  minQualityScore: number;      // Rollback if below this
  minSafetyScore: number;       // Rollback if below this
  maxQualityDrop: number;       // Rollback if drops more than this %

  // Deployment gates
  requireABTest: boolean;
  minABTestSamples: number;
  minABWinRate: number;         // Must win this % to promote
  requireHumanApproval: boolean;

  // Monitoring
  monitoringWindowHours: number;
  snapshotIntervalMinutes: number;
  driftDetectionEnabled: boolean;
  driftThreshold: number;       // % change that triggers alert

  // Retention
  minVersionsToKeep: number;    // Never delete below this
  maxVersionsToKeep: number;
}

// ============================================
// DEFAULT SAFETY CONFIG
// Conservative defaults - safety first
// ============================================

const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  // Auto-rollback thresholds
  autoRollbackEnabled: true,
  minQualityScore: 60,          // Rollback if quality drops below 60%
  minSafetyScore: 80,           // Rollback if safety drops below 80%
  maxQualityDrop: 15,           // Rollback if quality drops more than 15%

  // Deployment gates
  requireABTest: true,
  minABTestSamples: 20,         // At least 20 A/B comparisons
  minABWinRate: 50,             // Must win at least 50% to promote
  requireHumanApproval: true,   // Human must approve for production

  // Monitoring
  monitoringWindowHours: 24,
  snapshotIntervalMinutes: 60,
  driftDetectionEnabled: true,
  driftThreshold: 10,           // Alert if metrics drift 10%+

  // Retention
  minVersionsToKeep: 5,         // Always keep last 5 versions
  maxVersionsToKeep: 20,
};

// ============================================
// VERSION MANAGEMENT
// ============================================

/**
 * Create a new model version (like git commit)
 */
export async function createModelVersion(
  params: {
    name: string;
    description: string;
    parentVersion: string | null;
    branch?: 'main' | 'experimental' | 'hotfix';
    trainingData: ModelVersion['trainingData'];
    modelPath: string;
    configPath: string;
    tokenizerPath: string;
    initialMetrics: Partial<ModelMetrics>;
  }
): Promise<ModelVersion> {
  const versions = await getAllVersions();

  // Generate version number
  const parentVer = params.parentVersion
    ? versions.find(v => v.id === params.parentVersion)
    : null;
  const newVersionNum = generateNextVersion(parentVer?.version || '0.0.0', params.branch || 'main');

  // Calculate quality delta if parent exists
  const qualityDelta = parentVer
    ? (params.initialMetrics.overallQuality || 0) - parentVer.metrics.overallQuality
    : 0;

  const version: ModelVersion = {
    id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    version: newVersionNum,
    name: params.name,
    description: params.description,
    parentVersion: params.parentVersion,
    branch: params.branch || 'main',
    tags: [],
    trainingData: params.trainingData,
    modelPath: params.modelPath,
    configPath: params.configPath,
    tokenizerPath: params.tokenizerPath,
    metrics: {
      overallQuality: params.initialMetrics.overallQuality || 0,
      humanessScore: params.initialMetrics.humanessScore || 0,
      empathyScore: params.initialMetrics.empathyScore || 0,
      accuracyScore: params.initialMetrics.accuracyScore || 0,
      safetyScore: params.initialMetrics.safetyScore || 100,
      qualityDelta,
      avgResponseTime: params.initialMetrics.avgResponseTime || 0,
      tokensPerResponse: params.initialMetrics.tokensPerResponse || 0,
    },
    status: 'draft',
    createdAt: new Date().toISOString(),
    safetyChecks: [],
  };

  versions.push(version);
  await AsyncStorage.setItem(STORAGE_KEYS.MODEL_VERSIONS, JSON.stringify(versions));

  // Log to history
  await addToHistory({
    action: 'create',
    versionId: version.id,
    version: version.version,
    details: `Created version ${version.version}: ${version.name}`,
    timestamp: new Date().toISOString(),
  });

  return version;
}

/**
 * Generate next version number based on branch
 */
function generateNextVersion(current: string, branch: string): string {
  const parts = current.split('.').map(Number);

  switch (branch) {
    case 'main':
      // Minor version bump: 1.2.3 -> 1.3.0
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'experimental':
      // Patch version bump: 1.2.3 -> 1.2.4
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    case 'hotfix':
      // Patch version bump with hotfix tag
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}

/**
 * Get all model versions
 */
export async function getAllVersions(): Promise<ModelVersion[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_VERSIONS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get version by ID
 */
export async function getVersion(id: string): Promise<ModelVersion | null> {
  const versions = await getAllVersions();
  return versions.find(v => v.id === id) || null;
}

/**
 * Get current production version
 */
export async function getProductionVersion(): Promise<ModelVersion | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODEL);
  if (!stored) return null;
  return getVersion(stored);
}

/**
 * Get staged version (ready for testing)
 */
export async function getStagedVersion(): Promise<ModelVersion | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.STAGING_MODEL);
  if (!stored) return null;
  return getVersion(stored);
}

/**
 * Get version history (like git log)
 */
export async function getVersionHistory(branch?: string): Promise<ModelVersion[]> {
  const versions = await getAllVersions();
  let filtered = branch ? versions.filter(v => v.branch === branch) : versions;
  return filtered.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Tag a version (like git tag)
 */
export async function tagVersion(versionId: string, tag: string): Promise<void> {
  const versions = await getAllVersions();
  const index = versions.findIndex(v => v.id === versionId);

  if (index !== -1 && !versions[index].tags.includes(tag)) {
    versions[index].tags.push(tag);
    await AsyncStorage.setItem(STORAGE_KEYS.MODEL_VERSIONS, JSON.stringify(versions));

    await addToHistory({
      action: 'tag',
      versionId,
      version: versions[index].version,
      details: `Tagged as '${tag}'`,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================
// DEPLOYMENT PIPELINE
// ============================================

/**
 * Stage a version for testing (like git staging)
 */
export async function stageVersion(versionId: string): Promise<{ success: boolean; message: string }> {
  const version = await getVersion(versionId);
  if (!version) {
    return { success: false, message: 'Version not found' };
  }

  // Run initial safety checks
  const safetyResults = await runSafetyChecks(version);
  const allPassed = safetyResults.every(r => r.passed);

  if (!allPassed) {
    const failed = safetyResults.filter(r => !r.passed);
    return {
      success: false,
      message: `Safety checks failed: ${failed.map(f => f.checkName).join(', ')}`
    };
  }

  // Update version status
  await updateVersionStatus(versionId, 'staged');
  await AsyncStorage.setItem(STORAGE_KEYS.STAGING_MODEL, versionId);

  await addToHistory({
    action: 'stage',
    versionId,
    version: version.version,
    details: `Staged for testing`,
    timestamp: new Date().toISOString(),
  });

  return { success: true, message: `Version ${version.version} staged for testing` };
}

/**
 * Run safety checks on a version
 */
export async function runSafetyChecks(version: ModelVersion): Promise<SafetyCheckResult[]> {
  const config = await getSafetyConfig();
  const results: SafetyCheckResult[] = [];
  const now = new Date().toISOString();

  // Check 1: Minimum quality score
  results.push({
    checkName: 'Minimum Quality',
    passed: version.metrics.overallQuality >= config.minQualityScore,
    score: version.metrics.overallQuality,
    threshold: config.minQualityScore,
    message: version.metrics.overallQuality >= config.minQualityScore
      ? 'Quality score meets minimum threshold'
      : `Quality score ${version.metrics.overallQuality} below minimum ${config.minQualityScore}`,
    checkedAt: now,
  });

  // Check 2: Safety score
  results.push({
    checkName: 'Safety Score',
    passed: version.metrics.safetyScore >= config.minSafetyScore,
    score: version.metrics.safetyScore,
    threshold: config.minSafetyScore,
    message: version.metrics.safetyScore >= config.minSafetyScore
      ? 'Safety score meets minimum threshold'
      : `Safety score ${version.metrics.safetyScore} below minimum ${config.minSafetyScore}`,
    checkedAt: now,
  });

  // Check 3: Quality regression (if has parent)
  if (version.parentVersion) {
    const parent = await getVersion(version.parentVersion);
    if (parent) {
      const qualityDrop = parent.metrics.overallQuality - version.metrics.overallQuality;
      results.push({
        checkName: 'Quality Regression',
        passed: qualityDrop <= config.maxQualityDrop,
        score: -qualityDrop, // Negative because drop is bad
        threshold: -config.maxQualityDrop,
        message: qualityDrop <= config.maxQualityDrop
          ? `Quality change: ${version.metrics.qualityDelta > 0 ? '+' : ''}${version.metrics.qualityDelta}%`
          : `Quality dropped ${qualityDrop}% (max allowed: ${config.maxQualityDrop}%)`,
        checkedAt: now,
      });
    }
  }

  // Check 4: Has training data
  results.push({
    checkName: 'Training Data',
    passed: version.trainingData.insightCount > 0,
    score: version.trainingData.insightCount,
    threshold: 1,
    message: version.trainingData.insightCount > 0
      ? `Trained on ${version.trainingData.insightCount} insights`
      : 'No training data associated',
    checkedAt: now,
  });

  // Save results to version
  const versions = await getAllVersions();
  const index = versions.findIndex(v => v.id === version.id);
  if (index !== -1) {
    versions[index].safetyChecks = results;
    await AsyncStorage.setItem(STORAGE_KEYS.MODEL_VERSIONS, JSON.stringify(versions));
  }

  return results;
}

/**
 * Get deployment gates status for a version
 */
export async function getDeploymentGates(versionId: string): Promise<DeploymentGate[]> {
  const config = await getSafetyConfig();
  const version = await getVersion(versionId);
  if (!version) return [];

  const gates: DeploymentGate[] = [];

  // Gate 1: Safety checks passed
  const safetyPassed = version.safetyChecks.length > 0 &&
                       version.safetyChecks.every(c => c.passed);
  gates.push({
    name: 'Safety Checks',
    description: 'All automated safety checks must pass',
    required: true,
    type: 'automatic',
    status: version.safetyChecks.length === 0 ? 'pending' : (safetyPassed ? 'passed' : 'failed'),
    result: version.safetyChecks,
    checkedAt: version.safetyChecks[0]?.checkedAt,
  });

  // Gate 2: A/B Testing
  if (config.requireABTest) {
    const abResults = await getABTestResults(versionId);
    const abPassed = abResults &&
                     abResults.results.totalComparisons >= config.minABTestSamples &&
                     abResults.results.winRate >= config.minABWinRate;
    gates.push({
      name: 'A/B Testing',
      description: `Must win ${config.minABWinRate}%+ of ${config.minABTestSamples}+ comparisons`,
      required: true,
      type: 'automatic',
      status: !abResults ? 'pending' : (abPassed ? 'passed' : 'failed'),
      result: abResults?.results,
      checkedAt: abResults?.completedAt,
    });
  }

  // Gate 3: Human Approval
  if (config.requireHumanApproval) {
    gates.push({
      name: 'Human Approval',
      description: 'A human must review and approve this version',
      required: true,
      type: 'manual',
      status: version.humanApproval ? 'passed' : 'pending',
      result: version.humanApproval,
      checkedAt: version.humanApproval?.approvedAt,
    });
  }

  // Gate 4: Staged period (optional)
  const stagedDuration = version.stagedAt
    ? Date.now() - new Date(version.stagedAt).getTime()
    : 0;
  const minStagedHours = 1; // At least 1 hour in staging
  gates.push({
    name: 'Staging Period',
    description: 'Must be staged for at least 1 hour',
    required: false,
    type: 'automatic',
    status: stagedDuration >= minStagedHours * 60 * 60 * 1000 ? 'passed' : 'pending',
    result: { stagedHours: Math.round(stagedDuration / (60 * 60 * 1000) * 10) / 10 },
  });

  return gates;
}

/**
 * Promote staged version to production
 */
export async function promoteToProduction(
  versionId: string,
  approvedBy?: string,
  notes?: string
): Promise<{ success: boolean; message: string; rollbackVersion?: string }> {
  const version = await getVersion(versionId);
  if (!version) {
    return { success: false, message: 'Version not found' };
  }

  // Check all gates
  const gates = await getDeploymentGates(versionId);
  const requiredGates = gates.filter(g => g.required);
  const allGatesPassed = requiredGates.every(g => g.status === 'passed');

  if (!allGatesPassed) {
    const failedGates = requiredGates.filter(g => g.status !== 'passed');
    return {
      success: false,
      message: `Deployment gates not passed: ${failedGates.map(g => g.name).join(', ')}`,
    };
  }

  // Get current production for potential rollback
  const currentProd = await getProductionVersion();

  // Update human approval if provided
  if (approvedBy) {
    await updateVersion(versionId, {
      humanApproval: {
        approvedBy,
        approvedAt: new Date().toISOString(),
        notes: notes || '',
      },
    });
  }

  // Retire current production
  if (currentProd) {
    await updateVersionStatus(currentProd.id, 'retired');
  }

  // Promote new version
  await updateVersionStatus(versionId, 'production');
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL, versionId);
  await AsyncStorage.removeItem(STORAGE_KEYS.STAGING_MODEL);
  await tagVersion(versionId, 'production');

  await addToHistory({
    action: 'promote',
    versionId,
    version: version.version,
    details: `Promoted to production${approvedBy ? ` by ${approvedBy}` : ''}`,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Version ${version.version} is now in production`,
    rollbackVersion: currentProd?.id,
  };
}

// ============================================
// ROLLBACK
// ============================================

/**
 * Rollback to a previous version
 */
export async function rollback(
  toVersionId: string,
  reason: RollbackEvent['reason'],
  trigger: string,
  performedBy: 'system' | 'human' = 'human'
): Promise<{ success: boolean; message: string }> {
  const toVersion = await getVersion(toVersionId);
  if (!toVersion) {
    return { success: false, message: 'Target version not found' };
  }

  const currentProd = await getProductionVersion();
  if (!currentProd) {
    return { success: false, message: 'No current production version to rollback from' };
  }

  if (currentProd.id === toVersionId) {
    return { success: false, message: 'Already on this version' };
  }

  // Mark current as rolled back
  await updateVersionStatus(currentProd.id, 'rolled_back');

  // Restore target version
  await updateVersionStatus(toVersionId, 'production');
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL, toVersionId);

  // Log rollback event
  const rollbackEvent: RollbackEvent = {
    id: `rollback_${Date.now()}`,
    fromVersion: currentProd.id,
    toVersion: toVersionId,
    reason,
    trigger,
    details: `Rolled back from ${currentProd.version} to ${toVersion.version}`,
    performedAt: new Date().toISOString(),
    performedBy,
  };

  const rollbackLog = await getRollbackLog();
  rollbackLog.push(rollbackEvent);
  await AsyncStorage.setItem(STORAGE_KEYS.ROLLBACK_LOG, JSON.stringify(rollbackLog));

  await addToHistory({
    action: 'rollback',
    versionId: toVersionId,
    version: toVersion.version,
    details: `Rolled back: ${trigger}`,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Rolled back to version ${toVersion.version}`,
  };
}

/**
 * Check if auto-rollback should be triggered
 */
export async function checkAutoRollback(currentMetrics: ModelMetrics): Promise<{
  shouldRollback: boolean;
  reason?: string;
  targetVersion?: string;
}> {
  const config = await getSafetyConfig();

  if (!config.autoRollbackEnabled) {
    return { shouldRollback: false };
  }

  const currentProd = await getProductionVersion();
  if (!currentProd) {
    return { shouldRollback: false };
  }

  // Check quality threshold
  if (currentMetrics.overallQuality < config.minQualityScore) {
    const previousVersions = await getVersionHistory();
    const rollbackTarget = previousVersions.find(
      v => v.id !== currentProd.id &&
           v.status !== 'rolled_back' &&
           v.metrics.overallQuality >= config.minQualityScore
    );

    if (rollbackTarget) {
      return {
        shouldRollback: true,
        reason: `Quality dropped to ${currentMetrics.overallQuality}% (min: ${config.minQualityScore}%)`,
        targetVersion: rollbackTarget.id,
      };
    }
  }

  // Check safety threshold
  if (currentMetrics.safetyScore < config.minSafetyScore) {
    const previousVersions = await getVersionHistory();
    const rollbackTarget = previousVersions.find(
      v => v.id !== currentProd.id &&
           v.status !== 'rolled_back' &&
           v.metrics.safetyScore >= config.minSafetyScore
    );

    if (rollbackTarget) {
      return {
        shouldRollback: true,
        reason: `Safety score dropped to ${currentMetrics.safetyScore}% (min: ${config.minSafetyScore}%)`,
        targetVersion: rollbackTarget.id,
      };
    }
  }

  // Check for sudden quality drop
  const qualityDrop = currentProd.metrics.overallQuality - currentMetrics.overallQuality;
  if (qualityDrop > config.maxQualityDrop) {
    const previousVersions = await getVersionHistory();
    const rollbackTarget = previousVersions.find(
      v => v.id !== currentProd.id && v.status !== 'rolled_back'
    );

    if (rollbackTarget) {
      return {
        shouldRollback: true,
        reason: `Quality dropped ${qualityDrop}% (max allowed: ${config.maxQualityDrop}%)`,
        targetVersion: rollbackTarget.id,
      };
    }
  }

  return { shouldRollback: false };
}

/**
 * Get rollback log
 */
export async function getRollbackLog(): Promise<RollbackEvent[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.ROLLBACK_LOG);
  return stored ? JSON.parse(stored) : [];
}

// ============================================
// A/B TESTING
// ============================================

/**
 * Start an A/B test session
 */
export async function startABTest(
  challengerVersionId: string
): Promise<ABTestSession | null> {
  const challenger = await getVersion(challengerVersionId);
  const production = await getProductionVersion();

  if (!challenger || !production) {
    return null;
  }

  const session: ABTestSession = {
    id: `abtest_${Date.now()}`,
    versionA: production.id,
    versionB: challenger.id,
    startedAt: new Date().toISOString(),
    comparisons: [],
    results: {
      versionAWins: 0,
      versionBWins: 0,
      ties: 0,
      totalComparisons: 0,
      winRate: 0,
      confidence: 0,
    },
    recommendation: 'needs_more_data',
  };

  await AsyncStorage.setItem(`${STORAGE_KEYS.AB_TEST_RESULTS}_${challengerVersionId}`, JSON.stringify(session));

  return session;
}

/**
 * Record an A/B comparison result
 */
export async function recordABComparison(
  versionId: string,
  comparison: Omit<ABComparison, 'id' | 'ratedAt'>
): Promise<void> {
  const stored = await AsyncStorage.getItem(`${STORAGE_KEYS.AB_TEST_RESULTS}_${versionId}`);
  if (!stored) return;

  const session: ABTestSession = JSON.parse(stored);
  const config = await getSafetyConfig();

  const newComparison: ABComparison = {
    ...comparison,
    id: `comp_${Date.now()}`,
    ratedAt: new Date().toISOString(),
  };

  session.comparisons.push(newComparison);

  // Update results
  if (comparison.winner === 'A') session.results.versionAWins++;
  else if (comparison.winner === 'B') session.results.versionBWins++;
  else session.results.ties++;

  session.results.totalComparisons = session.comparisons.length;
  session.results.winRate = session.results.totalComparisons > 0
    ? Math.round((session.results.versionBWins / session.results.totalComparisons) * 100)
    : 0;

  // Calculate confidence (simplified)
  session.results.confidence = Math.min(
    session.results.totalComparisons / config.minABTestSamples * 100,
    100
  );

  // Update recommendation
  if (session.results.totalComparisons >= config.minABTestSamples) {
    session.completedAt = new Date().toISOString();
    session.recommendation = session.results.winRate >= config.minABWinRate ? 'promote' : 'reject';
  }

  await AsyncStorage.setItem(`${STORAGE_KEYS.AB_TEST_RESULTS}_${versionId}`, JSON.stringify(session));
}

/**
 * Get A/B test results for a version
 */
export async function getABTestResults(versionId: string): Promise<ABTestSession | null> {
  const stored = await AsyncStorage.getItem(`${STORAGE_KEYS.AB_TEST_RESULTS}_${versionId}`);
  return stored ? JSON.parse(stored) : null;
}

// ============================================
// DRIFT DETECTION
// ============================================

/**
 * Record a quality snapshot for drift detection
 */
export async function recordQualitySnapshot(
  versionId: string,
  metrics: ModelMetrics,
  sampleSize: number
): Promise<void> {
  const snapshots = await getQualitySnapshots(versionId);

  const snapshot: QualitySnapshot = {
    id: `snapshot_${Date.now()}`,
    versionId,
    timestamp: new Date().toISOString(),
    metrics,
    sampleSize,
  };

  snapshots.push(snapshot);

  // Keep last 100 snapshots per version
  const trimmed = snapshots.slice(-100);
  await AsyncStorage.setItem(`${STORAGE_KEYS.QUALITY_SNAPSHOTS}_${versionId}`, JSON.stringify(trimmed));
}

/**
 * Get quality snapshots for drift analysis
 */
export async function getQualitySnapshots(versionId: string): Promise<QualitySnapshot[]> {
  const stored = await AsyncStorage.getItem(`${STORAGE_KEYS.QUALITY_SNAPSHOTS}_${versionId}`);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Detect quality drift
 */
export async function detectDrift(versionId: string): Promise<{
  driftDetected: boolean;
  driftAmount: number;
  direction: 'improving' | 'degrading' | 'stable';
  alert?: string;
}> {
  const config = await getSafetyConfig();
  const snapshots = await getQualitySnapshots(versionId);

  if (snapshots.length < 5) {
    return { driftDetected: false, driftAmount: 0, direction: 'stable' };
  }

  // Compare recent vs older snapshots
  const recent = snapshots.slice(-5);
  const older = snapshots.slice(-10, -5);

  const recentAvg = recent.reduce((sum, s) => sum + s.metrics.overallQuality, 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + s.metrics.overallQuality, 0) / older.length;

  const driftAmount = recentAvg - olderAvg;
  const driftDetected = Math.abs(driftAmount) >= config.driftThreshold;
  const direction = driftAmount > 0 ? 'improving' : driftAmount < 0 ? 'degrading' : 'stable';

  let alert: string | undefined;
  if (driftDetected && direction === 'degrading') {
    alert = `Quality drifting down: ${Math.abs(driftAmount).toFixed(1)}% decrease detected`;
  }

  return { driftDetected, driftAmount, direction, alert };
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * Get safety configuration
 */
export async function getSafetyConfig(): Promise<SafetyConfig> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAFETY_CONFIG);
  return stored ? { ...DEFAULT_SAFETY_CONFIG, ...JSON.parse(stored) } : DEFAULT_SAFETY_CONFIG;
}

/**
 * Update safety configuration
 */
export async function updateSafetyConfig(updates: Partial<SafetyConfig>): Promise<void> {
  const current = await getSafetyConfig();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.SAFETY_CONFIG, JSON.stringify(updated));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updateVersionStatus(versionId: string, status: ModelVersion['status']): Promise<void> {
  const versions = await getAllVersions();
  const index = versions.findIndex(v => v.id === versionId);

  if (index !== -1) {
    versions[index].status = status;

    // Update timestamp based on status
    const now = new Date().toISOString();
    switch (status) {
      case 'testing': versions[index].testedAt = now; break;
      case 'staged': versions[index].stagedAt = now; break;
      case 'production': versions[index].deployedAt = now; break;
      case 'retired': versions[index].retiredAt = now; break;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MODEL_VERSIONS, JSON.stringify(versions));
  }
}

async function updateVersion(versionId: string, updates: Partial<ModelVersion>): Promise<void> {
  const versions = await getAllVersions();
  const index = versions.findIndex(v => v.id === versionId);

  if (index !== -1) {
    versions[index] = { ...versions[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.MODEL_VERSIONS, JSON.stringify(versions));
  }
}

interface HistoryEntry {
  action: string;
  versionId: string;
  version: string;
  details: string;
  timestamp: string;
}

async function addToHistory(entry: HistoryEntry): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.VERSION_HISTORY);
  const history: HistoryEntry[] = stored ? JSON.parse(stored) : [];

  history.unshift(entry);

  // Keep last 500 entries
  const trimmed = history.slice(0, 500);
  await AsyncStorage.setItem(STORAGE_KEYS.VERSION_HISTORY, JSON.stringify(trimmed));
}

/**
 * Get version history log
 */
export async function getHistoryLog(): Promise<HistoryEntry[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.VERSION_HISTORY);
  return stored ? JSON.parse(stored) : [];
}

// ============================================
// CLEANUP
// ============================================

/**
 * Clean up old versions (respecting retention policy)
 */
export async function cleanupOldVersions(): Promise<{ deleted: number; kept: number }> {
  const config = await getSafetyConfig();
  const versions = await getAllVersions();

  // Never delete production or staged
  const protectedStatuses = ['production', 'staged', 'testing'];

  // Sort by creation date, oldest first
  const sorted = [...versions].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Determine which to keep
  const toKeep: ModelVersion[] = [];
  const toDelete: ModelVersion[] = [];

  for (const version of sorted) {
    if (protectedStatuses.includes(version.status)) {
      toKeep.push(version);
    } else if (toKeep.length < config.minVersionsToKeep) {
      toKeep.push(version);
    } else if (versions.length - toDelete.length > config.maxVersionsToKeep) {
      toDelete.push(version);
    } else {
      toKeep.push(version);
    }
  }

  // Save kept versions
  await AsyncStorage.setItem(STORAGE_KEYS.MODEL_VERSIONS, JSON.stringify(toKeep));

  return { deleted: toDelete.length, kept: toKeep.length };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Version management
  createModelVersion,
  getAllVersions,
  getVersion,
  getVersionHistory,
  tagVersion,
  getProductionVersion,
  getStagedVersion,

  // Deployment pipeline
  stageVersion,
  runSafetyChecks,
  getDeploymentGates,
  promoteToProduction,

  // Rollback
  rollback,
  checkAutoRollback,
  getRollbackLog,

  // A/B Testing
  startABTest,
  recordABComparison,
  getABTestResults,

  // Drift detection
  recordQualitySnapshot,
  getQualitySnapshots,
  detectDrift,

  // Configuration
  getSafetyConfig,
  updateSafetyConfig,

  // History
  getHistoryLog,

  // Cleanup
  cleanupOldVersions,
};
