'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchChannels,
  addChannel,
  deleteChannel,
  fetchRecommendedChannels,
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

function ChannelCard({
  channel,
  onDelete,
}: {
  channel: any;
  onDelete: () => void;
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

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Videos Processed</p>
          <p className="font-semibold text-gray-900">{channel.videos_processed}</p>
        </div>
        <div>
          <p className="text-gray-500">Insights Extracted</p>
          <p className="font-semibold text-gray-900">{channel.insights_extracted}</p>
        </div>
      </div>
    </div>
  );
}

function RecommendedChannelCard({
  channel,
  onAdd,
  isAdded,
}: {
  channel: { name: string; category: string; url: string };
  onAdd: () => void;
  isAdded: boolean;
}) {
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
        ) : (
          <button
            onClick={onAdd}
            className="px-3 py-1 text-xs bg-leaf-50 text-leaf-700 rounded-full hover:bg-leaf-100 transition-colors flex-shrink-0"
          >
            Add
          </button>
        )}
      </div>
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAllRecommended, setShowAllRecommended] = useState(false);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

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
            />
          ))}
        </div>
      )}

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
                          onAdd={() =>
                            add({
                              url: `https://youtube.com/${channel.url}`,
                              category: channel.category,
                              trust_level: 'high',
                              extraction_categories: [],
                            })
                          }
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
                  onAdd={() =>
                    add({
                      url: `https://youtube.com/${channel.url}`,
                      category: channel.category,
                      trust_level: 'high',
                      extraction_categories: [],
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AddChannelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
