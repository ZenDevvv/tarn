import { describe, it, expect } from 'vitest';
import { AnalyticsOverviewDTO } from '@tracker/types';

describe('Analytics Feature - Unit Tests', () => {
  const mockOverview: AnalyticsOverviewDTO = {
    range: 'all',
    rangeLabel: 'All time',
    kpis: {
      totalApplications: 20,
      activeApplications: 12,
      closedApplications: 8,
      responseCount: 10,
      responseRate: 50.0,
      interviewCount: 5,
      interviewRate: 25.0,
      offerCount: 2,
      offerRate: 10.0,
      rejectionCount: 6,
      rejectionRate: 30.0,
    },
    funnel: [
      { id: 'applied', name: 'Applications submitted', count: 20, conversionFromTotal: 100, stepConversion: 100 },
      { id: 'responded', name: 'Responses / Viewed', count: 10, conversionFromTotal: 50, stepConversion: 50 },
      { id: 'screening', name: 'Screening / HR round', count: 7, conversionFromTotal: 35, stepConversion: 70 },
      { id: 'technical', name: 'Technical interview', count: 5, conversionFromTotal: 25, stepConversion: 71.4 },
      { id: 'final', name: 'Final round', count: 3, conversionFromTotal: 15, stepConversion: 60 },
      { id: 'offer', name: 'Offers received', count: 2, conversionFromTotal: 10, stepConversion: 66.7 },
    ],
    platforms: [
      { platform: 'LinkedIn', totalApplications: 12, activeCount: 8, interviewCount: 4, offerCount: 2, interviewRate: 33.3, offerRate: 16.7 },
      { platform: 'Indeed', totalApplications: 5, activeCount: 3, interviewCount: 1, offerCount: 0, interviewRate: 20.0, offerRate: 0.0 },
      { platform: 'JobStreet', totalApplications: 3, activeCount: 1, interviewCount: 0, offerCount: 0, interviewRate: 0.0, offerRate: 0.0 },
    ],
    workSetups: [
      { setup: 'REMOTE', label: 'Remote', count: 14, percentage: 70.0, interviewCount: 4, interviewRate: 28.6 },
      { setup: 'HYBRID', label: 'Hybrid', count: 6, percentage: 30.0, interviewCount: 1, interviewRate: 16.7 },
    ],
    weeklyVelocity: [
      { label: 'Sep 1', count: 3, isCurrent: false },
      { label: 'Sep 8', count: 5, isCurrent: false },
      { label: 'Sep 15', count: 4, isCurrent: true },
    ],
    monthlyVelocity: [
      { label: 'Aug 2026', count: 8 },
      { label: 'Sep 2026', count: 12 },
    ],
    timing: {
      avgDaysToResponse: 3.5,
      avgDaysToInterview: 6.2,
      avgDaysToRejection: 12.0,
    },
    salaryInsights: {
      disclosedCount: 15,
      disclosedPercentage: 75.0,
      avgSalaryMin: 90000,
      avgSalaryMax: 120000,
      currency: 'USD',
    },
    statusDistribution: [
      { status: 'APPLIED', count: 6, percentage: 30.0 },
      { status: 'INTERVIEWING', count: 2, percentage: 10.0 },
      { status: 'OFFER', count: 2, percentage: 10.0 },
      { status: 'REJECTED', count: 6, percentage: 30.0 },
      { status: 'SAVED', count: 4, percentage: 20.0 },
    ] as any,
  };

  it('correctly reports KPI conversion metrics and rates', () => {
    expect(mockOverview.kpis.totalApplications).toBe(20);
    expect(mockOverview.kpis.activeApplications + mockOverview.kpis.closedApplications).toBe(20);
    expect(mockOverview.kpis.responseRate).toBe(50.0);
    expect(mockOverview.kpis.interviewRate).toBe(25.0);
    expect(mockOverview.kpis.offerRate).toBe(10.0);
  });

  it('maintains hierarchical step conversion across funnel stages', () => {
    expect(mockOverview.funnel.length).toBe(6);
    expect(mockOverview.funnel[0].count).toBeGreaterThanOrEqual(mockOverview.funnel[1].count);
    expect(mockOverview.funnel[1].count).toBeGreaterThanOrEqual(mockOverview.funnel[2].count);
    expect(mockOverview.funnel[2].count).toBeGreaterThanOrEqual(mockOverview.funnel[3].count);
    expect(mockOverview.funnel[3].count).toBeGreaterThanOrEqual(mockOverview.funnel[4].count);
    expect(mockOverview.funnel[4].count).toBeGreaterThanOrEqual(mockOverview.funnel[5].count);
  });

  it('computes platform interview conversion performance', () => {
    const linkedIn = mockOverview.platforms.find((p) => p.platform === 'LinkedIn');
    expect(linkedIn).toBeDefined();
    expect(linkedIn?.interviewRate).toBe(33.3);
    expect(linkedIn?.offerRate).toBe(16.7);
  });

  it('handles turnaround cycle timing metrics', () => {
    expect(mockOverview.timing.avgDaysToResponse).toBe(3.5);
    expect(mockOverview.timing.avgDaysToInterview).toBe(6.2);
    expect(mockOverview.timing.avgDaysToRejection).toBe(12.0);
  });
});
