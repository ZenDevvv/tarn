import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '@tracker/database';
import { PdfRendererService } from '../src/modules/tailoring/pdf-renderer.service';
import { tailoringService } from '../src/modules/tailoring/tailoring.service';

describe('Tailoring and Cover Letter API Integration Tests', () => {
  let userCookie: string[];
  let userId: string;
  let applicationId: string;
  let generatedResumeId: string;
  let generatedCoverLetterId: string;

  const mockResumePayload = {
    basics: {
      name: 'Zen Andrei Obrero',
      location: 'Dasmarinas, Cavite',
      phone: '09068575015',
      email: 'zen@example.com',
      links: [
        { label: 'Portfolio', url: 'https://zendev-portfolio.netlify.app/' },
        { label: 'GitHub', url: 'https://github.com/ZenDevvv' },
      ],
    },
    education: [
      {
        school: 'Biliran Province State University',
        degree: 'BS Computer Science',
        honors: 'With Honors',
        graduation: 'May 2024',
      },
    ],
    experience: [
      {
        company: 'Uzaro Solutions Technology Inc.',
        location: 'Quezon City',
        role: 'Technology Developer',
        date_range: 'Nov 2024 - Present',
        bullets: [
          'Built and shipped Bandai Namco HRIS handling 6,000+ employee records with React, TypeScript, Node.js, and Prisma ORM.',
          'Designed REST APIs and scalable backend architectures with Node.js and Prisma.',
        ],
      },
    ],
    projects: [
      {
        name: 'Bandai Namco HRIS',
        subtitle: 'Multi-tenant HRIS',
        stack: ['React', 'TypeScript', 'Node.js', 'Prisma'],
        bullets: ['Built enterprise surfaces handling 6,000+ employee records.'],
      },
    ],
    skills: {
      Frontend: ['React', 'TypeScript'],
      Backend: ['Node.js', 'Prisma'],
    },
  };

  const mockCoverLetter = `
Dear Hiring Team,

I am writing to apply for the Full Stack Web Developer position at Acme Software.
In my recent work, I built and shipped enterprise platforms handling 6,000+ records.
I look forward to help build and iterate clickable prototypes and lead sprint delivery in agile workflows.

Sincerely,
Zen Andrei Obrero
`.trim();

  beforeAll(async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-api-key';

    // 1. Register test user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `tailoring_test_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Zen Andrei Obrero',
      });
    userCookie = regRes.headers['set-cookie'];
    userId = regRes.body.data.user.id;

    // 2. Setup MasterProfile with factual data
    await request(app)
      .put('/api/v1/master-profile')
      .set('Cookie', userCookie)
      .send({
        basics: {
          name: 'Zen Andrei Obrero',
          location: 'Dasmarinas, Cavite',
          phone: '09068575015',
          email: 'zen@example.com',
          links: [
            { label: 'Portfolio', url: 'https://zendev-portfolio.netlify.app/' },
            { label: 'GitHub', url: 'https://github.com/ZenDevvv' },
          ],
        },
        positioningRules: [
          'Lead with professional fullstack delivery.',
          'Put Bandai Namco HRIS first in highlights.',
        ],
        factBank: {
          core_positioning: ['Professional fullstack developer'],
          priority_themes: ['React', 'TypeScript', 'Node.js', 'Prisma'],
          quantified_highlights: ['6,000+ employee records handled in Bandai Namco HRIS'],
        },
        workExperience: [
          {
            company: 'Uzaro Solutions Technology Inc.',
            location: 'Quezon City',
            role: 'Technology Developer',
            date_range: 'Nov 2024 - Present',
            bullets: [
              'Built and shipped Bandai Namco HRIS handling 6,000+ employee records with React, TypeScript, Node.js, and Prisma ORM.',
              'Designed backend data models in MongoDB and Prisma with CI/CD deployment.',
            ],
          },
        ],
        projectExperience: [
          {
            name: 'Bandai Namco HRIS',
            subtitle: 'Multi-tenant HRIS',
            stack: ['React', 'TypeScript', 'Node.js', 'Prisma'],
            bullets: ['Built enterprise surfaces handling 6,000+ employee records.'],
          },
        ],
        technicalSkills: {
          Frontend: ['React', 'TypeScript', 'Tailwind CSS'],
          Backend: ['Node.js', 'Express', 'Prisma', 'MongoDB'],
        },
        education: [
          {
            school: 'Biliran Province State University',
            degree: 'BS Computer Science',
            honors: 'With Honors',
            graduation: 'May 2024',
          },
        ],
      });

    // 3. Create an application with rich JD text
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userCookie)
      .send({
        companyName: 'Acme Software',
        position: 'Full Stack Web Developer',
        status: 'APPLIED',
        priority: 'HIGH',
        description: `
          We are hiring a Full Stack Web Developer.
          Responsibilities:
          - Build and iterate clickable prototypes and production enterprise web platforms.
          - Design REST APIs and scalable backend architectures with Node.js and Prisma.
          - Develop responsive user interfaces using React and TypeScript.
          - Maintain strong engineering rigor and lead sprint delivery in agile workflows.
        `,
      });
    applicationId = appRes.body.data.id;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/v1/tailoring/applications/:id/analysis returns keyword scorecard', async () => {
    const res = await request(app)
      .get(`/api/v1/tailoring/applications/${applicationId}/analysis`)
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.matchScore).toBeGreaterThan(40);
    expect(res.body.data.highPriorityKeywords.length).toBeGreaterThan(0);
    expect(res.body.data.matchedKeywords.some((k: string) => k.toLowerCase().includes('react'))).toBe(true);
  });

  it('GET /api/v1/tailoring/quota returns daily quota information', async () => {
    const res = await request(app)
      .get('/api/v1/tailoring/quota')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.limit).toBe(5);
    expect(res.body.data.usedToday).toBe(0);
    expect(res.body.data.remainingToday).toBe(5);
    expect(res.body.data.isEntitled).toBe(true);
  });

  it('POST /api/v1/tailoring/applications/:id/generate fails with 503 when GEMINI_API_KEY is missing and does not deduct quota', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    process.env.GEMINI_API_KEY = originalKey;

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toContain('platform API key is not configured');

    // Quota should still be 0
    const quotaRes = await request(app)
      .get('/api/v1/tailoring/quota')
      .set('Cookie', userCookie);
    expect(quotaRes.body.data.usedToday).toBe(0);
  });

  it('POST /api/v1/tailoring/applications/:id/generate fails with 503 when AI synthesis errors and does not deduct quota', async () => {
    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockRejectedValueOnce(new Error('Simulated Gemini 504 gateway timeout'));

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    spy.mockRestore();

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toContain('Simulated Gemini 504 gateway timeout');

    // Quota should still be 0
    const quotaRes = await request(app)
      .get('/api/v1/tailoring/quota')
      .set('Cookie', userCookie);
    expect(quotaRes.body.data.usedToday).toBe(0);
  });

  it('POST /api/v1/tailoring/applications/:id/generate generates full package and decrements quota', async () => {
    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockResolvedValueOnce({
        resume: mockResumePayload,
        coverLetterMarkdown: mockCoverLetter,
      });

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    spy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body.data.resume).toBeDefined();
    expect(res.body.data.coverLetter).toBeDefined();
    expect(res.body.data.validation.isValid).toBe(true);
    expect(typeof res.body.data.validation.coverageDelta).toBe('number');
    expect(res.body.data.resume.fileUrl).toContain('.pdf');
    expect(res.body.data.coverLetter.fileUrl).toContain('.pdf');
    expect(res.body.data.quota.usedToday).toBe(1);
    expect(res.body.data.quota.remainingToday).toBe(4);

    generatedResumeId = res.body.data.resume.id;
    generatedCoverLetterId = res.body.data.coverLetter.id;

    // Verify application was updated with resumeId
    const checkApp = await request(app)
      .get(`/api/v1/applications/${applicationId}`)
      .set('Cookie', userCookie);
    expect(checkApp.body.data.resumeId).toBe(generatedResumeId);
  });

  it('POST /api/v1/tailoring/applications/:id/generate generates resume only when targetArtifact is resume', async () => {
    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockResolvedValueOnce({
        resume: mockResumePayload,
        coverLetterMarkdown: mockCoverLetter,
      });

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'resume' });

    spy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body.data.resume).toBeDefined();
    expect(res.body.data.coverLetter).toBeUndefined();
    expect(res.body.data.quota.usedToday).toBe(2);
    expect(res.body.data.quota.remainingToday).toBe(3);
  });

  it('POST /api/v1/tailoring/applications/:id/generate generates cover letter only when targetArtifact is cover_letter', async () => {
    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockResolvedValueOnce({
        resume: mockResumePayload,
        coverLetterMarkdown: mockCoverLetter,
      });

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'cover_letter' });

    spy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body.data.resume).toBeUndefined();
    expect(res.body.data.coverLetter).toBeDefined();
    expect(res.body.data.quota.usedToday).toBe(3);
    expect(res.body.data.quota.remainingToday).toBe(2);
  });

  it('POST /api/v1/tailoring/applications/:id/generate blocks ungrounded claims with 422 and does not deduct quota', async () => {
    const ungroundedResume = {
      ...mockResumePayload,
      experience: [
        {
          ...mockResumePayload.experience[0],
          bullets: ['Cut server latency by 40% and improved query speeds by 10x.'],
        },
      ],
    };

    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockResolvedValueOnce({
        resume: ungroundedResume,
        coverLetterMarkdown: mockCoverLetter,
      });

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'resume' });

    spy.mockRestore();

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('UNGROUNDED_CLAIMS_DETECTED');
    expect(res.body.error.message).toContain('Ungrounded metric claim: "40%"');

    // Quota should NOT have been deducted
    const quotaRes = await request(app)
      .get('/api/v1/tailoring/quota')
      .set('Cookie', userCookie);
    expect(quotaRes.body.data.usedToday).toBe(3);
  });

  it('POST /api/v1/tailoring/applications/:id/generate allows ungrounded claims when overrideWarnings is true', async () => {
    const ungroundedResume = {
      ...mockResumePayload,
      experience: [
        {
          ...mockResumePayload.experience[0],
          bullets: ['Cut server latency by 40% and improved query speeds by 10x.'],
        },
      ],
    };

    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockResolvedValueOnce({
        resume: ungroundedResume,
        coverLetterMarkdown: mockCoverLetter,
      });

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'resume', overrideWarnings: true });

    spy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body.data.resume).toBeDefined();
    expect(res.body.data.validation.isValid).toBe(false);
    expect(res.body.data.validation.blocking).toBe(true);
    expect(res.body.data.validation.fidelityWarnings.length).toBeGreaterThan(0);
    expect(res.body.data.quota.usedToday).toBe(4);
  });

  it('POST /api/v1/tailoring/applications/:id/generate fails loudly with 503 and rolls back DB writes when Chromium is missing', async () => {
    const appRes = await request(app)
      .post('/api/v1/applications')
      .set('Cookie', userCookie)
      .send({
        companyName: 'Failing Chromium Corp',
        position: 'Backend Developer',
        status: 'APPLIED',
        priority: 'MEDIUM',
        description: 'Need a Node.js developer with TypeScript.',
      });
    const testAppId = appRes.body.data.id;

    const resumeCountBefore = await prisma.resume.count({
      where: { notes: { contains: 'Failing Chromium Corp' } },
    });
    const clCountBefore = await prisma.coverLetter.count({
      where: { company: 'Failing Chromium Corp' },
    });

    const chromCoverLetter = `
Dear Failing Chromium Corp Team,

I am writing to apply for the Backend Developer position at Failing Chromium Corp.
In my work at Uzaro Solutions Technology Inc., I delivered reliable platform code.
I handled 6,000+ records.

Sincerely,
Zen Andrei Obrero
    `.trim();

    const aiSpy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockResolvedValueOnce({
        resume: mockResumePayload,
        coverLetterMarkdown: chromCoverLetter,
      });
    const chromSpy = vi.spyOn(PdfRendererService, 'findChromiumBinary').mockReturnValue(null);

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${testAppId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    aiSpy.mockRestore();
    chromSpy.mockRestore();

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toContain('PDF generation is temporarily unavailable');

    const resumeCountAfter = await prisma.resume.count({
      where: { notes: { contains: 'Failing Chromium Corp' } },
    });
    const clCountAfter = await prisma.coverLetter.count({
      where: { company: 'Failing Chromium Corp' },
    });
    expect(resumeCountAfter).toBe(resumeCountBefore);
    expect(clCountAfter).toBe(clCountBefore);

    const checkApp = await request(app)
      .get(`/api/v1/applications/${testAppId}`)
      .set('Cookie', userCookie);
    expect(checkApp.body.data.resumeId).toBeNull();
  });

  it('GET /api/v1/tailoring/resumes/:id/preview-html renders classic HTML layout', async () => {
    const res = await request(app)
      .get(`/api/v1/tailoring/resumes/${generatedResumeId}/preview-html`)
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.headers['x-frame-options']).toBeUndefined();
    expect(res.headers['content-security-policy']).toContain('frame-ancestors');
    expect(res.text).toContain('Zen Andrei Obrero Resume');
    expect(res.text).toContain('Bandai Namco HRIS');
    expect(res.text).toContain('Uzaro Solutions Technology Inc.');
    expect(res.text).not.toContain('Professional Summary');
  });

  it('GET /api/v1/tailoring/cover-letters/:id/preview-html renders cover letter HTML', async () => {
    const res = await request(app)
      .get(`/api/v1/tailoring/cover-letters/${generatedCoverLetterId}/preview-html`)
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.headers['x-frame-options']).toBeUndefined();
    expect(res.headers['content-security-policy']).toContain('frame-ancestors');
    expect(res.text).toContain('Cover Letter');
    expect(res.text).toContain('Acme Software');
  });

  it('Cover Letter CRUD endpoints work smoothly', async () => {
    const getRes = await request(app)
      .get(`/api/v1/cover-letters/${generatedCoverLetterId}`)
      .set('Cookie', userCookie);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(generatedCoverLetterId);

    const updateRes = await request(app)
      .patch(`/api/v1/cover-letters/${generatedCoverLetterId}`)
      .set('Cookie', userCookie)
      .send({
        content: 'Dear Hiring Manager,\n\nI am thrilled to submit my tailored application for this opportunity.',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.content).toContain('thrilled to submit my tailored application');

    const listAllRes = await request(app)
      .get('/api/v1/cover-letters')
      .set('Cookie', userCookie);
    expect(listAllRes.status).toBe(200);
    expect(listAllRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(listAllRes.body.data[0].application).toBeDefined();
    expect(listAllRes.body.data[0].application.company.name).toBe('Acme Software');

    const listRes = await request(app)
      .get(`/api/v1/cover-letters/application/${applicationId}`)
      .set('Cookie', userCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(2);

    const deleteRes = await request(app)
      .delete(`/api/v1/cover-letters/${generatedCoverLetterId}`)
      .set('Cookie', userCookie);
    expect(deleteRes.status).toBe(200);
  });

  it('POST /api/v1/tailoring/applications/:id/generate enforces daily limit and returns 402 PLANS_REQUIRED when limit reached', async () => {
    const today = new Date().toISOString().slice(0, 10);
    // Artificially max out the quota to 5
    await prisma.generationUsage.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, count: 5 },
      update: { count: 5 },
    });

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('PLANS_REQUIRED');
    expect(res.body.error.message).toContain('Daily free generation limit (5) reached');
  });

  it('POST /api/v1/tailoring/applications/:id/generate returns 402 PLANS_REQUIRED when REQUIRE_PAID_PLAN is true', async () => {
    // Reset usage count so daily limit is not the blocker
    const today = new Date().toISOString().slice(0, 10);
    await prisma.generationUsage.update({
      where: { userId_date: { userId, date: today } },
      data: { count: 0 },
    });

    process.env.REQUIRE_PAID_PLAN = 'true';

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    delete process.env.REQUIRE_PAID_PLAN;

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('PLANS_REQUIRED');
    expect(res.body.error.message).toContain('paid plan is required');
  });

  it('POST /api/v1/tailoring/applications/:id/generate redacts GEMINI_API_KEY on failure', async () => {
    const testSecretKey = 'secret_gemini_test_api_key_12345';
    process.env.GEMINI_API_KEY = testSecretKey;

    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockRejectedValueOnce(
        new Error(`Google API network timeout at https://generativelanguage.googleapis.com/v1beta/models?key=${testSecretKey}`)
      );

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    spy.mockRestore();

    expect(res.status).toBe(503);
    expect(res.body.error.message).not.toContain(testSecretKey);
    expect(res.body.error.message).toContain('[REDACTED]');
  });

  it('POST /api/v1/tailoring/applications/:id/generate rejects malformed AI output without saving deliverables', async () => {
    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockRejectedValueOnce(
        new Error('Malformed AI tailoring output structure: resume.basics.name: Candidate name is required')
      );

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    spy.mockRestore();

    expect(res.status).toBe(503);
    expect(res.body.error.message).toContain('Malformed AI tailoring output structure');
  });

  it('POST /api/v1/tailoring/applications/:id/generate rolls back DB writes and quota when transaction fails mid-flight', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const initialUsage = await prisma.generationUsage.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    const initialCount = initialUsage?.count || 0;

    const spy = vi
      .spyOn(tailoringService, 'callGeminiSynthesis')
      .mockResolvedValueOnce({
        resume: mockResumePayload,
        coverLetterMarkdown: mockCoverLetter,
      });

    const originalTransaction = prisma.$transaction.bind(prisma);
    const txSpy = vi
      .spyOn(prisma, '$transaction')
      .mockImplementationOnce(async (fn: any, ...args: any[]) => {
        return originalTransaction(async (tx: any) => {
          tx.timelineEvent.create = vi
            .fn()
            .mockRejectedValueOnce(new Error('Simulated mid-transaction failure'));
          return fn(tx);
        }, ...args);
      });

    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ targetArtifact: 'package' });

    spy.mockRestore();
    txSpy.mockRestore();

    expect(res.status).toBe(500);

    // Verify quota count was NOT incremented due to transaction rollback
    const afterUsage = await prisma.generationUsage.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    expect(afterUsage?.count || 0).toBe(initialCount);
  });

  it('serves static /uploads files with framing allowed for in-app previews', async () => {
    const res = await request(app).get('/uploads/health-check-nonexistent.pdf');
    expect(res.headers['x-frame-options']).toBeUndefined();
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'self' *");
  });
});

