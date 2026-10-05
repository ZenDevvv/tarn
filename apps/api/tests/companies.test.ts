import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Companies API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];
  let userACompanyId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `company_user_a_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Company User A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `company_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Company User B',
      });
    userBCookie = resB.headers['set-cookie'];
  });

  it('POST /api/v1/companies creates a new company for the authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/companies')
      .set('Cookie', userACookie)
      .send({
        name: 'Vercel Inc',
        website: 'https://vercel.com',
        industry: 'Cloud Infrastructure',
        location: 'San Francisco, CA',
        description: 'Frontend cloud platform.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('Vercel Inc');
    expect(res.body.data.website).toBe('https://vercel.com');
    expect(res.body.data.industry).toBe('Cloud Infrastructure');
    userACompanyId = res.body.data.id;
  });

  it('POST /api/v1/companies rejects creation without a name', async () => {
    const res = await request(app)
      .post('/api/v1/companies')
      .set('Cookie', userACookie)
      .send({
        website: 'https://noname.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('GET /api/v1/companies lists user companies with stats and application counts', async () => {
    // Also create an application for this company to test counts
    await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Vercel Inc',
        position: 'Full Stack Engineer',
        status: 'TECHNICAL_INTERVIEW',
        priority: 'HIGH',
      });

    const res = await request(app)
      .get('/api/v1/companies')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const vercel = res.body.data.find((c: any) => c.name === 'Vercel Inc');
    expect(vercel).toBeDefined();
    expect(vercel.applicationsCount).toBeGreaterThanOrEqual(1);
    expect(vercel.activeApplicationsCount).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/companies filters by search query', async () => {
    const res = await request(app)
      .get('/api/v1/companies?search=Vercel')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].name).toContain('Vercel');

    const notFoundRes = await request(app)
      .get('/api/v1/companies?search=NonExistentCompanyXYZ999')
      .set('Cookie', userACookie);

    expect(notFoundRes.status).toBe(200);
    expect(notFoundRes.body.data.length).toBe(0);
  });

  it('GET /api/v1/companies/:id returns detailed company information and applications list', async () => {
    const res = await request(app)
      .get(`/api/v1/companies/${userACompanyId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(userACompanyId);
    expect(res.body.data.name).toBe('Vercel Inc');
    expect(Array.isArray(res.body.data.applications)).toBe(true);
    expect(res.body.data.applications.length).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /api/v1/companies/:id updates company information', async () => {
    const res = await request(app)
      .patch(`/api/v1/companies/${userACompanyId}`)
      .set('Cookie', userACookie)
      .send({
        location: 'Remote, Global',
        description: 'Updated platform description',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.location).toBe('Remote, Global');
    expect(res.body.data.description).toBe('Updated platform description');
  });

  it('Enforces tenant isolation: User B cannot view or modify User A company', async () => {
    const getRes = await request(app)
      .get(`/api/v1/companies/${userACompanyId}`)
      .set('Cookie', userBCookie);

    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/companies/${userACompanyId}`)
      .set('Cookie', userBCookie)
      .send({
        name: 'Hacked Name',
      });

    expect(patchRes.status).toBe(404);
  });

  it('DELETE /api/v1/companies/:id deletes company and returns 200', async () => {
    // Create a temporary company to delete
    const tempRes = await request(app)
      .post('/api/v1/companies')
      .set('Cookie', userACookie)
      .send({
        name: 'Temporary Company To Delete',
      });
    const tempId = tempRes.body.data.id;

    const deleteRes = await request(app)
      .delete(`/api/v1/companies/${tempId}`)
      .set('Cookie', userACookie);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deleted).toBe(true);

    const verifyRes = await request(app)
      .get(`/api/v1/companies/${tempId}`)
      .set('Cookie', userACookie);

    expect(verifyRes.status).toBe(404);
  });
});
