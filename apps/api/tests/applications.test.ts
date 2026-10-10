import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Applications API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];
  let createdAppId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `app_user_a_${Date.now()}@example.com`,
        password: 'password123',
        name: 'User A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `app_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'User B',
      });
    userBCookie = resB.headers['set-cookie'];
  });

  it('POST /api/v1/applications/:id/submitted-resume snapshots what was sent', async () => {
    const { prisma } = await import('@tracker/database');
    const me = await request(app).get('/api/v1/auth/me').set('Cookie', userACookie);
    const userId = me.body.data.user.id;

    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({ companyName: 'Submit Co', position: 'Backend Developer', description: 'TypeScript role.' });
    const targetId = appRes.body.data.id;

    const mine = await prisma.resume.create({
      data: { userId, name: 'Attempt r1', applicationId: targetId, revision: 1 },
    });
    const otherApp = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({ companyName: 'Elsewhere Co', position: 'Backend Developer', description: 'TypeScript role.' });
    const foreign = await prisma.resume.create({
      data: { userId, name: 'Other app attempt', applicationId: otherApp.body.data.id, revision: 1 },
    });

    // A resume belonging to a different application cannot be submitted here.
    const bad = await request(app)
      .post(`/api/v1/applications/${targetId}/submitted-resume`)
      .set('Cookie', userACookie)
      .send({ resumeId: foreign.id });
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .post(`/api/v1/applications/${targetId}/submitted-resume`)
      .set('Cookie', userACookie)
      .send({ resumeId: mine.id });
    expect(ok.status).toBe(200);
    expect(ok.body.data.submittedResumeId).toBe(mine.id);
    expect(ok.body.data.submittedAt).toBeTruthy();
    expect(ok.body.data.submittedResume).toBeDefined();
    expect(ok.body.data.submittedResume.id).toBe(mine.id);

    // Omitting resumeId falls back to the application's current resume.
    const fallbackApp = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({ companyName: 'Fallback Co', position: 'Backend Developer', description: 'TypeScript role.' });
    const fallback = await prisma.resume.create({
      data: { userId, name: 'Fallback r1', applicationId: fallbackApp.body.data.id, revision: 1 },
    });
    await prisma.application.update({
      where: { id: fallbackApp.body.data.id },
      data: { resumeId: fallback.id },
    });
    const fb = await request(app)
      .post(`/api/v1/applications/${fallbackApp.body.data.id}/submitted-resume`)
      .set('Cookie', userACookie)
      .send({});
    expect(fb.status).toBe(200);
    expect(fb.body.data.submittedResumeId).toBe(fallback.id);
  });

  it('POST /api/v1/applications creates an application with company, job, and timeline event', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Linear Labs',
        position: 'Staff Engineer',
        status: 'APPLIED',
        priority: 'HIGH',
        source: 'LinkedIn',
        sourceUrl: 'https://linkedin.com/jobs/view/999',
        salaryMin: 90000,
        salaryMax: 120000,
        currency: 'USD',
        nextAction: 'Follow up with recruiter',
        nextActionDueAt: new Date(Date.now() + 86400000).toISOString(),
        description: 'Building collaborative project management tools.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.company.name).toBe('Linear Labs');
    expect(res.body.data.job.title).toBe('Staff Engineer');
    expect(res.body.data.priority).toBe('HIGH');
    createdAppId = res.body.data.id;
  });

  it('GET /api/v1/applications lists applications for user A with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/applications?page=1&limit=10')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/applications/:id retrieves complete details', async () => {
    const res = await request(app)
      .get(`/api/v1/applications/${createdAppId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdAppId);
    expect(res.body.data.company.name).toBe('Linear Labs');
    expect(res.body.data.timelineEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('Multi-tenant security: User B cannot access User A application', async () => {
    const res = await request(app)
      .get(`/api/v1/applications/${createdAppId}`)
      .set('Cookie', userBCookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/v1/applications/:id updates application and job info', async () => {
    const res = await request(app)
      .patch(`/api/v1/applications/${createdAppId}`)
      .set('Cookie', userACookie)
      .send({
        notes: 'Spoke with hiring manager; positive signals.',
        priority: 'HIGH',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Spoke with hiring manager; positive signals.');
  });

  it('DELETE /api/v1/applications/:id soft-archives application', async () => {
    const res = await request(app)
      .delete(`/api/v1/applications/${createdAppId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.archived).toBe(true);

    // Verify it no longer appears in normal list
    const listRes = await request(app)
      .get('/api/v1/applications')
      .set('Cookie', userACookie);

    const found = listRes.body.data.find((a: any) => a.id === createdAppId);
    expect(found).toBeUndefined();
  });

  it('GET /api/v1/analytics/dashboard returns summary, weekly velocity, and pipeline data', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.activeApplications).toBeDefined();
    expect(res.body.data.weeklyVelocity.weeks).toHaveLength(8);
    expect(res.body.data.pipeline).toBeDefined();
    expect(res.body.data.pipeline.SAVED).toBeDefined();
  });
});

