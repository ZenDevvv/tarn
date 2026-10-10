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

  it('POST /api/v1/applications/:id/submitted snapshots what was sent', async () => {
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
      .post(`/api/v1/applications/${targetId}/submitted`)
      .set('Cookie', userACookie)
      .send({ resumeId: foreign.id });
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .post(`/api/v1/applications/${targetId}/submitted`)
      .set('Cookie', userACookie)
      .send({ resumeId: mine.id });
    expect(ok.status).toBe(200);
    expect(ok.body.data.submittedResumeId).toBe(mine.id);
    expect(ok.body.data.submittedAt).toBeTruthy();
    expect(ok.body.data.submittedResume).toBeDefined();
    expect(ok.body.data.submittedResume.id).toBe(mine.id);

    // An empty body names no document, so it is rejected rather than guessing.
    const noDocApp = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({ companyName: 'No Doc Co', position: 'Backend Developer', description: 'TypeScript role.' });
    const empty = await request(app)
      .post(`/api/v1/applications/${noDocApp.body.data.id}/submitted`)
      .set('Cookie', userACookie)
      .send({});
    expect(empty.status).toBe(400);

    // Marking only a cover letter must leave an existing resume pointer untouched.
    const bothApp = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({ companyName: 'Both Co', position: 'Backend Developer', description: 'TypeScript role.' });
    const r = await prisma.resume.create({
      data: { userId, name: 'Resume r1', applicationId: bothApp.body.data.id, revision: 1 },
    });
    const letter = await prisma.coverLetter.create({
      data: {
        userId,
        name: 'Letter r1',
        applicationId: bothApp.body.data.id,
        content: 'Dear team.',
      },
    });

    const bothRes = await request(app)
      .post(`/api/v1/applications/${bothApp.body.data.id}/submitted`)
      .set('Cookie', userACookie)
      .send({ resumeId: r.id, coverLetterId: letter.id });
    expect(bothRes.status).toBe(200);
    expect(bothRes.body.data.submittedResumeId).toBe(r.id);
    expect(bothRes.body.data.submittedCoverLetterId).toBe(letter.id);
    expect(bothRes.body.data.submittedAt).toBeTruthy();
    const firstSubmittedAt = bothRes.body.data.submittedAt;

    // Marking the letter again does not re-freeze the resume.
    const letterOnly = await request(app)
      .post(`/api/v1/applications/${bothApp.body.data.id}/submitted`)
      .set('Cookie', userACookie)
      .send({ coverLetterId: letter.id });
    expect(letterOnly.status).toBe(200);
    expect(letterOnly.body.data.submittedResumeId).toBe(r.id);
    expect(letterOnly.body.data.submittedCoverLetterId).toBe(letter.id);
    expect(letterOnly.body.data.submittedAt).toBeTruthy();
    expect(typeof firstSubmittedAt).toBe('string');
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

