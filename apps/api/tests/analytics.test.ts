import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Analytics API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `analytics_user_a_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Analytics User A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `analytics_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Analytics User B',
      });
    userBCookie = resB.headers['set-cookie'];

    // Create 3 sample applications for User A across different platforms and statuses
    const app1 = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Stripe',
        position: 'Frontend Engineer',
        source: 'LinkedIn',
        workSetup: 'REMOTE',
        salaryMin: 120000,
        salaryMax: 150000,
        currency: 'USD',
        status: 'INTERVIEWING',
        priority: 'HIGH',
      });
    expect(app1.status).toBe(201);

    const app2 = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Linear',
        position: 'Full Stack Engineer',
        source: 'Indeed',
        workSetup: 'REMOTE',
        salaryMin: 130000,
        salaryMax: 160000,
        currency: 'USD',
        status: 'OFFER',
        priority: 'HIGH',
      });
    expect(app2.status).toBe(201);

    const app3 = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Acme Corp',
        position: 'QA Engineer',
        source: 'LinkedIn',
        workSetup: 'HYBRID',
        salaryMin: 80000,
        salaryMax: 95000,
        currency: 'USD',
        status: 'REJECTED',
        priority: 'LOW',
      });
    expect(app3.status).toBe(201);

  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/analytics/overview');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/analytics/dashboard returns dashboard summary, velocity, and pipeline', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.weeklyVelocity).toBeDefined();
    expect(res.body.data.pipeline).toBeDefined();
    expect(res.body.data.pipeline.INTERVIEWING).toBe(1);
    expect(res.body.data.pipeline.OFFER).toBe(1);
    expect(res.body.data.pipeline.REJECTED).toBe(1);
  });

  it('GET /api/v1/analytics/overview returns comprehensive analytics DTO', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data).toBeDefined();
    expect(data.range).toBe('all');
    expect(data.rangeLabel).toBe('All time');

    // KPIs
    expect(data.kpis).toBeDefined();
    expect(data.kpis.totalApplications).toBe(3);
    expect(data.kpis.activeApplications).toBe(2); // Stripe and Linear are active, Acme is rejected
    expect(data.kpis.closedApplications).toBe(1);
    expect(data.kpis.offerCount).toBe(1);
    expect(data.kpis.offerRate).toBeGreaterThan(0);
    expect(data.kpis.rejectionCount).toBe(1);

    // Funnel
    expect(data.funnel).toBeDefined();
    expect(Array.isArray(data.funnel)).toBe(true);
    expect(data.funnel.length).toBe(5);
    expect(data.funnel[0].count).toBe(3);

    // Platforms
    expect(data.platforms).toBeDefined();
    expect(Array.isArray(data.platforms)).toBe(true);
    const linkedIn = data.platforms.find((p: any) => p.platform === 'LinkedIn');
    expect(linkedIn).toBeDefined();
    expect(linkedIn.totalApplications).toBe(2);

    // Work setups
    expect(data.workSetups).toBeDefined();
    const remote = data.workSetups.find((s: any) => s.setup === 'REMOTE');
    expect(remote).toBeDefined();
    expect(remote.count).toBe(2);

    // Velocity & timing
    expect(data.weeklyVelocity).toBeDefined();
    expect(data.weeklyVelocity.length).toBe(12);
    expect(data.monthlyVelocity).toBeDefined();
    expect(data.timing).toBeDefined();

    // Salary insights
    expect(data.salaryInsights).toBeDefined();
    expect(data.salaryInsights.disclosedCount).toBe(3);
    expect(data.salaryInsights.currency).toBe('USD');
    expect(data.salaryInsights.avgSalaryMin).toBeGreaterThan(0);
    expect(data.salaryInsights.avgSalaryMax).toBeGreaterThan(0);

    // Status distribution
    expect(data.statusDistribution).toBeDefined();
    expect(data.statusDistribution.length).toBe(8);
  });

  it('GET /api/v1/analytics/overview supports range filters (30d, 90d, ytd)', async () => {
    const res30d = await request(app)
      .get('/api/v1/analytics/overview?range=30d')
      .set('Cookie', userACookie);

    expect(res30d.status).toBe(200);
    expect(res30d.body.data.range).toBe('30d');
    expect(res30d.body.data.rangeLabel).toBe('Past 30 days');
    expect(res30d.body.data.kpis.totalApplications).toBe(3);

    const resYtd = await request(app)
      .get('/api/v1/analytics/overview?range=ytd')
      .set('Cookie', userACookie);

    expect(resYtd.status).toBe(200);
    expect(resYtd.body.data.range).toBe('ytd');
  });

  it('enforces strict tenant isolation (User B sees zero metrics)', async () => {
    const resB = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Cookie', userBCookie);

    expect(resB.status).toBe(200);
    expect(resB.body.data.kpis.totalApplications).toBe(0);
    expect(resB.body.data.kpis.activeApplications).toBe(0);
    expect(resB.body.data.kpis.interviewCount).toBe(0);
    expect(resB.body.data.kpis.offerCount).toBe(0);
    expect(resB.body.data.platforms.length).toBe(0);
  });
});
