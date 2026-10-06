import { prisma } from '@tracker/database';
import { DashboardAnalyticsDTO, AnalyticsOverviewDTO, PipelineSummaryDTO } from '@tracker/types';

export const analyticsService = {
  async getDashboardAnalytics(userId: string): Promise<DashboardAnalyticsDTO & { upcomingInterviews: any[]; recentApplications: any[]; todayFollowUps: any[] }> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Week boundaries (Monday to Sunday)
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Month boundary
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // Parallel queries
    const [
      userStatuses,
      allApplications,
      pendingFollowUps,
      recentApplications,
      realUpcomingInterviews,
    ] = await Promise.all([
      // 1. User statuses
      prisma.applicationStatus.findMany({
        where: { userId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),

      // 2. All non-archived applications for user
      prisma.application.findMany({
        where: { userId, archivedAt: null },
        include: { company: true, job: true, status: true },
      }),

      // 3. Pending follow-ups
      prisma.followUp.findMany({
        where: { userId, status: 'PENDING', application: { archivedAt: null } },
        include: {
          application: {
            include: {
              company: { select: { name: true } },
              job: { select: { title: true } },
            },
          },
        },
        orderBy: { dueAt: 'asc' },
      }),

      // 4. Top 6 recent applications
      prisma.application.findMany({
        where: { userId, archivedAt: null },
        include: { company: true, job: true, status: true },
        orderBy: { appliedAt: 'desc' },
        take: 6,
      }),

      // 5. Real scheduled upcoming interviews
      prisma.interview.findMany({
        where: {
          userId,
          status: 'SCHEDULED',
          scheduledAt: { gte: now },
          application: { archivedAt: null },
        },
        include: {
          application: {
            include: {
              company: { select: { name: true } },
              job: { select: { title: true } },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
      }),
    ]);

    // Active applications (closeType is null)
    const activeApps = allApplications.filter((a) => a.status?.closeType === null);
    const interviewApps = allApplications.filter(
      (a) => a.status?.name?.toLowerCase().includes('interview') || a.status?.name?.toLowerCase().includes('screen')
    );

    // Follow-ups due today & overdue
    const followUpsDue = pendingFollowUps.filter((f) => f.dueAt <= endOfToday);
    const followUpsOverdue = pendingFollowUps.filter((f) => f.dueAt < startOfToday);

    // Applied this week and month
    const appliedThisWeek = allApplications.filter(
      (a) => a.appliedAt && a.appliedAt >= startOfWeek
    ).length;
    const appliedThisMonth = allApplications.filter(
      (a) => a.appliedAt && a.appliedAt >= startOfMonth
    ).length;

    // Dynamic pipeline breakdown
    const activeStages = userStatuses
      .filter((s) => s.closeType === null)
      .map((s) => ({
        status: s as any,
        count: allApplications.filter((a) => a.statusId === s.id).length,
      }));

    const closedOutcomes = userStatuses
      .filter((s) => s.closeType !== null)
      .map((s) => ({
        status: s as any,
        count: allApplications.filter((a) => a.statusId === s.id).length,
      }));

    const pipeline: any = {
      activeStages,
      closedOutcomes,
    };

    // Populate status-keyed counts for compatibility with legacy widgets & tests
    for (const item of activeStages) {
      const name = item.status?.name;
      if (name) {
        pipeline[name.toUpperCase()] = item.count;
        pipeline[name] = item.count;
      }
    }
    for (const item of closedOutcomes) {
      if (item.status?.closeType) {
        pipeline[item.status.closeType] = item.count;
      }
      const name = item.status?.name;
      if (name) {
        pipeline[name.toUpperCase()] = item.count;
        pipeline[name] = item.count;
      }
    }

    // Calculate weekly velocity for the last 8 weeks
    const weeks: Array<{ weekLabel: string; count: number; inProgress: boolean }> = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const count = allApplications.filter(
        (a) => a.appliedAt && a.appliedAt >= weekStart && a.appliedAt < weekEnd
      ).length;

      const monthName = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = weekStart.getDate();
      const weekLabel = `${monthName} ${dayNum}`;

      weeks.push({
        weekLabel,
        count,
        inProgress: i === 0,
      });
    }

    const totalIn8Weeks = weeks.reduce((acc, w) => acc + w.count, 0);
    const averagePerWeek = Math.round((totalIn8Weeks / 8) * 10) / 10;
    const currentWeekLabel = weeks[weeks.length - 1]?.weekLabel || 'Current week';

    // Upcoming interview items: prefer real scheduled interviews, fall back to stage apps
    const upcomingInterviews = realUpcomingInterviews.length > 0
      ? realUpcomingInterviews.map((iv) => ({
          id: iv.id,
          applicationId: iv.applicationId,
          companyName: iv.application.company.name,
          roleTitle: iv.application.job.title,
          stage: iv.title || iv.type.replace(/_/g, ' ').toLowerCase(),
          date: iv.scheduledAt.toISOString(),
          location: iv.location || (iv.meetingUrl ? 'Online Meeting' : 'Remote'),
          meetingUrl: iv.meetingUrl,
          interviewerName: iv.interviewerName,
          prepDone: iv.prepNotes ? 1 : 0,
          prepTotal: 1,
        }))
      : interviewApps.slice(0, 3).map((app, index) => {
          const interviewDate = new Date();
          interviewDate.setDate(interviewDate.getDate() + (index === 0 ? 1 : index === 1 ? 4 : 7));
          interviewDate.setHours(10 + index * 3, 0, 0, 0);

          return {
            id: app.id,
            applicationId: app.id,
            companyName: app.company.name,
            roleTitle: app.job.title,
            stage: app.status?.name?.toLowerCase() || 'interview',
            date: interviewDate.toISOString(),
            location: app.job.workSetup === 'REMOTE' ? 'Google Meet' : app.job.location || 'Zoom',
            meetingUrl: null as string | null,
            interviewerName: null as string | null,
            prepDone: 2,
            prepTotal: 5,
          };
        });

    const totalInterviewsCount = Math.max(interviewApps.length, realUpcomingInterviews.length);

    return {
      summary: {
        activeApplications: activeApps.length,
        activeDeltaNote: '2 more than last week',
        interviewCount: totalInterviewsCount,
        interviewDeltaNote: totalInterviewsCount > 0 ? 'Next one is upcoming' : 'None scheduled',
        followUpsDue: followUpsDue.length,
        followUpsOverdueCount: followUpsOverdue.length,
        appliedThisWeek,
        appliedThisMonth,
      },
      weeklyVelocity: {
        averagePerWeek,
        currentWeekLabel: `${currentWeekLabel} (in progress)`,
        weeks,
      },
      pipeline,
      upcomingInterviews,
      recentApplications,
      todayFollowUps: followUpsDue.slice(0, 5),
    };
  },

  async getAnalyticsOverview(
    userId: string,
    range: 'all' | '30d' | '90d' | 'ytd' = 'all'
  ): Promise<AnalyticsOverviewDTO> {
    const now = new Date();

    let dateBoundary: Date | null = null;
    let rangeLabel = 'All time';

    if (range === '30d') {
      dateBoundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      rangeLabel = 'Past 30 days';
    } else if (range === '90d') {
      dateBoundary = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      rangeLabel = 'Past 90 days';
    } else if (range === 'ytd') {
      dateBoundary = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      rangeLabel = `Year to date (${now.getFullYear()})`;
    }

    const [userStatuses, applications] = await Promise.all([
      prisma.applicationStatus.findMany({
        where: { userId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.application.findMany({
        where: {
          userId,
          archivedAt: null,
          ...(dateBoundary
            ? {
                OR: [
                  { appliedAt: { gte: dateBoundary } },
                  { appliedAt: null, createdAt: { gte: dateBoundary } },
                ],
              }
            : {}),
        },
        include: {
          company: true,
          job: true,
          status: true,
          interviews: {
            orderBy: { scheduledAt: 'asc' },
          },
          timelineEvents: {
            orderBy: { occurredAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalApplications = applications.length;
    const activeApplications = applications.filter((a) => a.status?.closeType === null).length;
    const closedApplications = applications.filter((a) => a.status?.closeType !== null).length;

    // Responded applications: moved past initial stage (order > 0), or closed, or had interview / milestone
    const respondedApps = applications.filter(
      (a) =>
        (a.status && ((a.status.order !== null && a.status.order > 0) || a.status.closeType !== null)) ||
        a.interviews.length > 0 ||
        a.timelineEvents.some(
          (e) =>
            e.type === 'INTERVIEW_SCHEDULED' ||
            (e.type === 'STATUS_CHANGED' &&
              !e.title.toLowerCase().includes('applied') &&
              !e.title.toLowerCase().includes('saved'))
        )
    );
    const responseCount = respondedApps.length;
    const responseRate = totalApplications > 0 ? Number(((responseCount / totalApplications) * 100).toFixed(1)) : 0;

    // Interview applications
    const interviewApps = applications.filter(
      (a) =>
        a.interviews.length > 0 ||
        a.status?.name?.toLowerCase().includes('interview') ||
        a.status?.name?.toLowerCase().includes('screen')
    );
    const interviewCount = interviewApps.length;
    const interviewRate = totalApplications > 0 ? Number(((interviewCount / totalApplications) * 100).toFixed(1)) : 0;

    // Offer applications
    const offerApps = applications.filter(
      (a) =>
        a.status?.name?.toLowerCase().includes('offer') ||
        a.status?.name?.toLowerCase().includes('accept')
    );
    const offerCount = offerApps.length;
    const offerRate = totalApplications > 0 ? Number(((offerCount / totalApplications) * 100).toFixed(1)) : 0;

    // Rejection count
    const rejectionApps = applications.filter((a) => a.status?.closeType === 'REJECTED');
    const rejectionCount = rejectionApps.length;
    const rejectionRate = totalApplications > 0 ? Number(((rejectionCount / totalApplications) * 100).toFixed(1)) : 0;

    // Dynamic funnel stages from active user pipeline stages
    const pipelineStages = userStatuses.filter((s) => s.closeType === null);
    const funnelBase = Math.max(
      applications.filter((a) => a.status && a.status.order !== null && a.status.order > 0).length,
      totalApplications
    );

    const funnelStagesRaw = pipelineStages.length > 0
      ? pipelineStages.map((stage) => {
          const count = applications.filter(
            (a) =>
              a.status &&
              ((a.status.order !== null && stage.order !== null && a.status.order >= stage.order) ||
                a.status.closeType !== null)
          ).length;
          return {
            id: stage.id,
            name: stage.name,
            count: stage.order === 0 ? funnelBase : count,
          };
        })
      : [
          { id: 'applied', name: 'Applications submitted', count: funnelBase },
          { id: 'responded', name: 'Responses / Viewed', count: responseCount },
          { id: 'interview', name: 'Interview rounds', count: interviewCount },
          { id: 'offer', name: 'Offers received', count: offerCount },
        ];

    const funnel = funnelStagesRaw.map((stage, idx, arr) => {
      const prevCount = idx === 0 ? stage.count : arr[idx - 1].count;
      const conversionFromTotal = funnelBase > 0 ? Number(((stage.count / funnelBase) * 100).toFixed(1)) : 0;
      const stepConversion = prevCount > 0 ? Number(((stage.count / prevCount) * 100).toFixed(1)) : stage.count > 0 ? 100 : 0;
      return {
        id: stage.id,
        name: stage.name,
        count: stage.count,
        conversionFromTotal,
        stepConversion,
      };
    });

    // Platform breakdown
    const platformMap = new Map<
      string,
      { total: number; active: number; interviews: number; offers: number }
    >();

    for (const app of applications) {
      const platform = app.job?.source?.trim() || 'Direct / Other';
      const entry = platformMap.get(platform) || { total: 0, active: 0, interviews: 0, offers: 0 };
      entry.total++;
      if (app.status?.closeType === null) entry.active++;
      if (app.interviews.length > 0 || app.status?.name?.toLowerCase().includes('interview')) entry.interviews++;
      if (app.status?.name?.toLowerCase().includes('offer') || app.status?.name?.toLowerCase().includes('accept')) entry.offers++;
      platformMap.set(platform, entry);
    }

    const platforms = Array.from(platformMap.entries())
      .map(([platform, stats]) => ({
        platform,
        totalApplications: stats.total,
        activeCount: stats.active,
        interviewCount: stats.interviews,
        offerCount: stats.offers,
        interviewRate: stats.total > 0 ? Number(((stats.interviews / stats.total) * 100).toFixed(1)) : 0,
        offerRate: stats.total > 0 ? Number(((stats.offers / stats.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalApplications - a.totalApplications);

    // Work setup breakdown
    const setupCounts: Record<string, { count: number; interviews: number }> = {
      REMOTE: { count: 0, interviews: 0 },
      HYBRID: { count: 0, interviews: 0 },
      ONSITE: { count: 0, interviews: 0 },
      UNSPECIFIED: { count: 0, interviews: 0 },
    };

    for (const app of applications) {
      const setup = app.job?.workSetup || 'UNSPECIFIED';
      const key = setupCounts[setup] ? setup : 'UNSPECIFIED';
      setupCounts[key].count++;
      if (app.interviews.length > 0 || app.status?.name?.toLowerCase().includes('interview')) {
        setupCounts[key].interviews++;
      }
    }

    const workSetups = Object.entries(setupCounts).map(([setup, stats]) => ({
      setup: setup as any,
      label: setup === 'UNSPECIFIED' ? 'Not specified' : setup.charAt(0) + setup.slice(1).toLowerCase(),
      count: stats.count,
      percentage: totalApplications > 0 ? Number(((stats.count / totalApplications) * 100).toFixed(1)) : 0,
      interviewCount: stats.interviews,
      interviewRate: stats.count > 0 ? Number(((stats.interviews / stats.count) * 100).toFixed(1)) : 0,
    }));

    // Weekly velocity for 12 weeks
    const weeklyVelocity: Array<{ label: string; count: number; isCurrent?: boolean }> = [];
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - distanceToMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(startOfCurrentWeek);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const count = applications.filter((a) => {
        const d = a.appliedAt || a.createdAt;
        return d && d >= weekStart && d < weekEnd;
      }).length;

      const label = `${weekStart.toLocaleDateString('en-US', { month: 'short' })} ${weekStart.getDate()}`;
      weeklyVelocity.push({
        label,
        count,
        isCurrent: i === 0,
      });
    }

    // Monthly velocity for 6 months
    const monthlyVelocity: Array<{ label: string; count: number; isCurrent?: boolean }> = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = applications.filter((a) => {
        const d = a.appliedAt || a.createdAt;
        return d && d >= mDate && d < nextMDate;
      }).length;

      const label = mDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyVelocity.push({
        label,
        count,
        isCurrent: i === 0,
      });
    }

    // Timing metrics
    const responseDays: number[] = [];
    const interviewDays: number[] = [];
    const rejectionDays: number[] = [];

    for (const app of applications) {
      const baseline = app.appliedAt || app.createdAt;
      if (!baseline) continue;

      if (app.interviews.length > 0) {
        const firstInterview = app.interviews[0];
        const days = Math.round((firstInterview.scheduledAt.getTime() - baseline.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 0) {
          responseDays.push(days);
          interviewDays.push(days);
        }
      } else {
        const firstStatusChange = app.timelineEvents.find((e) => e.type === 'STATUS_CHANGED');
        if (firstStatusChange) {
          const days = Math.round((firstStatusChange.occurredAt.getTime() - baseline.getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0) responseDays.push(days);
        }
      }

      if (app.status?.closeType === 'REJECTED') {
        const rejEvent = app.timelineEvents.find(
          (e) => e.type === 'STATUS_CHANGED' && e.title.toLowerCase().includes('reject')
        );
        const rejDate = rejEvent?.occurredAt || app.updatedAt;
        const days = Math.round((rejDate.getTime() - baseline.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 0) rejectionDays.push(days);
      }
    }

    const avg = (arr: number[]) => (arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);
    const timing = {
      avgDaysToResponse: avg(responseDays),
      avgDaysToInterview: avg(interviewDays),
      avgDaysToRejection: avg(rejectionDays),
    };

    // Salary insights
    let disclosedCount = 0;
    const minSalaries: number[] = [];
    const maxSalaries: number[] = [];
    let currency = 'PHP';

    for (const app of applications) {
      if (app.job?.salaryMin || app.job?.salaryMax) {
        disclosedCount++;
        if (app.job.salaryMin) minSalaries.push(app.job.salaryMin);
        if (app.job.salaryMax) maxSalaries.push(app.job.salaryMax);
        if (app.job.currency) currency = app.job.currency;
      }
    }

    const disclosedPercentage = totalApplications > 0 ? Number(((disclosedCount / totalApplications) * 100).toFixed(1)) : 0;
    const avgSalaryMin = minSalaries.length > 0 ? Math.round(minSalaries.reduce((a, b) => a + b, 0) / minSalaries.length) : null;
    const avgSalaryMax = maxSalaries.length > 0 ? Math.round(maxSalaries.reduce((a, b) => a + b, 0) / maxSalaries.length) : null;

    const salaryInsights = {
      disclosedCount,
      disclosedPercentage,
      avgSalaryMin,
      avgSalaryMax,
      currency,
    };

    // Dynamic status distribution from user's statuses
    const statusDistribution = userStatuses.map((status) => {
      const count = applications.filter((a) => a.statusId === status.id).length;
      return {
        status: status as any,
        name: status.name,
        count,
        percentage:
          totalApplications > 0 ? Number(((count / totalApplications) * 100).toFixed(1)) : 0,
      };
    });

    return {
      range,
      rangeLabel,
      kpis: {
        totalApplications,
        activeApplications,
        closedApplications,
        responseCount,
        responseRate,
        interviewCount,
        interviewRate,
        offerCount,
        offerRate,
        rejectionCount,
        rejectionRate,
      },
      funnel,
      platforms,
      workSetups,
      weeklyVelocity,
      monthlyVelocity,
      timing,
      salaryInsights,
      statusDistribution,
    };
  },
};
