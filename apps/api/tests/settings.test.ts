import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Settings API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];
  const userAPassword = 'initialPassword123';
  const userAEmail = `settings_user_a_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: userAEmail,
        password: userAPassword,
        name: 'Settings Tester A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `settings_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Settings Tester B',
      });
    userBCookie = resB.headers['set-cookie'];

    // Create an application for User A to check stats & export
    await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userACookie)
      .send({
        companyName: 'Acme Systems',
        position: 'Senior TypeScript Architect',
        status: 'APPLIED',
        priority: 'HIGH',
      });
  });

  it('GET /api/v1/settings returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/settings');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/settings returns current profile, default preferences and stats', async () => {
    const res = await request(app)
      .get('/api/v1/settings')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(userAEmail);
    expect(res.body.data.name).toBe('Settings Tester A');
    expect(res.body.data.timezone).toBe('UTC');
    expect(res.body.data.defaultCurrency).toBe('PHP');
    expect(res.body.data.emailNotifications).toBe(true);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.totalApplications).toBe(1);
    expect(res.body.data.stats.activeApplications).toBe(1);
  });

  it('PATCH /api/v1/settings/profile updates user profile fields', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/profile')
      .set('Cookie', userACookie)
      .send({
        name: 'Alex Rivera',
        headline: 'Staff Frontend Engineer',
        location: 'San Francisco, CA',
        timezone: 'America/Los_Angeles',
        phone: '+1 (555) 234-5678',
        website: 'https://alexrivera.dev',
        linkedinUrl: 'https://linkedin.com/in/alexrivera',
        bio: 'Passionate about accessible UI and web performance.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Alex Rivera');
    expect(res.body.data.headline).toBe('Staff Frontend Engineer');
    expect(res.body.data.location).toBe('San Francisco, CA');
    expect(res.body.data.timezone).toBe('America/Los_Angeles');
    expect(res.body.data.phone).toBe('+1 (555) 234-5678');
    expect(res.body.data.website).toBe('https://alexrivera.dev');
    expect(res.body.data.linkedinUrl).toBe('https://linkedin.com/in/alexrivera');
    expect(res.body.data.bio).toContain('Passionate about accessible UI');
  });

  it('PATCH /api/v1/settings/preferences updates user defaults and toggles', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/preferences')
      .set('Cookie', userACookie)
      .send({
        defaultCurrency: 'EUR',
        defaultWorkSetup: 'REMOTE',
        emailNotifications: false,
        interviewReminders: true,
        followUpAlerts: true,
        weeklyDigest: true,
        themePreference: 'dark',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.defaultCurrency).toBe('EUR');
    expect(res.body.data.defaultWorkSetup).toBe('REMOTE');
    expect(res.body.data.emailNotifications).toBe(false);
    expect(res.body.data.weeklyDigest).toBe(true);
    expect(res.body.data.themePreference).toBe('dark');
  });

  it('POST /api/v1/settings/password fails with 401 when current password is wrong', async () => {
    const res = await request(app)
      .post('/api/v1/settings/password')
      .set('Cookie', userACookie)
      .send({
        currentPassword: 'incorrectPassword999',
        newPassword: 'brandNewPassword123',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Current password does not match');
  });

  it('POST /api/v1/settings/password fails with 400 when new password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/settings/password')
      .set('Cookie', userACookie)
      .send({
        currentPassword: userAPassword,
        newPassword: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/settings/password succeeds and enables login with new password', async () => {
    const newPass = 'updatedSecurePassword456';
    const changeRes = await request(app)
      .post('/api/v1/settings/password')
      .set('Cookie', userACookie)
      .send({
        currentPassword: userAPassword,
        newPassword: newPass,
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.message).toContain('Password updated successfully');

    // Verify login with new password succeeds
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userAEmail,
        password: newPass,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe(userAEmail);
  });

  it('GET /api/v1/settings/export provides complete JSON export', async () => {
    const res = await request(app)
      .get('/api/v1/settings/export')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['content-disposition']).toContain('attachment; filename=');

    const data = JSON.parse(res.text);
    expect(data.version).toBe('1.0.0');
    expect(data.exportDate).toBeDefined();
    expect(data.user.email).toBe(userAEmail);
    expect(data.applications.length).toBeGreaterThanOrEqual(1);
    expect(data.applications[0].job.title).toBe('Senior TypeScript Architect');
  });

  it('ensures strict tenant isolation between users', async () => {
    const resB = await request(app)
      .get('/api/v1/settings')
      .set('Cookie', userBCookie);

    expect(resB.status).toBe(200);
    expect(resB.body.data.name).toBe('Settings Tester B');
    // User B should have default PHP, not User A's EUR
    expect(resB.body.data.defaultCurrency).toBe('PHP');
    expect(resB.body.data.stats.totalApplications).toBe(0);
  });
});
