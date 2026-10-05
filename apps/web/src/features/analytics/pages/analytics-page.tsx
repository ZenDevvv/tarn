import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics-api';
import { AnalyticsHeader } from '../components/analytics-header';
import { AnalyticsKpiStrip } from '../components/analytics-kpi-strip';
import { AnalyticsFunnel } from '../components/analytics-funnel';
import { PlatformBreakdown } from '../components/platform-breakdown';
import { VelocityTrend } from '../components/velocity-trend';
import { TimingMetrics } from '../components/timing-metrics';
import { WorkSetupAndSalary } from '../components/work-setup-and-salary';
import { StatusDistribution } from '../components/status-distribution';
import { Loader2, Plus, AlertCircle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AnalyticsPage() {
  const [range, setRange] = useState<'all' | '30d' | '90d' | 'ytd'>('all');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analytics-overview', range],
    queryFn: () => analyticsApi.getOverview(range),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 w-full">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-small text-muted-foreground font-sans">
          Computing job-search metrics...
        </span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-lg text-center my-8 w-full max-w-xl mx-auto flex flex-col items-center gap-3">
        <AlertCircle size={28} className="text-destructive" />
        <div>
          <p className="text-body font-medium text-destructive">Failed to load analytics</p>
          <p className="text-small text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Please check your connection and try again.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 px-3.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-small font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const {
    kpis,
    funnel,
    platforms,
    workSetups,
    weeklyVelocity,
    monthlyVelocity,
    timing,
    salaryInsights,
    statusDistribution,
  } = data;

  // Empty state when user has zero applications in range
  if (kpis.totalApplications === 0 && range === 'all') {
    return (
      <div className="flex flex-col gap-8 w-full">
        <AnalyticsHeader
          range={range}
          onRangeChange={setRange}
          totalApplications={0}
        />
        <div className="p-12 sm:p-16 rounded-lg bg-card border border-border text-center flex flex-col items-center gap-4 max-w-lg mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary grid place-items-center">
            <BarChart3 size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-display font-semibold text-[20px] text-foreground tracking-tight">
              No applications recorded yet
            </h2>
            <p className="text-[14px] text-muted-foreground font-sans mt-1 leading-relaxed">
              As you apply to jobs, track recruiter messages, and complete interviews, the Analytics Hub will generate descriptive funnel dynamics and yield metrics.
            </p>
          </div>
          <Link
            to="/applications/new"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-[13px] no-underline transition-colors mt-2"
          >
            <Plus size={16} strokeWidth={1.5} />
            <span>Add your first application</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 w-full animate-in fade-in duration-200">
      {/* 1. Header with Range Switcher */}
      <AnalyticsHeader
        range={range}
        onRangeChange={setRange}
        totalApplications={kpis.totalApplications}
      />

      {/* 2. Top-level KPIs Strip */}
      <AnalyticsKpiStrip kpis={kpis} />

      {/* 3. Conversion Funnel */}
      <AnalyticsFunnel funnel={funnel} />

      {/* 4. Two-Column Analytical Section: Platforms & Velocity */}
      <div className="grid grid-cols-2 max-[1023px]:grid-cols-1 gap-10">
        <PlatformBreakdown platforms={platforms} />
        <VelocityTrend weekly={weeklyVelocity} monthly={monthlyVelocity} />
      </div>

      {/* 5. Timing & Cycle Speed Metrics */}
      <TimingMetrics timing={timing} />

      {/* 6. Work Environment & Salary Insights */}
      <WorkSetupAndSalary workSetups={workSetups} salaryInsights={salaryInsights} />

      {/* 7. Comprehensive 12-Stage Distribution */}
      <StatusDistribution distribution={statusDistribution} />
    </div>
  );
}
