'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchChannels,
  fetchChannelVideos,
  processVideo,
  processVideoSimple,
  fetchJobs,
} from '@/lib/api';
import {
  Play,
  Loader2,
  Video,
  Clock,
  Eye,
  ThumbsUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import clsx from 'clsx';

function VideoCard({
  video,
  isProcessing,
  onProcess,
  isSelected,
  onToggleSelect,
  showSelect,
}: {
  video: any;
  isProcessing: boolean;
  onProcess: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showSelect?: boolean;
}) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={clsx(
      "bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow",
      isSelected ? "border-leaf-500 ring-2 ring-leaf-200" : "border-gray-100"
    )}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration_seconds)}
        </span>
        {showSelect && (
          <button
            onClick={onToggleSelect}
            className="absolute top-2 left-2 p-1 bg-white/90 rounded shadow hover:bg-white transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-leaf-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
          {video.title}
        </h3>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatNumber(video.view_count)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {formatNumber(video.like_count)}
          </span>
        </div>

        <button
          onClick={onProcess}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-leaf-500 text-white text-sm rounded-lg hover:bg-leaf-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Process
            </>
          )}
        </button>
      </div>
    </div>
  );
}

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

export default function ProcessPage() {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [processingVideos, setProcessingVideos] = useState<Set<string>>(new Set());
  const [simpleMode, setSimpleMode] = useState(true);  // Default to simple mode
  const [autoApprove, setAutoApprove] = useState(false);
  const [skipFacial, setSkipFacial] = useState(true);
  const [skipProsody, setSkipProsody] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  const { data: channels } = useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannels,
  });

  const { data: channelVideos, isLoading: videosLoading } = useQuery({
    queryKey: ['channel-videos', selectedChannel],
    queryFn: () => fetchChannelVideos(selectedChannel!, 20, 'balanced'),
    enabled: !!selectedChannel,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    refetchInterval: 3000,
  });

  const { mutate: startProcess } = useMutation({
    mutationFn: (url: string) =>
      simpleMode
        ? processVideoSimple(url, { autoApprove })
        : processVideo(url, { skipFacial, skipProsody }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleProcessVideo = (videoId: string) => {
    setProcessingVideos((prev) => new Set(prev).add(videoId));
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    startProcess(url, {
      onSettled: () => {
        setProcessingVideos((prev) => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      },
    });
  };

  const handleProcessUrl = () => {
    if (!videoUrl) return;
    startProcess(videoUrl);
    setVideoUrl('');
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  };

  const selectAllVideos = () => {
    if (!channelVideos?.videos) return;
    setSelectedVideos(new Set(channelVideos.videos.map(v => v.video_id)));
  };

  const clearSelection = () => {
    setSelectedVideos(new Set());
  };

  const handleBatchProcess = async () => {
    if (selectedVideos.size === 0) return;

    // Mark all selected videos as processing
    setProcessingVideos(prev => {
      const next = new Set(prev);
      selectedVideos.forEach(id => next.add(id));
      return next;
    });

    // Process each video with a small delay between them
    const videoIds = Array.from(selectedVideos);
    for (const videoId of videoIds) {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      startProcess(url);
      // Small delay to avoid overwhelming the backend
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Clear selection after starting batch
    clearSelection();
    setBatchMode(false);
  };

  const activeJobs = jobs?.filter((j) => !['completed', 'failed'].includes(j.status)) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Process Videos</h1>
        <p className="text-gray-500 mt-1">
          Download and analyze YouTube videos for training insights
        </p>
      </div>

      {/* Quick Process URL */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Process</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
          />
          <button
            onClick={handleProcessUrl}
            disabled={!videoUrl}
            className="px-6 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Process
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-6 mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={simpleMode}
              onChange={(e) => setSimpleMode(e.target.checked)}
              className="rounded border-gray-300 text-leaf-500 focus:ring-leaf-500"
            />
            <span className="font-medium">Simple Mode</span>
            <span className="text-xs text-gray-400">(YouTube transcript + Claude only, much faster)</span>
          </label>
          {simpleMode && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded border-gray-300 text-leaf-500 focus:ring-leaf-500"
              />
              Auto-approve 85+ quality
            </label>
          )}
          {!simpleMode && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={skipFacial}
                  onChange={(e) => setSkipFacial(e.target.checked)}
                  className="rounded border-gray-300 text-leaf-500 focus:ring-leaf-500"
                />
                Skip facial analysis
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={skipProsody}
                  onChange={(e) => setSkipProsody(e.target.checked)}
                  className="rounded border-gray-300 text-leaf-500 focus:ring-leaf-500"
                />
                Skip prosody extraction
              </label>
            </>
          )}
        </div>
      </div>

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

      {/* Browse Channel Videos */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Browse Channel Videos</h2>
          {channelVideos?.videos && channelVideos.videos.length > 0 && (
            <button
              onClick={() => {
                setBatchMode(!batchMode);
                if (!batchMode) clearSelection();
              }}
              className={clsx(
                "px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors",
                batchMode
                  ? "bg-leaf-500 text-white hover:bg-leaf-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <PlayCircle className="w-4 h-4" />
              {batchMode ? 'Exit Batch Mode' : 'Batch Process'}
            </button>
          )}
        </div>

        {/* Channel Selector */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <select
            value={selectedChannel || ''}
            onChange={(e) => {
              setSelectedChannel(e.target.value || null);
              clearSelection();
            }}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
          >
            <option value="">Select a channel...</option>
            {channels?.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>

          {/* Batch controls */}
          {batchMode && channelVideos?.videos && channelVideos.videos.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={selectAllVideos}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Select All ({channelVideos.videos.length})
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Clear
              </button>
              {selectedVideos.size > 0 && (
                <button
                  onClick={handleBatchProcess}
                  disabled={processingVideos.size > 0}
                  className="px-4 py-1.5 text-sm bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Process {selectedVideos.size} Videos
                </button>
              )}
            </div>
          )}
        </div>

        {/* Videos Grid */}
        {selectedChannel && (
          <>
            {videosLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : !channelVideos?.videos?.length ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No videos found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {channelVideos.videos.map((video) => (
                  <VideoCard
                    key={video.video_id}
                    video={video}
                    isProcessing={processingVideos.has(video.video_id)}
                    onProcess={() => handleProcessVideo(video.video_id)}
                    isSelected={selectedVideos.has(video.video_id)}
                    onToggleSelect={() => toggleVideoSelection(video.video_id)}
                    showSelect={batchMode}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!selectedChannel && (
          <div className="text-center py-12">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Select a channel to browse videos</p>
          </div>
        )}
      </div>
    </div>
  );
}
