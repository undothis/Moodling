'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInsights, reviewInsight, deleteInsight, fetchCategories, batchApproveInsights } from '@/lib/api';
import {
  Check,
  X,
  Trash2,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import clsx from 'clsx';

function InsightCard({
  insight,
  onApprove,
  onReject,
  onDelete,
}: {
  insight: any;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const categoryColors: Record<string, string> = {
    emotional_struggles: 'bg-red-100 text-red-700',
    coping_strategies: 'bg-blue-100 text-blue-700',
    vulnerability: 'bg-purple-100 text-purple-700',
    humor_wit: 'bg-yellow-100 text-yellow-700',
    growth_moments: 'bg-green-100 text-green-700',
    what_helps_hurts: 'bg-orange-100 text-orange-700',
    mental_health_patterns: 'bg-pink-100 text-pink-700',
    companionship: 'bg-indigo-100 text-indigo-700',
    self_discovery: 'bg-teal-100 text-teal-700',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border transition-all',
        insight.flagged_for_review
          ? 'border-yellow-300 shadow-yellow-100'
          : 'border-gray-100',
        expanded ? 'shadow-lg' : 'shadow-sm'
      )}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            {insight.flagged_for_review && (
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{insight.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={clsx(
                    'px-2 py-0.5 text-xs font-medium rounded',
                    categoryColors[insight.category] || 'bg-gray-100 text-gray-700'
                  )}
                >
                  {insight.category.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-gray-400">
                  {insight.video_id}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Insight Text */}
        <p className={clsx('text-gray-600 text-sm', !expanded && 'line-clamp-2')}>
          {insight.insight}
        </p>

        {/* Scores (always visible) */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span
            className={clsx(
              'px-2 py-1 text-xs font-medium rounded',
              getScoreColor(insight.quality_score)
            )}
          >
            Quality: {insight.quality_score}
          </span>
          <span
            className={clsx(
              'px-2 py-1 text-xs font-medium rounded',
              getScoreColor(insight.safety_score)
            )}
          >
            Safety: {insight.safety_score}
          </span>
          <span
            className={clsx(
              'px-2 py-1 text-xs font-medium rounded',
              getScoreColor(insight.specificity_score)
            )}
          >
            Specificity: {insight.specificity_score}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Coaching Implication
            </h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {insight.coaching_implication}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-500">Actionability</p>
              <p className="font-semibold">{insight.actionability_score}</p>
            </div>
            <div>
              <p className="text-gray-500">Novelty</p>
              <p className="font-semibold">{insight.novelty_score}</p>
            </div>
            <div>
              <p className="text-gray-500">Confidence</p>
              <p className="font-semibold">{(insight.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights', statusFilter, categoryFilter],
    queryFn: () => fetchInsights(statusFilter, categoryFilter || undefined, 100),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { mutate: review } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      reviewInsight(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteInsight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });

  const { mutate: batchApprove, isPending: isBatchApproving } = useMutation({
    mutationFn: (minQuality: number) => batchApproveInsights(minQuality),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      alert(`Approved ${data.approved_count} insights with quality >= 85`);
    },
  });

  const pendingCount = insights?.filter((i) => i.status === 'pending').length || 0;
  const flaggedCount = insights?.filter((i) => i.flagged_for_review).length || 0;
  const highQualityPending = insights?.filter((i) => i.status === 'pending' && i.quality_score >= 85).length || 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Insights</h1>
          <p className="text-gray-500 mt-1">
            Approve or reject extracted insights for training
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
              {pendingCount} pending
            </span>
          )}
          {flaggedCount > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
              {flaggedCount} flagged
            </span>
          )}
        </div>
      </div>

      {/* Filters and Batch Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500 text-sm"
          >
            <option value="">All Categories</option>
            {categories &&
              Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
          </select>
        </div>

        {/* Batch Approve Button */}
        {statusFilter === 'pending' && highQualityPending > 0 && (
          <button
            onClick={() => batchApprove(85)}
            disabled={isBatchApproving}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isBatchApproving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Approve All 85+ ({highQualityPending})
          </button>
        )}
      </div>

      {/* Insights List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : !insights || insights.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No insights to review
          </h3>
          <p className="text-gray-500">
            {statusFilter === 'pending'
              ? 'Process more videos to generate insights'
              : `No ${statusFilter} insights found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onApprove={() => review({ id: insight.id, action: 'approve' })}
              onReject={() => review({ id: insight.id, action: 'reject' })}
              onDelete={() => remove(insight.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
