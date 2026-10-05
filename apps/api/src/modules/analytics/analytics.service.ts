import { prisma, ApplicationStatus } from '@tracker/database';
import { DashboardAnalyticsDTO } from '@tracker/types';

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

    const closedStatuses: ApplicationStatus[] = [
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.NO_RESPONSE,
    ];

    const interviewStatuses: ApplicationStatus[] = [
      ApplicationStatus.HR_INTERVIEW,
      ApplicationStatus.TECHNICAL_INTERVIEW,
      ApplicationStatus.FINAL_INTERVIEW,
    ];

    // Parallel queries
    const [
      allApplications,
      pendingFollowUps,
      recentApplications,
      realUpcomingInterviews,
    ] = await Promise.all([
      // 1. All non-archived applications for user
      prisma.application.findMany({
        where: { userId, archivedAt: null },
        include: { company: true, job: true },
      }),

      // 2. Pending follow-ups
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

      // 3. Top 6 recent applications
      prisma.application.findMany({
        where: { userId, archivedAt: null },
        include: { company: true, job: true },
        orderBy: { appliedAt: 'desc' },
        take: 6,
      }),

      // 4. Real scheduled upcoming interviews
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

    // Active applications (not closed)
    const activeApps = allApplications.filter((a) => !closedStatuses.includes(a.status));
    const interviewApps = allApplications.filter((a) => interviewStatuses.includes(a.status));

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

    // Pipeline status map
    const pipeline: Record<ApplicationStatus, number> = {
      SAVED: 0,
      APPLIED: 0,
      APPLICATION_VIEWED: 0,
      RECRUITER_CONTACTED: 0,
      HR_INTERVIEW: 0,
      TECHNICAL_INTERVIEW: 0,
      FINAL_INTERVIEW: 0,
      OFFER: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
      NO_RESPONSE: 0,
    };

    for (const app of allApplications) {
      if (pipeline[app.status] !== undefined) {
        pipeline[app.status]++;
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
            stage: app.status.replace(/_/g, ' ').toLowerCase(),
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
  ) {
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

    const applications = await prisma.application.findMany({
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
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
        timelineEvents: {
          orderBy: { occurredAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const closedStatuses: ApplicationStatus[] = [
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.NO_RESPONSE,
    ];

    const interviewStatuses: ApplicationStatus[] = [
      ApplicationStatus.HR_INTERVIEW,
      ApplicationStatus.TECHNICAL_INTERVIEW,
      ApplicationStatus.FINAL_INTERVIEW,
      ApplicationStatus.OFFER,
      ApplicationStatus.ACCEPTED,
    ];

    const offerStatuses: ApplicationStatus[] = [
      ApplicationStatus.OFFER,
      ApplicationStatus.ACCEPTED,
    ];

    const responseStatuses: ApplicationStatus[] = [
      ApplicationStatus.APPLICATION_VIEWED,
      ApplicationStatus.RECRUITER_CONTACTED,
      ApplicationStatus.HR_INTERVIEW,
      ApplicationStatus.TECHNICAL_INTERVIEW,
      ApplicationStatus.FINAL_INTERVIEW,
      ApplicationStatus.OFFER,
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
    ];

    const totalApplications = applications.length;
    const activeApplications = applications.filter((a) => !closedStatuses.includes(a.status)).length;
    const closedApplications = applications.filter((a) => closedStatuses.includes(a.status)).length;

    // Responded applications
    const respondedApps = applications.filter(
      (a) =>
        responseStatuses.includes(a.status) ||
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
      (a) => interviewStatuses.includes(a.status) || a.interviews.length > 0
    );
    const interviewCount = interviewApps.length;
    const interviewRate = totalApplications > 0 ? Number(((interviewCount / totalApplications) * 100).toFixed(1)) : 0;

    // Offer applications
    const offerApps = applications.filter((a) => offerStatuses.includes(a.status));
    const offerCount = offerApps.length;
    const offerRate = totalApplications > 0 ? Number(((offerCount / totalApplications) * 100).toFixed(1)) : 0;

    // Rejection count
    const rejectionApps = applications.filter((a) => a.status === ApplicationStatus.REJECTED);
    const rejectionCount = rejectionApps.length;
    const rejectionRate = totalApplications > 0 ? Number(((rejectionCount / totalApplications) * 100).toFixed(1)) : 0;

    // Funnel calculations
    const appliedApps = applications.filter((a) => a.status !== ApplicationStatus.SAVED);
    const funnelBase = Math.max(appliedApps.length, totalApplications);

    const screenStages: ApplicationStatus[] = [
      ApplicationStatus.HR_INTERVIEW,
      ApplicationStatus.TECHNICAL_INTERVIEW,
      ApplicationStatus.FINAL_INTERVIEW,
      ApplicationStatus.OFFER,
      ApplicationStatus.ACCEPTED,
    ];

    const techStages: ApplicationStatus[] = [
      ApplicationStatus.TECHNICAL_INTERVIEW,
      ApplicationStatus.FINAL_INTERVIEW,
      ApplicationStatus.OFFER,
      ApplicationStatus.ACCEPTED,
    ];

    const finalStages: ApplicationStatus[] = [
      ApplicationStatus.FINAL_INTERVIEW,
      ApplicationStatus.OFFER,
      ApplicationStatus.ACCEPTED,
    ];

    const screenApps = applications.filter(
      (a) =>
        screenStages.includes(a.status) ||
        a.interviews.some((iv) => iv.type === 'HR' || iv.round >= 1)
    );

    const techApps = applications.filter(
      (a) =>
        techStages.includes(a.status) ||
        a.interviews.some((iv) => iv.type === 'TECHNICAL' || iv.round >= 2)
    );

    const finalApps = applications.filter(
      (a) =>
        finalStages.includes(a.status) ||
        a.interviews.some((iv) => iv.type === 'FINAL' || iv.round >= 3)
    );


    const funnelStagesRaw = [
      { id: 'applied', name: 'Applications submitted', count: funnelBase },
      { id: 'responded', name: 'Responses / Viewed', count: responseCount },
      { id: 'screening', name: 'Screening / HR round', count: screenApps.length },
      { id: 'technical', name: 'Technical interview', count: techApps.length },
      { id: 'final', name: 'Final round', count: finalApps.length },
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
      if (!closedStatuses.includes(app.status)) entry.active++;
      if (interviewStatuses.includes(app.status) || app.interviews.length > 0) entry.interviews++;
      if (offerStatuses.includes(app.status)) entry.offers++;
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
      if (interviewStatuses.includes(app.status) || app.interviews.length > 0) {
        setupCounts[key].interviews++;
      }
    }

    const workSetupLabels: Record<string, string> = {
      REMOTE: 'Remote',
      HYBRID: 'Hybrid',
      ONSITE: 'On-site',
      UNSPECIFIED: 'Unspecified',
    };

    const workSetups = Object.entries(setupCounts)
      .filter(([_, stats]) => stats.count > 0 || totalApplications === 0)
      .map(([setup, stats]) => ({
        setup: setup as any,
        label: workSetupLabels[setup] || setup,
        count: stats.count,
        percentage: totalApplications > 0 ? Number(((stats.count / totalApplications) * 100).toFixed(1)) : 0,
        interviewCount: stats.interviews,
        interviewRate: stats.count > 0 ? Number(((stats.interviews / stats.count) * 100).toFixed(1)) : 0,
      }));

    // Weekly velocity for 12 weeks
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - distanceToMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const weeklyVelocity: Array<{ label: string; count: number; isCurrent?: boolean }> = [];
    for (let i = 11; i >= 0; i--) {
      const wStart = new Date(startOfCurrentWeek);
      wStart.setDate(wStart.getDate() - i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 7);

      const count = applications.filter((a) => {
        const d = a.appliedAt || a.createdAt;
        return d >= wStart && d < wEnd;
      }).length;

      const m = wStart.toLocaleDateString('en-US', { month: 'short' });
      const day = wStart.getDate();
      weeklyVelocity.push({
        label: `${m} ${day}`,
        count,
        isCurrent: i === 0,
      });
    }

    // Monthly velocity for 6 months
    const monthlyVelocity: Array<{ label: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
      const nextMDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1, 0, 0, 0);

      const count = applications.filter((a) => {
        const d = a.appliedAt || a.createdAt;
        return d >= mDate && d < nextMDate;
      }).length;

      const label = mDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyVelocity.push({ label, count });
    }

    // Timing metrics
    const responseDaysList: number[] = [];
    const interviewDaysList: number[] = [];
    const rejectionDaysList: number[] = [];

    for (const app of applications) {
      const startDate = app.appliedAt || app.createdAt;

      // Response timing
      if (responseStatuses.includes(app.status) || app.interviews.length > 0) {
        const firstEvent = app.timelineEvents.find(
          (e) =>
            e.type === 'INTERVIEW_SCHEDULED' ||
            (e.type === 'STATUS_CHANGED' &&
              !e.title.toLowerCase().includes('applied') &&
              !e.title.toLowerCase().includes('saved'))
        );
        const eventDate = firstEvent ? firstEvent.occurredAt : app.updatedAt;
        const days = Math.max(0, (eventDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        responseDaysList.push(days);
      }

      // Interview timing
      if (app.interviews.length > 0) {
        const firstScheduled = app.interviews[0].scheduledAt;
        const days = Math.max(0, (firstScheduled.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        interviewDaysList.push(days);
      }

      // Rejection timing
      if (app.status === ApplicationStatus.REJECTED) {
        const rejEvent = app.timelineEvents.find(
          (e) => e.type === 'STATUS_CHANGED' && e.title.toLowerCase().includes('rejected')
        );
        const rejDate = rejEvent ? rejEvent.occurredAt : app.updatedAt;
        const days = Math.max(0, (rejDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        rejectionDaysList.push(days);
      }
    }

    const calcAvg = (arr: number[]) =>
      arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : null;

    const timing = {
      avgDaysToResponse: calcAvg(responseDaysList),
      avgDaysToInterview: calcAvg(interviewDaysList),
      avgDaysToRejection: calcAvg(rejectionDaysList),
    };

    // Salary insights
    const salaryJobs = applications
      .map((a) => a.job)
      .filter((j): j is NonNullable<typeof j> => !!j && (j.salaryMin != null || j.salaryMax != null));

    const disclosedCount = salaryJobs.length;
    const disclosedPercentage =
      totalApplications > 0 ? Number(((disclosedCount / totalApplications) * 100).toFixed(1)) : 0;

    let avgSalaryMin: number | null = null;
    let avgSalaryMax: number | null = null;
    const currency = salaryJobs[0]?.currency || 'USD';

    if (disclosedCount > 0) {
      const minSalaries = salaryJobs.map((j) => j.salaryMin).filter((s): s is number => typeof s === 'number');
      const maxSalaries = salaryJobs.map((j) => j.salaryMax).filter((s): s is number => typeof s === 'number');

      if (minSalaries.length > 0) {
        avgSalaryMin = Math.round(minSalaries.reduce((a, b) => a + b, 0) / minSalaries.length);
      }
      if (maxSalaries.length > 0) {
        avgSalaryMax = Math.round(maxSalaries.reduce((a, b) => a + b, 0) / maxSalaries.length);
      }
    }

    const salaryInsights = {
      disclosedCount,
      disclosedPercentage,
      avgSalaryMin,
      avgSalaryMax,
      currency,
    };

    // Complete 12-status distribution
    const allStatuses = Object.values(ApplicationStatus);
    const statusCounts: Record<ApplicationStatus, number> = {} as any;
    for (const s of allStatuses) {
      statusCounts[s] = 0;
    }
    for (const app of applications) {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    }

    const statusDistribution = allStatuses.map((status) => ({
      status,
      count: statusCounts[status],
      percentage:
        totalApplications > 0 ? Number(((statusCounts[status] / totalApplications) * 100).toFixed(1)) : 0,
    }));

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

