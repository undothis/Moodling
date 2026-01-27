'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchChannels,
  addChannel,
  deleteChannel,
  fetchRecommendedChannels,
  getAIChannelRecommendations,
  fetchChannelVideos,
  processVideoSimple,
  AIChannelRecommendation,
  Video as VideoType,
} from '@/lib/api';
import {
  Plus,
  Trash2,
  Youtube,
  Loader2,
  ExternalLink,
  Star,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Sparkles,
  Info,
  Wand2,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  Play,
  Video,
  X,
} from 'lucide-react';
import clsx from 'clsx';

function AddChannelModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('general');
  const [trustLevel, setTrustLevel] = useState('medium');

  const { mutate: add, isPending } = useMutation({
    mutationFn: addChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setUrl('');
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add YouTube Channel</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/@channelname"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
            >
              <option value="general">General</option>
              <option value="therapy">Therapy</option>
              <option value="mental_health">Mental Health</option>
              <option value="relationships">Relationships</option>
              <option value="neurodivergent">Neurodivergent</option>
              <option value="grief">Grief</option>
              <option value="addiction">Addiction</option>
              <option value="wisdom">Wisdom</option>
              <option value="vulnerability">Vulnerability</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trust Level
            </label>
            <select
              value={trustLevel}
              onChange={(e) => setTrustLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
            >
              <option value="low">Low (more review needed)</option>
              <option value="medium">Medium</option>
              <option value="high">High (trusted source)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              add({ url, category, trust_level: trustLevel, extraction_categories: [] })
            }
            disabled={!url || isPending}
            className="flex-1 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Channel
          </button>
        </div>
      </div>
    </div>
  );
}

function BrowseVideosModal({
  isOpen,
  onClose,
  channel,
}: {
  isOpen: boolean;
  onClose: () => void;
  channel: any;
}) {
  const queryClient = useQueryClient();
  const [videoCount, setVideoCount] = useState(20);
  const [processingVideos, setProcessingVideos] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['channel-videos', channel?.id, videoCount],
    queryFn: () => fetchChannelVideos(channel.id, videoCount),
    enabled: isOpen && !!channel?.id,
  });

  const { mutate: startProcessing } = useMutation({
    mutationFn: (videoId: string) => processVideoSimple(`https://youtube.com/watch?v=${videoId}`),
    onMutate: (videoId) => {
      setProcessingVideos((prev) => new Set(prev).add(videoId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onSettled: (_, __, videoId) => {
      setTimeout(() => {
        setProcessingVideos((prev) => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      }, 2000);
    },
  });

  const processAll = () => {
    data?.videos?.forEach((video) => {
      if (!processingVideos.has(video.video_id)) {
        startProcessing(video.video_id);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Browse Videos</h2>
            <p className="text-sm text-gray-500">{channel?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={videoCount}
              onChange={(e) => setVideoCount(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value={10}>10 videos</option>
              <option value={20}>20 videos</option>
              <option value={50}>50 videos</option>
              <option value={100}>100 videos</option>
            </select>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Refresh
          </button>
          {data?.videos && data.videos.length > 0 && (
            <button
              onClick={processAll}
              className="px-4 py-1.5 text-sm bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Process All ({data.videos.length})
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : !data?.videos || data.videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No videos found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.videos.map((video) => (
                <div
                  key={video.video_id}
                  className="bg-gray-50 rounded-lg p-3 flex items-start gap-3"
                >
                  {video.thumbnail_url && (
                    <img
                      src={video.thumbnail_url}
                      alt=""
                      className="w-24 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 line-clamp-2">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {video.duration_seconds
                        ? `${Math.floor(video.duration_seconds / 60)}:${String(
                            video.duration_seconds % 60
                          ).padStart(2, '0')}`
                        : 'Duration unknown'}
                    </p>
                  </div>
                  <button
                    onClick={() => startProcessing(video.video_id)}
                    disabled={processingVideos.has(video.video_id)}
                    className="px-3 py-1.5 text-xs bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {processingVideos.has(video.video_id) ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Process
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelCard({
  channel,
  onDelete,
  onBrowseVideos,
}: {
  channel: any;
  onDelete: () => void;
  onBrowseVideos: () => void;
}) {
  const trustColors: Record<string, string> = {
    low: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-green-100 text-green-700',
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <Youtube className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{channel.name}</h3>
            <a
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-leaf-600 flex items-center gap-1"
            >
              {channel.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span
          className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full',
            trustColors[channel.trust_level] || 'bg-gray-100'
          )}
        >
          {channel.trust_level} trust
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
          {channel.category}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-500">Videos Processed</p>
          <p className="font-semibold text-gray-900">{channel.videos_processed}</p>
        </div>
        <div>
          <p className="text-gray-500">Insights Extracted</p>
          <p className="font-semibold text-gray-900">{channel.insights_extracted}</p>
        </div>
      </div>

      <button
        onClick={onBrowseVideos}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-leaf-50 text-leaf-700 rounded-lg hover:bg-leaf-100 transition-colors"
      >
        <Video className="w-4 h-4" />
        Browse Videos
      </button>
    </div>
  );
}

function RecommendedChannelCard({
  channel,
  onAdd,
  isAdded,
  isAdding,
  description,
}: {
  channel: { name: string; category: string; url: string; description?: string };
  onAdd: () => void;
  isAdded: boolean;
  isAdding?: boolean;
  description?: string;
}) {
  const desc = description || channel.description;
  return (
    <div className={clsx(
      "bg-white rounded-lg p-3 border transition-colors",
      isAdded ? "border-green-200 bg-green-50" : "border-gray-100 hover:border-leaf-200"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <p className="font-medium text-gray-900 text-sm truncate">{channel.name}</p>
        </div>
        {isAdded ? (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex-shrink-0">
            Added
          </span>
        ) : isAdding ? (
          <span className="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded-full flex-shrink-0 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Adding...
          </span>
        ) : (
          <button
            onClick={onAdd}
            className="px-3 py-1 text-xs bg-leaf-50 text-leaf-700 rounded-full hover:bg-leaf-100 transition-colors flex-shrink-0"
          >
            Add
          </button>
        )}
      </div>
      {desc && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{desc}</p>
      )}
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  // Emotional Experience
  philosophy_meaning: 'Philosophy & Meaning',
  relationships_love: 'Relationships & Love',
  therapy_mental_health: 'Therapy & Mental Health',
  grief_loss: 'Grief & Loss',
  vulnerability_shame: 'Vulnerability & Shame',
  addiction_recovery: 'Addiction & Recovery',
  trauma_healing: 'Trauma & Healing',
  // Cognitive Experience
  neurodivergent: 'Neurodivergent Perspectives',
  psychology_behavior: 'Psychology & Behavior',
  // Communication Patterns
  communication_conflict: 'Communication & Conflict',
  // Life Transitions
  life_transitions: 'Life Transitions',
  parenting_family: 'Parenting & Family',
  // Wisdom & Depth
  spirituality_faith: 'Spirituality & Faith',
  deep_conversations: 'Deep Conversations',
  human_stories: 'Human Stories',
  // Wellness
  wellness_selfcare: 'Wellness & Self-Care',
  // Legacy categories
  general: 'General',
  therapy: 'Therapy',
  mental_health: 'Mental Health',
  relationships: 'Relationships',
  grief: 'Grief',
  addiction: 'Addiction',
  wisdom: 'Wisdom',
  vulnerability: 'Vulnerability',
};

export default function ChannelsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [browseVideoChannel, setBrowseVideoChannel] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [addingChannels, setAddingChannels] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // AI Recommendation state
  const [aiDescription, setAiDescription] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<AIChannelRecommendation[]>([]);
  const [aiTrainingTips, setAiTrainingTips] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIRecommender, setShowAIRecommender] = useState(false);

  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannels,
  });

  const { data: recommended } = useQuery({
    queryKey: ['recommended-channels'],
    queryFn: fetchRecommendedChannels,
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const { mutate: add } = useMutation({
    mutationFn: addChannel,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      // Remove from adding set on success
      const urlKey = variables.url.replace('https://youtube.com/', '');
      setAddingChannels(prev => {
        const next = new Set(prev);
        next.delete(urlKey);
        return next;
      });
    },
    onError: (_, variables) => {
      // Remove from adding set on error too
      const urlKey = variables.url.replace('https://youtube.com/', '');
      setAddingChannels(prev => {
        const next = new Set(prev);
        next.delete(urlKey);
        return next;
      });
      alert('Failed to add channel. Please try again.');
    },
  });

  const handleAddChannel = (channel: { url: string; category: string }) => {
    setAddingChannels(prev => new Set(prev).add(channel.url));
    add({
      url: `https://youtube.com/${channel.url}`,
      category: channel.category,
      trust_level: 'high',
      extraction_categories: [],
    });
  };

  // Group recommended channels by category
  const groupedRecommended = useMemo(() => {
    if (!recommended) return {};
    return recommended.reduce((acc, ch) => {
      const cat = ch.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ch);
      return acc;
    }, {} as Record<string, typeof recommended>);
  }, [recommended]);

  // Get unique categories
  const categories = useMemo(() => {
    return Object.keys(groupedRecommended).sort();
  }, [groupedRecommended]);

  // Check if a channel is already added
  const addedChannelUrls = useMemo(() => {
    if (!channels) return new Set<string>();
    return new Set(channels.map(ch => ch.url.replace('https://youtube.com/', '').replace('https://www.youtube.com/', '')));
  }, [channels]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleGetAIRecommendations = async () => {
    if (!aiDescription.trim()) return;

    setIsLoadingAI(true);
    try {
      const response = await getAIChannelRecommendations(aiDescription);
      if (response.success && response.recommendations) {
        setAiRecommendations(response.recommendations);
        setAiTrainingTips(response.training_tips || '');
      } else {
        alert(response.error || 'Failed to get recommendations');
      }
    } catch (error) {
      alert('Failed to get AI recommendations. Make sure your Claude API key is configured.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAddAllAIRecommendations = () => {
    aiRecommendations.forEach(channel => {
      if (!addedChannelUrls.has(channel.url)) {
        handleAddChannel(channel);
      }
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
          <p className="text-gray-500 mt-1">
            Manage YouTube channels for training data harvesting
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Channel
        </button>
      </div>

      {/* Channels Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : !channels || channels.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center mb-8">
          <Youtube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No channels added yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add YouTube channels to start harvesting training data
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600"
          >
            <Plus className="w-4 h-4" />
            Add Your First Channel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onDelete={() => remove(channel.id)}
              onBrowseVideos={() => setBrowseVideoChannel(channel)}
            />
          ))}
        </div>
      )}

      {/* AI Channel Recommender */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                AI Channel Recommender
              </h2>
              <p className="text-sm text-gray-600">
                Describe your AI and get personalized channel recommendations
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAIRecommender(!showAIRecommender)}
            className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {showAIRecommender ? 'Hide' : 'Get Recommendations'}
          </button>
        </div>

        {showAIRecommender && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe what you want your AI to do:
              </label>
              <textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Example: I want to build an AI wellness coach that helps people deal with anxiety, provides coping strategies, and offers empathetic support during difficult times. It should sound warm and understanding, like a therapist friend."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px] resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGetAIRecommendations}
                disabled={!aiDescription.trim() || isLoadingAI}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoadingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Find Best Channels
                  </>
                )}
              </button>

              {aiRecommendations.length > 0 && (
                <button
                  onClick={handleAddAllAIRecommendations}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Add All Recommended
                </button>
              )}
            </div>

            {/* AI Recommendations Results */}
            {aiRecommendations.length > 0 && (
              <div className="mt-6 space-y-4">
                {aiTrainingTips && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Training Tip</p>
                        <p className="text-sm text-gray-600 mt-1">{aiTrainingTips}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm font-medium text-gray-700">
                  Recommended channels for your AI ({aiRecommendations.length}):
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiRecommendations.map((channel) => (
                    <div
                      key={channel.url}
                      className={clsx(
                        "bg-white rounded-lg p-4 border transition-colors",
                        addedChannelUrls.has(channel.url)
                          ? "border-green-200 bg-green-50"
                          : "border-purple-200 hover:border-purple-300"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-purple-500" />
                          <p className="font-medium text-gray-900">{channel.name}</p>
                        </div>
                        {addedChannelUrls.has(channel.url) ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            Added
                          </span>
                        ) : addingChannels.has(channel.url) ? (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Adding...
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddChannel(channel)}
                            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
                          >
                            Add
                          </button>
                        )}
                      </div>
                      <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full mb-2">
                        {CATEGORY_LABELS[channel.category] || channel.category}
                      </span>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium text-purple-700">Why this channel: </span>
                        {channel.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommended Channels */}
      {recommended && recommended.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recommended Channels
              </h2>
              <p className="text-sm text-gray-500">
                {recommended.length} curated channels across {categories.length} categories
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat} ({groupedRecommended[cat]?.length})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAllRecommended(!showAllRecommended)}
                className="px-4 py-1.5 text-sm bg-leaf-50 text-leaf-700 rounded-lg hover:bg-leaf-100 flex items-center gap-2"
              >
                {showAllRecommended ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show All
                  </>
                )}
              </button>
            </div>
          </div>

          {showAllRecommended ? (
            // Full categorized view
            <div className="space-y-4">
              {(categoryFilter === 'all' ? categories : [categoryFilter]).map(cat => (
                <div key={cat} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                        {groupedRecommended[cat]?.length} channels
                      </span>
                    </div>
                    {expandedCategories.has(cat) ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {(expandedCategories.has(cat) || categoryFilter !== 'all') && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupedRecommended[cat]?.map((channel) => (
                        <RecommendedChannelCard
                          key={channel.url}
                          channel={channel}
                          isAdded={addedChannelUrls.has(channel.url)}
                          isAdding={addingChannels.has(channel.url)}
                          onAdd={() => handleAddChannel(channel)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Compact preview (first 12)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recommended.slice(0, 12).map((channel) => (
                <RecommendedChannelCard
                  key={channel.url}
                  channel={channel}
                  isAdded={addedChannelUrls.has(channel.url)}
                  isAdding={addingChannels.has(channel.url)}
                  onAdd={() => handleAddChannel(channel)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Channel Discovery / Search */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Discover More Channels
              </h2>
              <p className="text-sm text-gray-500">
                Search for channels that fit MoodLeaf's coaching style
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {showSearch ? 'Hide Search' : 'Search Channels'}
          </button>
        </div>

        {showSearch && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic (e.g., 'anxiety', 'relationships', 'grief')"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => {/* Search functionality */}}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            {/* Search suggestions */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Channel Discovery Tips</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Look for channels with authentic conversations about emotions, personal growth, and mental wellness.
                    The best training data comes from therapists, coaches, and thoughtful interviewers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {['therapy sessions', 'emotional intelligence', 'life coaching', 'mental health interviews', 'grief counseling', 'relationship advice', 'mindfulness', 'personal stories'].map(topic => (
                  <button
                    key={topic}
                    onClick={() => setSearchQuery(topic)}
                    className="px-3 py-1.5 text-xs bg-white text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered results from recommendations */}
            {searchQuery && recommended && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Matching channels from our curated list:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommended
                    .filter(ch =>
                      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      ch.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (ch.description && ch.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .slice(0, 9)
                    .map((channel) => (
                      <RecommendedChannelCard
                        key={channel.url}
                        channel={channel}
                        isAdded={addedChannelUrls.has(channel.url)}
                        isAdding={addingChannels.has(channel.url)}
                        onAdd={() => handleAddChannel(channel)}
                      />
                    ))
                  }
                </div>
                {recommended.filter(ch =>
                  ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ch.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (ch.description && ch.description.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No matching channels found. Try a different search term or add a custom channel above.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AddChannelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <BrowseVideosModal
        isOpen={!!browseVideoChannel}
        onClose={() => setBrowseVideoChannel(null)}
        channel={browseVideoChannel}
      />
    </div>
  );
}
