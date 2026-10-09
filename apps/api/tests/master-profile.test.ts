import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
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
      skills: {
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

  it('POST /api/v1/master-profile/import-json returns draft and warnings without writing until confirm-import', async () => {
    // Check initial name for User B
    const beforeRes = await request(app)
      .get('/api/v1/master-profile')
      .set('Cookie', userBCookie);
    expect(beforeRes.body.data.basics.name).toBe('Profile User B');

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

    // 1. Import returns draft + warnings, does NOT write to database
    const draftRes = await request(app)
      .post('/api/v1/master-profile/import-json')
      .set('Cookie', userBCookie)
      .send(jsonImport);

    expect(draftRes.status).toBe(200);
    expect(draftRes.body.data.profile.basics.name).toBe('Alex Rivera');
    expect(draftRes.body.data.profile.workExperience[0].company).toBe('Nexus Tech');
    // Legacy key technical_skills is accepted and surfaced under the canonical `skills` field
    expect(draftRes.body.data.profile.skills.Backend).toEqual(['Go', 'Node.js', 'PostgreSQL']);
    expect(draftRes.body.data.warnings).toContain('Education not found — please verify');

    // Verify DB profile is UNTOUCHED
    const untouchedRes = await request(app)
      .get('/api/v1/master-profile')
      .set('Cookie', userBCookie);
    expect(untouchedRes.body.data.basics.name).toBe('Profile User B');
    expect(untouchedRes.body.data.workExperience).toHaveLength(0);

    // 2. confirm-import commits the draft to database
    const confirmRes = await request(app)
      .post('/api/v1/master-profile/confirm-import')
      .set('Cookie', userBCookie)
      .send(draftRes.body.data.profile);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.basics.name).toBe('Alex Rivera');
    expect(confirmRes.body.data.workExperience[0].company).toBe('Nexus Tech');

    // Verify DB profile is now updated
    const afterRes = await request(app)
      .get('/api/v1/master-profile')
      .set('Cookie', userBCookie);
    expect(afterRes.body.data.basics.name).toBe('Alex Rivera');
    expect(afterRes.body.data.workExperience[0].company).toBe('Nexus Tech');
  });

  it('GET /api/v1/master-profile/export-json exports structured profile', async () => {
    const res = await request(app)
      .get('/api/v1/master-profile/export-json')
      .set('Cookie', userBCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.meta).toBeDefined();
    expect(res.body.data.meta.candidate_name).toBe('Alex Rivera');
    expect(res.body.data.work_experience).toHaveLength(1);
    expect(res.body.data.skills).toBeDefined();
    expect(res.body.data.technicalSkills).toBeUndefined();
  });

  it('POST /api/v1/master-profile/upload-resume returns draft and warnings without writing until confirm-import', async () => {
    const sampleResumeText = `
John Smith
john.smith@gmail.com | 555-123-4567 | San Francisco, CA

WORK EXPERIENCE
Globex Corporation | Lead Web Architect | 2021 - Present
• Designed resilient microfrontends in React and TypeScript reducing load time by 40%
• Mentored 8 junior engineers across frontend performance and automated testing

TECHNICAL SKILLS
Frontend: React, TypeScript, Redux, Tailwind
Backend: Node.js, Express, PostgreSQL

EDUCATION
Stanford University
BS Computer Science | 2020
    `;

    const base64Content = Buffer.from(sampleResumeText, 'utf-8').toString('base64');

    // 1. Upload returns draft + warnings, does NOT write to database
    const draftRes = await request(app)
      .post('/api/v1/master-profile/upload-resume')
      .set('Cookie', userACookie)
      .send({
        filename: 'resume.txt',
        mimeType: 'text/plain',
        fileData: base64Content,
      });

    expect(draftRes.status).toBe(200);
    expect(draftRes.body.data.profile.basics.name).toBe('John Smith');
    expect(draftRes.body.data.profile.basics.email).toBe('john.smith@gmail.com');
    expect(draftRes.body.data.profile.basics.location).toBe('San Francisco, CA');
    expect(draftRes.body.data.profile.workExperience.length).toBeGreaterThan(0);
    expect(draftRes.body.data.profile.skills.Frontend).toBeDefined();
    expect(draftRes.body.data.warnings).toBeInstanceOf(Array);

    // Verify DB profile is still Jane Doe (from previous test), NOT John Smith
    const untouchedRes = await request(app)
      .get('/api/v1/master-profile')
      .set('Cookie', userACookie);
    expect(untouchedRes.body.data.basics.name).toBe('Jane Doe');

    // 2. Confirm import commits to DB
    const confirmRes = await request(app)
      .post('/api/v1/master-profile/confirm-import')
      .set('Cookie', userACookie)
      .send(draftRes.body.data.profile);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.basics.name).toBe('John Smith');

    // Verify DB now holds John Smith
    const updatedRes = await request(app)
      .get('/api/v1/master-profile')
      .set('Cookie', userACookie);
    expect(updatedRes.body.data.basics.name).toBe('John Smith');
    expect(updatedRes.body.data.basics.email).toBe('john.smith@gmail.com');
  });

  // spec-resume-ingestion.md §2.1 — the field report: uploading this exact PDF
  // returned 200 on upload-resume but 400 VALIDATION_ERROR on confirm-import,
  // because the parser emitted workExperience[1].company === "". Fixtures can only
  // approximate the layout `pdftotext -layout` produces; only the real file proves
  // the round-trip. The payload below mirrors resume-upload-dropzone.tsx exactly.
  describe('Zen Obrero RESUME.pdf round-trip', () => {
    const ZEN_PDF_PATH = '/home/machenike/Projects/Resume-Builder/Zen Obrero RESUME.pdf';

    it('uploads and confirms the real resume without a 400', async () => {
      const fileData = readFileSync(ZEN_PDF_PATH).toString('base64');

      const uploadRes = await request(app)
        .post('/api/v1/master-profile/upload-resume')
        .set('Cookie', userBCookie)
        .send({ filename: 'Zen Obrero RESUME.pdf', mimeType: 'application/pdf', fileData });

      expect(uploadRes.status).toBe(200);
      const draft = uploadRes.body.data.profile;
      expect(draft.workExperience.length).toBeGreaterThan(0);

      // Exactly what resume-upload-dropzone.tsx sends on Confirm & Import.
      const confirmRes = await request(app)
        .post('/api/v1/master-profile/confirm-import')
        .set('Cookie', userBCookie)
        .send({
          basics: draft.basics,
          positioningRules: draft.positioningRules || [],
          factBank: draft.factBank || {},
          summaryCandidates: draft.summaryCandidates || [],
          workExperience: (draft.workExperience || []).map((w: any) => ({ ...w, bullets: w.bullets || [] })),
          projectExperience: (draft.projectExperience || []).map((p: any) => ({
            ...p,
            stack: p.stack || [],
            bullets: p.bullets || [],
          })),
          skills: draft.skills || {},
          education: (draft.education || []).map((e: any) => ({ ...e, bullets: e.bullets || [] })),
        });

      expect(
        confirmRes.status,
        `confirm-import rejected the real resume: ${JSON.stringify(confirmRes.body)}`
      ).toBe(200);

      const persisted = await request(app)
        .get('/api/v1/master-profile')
        .set('Cookie', userBCookie);
      expect(persisted.body.data.basics.name).toBe('Zen Andrei Obrero');
      expect(persisted.body.data.workExperience.length).toBe(draft.workExperience.length);
      for (const job of persisted.body.data.workExperience) {
        expect(job.company.trim()).not.toBe('');
        expect(job.role.trim()).not.toBe('');
      }
    });
  });
});
