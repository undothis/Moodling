'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchExtractionVerification, CategoryVerification } from '@/lib/api';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Shield,
  TrendingUp,
  Info,
} from 'lucide-react';
import { useState } from 'react';

// Tier display names and colors
const TIER_CONFIG: Record<string, { name: string; color: string; bgColor: string; description: string }> = {
  emotional_texture: {
    name: 'Emotional Texture',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    description: 'How emotions actually show up in speech',
  },
  cognitive_patterns: {
    name: 'Cognitive Patterns',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'How people think and frame experience',
  },
  self_protective: {
    name: 'Self-Protective Language',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'How people hedge and protect themselves',
  },
  relational_signals: {
    name: 'Relational Signals',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'How people connect, repair, and attach',
  },
  authenticity_markers: {
    name: 'Authenticity Markers',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Signs of genuine human expression',
  },
  meta_conversational: {
    name: 'Meta-Conversational',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    description: "What's happening in the conversation itself",
  },
  rare_gold: {
    name: 'The Rare Gold',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'Precious moments that reveal deep humanity',
  },
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'excellent':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'good':
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case 'moderate':
      return <Circle className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
    case 'needs_data':
      return <Circle className="w-5 h-5 text-yellow-400" />;
    case 'low_quality':
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    case 'safety_concern':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'not_started':
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
}

function ProgressBar({ percentage, color }: { percentage: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

function CategoryRow({ category, name }: { category: CategoryVerification; name: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div
        className="flex items-center gap-4 py-3 px-4 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon status={category.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{category.name}</span>
            {category.type === 'aliveness' && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                aliveness
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{category.description}</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="w-20 text-right">
            <span className="font-semibold text-gray-900">{category.count}</span>
            <span className="text-gray-400 ml-1">insights</span>
          </div>
          <div className="w-16 text-right">
            <span className={category.percentage > 0 ? 'text-green-600' : 'text-gray-400'}>
              {category.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-24">
            <ProgressBar
              percentage={category.percentage * 5} // Scale for visibility
              color={category.count > 0 ? 'bg-green-500' : 'bg-gray-200'}
            />
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Quality Avg:</span>
              <span
                className={`ml-2 font-medium ${
                  category.quality_avg >= 80
                    ? 'text-green-600'
                    : category.quality_avg >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {category.quality_avg.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Safety Avg:</span>
              <span
                className={`ml-2 font-medium ${
                  category.safety_avg >= 80
                    ? 'text-green-600'
                    : category.safety_avg >= 70
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {category.safety_avg.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-medium text-gray-700">
                {category.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          {category.why_human && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Why this matters:</p>
                  <p className="text-sm text-gray-600">{category.why_human}</p>
                </div>
              </div>
            </div>
          )}
          {category.coach_note && (
            <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700">Coach Note:</p>
                  <p className="text-sm text-green-600">{category.coach_note}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TierSection({
  tierId,
  tierStats,
  categories,
}: {
  tierId: string;
  tierStats: { count: number; categories: number; health: string };
  categories: [string, CategoryVerification][];
}) {
  const [expanded, setExpanded] = useState(tierStats.count > 0);
  const config = TIER_CONFIG[tierId] || {
    name: tierId.replace(/_/g, ' '),
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: '',
  };

  return (
    <div className={`rounded-xl border border-gray-200 overflow-hidden ${config.bgColor}`}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <span className="text-xl">{tierStats.health === 'healthy' ? '✅' : tierStats.health === 'growing' ? '🟢' : tierStats.health === 'needs_data' ? '🟡' : '⚪'}</span>
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${config.color}`}>{config.name}</h3>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-gray-900">{tierStats.count}</div>
            <div className="text-xs text-gray-500">insights</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{tierStats.categories}</div>
            <div className="text-xs text-gray-500">categories</div>
          </div>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && categories.length > 0 && (
        <div className="bg-white border-t border-gray-200">
          {categories.map(([key, cat]) => (
            <CategoryRow key={key} category={cat} name={key} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VerificationPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['extraction-verification'],
    queryFn: fetchExtractionVerification,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Failed to load verification data</h2>
          <p className="text-gray-500">Please check if the backend is running</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Group categories by tier for aliveness, separate standard categories
  const standardCategories = Object.entries(data.categories).filter(
    ([_, cat]) => cat.type === 'standard'
  );

  const alivenesCategoriesByTier: Record<string, [string, CategoryVerification][]> = {};
  Object.entries(data.categories)
    .filter(([_, cat]) => cat.type === 'aliveness')
    .forEach(([key, cat]) => {
      const tier = cat.tier || 'other';
      if (!alivenesCategoriesByTier[tier]) {
        alivenesCategoriesByTier[tier] = [];
      }
      alivenesCategoriesByTier[tier].push([key, cat]);
    });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Extraction Verification</h1>
        <p className="text-gray-500 mt-1">
          Monitor extraction pipeline health and category coverage
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overall Health</p>
              <p className="text-3xl font-bold mt-1">{data.summary.overall_health_icon}</p>
              <p className="text-sm text-gray-600 capitalize mt-1">
                {data.summary.overall_health.replace(/_/g, ' ')}
              </p>
            </div>
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Insights</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.summary.total_insights.toLocaleString()}
              </p>
            </div>
            <Lightbulb className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categories Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.summary.categories_with_data}
                <span className="text-lg text-gray-400">/{data.summary.total_categories}</span>
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Coverage</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.summary.coverage_percentage.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12">
              <svg className="transform -rotate-90 w-12 h-12">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="4"
                  strokeDasharray={`${data.summary.coverage_percentage * 1.26} 126`}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
          <ul className="space-y-1">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-blue-700">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aliveness Categories by Tier */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Aliveness Categories (Texture Markers)
        </h2>
        <div className="space-y-4">
          {Object.keys(TIER_CONFIG).map((tierId) => (
            <TierSection
              key={tierId}
              tierId={tierId}
              tierStats={data.tiers[tierId] || { count: 0, categories: 0, health: 'not_started' }}
              categories={alivenesCategoriesByTier[tierId] || []}
            />
          ))}
        </div>
      </div>

      {/* Standard Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Standard Extraction Categories
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {standardCategories.map(([key, cat]) => (
            <CategoryRow key={key} category={cat} name={key} />
          ))}
        </div>
      </div>
    </div>
  );
}
