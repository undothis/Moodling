/**
 * API client for Training Studio backend
 */

const API_BASE = '/api';

export interface Channel {
  id: string;
  channel_id: string;
  name: string;
  url: string;
  category: string;
  trust_level: string;
  enabled: boolean;
  videos_processed: number;
  insights_extracted: number;
  last_processed: string | null;
}

export interface Video {
  id: string;
  video_id: string;
  channel_id: string;
  title: string;
  description: string;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  thumbnail_url: string | null;
}

export interface ComponentStatus {
  status: 'pending' | 'running' | 'ok' | 'warning' | 'error' | 'skipped';
  message: string;
}

export interface ProcessingJob {
  job_id: string;
  video_id: string;
  status: string;
  progress: number;
  current_step: string;
  error_message: string | null;
  insights_count: number;
  completed_at: string | null;
  component_status?: Record<string, ComponentStatus>;
  aliveness_scores?: Record<string, number>;
}

export interface Insight {
  id: string;
  video_id: string;
  title: string;
  insight: string;
  category: string;
  coaching_implication: string;
  quality_score: number;
  specificity_score: number;
  actionability_score: number;
  safety_score: number;
  novelty_score: number;
  confidence: number;
  status: string;
  flagged_for_review: boolean;
  created_at: string;
}

export interface Statistics {
  total_videos_processed: number;
  total_hours_analyzed: number;
  total_insights: number;
  approved_insights: number;
  pending_insights: number;
  rejected_insights: number;
  category_distribution: Record<string, number>;
}

// API Functions

export async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch(`${API_BASE}/channels`);
  if (!res.ok) throw new Error('Failed to fetch channels');
  return res.json();
}

export async function addChannel(data: {
  url: string;
  category: string;
  trust_level: string;
  extraction_categories: string[];
}): Promise<{ success: boolean; channel: Channel }> {
  const res = await fetch(`${API_BASE}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add channel');
  return res.json();
}

export async function deleteChannel(channelId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/channels/${channelId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete channel');
}

export async function refreshChannel(channelId: string): Promise<{
  success: boolean;
  channel: { id: string; name: string; channel_id: string };
  message: string;
}> {
  const res = await fetch(`${API_BASE}/channels/${channelId}/refresh`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to refresh channel');
  return res.json();
}

export async function fetchChannelVideos(
  channelId: string,
  maxVideos: number = 20,
  strategy: string = 'balanced'
): Promise<{ channel_id: string; videos: Video[] }> {
  const res = await fetch(
    `${API_BASE}/channels/${channelId}/videos?max_videos=${maxVideos}&strategy=${strategy}`
  );
  if (!res.ok) throw new Error('Failed to fetch videos');
  return res.json();
}

export async function processVideo(
  videoUrl: string,
  options: { skipFacial?: boolean; skipProsody?: boolean } = {}
): Promise<{ job_id: string; video_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_url: videoUrl,
      skip_facial: options.skipFacial ?? false,
      skip_prosody: options.skipProsody ?? false,
    }),
  });
  if (!res.ok) throw new Error('Failed to start processing');
  return res.json();
}

export async function processVideoSimple(
  videoUrl: string,
  options: { autoApprove?: boolean } = {}
): Promise<{ job_id: string; video_id: string; status: string; mode: string }> {
  const res = await fetch(`${API_BASE}/process-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_url: videoUrl,
      auto_approve: options.autoApprove ?? false,
    }),
  });
  if (!res.ok) throw new Error('Failed to start simple processing');
  return res.json();
}

export async function fetchJobStatus(jobId: string): Promise<ProcessingJob> {
  const res = await fetch(`${API_BASE}/process/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch job status');
  return res.json();
}

export async function fetchJobs(): Promise<ProcessingJob[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function cancelJob(jobId: string): Promise<{ message: string; job_id?: string; status?: string }> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to cancel job');
  return res.json();
}

export async function removeJob(jobId: string): Promise<{ message: string; job_id?: string }> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove job');
  return res.json();
}

export async function fetchInsights(
  status?: string,
  category?: string,
  limit: number = 50
): Promise<Insight[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (category) params.set('category', category);
  params.set('limit', limit.toString());

  const res = await fetch(`${API_BASE}/insights?${params}`);
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
}

export async function reviewInsight(
  insightId: string,
  action: 'approve' | 'reject',
  notes?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/insights/${insightId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ insight_id: insightId, action, notes }),
  });
  if (!res.ok) throw new Error('Failed to review insight');
}

export async function deleteInsight(insightId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/insights/${insightId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete insight');
}

export async function fetchStatistics(): Promise<Statistics> {
  const res = await fetch(`${API_BASE}/statistics`);
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

export async function exportData(
  format: 'alpaca' | 'jsonl' | 'raw' = 'alpaca',
  status: string = 'approved'
): Promise<{ format: string; count: number; data: any[] }> {
  const res = await fetch(`${API_BASE}/export?format=${format}&status=${status}`);
  if (!res.ok) throw new Error('Failed to export data');
  return res.json();
}

export async function fetchCategories(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchRecommendedChannels(): Promise<
  { name: string; category: string; url: string }[]
> {
  const res = await fetch(`${API_BASE}/recommended-channels`);
  if (!res.ok) throw new Error('Failed to fetch recommended channels');
  return res.json();
}

export async function batchApproveInsights(
  minQuality: number = 85
): Promise<{ success: boolean; approved_count: number; total_pending: number }> {
  const res = await fetch(`${API_BASE}/insights/batch-approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ min_quality: minQuality }),
  });
  if (!res.ok) throw new Error('Failed to batch approve');
  return res.json();
}

export async function setApiKey(apiKey: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/config/api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) throw new Error('Failed to set API key');
  return res.json();
}

export async function getApiKeyStatus(): Promise<{
  configured: boolean;
  masked_key: string | null;
}> {
  const res = await fetch(`${API_BASE}/config/api-key-status`);
  if (!res.ok) throw new Error('Failed to get API key status');
  return res.json();
}

// HuggingFace Token
export async function setHuggingFaceToken(token: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/config/huggingface-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('Failed to set HuggingFace token');
  return res.json();
}

export async function getHuggingFaceStatus(): Promise<{
  configured: boolean;
  masked_token: string | null;
}> {
  const res = await fetch(`${API_BASE}/config/huggingface-status`);
  if (!res.ok) throw new Error('Failed to get HuggingFace status');
  return res.json();
}

export interface DiagnosticResult {
  status: 'ok' | 'warning' | 'error';
  message: string;
  version?: string;
  note?: string;
  key_preview?: string;
}

export interface DiagnosticsResponse {
  summary: {
    ok: number;
    warnings: number;
    errors: number;
    ready_for_simple_mode: boolean;
    ready_for_full_mode: boolean;
  };
  components: Record<string, DiagnosticResult>;
}

export async function runDiagnostics(): Promise<DiagnosticsResponse> {
  const res = await fetch(`${API_BASE}/diagnostics`);
  if (!res.ok) throw new Error('Failed to run diagnostics');
  return res.json();
}

// Tuning Dashboard APIs
export interface ChannelStats {
  channel_id: string;
  channel_name: string;
  channel_url: string;
  influence_weight: number;
  include_in_training: boolean;
  trust_level: string;
  total_insights: number;
  approved_insights: number;
  pending_insights: number;
  rejected_insights: number;
  avg_quality: number;
  avg_safety: number;
  avg_confidence: number;
  category_distribution: Record<string, number>;
  videos_processed: number;
}

export async function fetchChannelStats(): Promise<{ channels: ChannelStats[] }> {
  const res = await fetch(`${API_BASE}/tuning/channels`);
  if (!res.ok) throw new Error('Failed to fetch channel stats');
  return res.json();
}

export async function updateChannelWeight(
  channelId: string,
  weight: number,
  includeInTraining?: boolean,
  notes?: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/tuning/channels/${channelId}/weight`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      influence_weight: weight,
      include_in_training: includeInTraining,
      notes,
    }),
  });
  if (!res.ok) throw new Error('Failed to update channel weight');
  return res.json();
}

export async function deleteChannelInsights(
  channelId: string
): Promise<{ success: boolean; deleted_count: number }> {
  const res = await fetch(`${API_BASE}/tuning/channels/${channelId}/insights`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete channel insights');
  return res.json();
}

export async function deleteVideoInsights(
  videoId: string
): Promise<{ success: boolean; deleted_count: number }> {
  const res = await fetch(`${API_BASE}/tuning/videos/${videoId}/insights`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete video insights');
  return res.json();
}

export interface SourceToken {
  token: string;
  channel_id: string;
  video_id: string;
  insight_count: number;
  categories: string[];
}

export async function fetchSourceTokens(): Promise<{ source_tokens: SourceToken[] }> {
  const res = await fetch(`${API_BASE}/tuning/source-tokens`);
  if (!res.ok) throw new Error('Failed to fetch source tokens');
  return res.json();
}

export async function fetchAnalysisStats(): Promise<any> {
  const res = await fetch(`${API_BASE}/stats/analysis`);
  if (!res.ok) throw new Error('Failed to fetch analysis stats');
  return res.json();
}

export interface AIChannelRecommendation {
  name: string;
  url: string;
  category: string;
  channel_id?: string;
  description?: string;
  reason: string;
}

export interface AIRecommendResponse {
  success: boolean;
  recommendations?: AIChannelRecommendation[];
  training_tips?: string;
  original_description?: string;
  error?: string;
}

export async function getAIChannelRecommendations(
  description: string
): Promise<AIRecommendResponse> {
  const res = await fetch(`${API_BASE}/recommend-channels-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error('Failed to get AI recommendations');
  return res.json();
}

// ============================================================================
// MOVIE SUPPORT
// ============================================================================

export interface RecommendedMovie {
  title: string;
  year: number;
  category: string;
  description: string;
  why_train: string;
  reason?: string; // Added by AI recommendations
}

export async function fetchRecommendedMovies(): Promise<RecommendedMovie[]> {
  const res = await fetch(`${API_BASE}/recommended-movies`);
  if (!res.ok) throw new Error('Failed to fetch recommended movies');
  return res.json();
}

export interface AIMovieRecommendResponse {
  success: boolean;
  recommendations?: RecommendedMovie[];
  training_tips?: string;
  original_description?: string;
  error?: string;
}

export async function getAIMovieRecommendations(
  description: string
): Promise<AIMovieRecommendResponse> {
  const res = await fetch(`${API_BASE}/recommend-movies-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error('Failed to get AI movie recommendations');
  return res.json();
}

export interface MovieUploadResponse {
  success: boolean;
  job_id?: string;
  message: string;
}

export async function uploadMovie(
  movieFile: File,
  title: string,
  category: string
): Promise<MovieUploadResponse> {
  const formData = new FormData();
  formData.append('movie_file', movieFile);
  formData.append('title', title);
  formData.append('category', category);

  const res = await fetch(`${API_BASE}/movies/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload movie');
  return res.json();
}

// ============================================================================
// EXTRACTION VERIFICATION
// ============================================================================

export interface CategoryVerification {
  name: string;
  description: string;
  type: 'standard' | 'aliveness';
  tier?: string;
  why_human?: string;
  coach_note?: string;
  count: number;
  percentage: number;
  status: string;
  status_icon: string;
  quality_avg: number;
  safety_avg: number;
}

export interface TierStats {
  count: number;
  categories: number;
  category_list?: string[];
  health: string;
  health_icon?: string;
}

export interface ExtractionVerificationResponse {
  summary: {
    total_insights: number;
    categories_with_data: number;
    total_categories: number;
    overall_health: string;
    overall_health_icon: string;
    coverage_percentage: number;
  };
  categories: Record<string, CategoryVerification>;
  tiers: Record<string, TierStats>;
  recommendations: string[];
}

export async function fetchExtractionVerification(): Promise<ExtractionVerificationResponse> {
  const res = await fetch(`${API_BASE}/extraction-verification`);
  if (!res.ok) throw new Error('Failed to fetch extraction verification');
  return res.json();
}

// ============================================================================
// BATCH VIDEO PROCESSING
// ============================================================================

export interface BatchProcessResponse {
  success: boolean;
  queued_count: number;
  jobs: Array<{
    job_id: string;
    video_id: string;
    title: string;
    status: string;
  }>;
  invalid_urls: string[];
  mode: string;
}

export async function processBatchVideos(
  videoUrls: string[],
  options: { autoApprove?: boolean; simpleMode?: boolean } = {}
): Promise<BatchProcessResponse> {
  const res = await fetch(`${API_BASE}/process-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_urls: videoUrls,
      auto_approve: options.autoApprove ?? false,
      simple_mode: options.simpleMode ?? true,
    }),
  });
  if (!res.ok) throw new Error('Failed to start batch processing');
  return res.json();
}

// ============================================================================
// BRAIN STUDIO - PHILOSOPHY & TENANTS
// ============================================================================

export interface Philosophy {
  id: string;
  program_name: string;
  program_description: string | null;
  core_philosophy: string | null;
  updated_at: string | null;
}

export interface Tenant {
  id: string;
  order_index: number;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string | null;
}

export async function fetchPhilosophy(): Promise<Philosophy> {
  const res = await fetch(`${API_BASE}/brain-studio/philosophy`);
  if (!res.ok) throw new Error('Failed to fetch philosophy');
  return res.json();
}

export async function updatePhilosophy(data: {
  program_name?: string;
  program_description?: string;
  core_philosophy?: string;
}): Promise<{ success: boolean; philosophy: Philosophy }> {
  const res = await fetch(`${API_BASE}/brain-studio/philosophy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update philosophy');
  return res.json();
}

export async function fetchTenants(): Promise<{ tenants: Tenant[] }> {
  const res = await fetch(`${API_BASE}/brain-studio/tenants`);
  if (!res.ok) throw new Error('Failed to fetch tenants');
  return res.json();
}

export async function createTenant(data: {
  name: string;
  description: string;
  category?: string;
}): Promise<{ success: boolean; tenant: Tenant }> {
  const res = await fetch(`${API_BASE}/brain-studio/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create tenant');
  return res.json();
}

export async function updateTenant(
  tenantId: string,
  data: { name?: string; description?: string; category?: string; is_active?: boolean }
): Promise<{ success: boolean; tenant: Tenant }> {
  const res = await fetch(`${API_BASE}/brain-studio/tenants/${tenantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update tenant');
  return res.json();
}

export async function deleteTenant(tenantId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/brain-studio/tenants/${tenantId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete tenant');
  return res.json();
}

export async function uploadTenants(
  tenants: Array<{ name: string; description: string; category?: string }>,
  replaceExisting: boolean = false
): Promise<{ success: boolean; created_count: number; tenants: Tenant[] }> {
  const res = await fetch(`${API_BASE}/brain-studio/tenants/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenants, replace_existing: replaceExisting }),
  });
  if (!res.ok) throw new Error('Failed to upload tenants');
  return res.json();
}

// ============================================================================
// BRAIN STUDIO - COMPLIANCE CHECKING
// ============================================================================

export interface ComplianceViolation {
  compliance_id: string;
  insight_id: string;
  insight_marker: string;
  insight_text: string;
  insight_category: string;
  tenant_id: string;
  tenant_name: string;
  tenant_description: string;
  alignment_score: number;
  violation_reason: string;
  influence_weight: number;
  is_active: boolean;
}

export async function checkCompliance(): Promise<{
  success: boolean;
  message: string;
  insights_to_check?: number;
  tenants_to_check?: number;
}> {
  const res = await fetch(`${API_BASE}/brain-studio/check-compliance`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to start compliance check');
  return res.json();
}

export async function fetchViolations(): Promise<{
  violations: ComplianceViolation[];
  total: number;
}> {
  const res = await fetch(`${API_BASE}/brain-studio/violations`);
  if (!res.ok) throw new Error('Failed to fetch violations');
  return res.json();
}

// ============================================================================
// BRAIN STUDIO - INFLUENCE & WEIGHTS
// ============================================================================

export interface BrainInsight {
  id: string;
  marker: string;
  title: string;
  insight: string;
  category: string;
  channel_id: string;
  video_id: string;
  influence_weight: number;
  is_active: boolean;
  quality_score: number;
  source_token: string | null;
}

export interface ChannelInfluence {
  channel_id: string;
  channel_name: string;
  approved_insights: number;
  influence_weight: number;
  include_in_training: boolean;
  weighted_contribution: number;
  percentage: number;
  category_distribution: Record<string, number>;
}

export async function fetchBrainInsights(
  limit: number = 100,
  channelId?: string
): Promise<{ insights: BrainInsight[]; total: number }> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (channelId) params.set('channel_id', channelId);
  const res = await fetch(`${API_BASE}/brain-studio/insights?${params}`);
  if (!res.ok) throw new Error('Failed to fetch brain insights');
  return res.json();
}

export async function updateInsightWeight(
  insightId: string,
  weight: number,
  isActive: boolean = true
): Promise<{ success: boolean; insight_id: string; weight: number; is_active: boolean }> {
  const res = await fetch(`${API_BASE}/brain-studio/insights/${insightId}/weight`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weight, is_active: isActive }),
  });
  if (!res.ok) throw new Error('Failed to update insight weight');
  return res.json();
}

export async function fetchChannelInfluence(): Promise<{
  total_weighted_influence: number;
  channels: ChannelInfluence[];
}> {
  const res = await fetch(`${API_BASE}/brain-studio/influence`);
  if (!res.ok) throw new Error('Failed to fetch channel influence');
  return res.json();
}

export async function fetchBrainStatistics(): Promise<{
  total_insights: number;
  active_insights: number;
  total_channels: number;
  total_tenants: number;
  total_violations: number;
  average_weight: number;
}> {
  const res = await fetch(`${API_BASE}/brain-studio/statistics`);
  if (!res.ok) throw new Error('Failed to fetch brain statistics');
  return res.json();
}

// ============================================================================
// BRAIN STUDIO - GOALS & COMPARISON
// ============================================================================

export interface BrainGoal {
  id: string;
  category: string;
  target_percentage: number;
  priority: number;
  description: string | null;
  recommended_sources: string | null;
  is_active: boolean;
}

export interface BrainComparison {
  total_insights: number;
  current_state: Record<string, number>;
  goal_state: Record<string, number>;
  goals_detail: Record<string, {
    target: number;
    priority: number;
    description: string | null;
    recommended_sources: string | null;
  }>;
  gaps: Array<{
    category: string;
    current: number;
    target: number;
    gap: number;
    priority: number;
    recommended_sources: string | null;
  }>;
  health_score: number;
}

export async function fetchBrainGoals(): Promise<{ goals: BrainGoal[] }> {
  const res = await fetch(`${API_BASE}/brain-studio/goals`);
  if (!res.ok) throw new Error('Failed to fetch brain goals');
  return res.json();
}

export async function createBrainGoal(data: {
  category: string;
  target_percentage: number;
  priority?: number;
  description?: string;
  recommended_sources?: string;
}): Promise<{ success: boolean; goal: BrainGoal }> {
  const res = await fetch(`${API_BASE}/brain-studio/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create goal');
  return res.json();
}

export async function updateBrainGoal(
  goalId: string,
  data: Partial<BrainGoal>
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/brain-studio/goals/${goalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update goal');
  return res.json();
}

export async function deleteBrainGoal(goalId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/brain-studio/goals/${goalId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete goal');
  return res.json();
}

export async function fetchBrainComparison(): Promise<BrainComparison> {
  const res = await fetch(`${API_BASE}/brain-studio/comparison`);
  if (!res.ok) throw new Error('Failed to fetch brain comparison');
  return res.json();
}

export async function fetchBrainCategories(): Promise<{
  categories: Array<{ name: string; count: number }>;
}> {
  const res = await fetch(`${API_BASE}/brain-studio/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

// ============================================================================
// BRAIN STUDIO - PROMPT LAB
// ============================================================================

export interface PromptLabResult {
  prompt: string;
  response: string;
  influences: Array<{
    marker: string;
    title: string;
    category: string;
    relevance_score: number;
    influence_weight: number;
    snippet: string;
  }>;
  total_relevant_insights: number;
  brain_stats: {
    total_insights: number;
    categories_represented: number;
  };
}

export async function testPromptInLab(
  prompt: string,
  options: { showInfluences?: boolean; systemPrompt?: string } = {}
): Promise<PromptLabResult> {
  const res = await fetch(`${API_BASE}/brain-studio/prompt-lab`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      show_influences: options.showInfluences ?? true,
      system_prompt: options.systemPrompt,
    }),
  });
  if (!res.ok) throw new Error('Failed to test prompt');
  return res.json();
}

// ============================================================================
// LOGS
// ============================================================================

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export async function fetchLogs(lines: number = 50): Promise<{ entries: LogEntry[]; total: number }> {
  const res = await fetch(`${API_BASE}/logs?lines=${lines}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

// ============================================================================
// MANUAL
// ============================================================================

export async function fetchManual(): Promise<{ content: string }> {
  const res = await fetch(`${API_BASE}/manual`);
  if (!res.ok) throw new Error('Failed to fetch manual');
  return res.json();
}

// ============================================================================
// BRAIN STUDIO - CHANNEL SUGGESTIONS
// ============================================================================

export interface ChannelForCategory {
  channel_id: string;
  name: string;
  youtube_channel_id: string;
  category_insights: number;
}

export async function fetchChannelsForCategory(category: string): Promise<{
  category: string;
  channels: ChannelForCategory[];
  total_channels: number;
}> {
  const res = await fetch(`${API_BASE}/brain-studio/channels-for-category/${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error('Failed to fetch channels for category');
  return res.json();
}

// ============================================================================
// BRAIN STUDIO - TRAINING ROADMAP
// ============================================================================

export interface TrainingRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'warning';
  action: string;
  detail: string;
  suggestion: string;
}

export interface TierChannelRecommendation {
  name: string;
  url: string;
  why: string;
}

export interface TierRecommendation {
  name: string;
  description: string;
  quality_multiplier: number;
  max_percentage?: number;
  examples: Array<{ name: string; note: string }>;
  youtube_channels: TierChannelRecommendation[];
}

export interface TrainingRoadmap {
  current_stats: {
    total_insights: number;
    dialogue_chains: number;
    avg_quality_score: number;
    avg_burstiness: number | null;
    contractions_percentage: number;
    tentative_language_percentage: number;
  };
  progress: {
    minimum_viable: number;
    therapeutic_competence: number;
    optimal: number;
    dialogue_chains: number;
  };
  needed: {
    to_minimum: number;
    to_therapeutic: number;
    to_optimal: number;
    dialogue_chains_needed: number;
  };
  videos_needed: {
    to_minimum: number;
    to_therapeutic: number;
    to_optimal: number;
  };
  milestones: {
    minimum_viable: number;
    therapeutic_competence: number;
    optimal: number;
    saturation: number;
    dialogue_chains_min: number;
    dialogue_chains_optimal: number;
  };
  current_phase: 'building' | 'minimum_viable' | 'therapeutic_competence' | 'optimal';
  phase_description: string;
  empathy_distribution: Record<string, number>;
  tier_distribution: Record<string, number>;
  tier_5_percentage: number;
  tier_5_warning: boolean;
  recommendations: TrainingRecommendation[];
  channel_recommendations: Record<string, TierRecommendation>;
}

export async function fetchTrainingRoadmap(): Promise<TrainingRoadmap> {
  const res = await fetch(`${API_BASE}/brain-studio/training-roadmap`);
  if (!res.ok) throw new Error('Failed to fetch training roadmap');
  return res.json();
}

