'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStatistics, fetchInsights } from '@/lib/api';
import {
  Loader2,
  Video,
  Clock,
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: fetchStatistics,
  });

  const { data: allInsights } = useQuery({
    queryKey: ['all-insights'],
    queryFn: () => fetchInsights(undefined, undefined, 1000),
  });

  // Calculate quality score distribution
  const qualityDistribution = allInsights
    ? [
        { name: '90-100', count: allInsights.filter((i) => i.quality_score >= 90).length },
        { name: '80-89', count: allInsights.filter((i) => i.quality_score >= 80 && i.quality_score < 90).length },
        { name: '70-79', count: allInsights.filter((i) => i.quality_score >= 70 && i.quality_score < 80).length },
        { name: '60-69', count: allInsights.filter((i) => i.quality_score >= 60 && i.quality_score < 70).length },
        { name: '<60', count: allInsights.filter((i) => i.quality_score < 60).length },
      ]
    : [];

  // Calculate category distribution
  const categoryData = stats?.category_distribution
    ? Object.entries(stats.category_distribution)
        .map(([name, count]) => ({
          name: name.replace(/_/g, ' ').slice(0, 15),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  // Calculate status breakdown
  const statusData = stats
    ? [
        { name: 'Approved', value: stats.approved_insights, color: '#22c55e' },
        { name: 'Pending', value: stats.pending_insights, color: '#f59e0b' },
        { name: 'Rejected', value: stats.rejected_insights, color: '#ef4444' },
      ]
    : [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
        <p className="text-gray-500 mt-1">
          Overview of training data collection progress
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Videos Processed"
          value={stats?.total_videos_processed || 0}
          icon={Video}
          color="bg-blue-500"
        />
        <StatCard
          title="Hours Analyzed"
          value={(stats?.total_hours_analyzed || 0).toFixed(1)}
          icon={Clock}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Insights"
          value={stats?.total_insights || 0}
          icon={Lightbulb}
          color="bg-leaf-500"
        />
        <StatCard
          title="Approved"
          value={stats?.approved_insights || 0}
          subtitle={`${stats?.total_insights ? ((stats.approved_insights / stats.total_insights) * 100).toFixed(0) : 0}% approval rate`}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Status Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Insight Status</h3>
          {statusData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              No data yet
            </div>
          )}
        </div>

        {/* Quality Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Quality Score Distribution</h3>
          {qualityDistribution.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={qualityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Category Distribution</h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
