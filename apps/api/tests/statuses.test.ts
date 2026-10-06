import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Application Statuses API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];
  const userAEmail = `status_user_a_${Date.now()}@example.com`;
  const userBEmail = `status_user_b_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: userAEmail,
        password: 'password123',
        name: 'Status Tester A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: userBEmail,
        password: 'password123',
        name: 'Status Tester B',
      });
    userBCookie = resB.headers['set-cookie'];
  });

  it('GET /api/v1/statuses returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/statuses');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/statuses auto-seeds and returns 8 default statuses in order', async () => {
    const res = await request(app)
      .get('/api/v1/statuses')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(8);

    const names = res.body.data.map((s: any) => s.name);
    expect(names).toEqual([
      'Saved',
      'Applied',
      'Interviewing',
      'Offer',
      'Accepted',
      'Rejected',
      'Withdrawn',
      'No response',
    ]);

    // Check orders for active stages are 0 to 4
    res.body.data.slice(0, 5).forEach((s: any, idx: number) => {
      expect(s.order).toBe(idx);
    });

    // Saved is default
    expect(res.body.data[0].isDefault).toBe(true);

    // Closed types have null order
    expect(res.body.data[5].closeType).toBe('REJECTED');
    expect(res.body.data[5].order).toBeNull();
    expect(res.body.data[6].closeType).toBe('WITHDRAWN');
    expect(res.body.data[6].order).toBeNull();
    expect(res.body.data[7].closeType).toBe('NO_RESPONSE');
    expect(res.body.data[7].order).toBeNull();
  });

  it('POST /api/v1/statuses creates a custom pipeline stage with next order', async () => {
    const res = await request(app)
      .post('/api/v1/statuses')
      .set('Cookie', userACookie)
      .send({
        name: 'Take-Home Assessment',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Take-Home Assessment');
    expect(res.body.data.order).toBe(5);
    expect(res.body.data.closeType).toBeNull();
  });

  it('POST /api/v1/statuses creates a custom closed outcome with closeType and null order', async () => {
    const res = await request(app)
      .post('/api/v1/statuses')
      .set('Cookie', userACookie)
      .send({
        name: 'Hiring Freeze',
        closeType: 'CANCELLED',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Hiring Freeze');
    expect(res.body.data.order).toBeNull();
    expect(res.body.data.closeType).toBe('CANCELLED');
  });

  it('POST /api/v1/statuses prevents duplicate name for the same user', async () => {
    const res = await request(app)
      .post('/api/v1/statuses')
      .set('Cookie', userACookie)
      .send({
        name: 'Take-Home Assessment',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('already exists');
  });

  it('PATCH /api/v1/statuses/:id updates status name', async () => {
    const listRes = await request(app)
      .get('/api/v1/statuses')
      .set('Cookie', userACookie);
    const takeHome = listRes.body.data.find((s: any) => s.name === 'Take-Home Assessment');

    const updateRes = await request(app)
      .patch(`/api/v1/statuses/${takeHome.id}`)
      .set('Cookie', userACookie)
      .send({
        name: 'Coding Challenge',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Coding Challenge');
  });

  it('PUT /api/v1/statuses/reorder updates stage orders in batch', async () => {
    const listRes = await request(app)
      .get('/api/v1/statuses')
      .set('Cookie', userACookie);
    const statuses = listRes.body.data;

    // Reverse first two statuses
    const reversedIds = [statuses[1].id, statuses[0].id, ...statuses.slice(2).map((s: any) => s.id)];

    const reorderRes = await request(app)
      .put('/api/v1/statuses/reorder')
      .set('Cookie', userACookie)
      .send({
        statusIds: reversedIds,
      });

    expect(reorderRes.status).toBe(200);
    expect(reorderRes.body.data[0].id).toBe(statuses[1].id);
    expect(reorderRes.body.data[0].order).toBe(0);
    expect(reorderRes.body.data[1].id).toBe(statuses[0].id);
    expect(reorderRes.body.data[1].order).toBe(1);
  });

  it('DELETE /api/v1/statuses/:id deletes an unused custom status', async () => {
    const listRes = await request(app)
      .get('/api/v1/statuses')
      .set('Cookie', userACookie);
    const codingChallenge = listRes.body.data.find((s: any) => s.name === 'Coding Challenge');

    const delRes = await request(app)
      .delete(`/api/v1/statuses/${codingChallenge.id}`)
      .set('Cookie', userACookie);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const afterList = await request(app)
      .get('/api/v1/statuses')
      .set('Cookie', userACookie);
    expect(afterList.body.data.some((s: any) => s.name === 'Coding Challenge')).toBe(false);
  });

  it('DELETE /api/v1/statuses/:id fails if attempting to delete a default status', async () => {
    const listRes = await request(app)
      .get('/api/v1/statuses')
      .set('Cookie', userACookie);
    const savedStatus = listRes.body.data.find((s: any) => s.isDefault);

    const delRes = await request(app)
      .delete(`/api/v1/statuses/${savedStatus.id}`)
      .set('Cookie', userACookie);

    expect(delRes.status).toBe(400);
    expect(delRes.body.error.message).toContain('Cannot delete the default status');
  });

  it('DELETE /api/v1/statuses/:id fails with 409 if applications use this status', async () => {
    const listRes = await request(app)
      .get('/api/v1/statuses')
      .set('Cookie', userACookie);
    const appliedStatus = listRes.body.data.find((s: any) => s.name === 'Applied');

    // Create an application using this status
    await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Acme Test Corp',
        position: 'Backend Developer',
        statusId: appliedStatus.id,
      });

    const delRes = await request(app)
      .delete(`/api/v1/statuses/${appliedStatus.id}`)
      .set('Cookie', userACookie);

    expect(delRes.status).toBe(409);
    expect(delRes.body.error.message).toContain('application is currently in this stage');
  });

  it('Ensures strict multi-tenant isolation between User A and User B', async () => {
    const listA = await request(app)
      .get('/api/v1/statuses')
      .set('Cookie', userACookie);
    const statusAId = listA.body.data[0].id;

    // User B attempts to delete User A's status
    const delRes = await request(app)
      .delete(`/api/v1/statuses/${statusAId}`)
      .set('Cookie', userBCookie);

    expect(delRes.status).toBe(404);

    // User B attempts to update User A's status
    const patchRes = await request(app)
      .patch(`/api/v1/statuses/${statusAId}`)
      .set('Cookie', userBCookie)
      .send({ name: 'Hacked Name' });

    expect(patchRes.status).toBe(404);
  });
});
