import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Resumes API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];
  let userAResumeId: string;
  let userASecondResumeId: string;
  let userAApplicationId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `resume_user_a_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Resume User A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `resume_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Resume User B',
      });
    userBCookie = resB.headers['set-cookie'];

    // Create an Application for User A
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Linear Orbit',
        position: 'Senior Frontend Engineer',
        status: 'APPLIED',
        priority: 'HIGH',
      });
    userAApplicationId = appRes.body.data.id;
  });

  it('POST /api/v1/resumes creates a resume version for authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/resumes')
      .set('Cookie', userACookie)
      .send({
        name: 'Frontend Specialist 2026',
        version: 'v3.0',
        targetRole: 'Senior Frontend Engineer',
        fileUrl: 'https://example.com/resumes/frontend_v3.pdf',
        filename: 'Frontend_Specialist_2026.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        isDefault: true,
        skills: ['React', 'TypeScript', 'Tailwind', 'Performance'],
        notes: 'Tailored with focus on design systems and web performance.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('Frontend Specialist 2026');
    expect(res.body.data.version).toBe('v3.0');
    expect(res.body.data.targetRole).toBe('Senior Frontend Engineer');
    expect(res.body.data.isDefault).toBe(true);
    expect(res.body.data.skills).toContain('React');
    userAResumeId = res.body.data.id;
  });

  it('POST /api/v1/resumes unsets previous default when a new default resume is created', async () => {
    const res = await request(app)
      .post('/api/v1/resumes')
      .set('Cookie', userACookie)
      .send({
        name: 'Full Stack Generalist',
        version: 'v1.5',
        targetRole: 'Full Stack Engineer',
        isDefault: true,
        skills: ['Node.js', 'PostgreSQL', 'React'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isDefault).toBe(true);
    userASecondResumeId = res.body.data.id;

    // Verify first resume is no longer default
    const getFirst = await request(app)
      .get(`/api/v1/resumes/${userAResumeId}`)
      .set('Cookie', userACookie);
    expect(getFirst.body.data.isDefault).toBe(false);
  });

  it('POST /api/v1/resumes rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/v1/resumes')
      .send({
        name: 'Unauth Resume',
      });
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/resumes lists resumes scoped to user', async () => {
    const res = await request(app)
      .get('/api/v1/resumes')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/v1/resumes supports search and targetRole filters', async () => {
    const resSearch = await request(app)
      .get('/api/v1/resumes?search=Generalist')
      .set('Cookie', userACookie);

    expect(resSearch.status).toBe(200);
    expect(resSearch.body.data.length).toBe(1);
    expect(resSearch.body.data[0].name).toBe('Full Stack Generalist');

    const resRole = await request(app)
      .get('/api/v1/resumes?targetRole=Senior Frontend Engineer')
      .set('Cookie', userACookie);

    expect(resRole.status).toBe(200);
    expect(resRole.body.data.length).toBe(1);
    expect(resRole.body.data[0].targetRole).toBe('Senior Frontend Engineer');
  });

  it('PATCH /api/v1/resumes/:id updates resume metadata', async () => {
    const res = await request(app)
      .patch(`/api/v1/resumes/${userAResumeId}`)
      .set('Cookie', userACookie)
      .send({
        notes: 'Updated tailoring notes for staff-level roles.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Updated tailoring notes for staff-level roles.');
  });

  it('POST /api/v1/resumes/:id/default promotes resume to default', async () => {
    const res = await request(app)
      .post(`/api/v1/resumes/${userAResumeId}/default`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.isDefault).toBe(true);

    // Verify other resume is now not default
    const getSecond = await request(app)
      .get(`/api/v1/resumes/${userASecondResumeId}`)
      .set('Cookie', userACookie);
    expect(getSecond.body.data.isDefault).toBe(false);
  });

  it('POST /api/v1/resumes/upload uploads base64 file and returns fileUrl and metadata', async () => {
    // 1x1 dummy text/pdf content encoded as base64
    const sampleBase64 = Buffer.from('PDF Mock Content Resume Test').toString('base64');

    const res = await request(app)
      .post('/api/v1/resumes/upload')
      .set('Cookie', userACookie)
      .send({
        filename: 'My_Tailored_Resume.pdf',
        mimeType: 'application/pdf',
        fileData: `data:application/pdf;base64,${sampleBase64}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.filename).toBe('My_Tailored_Resume.pdf');
    expect(res.body.data.mimeType).toBe('application/pdf');
    expect(res.body.data.fileUrl).toMatch(/^\/uploads\/resumes\//);
    expect(res.body.data.fileSize).toBeGreaterThan(0);
  });

  it('DELETE /api/v1/resumes/:id deletes resume and isolates from other users', async () => {
    // User B tries to delete User A's resume -> 404
    const resUnauth = await request(app)
      .delete(`/api/v1/resumes/${userASecondResumeId}`)
      .set('Cookie', userBCookie);
    expect(resUnauth.status).toBe(404);

    // User A deletes their own second resume
    const resDel = await request(app)
      .delete(`/api/v1/resumes/${userASecondResumeId}`)
      .set('Cookie', userACookie);
    expect(resDel.status).toBe(200);

    // Confirm deleted
    const resGet = await request(app)
      .get(`/api/v1/resumes/${userASecondResumeId}`)
      .set('Cookie', userACookie);
    expect(resGet.status).toBe(404);
  });

  it('Tenant Isolation: User B cannot access User A resumes', async () => {
    const res = await request(app)
      .get(`/api/v1/resumes/${userAResumeId}`)
      .set('Cookie', userBCookie);

    expect(res.status).toBe(404);
  });
});
