import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Timeline & Follow-ups Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];
  let applicationId: string;
  let followUpId: string;

  beforeAll(async () => {
    // User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `timeline_user_a_${Date.now()}@example.com`,
        password: 'password123',
        name: 'User A',
      });
    userACookie = resA.headers['set-cookie'];

    // User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `timeline_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'User B',
      });
    userBCookie = resB.headers['set-cookie'];

    // Create an application for User A
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Vercel',
        position: 'Solutions Architect',
        status: 'APPLIED',
        priority: 'HIGH',
      });
    applicationId = appRes.body.data.id;
  });

  it('PATCH /api/v1/applications/:id/status updates stage and creates STATUS_CHANGED timeline event', async () => {
    const res = await request(app)
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('Cookie', userACookie)
      .send({ status: 'INTERVIEWING' });

    expect(res.status).toBe(200);
    expect(res.body.data.status.name).toBe('Interviewing');

    // Verify timeline
    const timelineRes = await request(app)
      .get(`/api/v1/applications/${applicationId}/timeline`)
      .set('Cookie', userACookie);

    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body.data).toBeInstanceOf(Array);
    const statusEvent = timelineRes.body.data.find(
      (e: any) => e.type === 'STATUS_CHANGED'
    );
    expect(statusEvent).toBeDefined();
    expect(statusEvent.description).toContain('Applied to Interviewing');
  });

  it('POST /api/v1/applications/:id/timeline/note adds custom note to timeline', async () => {
    const res = await request(app)
      .post(`/api/v1/applications/${applicationId}/timeline/note`)
      .set('Cookie', userACookie)
      .send({ note: 'Passed recruiter screen; hiring manager chat next week.' });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('NOTE_ADDED');
    expect(res.body.data.description).toBe('Passed recruiter screen; hiring manager chat next week.');
  });

  it('POST /api/v1/follow-ups creates follow-up and synchronizes nextAction', async () => {
    const dueTomorrow = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app)
      .post('/api/v1/follow-ups')
      .set('Cookie', userACookie)
      .send({
        applicationId,
        action: 'Send thank you email to VP',
        dueAt: dueTomorrow,
        priority: 'HIGH',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.action).toBe('Send thank you email to VP');
    expect(res.body.data.status).toBe('PENDING');
    followUpId = res.body.data.id;

    // Verify application's nextAction was updated
    const appRes = await request(app)
      .get(`/api/v1/applications/${applicationId}`)
      .set('Cookie', userACookie);

    expect(appRes.body.data.nextAction).toBe('Send thank you email to VP');
  });

  it('GET /api/v1/follow-ups lists user follow-ups', async () => {
    const res = await request(app)
      .get('/api/v1/follow-ups')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.some((f: any) => f.id === followUpId)).toBe(true);
  });

  it('Multi-tenant security: User B cannot access User A follow-up', async () => {
    const res = await request(app)
      .get(`/api/v1/follow-ups/${followUpId}`)
      .set('Cookie', userBCookie);

    expect(res.status).toBe(404);
  });

  it('PATCH /api/v1/follow-ups/:id/complete marks task completed and adds timeline event', async () => {
    const res = await request(app)
      .patch(`/api/v1/follow-ups/${followUpId}/complete`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.completedAt).toBeDefined();

    // Verify timeline recorded the completion
    const timelineRes = await request(app)
      .get(`/api/v1/applications/${applicationId}/timeline`)
      .set('Cookie', userACookie);

    const completedEvent = timelineRes.body.data.find(
      (e: any) => e.type === 'FOLLOW_UP_COMPLETED'
    );
    expect(completedEvent).toBeDefined();
  });
});
