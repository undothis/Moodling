'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { processBatchVideos, fetchJobs, fetchChannels, fetchChannelVideos } from '@/lib/api';
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ListVideo,
  Trash2,
  Youtube,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';

function JobStatusCard({ job }: { job: any }) {
  const statusConfig: Record<string, { icon: any; color: string }> = {
    queued: { icon: Clock, color: 'text-gray-500' },
    downloading: { icon: Loader2, color: 'text-blue-500' },
    transcribing: { icon: Loader2, color: 'text-purple-500' },
    diarizing: { icon: Loader2, color: 'text-indigo-500' },
    extracting_prosody: { icon: Loader2, color: 'text-pink-500' },
    analyzing_facial: { icon: Loader2, color: 'text-orange-500' },
    extracting_insights: { icon: Loader2, color: 'text-yellow-500' },
    completed: { icon: CheckCircle, color: 'text-green-500' },
    failed: { icon: XCircle, color: 'text-red-500' },
  };

  const config = statusConfig[job.status] || { icon: AlertCircle, color: 'text-gray-500' };
  const Icon = config.icon;
  const isActive = !['completed', 'failed'].includes(job.status);

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={clsx('w-5 h-5', config.color, isActive && 'animate-spin')} />
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">{job.video_id}</p>
          <p className="text-xs text-gray-500">{job.current_step}</p>
        </div>
        <span className="text-xs font-medium text-gray-500">{job.progress}%</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={clsx(
            'h-2 rounded-full transition-all duration-500',
            job.status === 'failed' ? 'bg-red-500' : 'bg-leaf-500'
          )}
          style={{ width: `${job.progress}%` }}
        />
      </div>

      {job.error_message && (
        <p className="text-xs text-red-500 mt-2">{job.error_message}</p>
      )}

      {job.insights_count > 0 && (
        <p className="text-xs text-green-600 mt-2">
          {job.insights_count} insights extracted
        </p>
      )}
    </div>
  );
}

function ChannelVideoSelector({
  onAddVideos,
}: {
  onAddVideos: (urls: string[]) => void;
}) {
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [videoCount, setVideoCount] = useState(20);

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannels,
  });

  const { data: channelVideos, isLoading: videosLoading } = useQuery({
    queryKey: ['channel-videos', expandedChannel, videoCount],
    queryFn: () => fetchChannelVideos(expandedChannel!, videoCount),
    enabled: !!expandedChannel,
  });

  const toggleVideo = (videoId: string) => {
    setSelectedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  };

  const selectAllVideos = () => {
    if (channelVideos?.videos) {
      setSelectedVideos(new Set(channelVideos.videos.map((v) => v.video_id)));
    }
  };

  const addSelectedToQueue = () => {
    const urls = Array.from(selectedVideos).map(
      (id) => `https://youtube.com/watch?v=${id}`
    );
    onAddVideos(urls);
    setSelectedVideos(new Set());
  };

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Youtube className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No channels added yet</p>
        <a href="/channels" className="text-leaf-600 hover:underline text-sm">
          Add channels first →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {channels.map((channel) => (
        <div key={channel.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedChannel(expandedChannel === channel.id ? null : channel.id)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <Youtube className="w-5 h-5 text-red-500" />
              <span className="font-medium text-gray-900">{channel.name}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                {channel.videos_processed} processed
              </span>
            </div>
            {expandedChannel === channel.id ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedChannel === channel.id && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <select
                    value={videoCount}
                    onChange={(e) => setVideoCount(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value={10}>10 videos</option>
                    <option value={20}>20 videos</option>
                    <option value={50}>50 videos</option>
                    <option value={100}>100 videos</option>
                  </select>
                  <button
                    onClick={selectAllVideos}
                    className="text-sm text-leaf-600 hover:underline"
                  >
                    Select All
                  </button>
                </div>
                {selectedVideos.size > 0 && (
                  <button
                    onClick={addSelectedToQueue}
                    className="flex items-center gap-1 px-3 py-1.5 bg-leaf-500 text-white text-sm rounded-lg hover:bg-leaf-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add {selectedVideos.size} to Queue
                  </button>
                )}
              </div>

              {videosLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : channelVideos?.videos && channelVideos.videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto">
                  {channelVideos.videos.map((video) => (
                    <label
                      key={video.video_id}
                      className={clsx(
                        'flex items-center gap-2 p-2 rounded cursor-pointer',
                        selectedVideos.has(video.video_id)
                          ? 'bg-leaf-50 border border-leaf-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVideos.has(video.video_id)}
                        onChange={() => toggleVideo(video.video_id)}
                        className="rounded border-gray-300 text-leaf-500"
                      />
                      {video.thumbnail_url && (
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="w-16 h-10 object-cover rounded"
                        />
                      )}
                      <span className="text-sm text-gray-700 line-clamp-2 flex-1">
                        {video.title}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No videos found</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BatchPage() {
  const queryClient = useQueryClient();
  const [videoUrls, setVideoUrls] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showChannels, setShowChannels] = useState(true);

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    refetchInterval: 3000,
  });

  const addVideosFromChannel = (urls: string[]) => {
    const currentUrls = videoUrls.split('\n').filter((u) => u.trim());
    const newUrls = urls.filter((u) => !currentUrls.includes(u));
    setVideoUrls([...currentUrls, ...newUrls].join('\n'));
  };

  const { mutate: processBatch, isPending } = useMutation({
    mutationFn: (urls: string[]) => processBatchVideos(urls, { autoApprove }),
    onSuccess: (data) => {
      setLastResult(data);
      setVideoUrls('');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleProcess = () => {
    const urls = videoUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) return;
    processBatch(urls);
  };

  const urlCount = videoUrls
    .split('\n')
    .filter(u => u.trim().length > 0)
    .length;

  const activeJobs = jobs?.filter((j) => !['completed', 'failed'].includes(j.status)) || [];
  const completedJobs = jobs?.filter((j) => j.status === 'completed') || [];
  const failedJobs = jobs?.filter((j) => j.status === 'failed') || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <ListVideo className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Video Processing</h1>
        </div>
        <p className="text-gray-500">
          Select videos from your channels or paste YouTube URLs
        </p>
      </div>

      {/* Channel Selector */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Your Channels</h2>
          <button
            onClick={() => setShowChannels(!showChannels)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showChannels ? 'Hide' : 'Show'}
          </button>
        </div>
        {showChannels && <ChannelVideoSelector onAddVideos={addVideosFromChannel} />}
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Paste YouTube URLs</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter one URL per line. Supports full YouTube URLs, short URLs (youtu.be), and video IDs.
        </p>

        <textarea
          value={videoUrls}
          onChange={(e) => setVideoUrls(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=abc123
https://youtu.be/def456
ghi789"
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500 font-mono text-sm"
        />

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500">
              {urlCount} video{urlCount !== 1 ? 's' : ''} detected
            </span>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded border-gray-300 text-leaf-500 focus:ring-leaf-500"
              />
              Auto-approve quality 85+
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setVideoUrls('')}
              disabled={!videoUrls}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={handleProcess}
              disabled={urlCount === 0 || isPending}
              className="flex items-center gap-2 px-6 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Process {urlCount} Video{urlCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className={clsx(
          "rounded-lg p-4 mb-6",
          lastResult.invalid_urls?.length > 0
            ? "bg-yellow-50 border border-yellow-200"
            : "bg-green-50 border border-green-200"
        )}>
          <div className="flex items-center gap-2 mb-2">
            {lastResult.invalid_urls?.length > 0 ? (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <span className="font-medium">
              {lastResult.queued_count} video{lastResult.queued_count !== 1 ? 's' : ''} queued for processing
            </span>
          </div>
          {lastResult.invalid_urls?.length > 0 && (
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Invalid URLs:</p>
              <ul className="list-disc list-inside">
                {lastResult.invalid_urls.map((url: string, i: number) => (
                  <li key={i}>{url}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">
            Active Processing ({activeJobs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeJobs.map((job) => (
              <JobStatusCard key={job.job_id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">
            Recently Completed ({completedJobs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {completedJobs.slice(0, 8).map((job) => (
              <div key={job.job_id} className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 truncate">
                    {job.video_id}
                  </span>
                </div>
                {job.insights_count > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {job.insights_count} insights
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Jobs */}
      {failedJobs.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">
            Failed ({failedJobs.length})
          </h2>
          <div className="space-y-2">
            {failedJobs.slice(0, 5).map((job) => (
              <div key={job.job_id} className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    {job.video_id}
                  </span>
                </div>
                {job.error_message && (
                  <p className="text-xs text-red-600 mt-1">{job.error_message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeJobs.length === 0 && completedJobs.length === 0 && failedJobs.length === 0 && !lastResult && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ListVideo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No batch jobs yet</p>
          <p className="text-sm text-gray-400">Paste YouTube URLs above to get started</p>
        </div>
      )}
    </div>
  );
}
