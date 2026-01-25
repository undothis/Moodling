'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchChannelStats,
  updateChannelWeight,
  deleteChannelInsights,
  fetchSourceTokens,
  fetchAnalysisStats,
} from '@/lib/api';
import {
  Loader2,
  Sliders,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Weight,
  Database,
  Tag,
  BarChart3,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

function ChannelCard({
  channel,
  onUpdateWeight,
  onDelete,
  totalApproved,
}: {
  channel: any;
  onUpdateWeight: (weight: number, include: boolean) => void;
  onDelete: () => void;
  totalApproved: number;
}) {
  const [weight, setWeight] = useState(channel.influence_weight);
  const [include, setInclude] = useState(channel.include_in_training);
  const [showDelete, setShowDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleWeightChange = (newWeight: number) => {
    setWeight(newWeight);
    onUpdateWeight(newWeight, include);
  };

  const handleToggleInclude = () => {
    const newInclude = !include;
    setInclude(newInclude);
    onUpdateWeight(weight, newInclude);
  };

  // Calculate contribution percentage of total training data
  const contributionPercent = totalApproved > 0
    ? Math.round((channel.approved_insights / totalApproved) * 100)
    : 0;

  // Sort categories by count
  const sortedCategories = Object.entries(channel.category_distribution || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  const topCategories = sortedCategories.slice(0, 3);
  const hasMoreCategories = sortedCategories.length > 3;

  // Calculate what this channel is "pushing" the model toward
  const totalCatInsights = sortedCategories.reduce((sum, [, count]) => sum + (count as number), 0);
  const dominantCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
  const dominantPercent = dominantCategory
    ? Math.round(((dominantCategory[1] as number) / totalCatInsights) * 100)
    : 0;

  return (
    <div
      className={clsx(
        'bg-white rounded-xl p-5 border transition-all',
        !include ? 'opacity-60 border-gray-200' : 'border-gray-100'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{channel.channel_name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {channel.videos_processed} videos • {contributionPercent}% of training data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded',
              channel.trust_level === 'high'
                ? 'bg-green-100 text-green-700'
                : channel.trust_level === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {channel.trust_level}
          </span>
        </div>
      </div>

      {/* Contribution Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Training contribution</span>
          <span className="font-medium text-gray-700">{contributionPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-leaf-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(contributionPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* What this channel contributes */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-600 mb-2">This channel contributes:</p>
        <div className="flex flex-wrap gap-1">
          {topCategories.map(([category, count]) => (
            <span
              key={category}
              className="px-2 py-1 bg-white border border-gray-200 text-xs rounded-full text-gray-700"
            >
              {category.replace(/_/g, ' ')} ({count})
            </span>
          ))}
          {hasMoreCategories && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {expanded ? 'show less' : `+${sortedCategories.length - 3} more`}
            </button>
          )}
        </div>
        {expanded && sortedCategories.length > 3 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {sortedCategories.slice(3).map(([category, count]) => (
              <span
                key={category}
                className="px-2 py-1 bg-white border border-gray-200 text-xs rounded-full text-gray-700"
              >
                {category.replace(/_/g, ' ')} ({count})
              </span>
            ))}
          </div>
        )}
        {dominantCategory && dominantPercent > 50 && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ {dominantPercent}% focused on "{(dominantCategory[0] as string).replace(/_/g, ' ')}"
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-bold text-gray-900">{channel.total_insights}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-lg font-bold text-green-700">{channel.approved_insights}</p>
          <p className="text-xs text-gray-500">Approved</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-bold text-gray-900">{channel.avg_quality}</p>
          <p className="text-xs text-gray-500">Quality</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-bold text-gray-900">{channel.avg_safety}</p>
          <p className="text-xs text-gray-500">Safety</p>
        </div>
      </div>

      {/* Weight Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Weight className="w-4 h-4" />
            Influence Weight
          </label>
          <span className="text-sm font-bold text-gray-900">{weight.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={weight}
          onChange={(e) => handleWeightChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-leaf-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0x (Exclude)</span>
          <span>1x (Normal)</span>
          <span>2x (Double)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={include}
            onChange={handleToggleInclude}
            className="rounded border-gray-300 text-leaf-500 focus:ring-leaf-500"
          />
          Include in training
        </label>

        {showDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600">Delete all insights?</span>
            <button
              onClick={() => {
                onDelete();
                setShowDelete(false);
              }}
              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Yes
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function AnalysisOverview({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Analysis Metrics Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prosody */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="font-medium text-purple-900 mb-2">Prosody Analysis</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Pitch (F0 patterns)</li>
            <li>• Rhythm & tempo</li>
            <li>• Pause patterns</li>
            <li>• Volume dynamics</li>
            <li>• Voice quality (jitter, shimmer)</li>
          </ul>
          <p className="text-xs text-purple-500 mt-2">
            Composite: Aliveness, Naturalness, Expressiveness
          </p>
        </div>

        {/* Distress */}
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="font-medium text-red-900 mb-2">Distress Markers</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Crying detection</li>
            <li>• Voice breaks</li>
            <li>• Tremor patterns</li>
            <li>• Breathing analysis</li>
          </ul>
          <p className="text-xs text-red-500 mt-2">
            Overall distress level computed
          </p>
        </div>

        {/* Facial */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Facial Analysis</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 8 emotion categories</li>
            <li>• Action units (FACS)</li>
            <li>• Gaze direction</li>
            <li>• Head pose</li>
          </ul>
          <p className="text-xs text-blue-500 mt-2">
            py-feat + MediaPipe
          </p>
        </div>

        {/* Linguistic */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">Linguistic</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Transcription (Whisper)</li>
            <li>• Speaker diarization</li>
            <li>• Interview classification</li>
            <li>• Therapeutic approach</li>
          </ul>
          <p className="text-xs text-green-500 mt-2">
            Claude insight extraction
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TuningPage() {
  const queryClient = useQueryClient();

  const { data: channelData, isLoading: channelsLoading } = useQuery({
    queryKey: ['channel-stats'],
    queryFn: fetchChannelStats,
  });

  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['source-tokens'],
    queryFn: fetchSourceTokens,
  });

  const { data: analysisData } = useQuery({
    queryKey: ['analysis-stats'],
    queryFn: fetchAnalysisStats,
  });

  const { mutate: updateWeight } = useMutation({
    mutationFn: ({
      channelId,
      weight,
      include,
    }: {
      channelId: string;
      weight: number;
      include: boolean;
    }) => updateChannelWeight(channelId, weight, include),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
    },
  });

  const { mutate: deleteInsights } = useMutation({
    mutationFn: (channelId: string) => deleteChannelInsights(channelId),
    onSuccess: (data) => {
      alert(`Deleted ${data.deleted_count} insights`);
      queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });

  const channels = channelData?.channels || [];
  const totalApproved = channels.reduce((sum, c) => sum + c.approved_insights, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tuning Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Control how each source influences your training data
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How tuning works:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>Influence Weight</strong>: 0x excludes, 1x is normal, 2x doubles contribution</li>
            <li><strong>Source Tokens</strong>: Each insight has a unique ID for tracing back to source</li>
            <li><strong>Delete</strong>: If a channel is causing issues, remove all its data</li>
            <li>After changes, re-export and re-train your model</li>
          </ul>
        </div>
      </div>

      {/* Analysis Overview */}
      <div className="mb-8">
        <AnalysisOverview data={analysisData} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Channels</p>
          <p className="text-3xl font-bold text-gray-900">{channels.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Approved Insights</p>
          <p className="text-3xl font-bold text-green-600">{totalApproved}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Unique Source Tokens</p>
          <p className="text-3xl font-bold text-blue-600">
            {tokensData?.source_tokens?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Active Channels</p>
          <p className="text-3xl font-bold text-gray-900">
            {channels.filter((c) => c.include_in_training).length}
          </p>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5" />
          Channel Influence Controls
        </h2>

        {channelsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : channels.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No channels with insights yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.channel_id}
                channel={channel}
                onUpdateWeight={(weight, include) =>
                  updateWeight({
                    channelId: channel.channel_id,
                    weight,
                    include,
                  })
                }
                onDelete={() => deleteInsights(channel.channel_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Source Tokens */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Source Tokens (for model debugging)
        </h2>

        {tokensLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : !tokensData?.source_tokens?.length ? (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No approved insights to track yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Token</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Video</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Insights</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Categories</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tokensData.source_tokens.slice(0, 50).map((token) => (
                  <tr key={token.token} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {token.token}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{token.video_id}</td>
                    <td className="px-4 py-3 text-center font-medium">
                      {token.insight_count}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {token.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {cat}
                          </span>
                        ))}
                        {token.categories.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{token.categories.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tokensData.source_tokens.length > 50 && (
              <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 text-center">
                Showing 50 of {tokensData.source_tokens.length} tokens
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
