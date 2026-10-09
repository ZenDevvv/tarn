import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Master Profile API Integration Tests', () => {
  let userACookie: string[];
  let userBCookie: string[];

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `profile_user_a_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Profile User A',
      });
    userACookie = resA.headers['set-cookie'];

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `profile_user_b_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Profile User B',
      });
    userBCookie = resB.headers['set-cookie'];
  });

  it('GET /api/v1/master-profile returns default or existing profile for user', async () => {
    const res = await request(app)
      .get('/api/v1/master-profile')
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.basics.name).toBe('Profile User A');
  });

  it('PUT /api/v1/master-profile updates profile with custom positioning rules and experience', async () => {
    const updatePayload = {
      basics: {
        name: 'Jane Doe',
        location: 'San Francisco, CA',
        phone: '123-456-7890',
        email: 'jane@example.com',
        links: [{ label: 'Portfolio', url: 'https://janedoe.dev' }],
      },
      positioningRules: [
        'Lead with Senior Frontend roles.',
        'Emphasize React and design systems.',
      ],
      factBank: {
        core_positioning: ['Senior UI Engineer with 6 years experience'],
        priority_themes: ['Design Systems', 'Performance'],
        quantified_highlights: ['35% performance improvement'],
      },
      workExperience: [
        {
          company: 'Acme Corp',
          location: 'San Francisco',
          role: 'Senior Frontend Engineer',
          date_range: '2022 - Present',
          bullets: ['Engineered design system adopted across 12 product teams.'],
        },
      ],
      projectExperience: [
        {
          name: 'Acme Design System',
          subtitle: 'Component Library',
          stack: ['React', 'TypeScript', 'Tailwind'],
          bullets: ['Built accessible WCAG AA components.'],
        },
      ],
      technicalSkills: {
        Frontend: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      },
      education: [
        {
          school: 'UC Berkeley',
          degree: 'BS Computer Science',
          graduation: '2020',
          bullets: ['Dean Honor List'],
        },
      ],
    };

    const res = await request(app)
      .put('/api/v1/master-profile')
      .set('Cookie', userACookie)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.data.basics.name).toBe('Jane Doe');
    expect(res.body.data.positioningRules).toContain('Lead with Senior Frontend roles.');
    expect(res.body.data.workExperience).toHaveLength(1);
    expect(res.body.data.workExperience[0].company).toBe('Acme Corp');
  });

  it('GET /api/v1/master-profile isolates User A and User B profiles', async () => {
    const resB = await request(app)
      .get('/api/v1/master-profile')
      .set('Cookie', userBCookie);

    expect(resB.status).toBe(200);
    expect(resB.body.data.basics.name).toBe('Profile User B');
    expect(resB.body.data.workExperience).toHaveLength(0);
  });

  it('POST /api/v1/master-profile/import-json imports full JSON profile', async () => {
    const jsonImport = {
      basics: {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        links: [{ label: 'GitHub', url: 'https://github.com/alex' }],
      },
      positioning_rules: ['Lead with fullstack AI workflows.'],
      work_experience: [
        {
          company: 'Nexus Tech',
          role: 'Full Stack Engineer',
          date_range: '2023 - 2025',
          bullets: ['Built real-time telemetry pipeline.'],
        },
      ],
      technical_skills: {
        Backend: ['Go', 'Node.js', 'PostgreSQL'],
      },
      education: [],
    };

    const res = await request(app)
      .post('/api/v1/master-profile/import-json')
      .set('Cookie', userBCookie)
      .send(jsonImport);

    expect(res.status).toBe(200);
    expect(res.body.data.basics.name).toBe('Alex Rivera');
    expect(res.body.data.workExperience[0].company).toBe('Nexus Tech');
  });

  it('GET /api/v1/master-profile/export-json exports structured profile', async () => {
    const res = await request(app)
      .get('/api/v1/master-profile/export-json')
      .set('Cookie', userBCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.meta).toBeDefined();
    expect(res.body.data.meta.candidate_name).toBe('Alex Rivera');
    expect(res.body.data.work_experience).toHaveLength(1);
  });

  it('POST /api/v1/master-profile/upload-resume parses raw text file and updates profile', async () => {
    const sampleResumeText = `
John Smith
john.smith@gmail.com | 555-123-4567 | San Francisco, CA
Portfolio | GitHub

WORK EXPERIENCE
Globex Corporation                                                                          San Francisco
Lead Web Architect                                                                     2021 - Present
• Designed resilient microfrontends in React and TypeScript reducing load time by 40%
• Mentored 8 junior engineers across frontend performance and automated testing

TECHNICAL SKILLS
Frontend: React, TypeScript, Redux, Tailwind
Backend: Node.js, Express, PostgreSQL

EDUCATION
Stanford University
BS Computer Science
    `;

    const base64Content = Buffer.from(sampleResumeText, 'utf-8').toString('base64');

    const res = await request(app)
      .post('/api/v1/master-profile/upload-resume')
      .set('Cookie', userACookie)
      .send({
        filename: 'resume.txt',
        mimeType: 'text/plain',
        fileData: base64Content,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.basics.email).toBe('john.smith@gmail.com');
    expect(res.body.data.workExperience.length).toBeGreaterThan(0);
    expect(res.body.data.technicalSkills.Frontend).toBeDefined();
  });
});
