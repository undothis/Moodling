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

export interface ProcessingJob {
  job_id: string;
  video_id: string;
  status: string;
  progress: number;
  current_step: string;
  error_message: string | null;
  insights_count: number;
  completed_at: string | null;
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
