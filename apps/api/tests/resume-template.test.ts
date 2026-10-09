import { describe, it, expect } from 'vitest';
import { buildResumeHtml } from '../src/modules/tailoring/templates/resume-template';
import { determineOptimalSectionOrder } from '../src/modules/tailoring/tailoring.service';

describe('buildResumeHtml Dynamic Section Ordering & Certifications Tests', () => {
  const baseProfile = {
    basics: {
      name: 'Alex Johnson',
      location: 'San Francisco, CA',
      phone: '555-1234',
      email: 'alex@example.com',
      links: [{ label: 'GitHub', url: 'https://github.com/alex' }],
    },
    education: [
      {
        school: 'University of California, Berkeley',
        degree: 'BS Computer Science',
        graduation: '2023',
      },
    ],
    skills: {
      Languages: ['TypeScript', 'Python'],
      Cloud: ['AWS', 'Docker'],
    },
  };

  it('renders Work Experience before Education for experienced candidate (>=2 jobs) and omits summary by default', () => {
    const payload = {
      ...baseProfile,
      experience: [
        {
          company: 'Acme Corp',
          role: 'Senior Software Engineer',
          date_range: '2023 - Present',
          bullets: ['Architected distributed event stream with Kafka.'],
        },
        {
          company: 'Beta LLC',
          role: 'Software Engineer',
          date_range: '2021 - 2023',
          bullets: ['Built microservices handling 5k req/sec.'],
        },
      ],
      projects: [
        {
          name: 'CloudSync',
          bullets: ['Open-source sync agent.'],
        },
      ],
    };

    const html = buildResumeHtml(payload);

    // Verify no Professional Summary section is present
    expect(html).not.toContain('Professional Summary');

    // Verify Work Experience appears before Education in the HTML output
    const expIndex = html.indexOf('Work Experience');
    const eduIndex = html.indexOf('Education');
    expect(expIndex).toBeGreaterThan(-1);
    expect(eduIndex).toBeGreaterThan(-1);
    expect(expIndex).toBeLessThan(eduIndex);
  });

  it('renders Education before Experience for early-career / student profile (<=1 job) and renders summary when present', () => {
    const payload = {
      ...baseProfile,
      summary: 'Results-driven software engineer with expertise in TypeScript and cloud systems.',
      experience: [
        {
          company: 'Startup Co',
          role: 'Software Engineering Intern',
          date_range: 'Summer 2023',
          bullets: ['Assisted in frontend feature delivery.'],
        },
      ],
      projects: [
        {
          name: 'CampusNav',
          bullets: ['Campus navigation web app.'],
        },
      ],
    };

    const html = buildResumeHtml(payload);

    // Verify summary is rendered
    expect(html).toContain('Professional Summary');
    expect(html).toContain('Results-driven software engineer with expertise in TypeScript');

    const summaryIndex = html.indexOf('Professional Summary');
    const eduIndex = html.indexOf('Education');
    const expIndex = html.indexOf('Work Experience');

    // Order should be: Summary -> Education -> Projects/Skills -> Experience
    expect(summaryIndex).toBeLessThan(eduIndex);
    expect(eduIndex).toBeLessThan(expIndex);
  });

  it('renders dedicated Certifications section when certifications exist in payload', () => {
    const payload = {
      ...baseProfile,
      experience: [
        {
          company: 'Acme Corp',
          role: 'DevOps Engineer',
          date_range: '2022 - Present',
          bullets: ['Managed multi-region AWS clusters.'],
        },
        {
          company: 'Beta LLC',
          role: 'Cloud Engineer',
          date_range: '2020 - 2022',
          bullets: ['Configured Terraform IaC pipelines.'],
        },
      ],
      certifications: [
        'AWS Certified Solutions Architect - Associate (Amazon Web Services, 2024)',
        'Certified Kubernetes Administrator (CKA)',
      ],
    };

    const html = buildResumeHtml(payload);

    expect(html).toContain('Certifications & Licenses');
    expect(html).toContain('AWS Certified Solutions Architect - Associate');
    expect(html).toContain('Certified Kubernetes Administrator');
    expect(html).toContain('CKA');
  });

  it('supports structured objects for certifications with issuer and date', () => {
    const payload = {
      ...baseProfile,
      experience: [
        {
          company: 'Acme Corp',
          role: 'DevOps Engineer',
          date_range: '2022 - Present',
          bullets: ['Managed multi-region AWS clusters.'],
        },
        {
          company: 'Beta LLC',
          role: 'Cloud Engineer',
          date_range: '2020 - 2022',
          bullets: ['Configured Terraform IaC pipelines.'],
        },
      ],
      certifications: [
        {
          name: 'CompTIA Security+',
          issuer: 'CompTIA',
          date: '2023',
        },
      ],
    };

    const html = buildResumeHtml(payload);

    expect(html).toContain('CompTIA Security+');
    expect(html).toContain('CompTIA');
    expect(html).toContain('2023');
  });

  it('respects custom sectionOrder when provided in payload', () => {
    const payload = {
      ...baseProfile,
      experience: [
        {
          company: 'Acme Corp',
          role: 'Engineer',
          date_range: '2023 - Present',
          bullets: ['Engineered scalable APIs.'],
        },
      ],
      projects: [
        {
          name: 'Project Alpha',
          bullets: ['Personal project.'],
        },
      ],
      // Custom: Skills first, then Projects, then Education, then Experience
      sectionOrder: ['skills', 'projects', 'education', 'experience'],
    };

    const html = buildResumeHtml(payload);

    const skillsIndex = html.indexOf('Technical Skills');
    const projIndex = html.indexOf('Project Experience');
    const eduIndex = html.indexOf('Education');
    const expIndex = html.indexOf('Work Experience');

    expect(skillsIndex).toBeLessThan(projIndex);
    expect(projIndex).toBeLessThan(eduIndex);
    expect(eduIndex).toBeLessThan(expIndex);
  });

  it('renders Project Experience before Experience for portfolio/project-first profile (0 formal jobs, >=2 projects)', () => {
    const payload = {
      ...baseProfile,
      experience: [],
      projects: [
        {
          name: 'OpenCore Framework',
          bullets: ['Distributed actor framework in Rust.'],
        },
        {
          name: 'HyperDB',
          bullets: ['Embedded key-value engine.'],
        },
      ],
    };

    const html = buildResumeHtml(payload);

    const projIndex = html.indexOf('Project Experience');
    const eduIndex = html.indexOf('Education');

    expect(projIndex).toBeGreaterThan(-1);
    expect(eduIndex).toBeGreaterThan(-1);
    // Projects should precede Education and Experience
    expect(projIndex).toBeLessThan(eduIndex);
  });
});

describe('determineOptimalSectionOrder Profile Heuristic Tests', () => {
  it('returns experience-first order for experienced candidates (>=2 roles)', () => {
    const profile: any = {
      workExperience: [
        { company: 'A', role: 'Dev', bullets: ['Built APIs'] },
        { company: 'B', role: 'Dev', bullets: ['Built UI'] },
      ],
      projectExperience: [],
    };
    const order = determineOptimalSectionOrder(profile);
    expect(order).toEqual(['experience', 'projects', 'skills', 'education', 'certifications']);
  });

  it('returns experience-first order for candidate with 1 role but >=4 bullets', () => {
    const profile: any = {
      workExperience: [
        { company: 'A', role: 'Dev', bullets: ['b1', 'b2', 'b3', 'b4'] },
      ],
      projectExperience: [],
    };
    const order = determineOptimalSectionOrder(profile);
    expect(order).toEqual(['experience', 'projects', 'skills', 'education', 'certifications']);
  });

  it('returns portfolio/project-first order for candidates with 0 roles and >=2 projects', () => {
    const profile: any = {
      workExperience: [],
      projectExperience: [
        { name: 'Proj 1', bullets: ['b1'] },
        { name: 'Proj 2', bullets: ['b2'] },
      ],
    };
    const order = determineOptimalSectionOrder(profile);
    expect(order).toEqual(['projects', 'skills', 'education', 'certifications', 'experience']);
  });

  it('returns early-career/student order with summary placeholder for sparse profiles', () => {
    const profile: any = {
      workExperience: [
        { company: 'Intern Co', role: 'Intern', bullets: ['Assisted team'] },
      ],
      projectExperience: [
        { name: 'School Project', bullets: ['Completed lab'] },
      ],
    };
    const order = determineOptimalSectionOrder(profile);
    expect(order).toEqual(['summary', 'education', 'skills', 'projects', 'experience', 'certifications']);
  });
});
