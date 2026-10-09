import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Tailoring and Cover Letter API Integration Tests', () => {
  let userCookie: string[];
  let applicationId: string;
  let generatedResumeId: string;
  let generatedCoverLetterId: string;

  beforeAll(async () => {
    // 1. Register test user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `tailoring_test_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Zen Andrei Obrero',
      });
    userCookie = regRes.headers['set-cookie'];

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
          - Maintain strong engineering rigor and lead sprint delivery in Agile workflows.
        `,
      });
    applicationId = appRes.body.data.id;
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

  it('POST /api/v1/tailoring/applications/:id/generate generates tailored resume & cover letter', async () => {
    const res = await request(app)
      .post(`/api/v1/tailoring/applications/${applicationId}/generate`)
      .set('Cookie', userCookie)
      .send({ mode: 'deterministic' });

    expect(res.status).toBe(200);
    expect(res.body.data.resume).toBeDefined();
    expect(res.body.data.coverLetter).toBeDefined();
    expect(res.body.data.validation.isValid).toBe(true);
    expect(res.body.data.resume.fileUrl).toContain('.pdf');
    expect(res.body.data.coverLetter.fileUrl).toContain('.pdf');

    generatedResumeId = res.body.data.resume.id;
    generatedCoverLetterId = res.body.data.coverLetter.id;

    // Verify application was updated with resumeId
    const checkApp = await request(app)
      .get(`/api/v1/applications/${applicationId}`)
      .set('Cookie', userCookie);
    expect(checkApp.body.data.resumeId).toBe(generatedResumeId);
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
    // Must NOT contain a summary section per positioning rules
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
    // 1. Get by ID
    const getRes = await request(app)
      .get(`/api/v1/cover-letters/${generatedCoverLetterId}`)
      .set('Cookie', userCookie);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(generatedCoverLetterId);

    // 2. Update cover letter
    const updateRes = await request(app)
      .patch(`/api/v1/cover-letters/${generatedCoverLetterId}`)
      .set('Cookie', userCookie)
      .send({
        content: 'Dear Hiring Manager,\n\nI am thrilled to submit my tailored application for this opportunity.',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.content).toContain('thrilled to submit my tailored application');

    // 3. List all user cover letters
    const listAllRes = await request(app)
      .get('/api/v1/cover-letters')
      .set('Cookie', userCookie);
    expect(listAllRes.status).toBe(200);
    expect(listAllRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(listAllRes.body.data[0].application).toBeDefined();
    expect(listAllRes.body.data[0].application.company.name).toBe('Acme Software');

    // 4. List for application
    const listRes = await request(app)
      .get(`/api/v1/cover-letters/application/${applicationId}`)
      .set('Cookie', userCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    // 5. Delete
    const deleteRes = await request(app)
      .delete(`/api/v1/cover-letters/${generatedCoverLetterId}`)
      .set('Cookie', userCookie);
    expect(deleteRes.status).toBe(200);
  });

  it('serves static /uploads files with framing allowed for in-app previews', async () => {
    const res = await request(app).get('/uploads/health-check-nonexistent.pdf');
    // Even on 404 or file response, the framing headers should be configured
    expect(res.headers['x-frame-options']).toBeUndefined();
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'self' *");
  });
});
