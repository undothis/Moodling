'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStatistics, fetchJobs, fetchInsights } from '@/lib/api';
import {
  Video,
  Clock,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  const statusColors: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-700',
    downloading: 'bg-blue-100 text-blue-700',
    transcribing: 'bg-purple-100 text-purple-700',
    diarizing: 'bg-indigo-100 text-indigo-700',
    extracting_prosody: 'bg-pink-100 text-pink-700',
    analyzing_facial: 'bg-orange-100 text-orange-700',
    extracting_insights: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <code className="text-sm text-gray-600">{job.video_id}</code>
        <span
          className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full',
            statusColors[job.status] || 'bg-gray-100'
          )}
        >
          {job.status}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-2">{job.current_step}</p>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-leaf-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${job.progress}%` }}
        />
      </div>
      {job.insights_count > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {job.insights_count} insights extracted
        </p>
      )}
    </div>
  );
}

function RecentInsight({ insight }: { insight: any }) {
  const categoryColors: Record<string, string> = {
    emotional_struggles: 'bg-red-100 text-red-700',
    coping_strategies: 'bg-blue-100 text-blue-700',
    growth_moments: 'bg-green-100 text-green-700',
    vulnerability: 'bg-purple-100 text-purple-700',
    humor_wit: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
          {insight.title}
        </h4>
        <span
          className={clsx(
            'px-2 py-0.5 text-xs font-medium rounded',
            categoryColors[insight.category] || 'bg-gray-100 text-gray-700'
          )}
        >
          {insight.category.replace(/_/g, ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{insight.insight}</p>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span>Quality: {insight.quality_score}</span>
        <span>Safety: {insight.safety_score}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: fetchStatistics,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    refetchInterval: 5000, // Poll for updates
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', 'pending'],
    queryFn: () => fetchInsights('pending', undefined, 5),
  });

  const activeJobs = jobs?.filter((j) => !['completed', 'failed'].includes(j.status)) || [];
  const recentJobs = jobs?.slice(0, 5) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of training data harvesting progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </>
        ) : (
          <>
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
              subtitle={`${stats?.approved_insights || 0} approved`}
              icon={Lightbulb}
              color="bg-leaf-500"
            />
            <StatCard
              title="Pending Review"
              value={stats?.pending_insights || 0}
              icon={AlertCircle}
              color="bg-yellow-500"
            />
          </>
        )}
      </div>

      {/* Active Jobs & Recent Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Processing Jobs
            </h2>
            {activeJobs.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {activeJobs.length} active
              </span>
            )}
          </div>

          {jobsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No processing jobs yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Go to Process to start harvesting
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <JobCard key={job.job_id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Insights */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Insights
            </h2>
            {insights && insights.length > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                {insights.length} to review
              </span>
            )}
          </div>

          {insightsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !insights || insights.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">
                No insights pending review
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <RecentInsight key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
