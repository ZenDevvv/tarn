import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DashboardHeader } from '../components/dashboard-header';
import { NeedsYouToday } from '../components/needs-you-today';
import { StatsStrip } from '../components/stats-strip';
import { UpcomingInterviews } from '../components/upcoming-interviews';
import { WeeklyVelocityChart } from '../components/weekly-velocity-chart';
import { PipelineStrip } from '../components/pipeline-strip';
import { RecentApplicationsTable } from '../components/recent-applications-table';
import { Loader2 } from 'lucide-react';

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<any>('/analytics/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 w-full">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-small text-muted-foreground font-sans">
          Loading dashboard metrics...
        </span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-lg text-center my-8 w-full">
        <p className="text-body font-medium text-destructive">Failed to load dashboard metrics</p>
        <p className="text-small text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Please check your connection and try again.'}
        </p>
      </div>
    );
  }

  const { summary, weeklyVelocity, pipeline, upcomingInterviews, recentApplications, todayFollowUps } = data;

  const totalApplications = Object.values(pipeline as Record<string, number>).reduce(
    (a: number, b: number) => a + b,
    0
  );

  return (
    <div className="flex flex-col gap-10 w-full">
      {/* 1. Header */}
      <DashboardHeader />

      {/* 2. Needs you today */}
      <NeedsYouToday items={todayFollowUps || []} />

      {/* 3. Summary Stats Strip */}
      <StatsStrip summary={summary} />

      {/* 4. Two-column grid: Upcoming Interviews & Applications per week */}
      <div className="grid grid-cols-2 max-[1023px]:grid-cols-1 gap-12 max-[1023px]:gap-10">
        <UpcomingInterviews interviews={upcomingInterviews || []} />
        <WeeklyVelocityChart velocity={weeklyVelocity} />
      </div>

      {/* 5. Pipeline Strip */}
      <PipelineStrip pipeline={pipeline} />

      {/* 6. Recent Applications Table */}
      <RecentApplicationsTable
        applications={recentApplications || []}
        totalCount={totalApplications}
      />
    </div>
  );
}
