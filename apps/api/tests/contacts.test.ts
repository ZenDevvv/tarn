import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Contacts API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];
  let userACompanyId: string;
  let userAApplicationId: string;
  let userAContactId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `contacts_user_a_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Contacts User A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `contacts_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Contacts User B',
      });
    userBCookie = resB.headers['set-cookie'];

    // Create Company for User A
    const compRes = await request(app)
      .post('/api/v1/companies')
      .set('Cookie', userACookie)
      .send({
        name: 'Stripe Inc',
        website: 'https://stripe.com',
        industry: 'Fintech',
        location: 'San Francisco, CA',
      });
    userACompanyId = compRes.body.data.id;

    // Create Application for User A
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Stripe Inc',
        position: 'Backend Engineer',
        status: 'RECRUITER_CONTACTED',
        priority: 'HIGH',
      });
    userAApplicationId = appRes.body.data.id;
  });

  it('POST /api/v1/contacts creates a contact with company and application relations', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .set('Cookie', userACookie)
      .send({
        name: 'Sarah Connor',
        role: 'Senior Technical Recruiter',
        email: 'sarah.connor@stripe.com',
        phone: '+1 555-0199',
        linkedinUrl: 'https://linkedin.com/in/sarah-connor-recruiter',
        companyId: userACompanyId,
        applicationId: userAApplicationId,
        notes: 'Reached out via LinkedIn InMail about the Backend Engineer role.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('Sarah Connor');
    expect(res.body.data.role).toBe('Senior Technical Recruiter');
    expect(res.body.data.email).toBe('sarah.connor@stripe.com');
    expect(res.body.data.companyId).toBe(userACompanyId);
    expect(res.body.data.applicationId).toBe(userAApplicationId);
    userAContactId = res.body.data.id;
  });

  it('POST /api/v1/contacts rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .send({
        name: 'Unauthorized Contact',
      });

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/contacts rejects creation without name or with invalid email', async () => {
    const resNoName = await request(app)
      .post('/api/v1/contacts')
      .set('Cookie', userACookie)
      .send({
        email: 'test@example.com',
      });
    expect(resNoName.status).toBe(400);

    const resInvalidEmail = await request(app)
      .post('/api/v1/contacts')
      .set('Cookie', userACookie)
      .send({
        name: 'Valid Name',
        email: 'not-an-email',
      });
    expect(resInvalidEmail.status).toBe(400);
  });

  it('GET /api/v1/contacts lists user contacts with details', async () => {
    const res = await request(app)
      .get('/api/v1/contacts')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((c: any) => c.id === userAContactId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Sarah Connor');
    expect(found.company).toBeDefined();
    expect(found.company.name).toBe('Stripe Inc');
    expect(found.application).toBeDefined();
    expect(found.application.job.title).toBe('Backend Engineer');
  });

  it('GET /api/v1/contacts filters by search term and companyId', async () => {
    const resSearch = await request(app)
      .get('/api/v1/contacts?search=Connor')
      .set('Cookie', userACookie);

    expect(resSearch.status).toBe(200);
    expect(resSearch.body.data.length).toBeGreaterThanOrEqual(1);
    expect(resSearch.body.data[0].name).toContain('Sarah Connor');

    const resCompany = await request(app)
      .get(`/api/v1/contacts?companyId=${userACompanyId}`)
      .set('Cookie', userACookie);

    expect(resCompany.status).toBe(200);
    expect(resCompany.body.data.length).toBeGreaterThanOrEqual(1);

    const resNoMatch = await request(app)
      .get('/api/v1/contacts?search=NonExistent999')
      .set('Cookie', userACookie);

    expect(resNoMatch.status).toBe(200);
    expect(resNoMatch.body.data.length).toBe(0);
  });

  it('GET /api/v1/contacts/:id returns the single contact', async () => {
    const res = await request(app)
      .get(`/api/v1/contacts/${userAContactId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(userAContactId);
    expect(res.body.data.name).toBe('Sarah Connor');
  });

  it('PATCH /api/v1/contacts/:id updates contact info', async () => {
    const res = await request(app)
      .patch(`/api/v1/contacts/${userAContactId}`)
      .set('Cookie', userACookie)
      .send({
        role: 'Lead Talent Partner',
        notes: 'Followed up after screening call.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('Lead Talent Partner');
    expect(res.body.data.notes).toBe('Followed up after screening call.');
  });

  it('Enforces cross-user isolation: User B cannot access, modify, or delete User A contact', async () => {
    const getRes = await request(app)
      .get(`/api/v1/contacts/${userAContactId}`)
      .set('Cookie', userBCookie);
    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/contacts/${userAContactId}`)
      .set('Cookie', userBCookie)
      .send({ name: 'Hacked Name' });
    expect(patchRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/v1/contacts/${userAContactId}`)
      .set('Cookie', userBCookie);
    expect(deleteRes.status).toBe(404);
  });

  it('DELETE /api/v1/contacts/:id deletes the contact', async () => {
    const res = await request(app)
      .delete(`/api/v1/contacts/${userAContactId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/contacts/${userAContactId}`)
      .set('Cookie', userACookie);
    expect(getRes.status).toBe(404);
  });
});
