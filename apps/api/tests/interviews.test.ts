import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Interviews API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];
  let applicationId: string;
  let interviewId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `interview_user_a_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Interview User A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `interview_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Interview User B',
      });
    userBCookie = resB.headers['set-cookie'];

    // Create application for User A
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Anthropic',
        position: 'Prompt Engineer',
        status: 'INTERVIEWING',
        priority: 'HIGH',
      });
    applicationId = appRes.body.data.id;
  });

  it('POST /api/v1/interviews creates interview and logs timeline event', async () => {
    const scheduledAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/v1/interviews')
      .set('Cookie', userACookie)
      .send({
        applicationId,
        round: 1,
        type: 'TECHNICAL',
        title: 'Technical Screen',
        scheduledAt,
        durationMinutes: 60,
        interviewerName: 'Dr. Jane Smith',
        meetingUrl: 'https://meet.google.com/xyz-abcd-efg',
        location: 'Google Meet',
        prepNotes: 'Review transformer architecture and system prompting.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.round).toBe(1);
    expect(res.body.data.type).toBe('TECHNICAL');
    expect(res.body.data.status).toBe('SCHEDULED');
    expect(res.body.data.interviewerName).toBe('Dr. Jane Smith');
    interviewId = res.body.data.id;

    // Verify automatic timeline event was logged
    const timelineRes = await request(app)
      .get(`/api/v1/applications/${applicationId}/timeline`)
      .set('Cookie', userACookie);

    expect(timelineRes.status).toBe(200);
    const event = timelineRes.body.data.find(
      (e: any) => e.type === 'INTERVIEW_SCHEDULED'
    );
    expect(event).toBeDefined();
    expect(event.title).toContain('Technical interview scheduled');
  });

  it('GET /api/v1/interviews returns user interviews', async () => {
    const res = await request(app)
      .get('/api/v1/interviews')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].id).toBe(interviewId);
  });

  it('GET /api/v1/applications/:id/interviews returns application-scoped interviews', async () => {
    const res = await request(app)
      .get(`/api/v1/applications/${applicationId}/interviews`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.some((iv: any) => iv.id === interviewId)).toBe(true);
  });

  it('GET /api/v1/interviews/:id returns interview details', async () => {
    const res = await request(app)
      .get(`/api/v1/interviews/${interviewId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(interviewId);
    expect(res.body.data.application.company.name).toBe('Anthropic');
  });

  it('PATCH /api/v1/interviews/:id updates interview fields', async () => {
    const res = await request(app)
      .patch(`/api/v1/interviews/${interviewId}`)
      .set('Cookie', userACookie)
      .send({
        notes: 'Followed up with interviewer about team size.',
        durationMinutes: 45,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Followed up with interviewer about team size.');
    expect(res.body.data.durationMinutes).toBe(45);
  });

  it('PATCH /api/v1/interviews/:id/status completes interview and logs timeline event', async () => {
    const res = await request(app)
      .patch(`/api/v1/interviews/${interviewId}/status`)
      .set('Cookie', userACookie)
      .send({
        status: 'COMPLETED',
        result: 'PASSED',
        notes: 'Passed round 1. Next is system design.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.result).toBe('PASSED');

    // Verify timeline
    const timelineRes = await request(app)
      .get(`/api/v1/applications/${applicationId}/timeline`)
      .set('Cookie', userACookie);

    expect(timelineRes.status).toBe(200);
    const completedEvent = timelineRes.body.data.find(
      (e: any) => e.type === 'INTERVIEW_COMPLETED'
    );
    expect(completedEvent).toBeDefined();
    expect(completedEvent.title).toContain('completed');
  });

  it('Enforces multi-tenant isolation: User B cannot access or mutate User A interview', async () => {
    // User B attempts GET
    const getRes = await request(app)
      .get(`/api/v1/interviews/${interviewId}`)
      .set('Cookie', userBCookie);
    expect(getRes.status).toBe(404);

    // User B attempts PATCH
    const patchRes = await request(app)
      .patch(`/api/v1/interviews/${interviewId}`)
      .set('Cookie', userBCookie)
      .send({ notes: 'Hacked' });
    expect(patchRes.status).toBe(404);

    // User B attempts DELETE
    const delRes = await request(app)
      .delete(`/api/v1/interviews/${interviewId}`)
      .set('Cookie', userBCookie);
    expect(delRes.status).toBe(404);
  });

  it('DELETE /api/v1/interviews/:id removes interview', async () => {
    const res = await request(app)
      .delete(`/api/v1/interviews/${interviewId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/interviews/${interviewId}`)
      .set('Cookie', userACookie);
    expect(getRes.status).toBe(404);
  });
});
