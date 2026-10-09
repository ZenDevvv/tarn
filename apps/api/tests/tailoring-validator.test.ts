import { describe, it, expect } from 'vitest';
import { TailoringValidatorService } from '../src/modules/tailoring/tailoring-validator.service';
import { MasterProfileDTO } from '@tracker/types';

describe('TailoringValidatorService Unit Tests', () => {
  const sampleProfile: MasterProfileDTO = {
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
    positioningRules: ['Lead with fullstack engineering.'],
    factBank: {
      core_positioning: ['Professional fullstack developer'],
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
        ],
      },
    ],
    projectExperience: [
      {
        name: 'Bandai Namco HRIS',
        subtitle: 'Multi-tenant HRIS',
        stack: ['React', 'TypeScript', 'Node.js', 'Prisma'],
        bullets: ['Enterprise platform handling 6,000+ employee records.'],
      },
    ],
    technicalSkills: {
      Frontend: ['React', 'TypeScript', 'Tailwind CSS'],
      Backend: ['Node.js', 'Express', 'Prisma', 'PostgreSQL'],
    },
    education: [
      {
        school: 'Biliran Province State University',
        degree: 'BS Computer Science',
        honors: 'With Honors',
        graduation: 'May 2024',
      },
    ],
  };

  const sampleKeywords = ['React', 'TypeScript', 'Node.js', 'Prisma'];
  const samplePhrases = ['enterprise web platforms', 'agile workflows'];

  it('validates 100% faithful output with zero fidelity warnings', () => {
    const resumePayload = {
      experience: [
        {
          company: 'Uzaro Solutions Technology Inc.',
          role: 'Technology Developer',
          date_range: 'Nov 2024 - Present',
          bullets: [
            'Built and shipped Bandai Namco HRIS handling 6,000+ employee records with React and TypeScript.',
          ],
        },
      ],
      projects: [
        {
          name: 'Bandai Namco HRIS',
          bullets: ['Enterprise web platform with React.'],
        },
      ],
      skills: {
        Frontend: ['React', 'TypeScript'],
        Backend: ['Node.js', 'Prisma'],
      },
      education: [
        {
          school: 'Biliran Province State University',
          graduation: 'May 2024',
        },
      ],
    };

    const coverLetter = `
Dear Acme Software Hiring Team,

I am applying for the role. In my work at Uzaro Solutions Technology Inc., I delivered enterprise web platforms and adhered to agile workflows. I handled 6,000+ employee records with high reliability.

Sincerely,
Zen Andrei Obrero
    `.trim();

    const report = TailoringValidatorService.validate(
      resumePayload,
      coverLetter,
      sampleKeywords,
      samplePhrases,
      sampleProfile,
      'Acme Software'
    );

    expect(report.isValid).toBe(true);
    expect(report.blocking).toBe(false);
    expect(report.fidelityWarnings).toHaveLength(0);
    expect(report.keywordCoveragePercent).toBeGreaterThan(0);
    expect(report.exactPhraseEchoes).toContain('enterprise web platforms');
    expect(report.checkedDimensions).toContain('metrics');
    expect(report.checkedDimensions).toContain('dates');
  });

  it('flags ungrounded metric claims (e.g. "cut latency 40%", "$500k") as blocking warnings', () => {
    const resumePayload = {
      experience: [
        {
          company: 'Uzaro Solutions Technology Inc.',
          role: 'Technology Developer',
          bullets: [
            'Cut server latency by 40% and improved query speeds by 10x.',
            'Saved the department $500k in annual operating overhead.',
          ],
        },
      ],
      projects: [
        {
          name: 'Bandai Namco HRIS',
          bullets: ['Handled 6,000+ employee records.'],
        },
      ],
      skills: {
        Frontend: ['React'],
      },
    };

    const report = TailoringValidatorService.validate(
      resumePayload,
      '',
      sampleKeywords,
      samplePhrases,
      sampleProfile,
      'Acme Software'
    );

    expect(report.isValid).toBe(false);
    expect(report.blocking).toBe(true);
    expect(
      report.fidelityWarnings.some((w) => w.includes('Ungrounded metric claim: "40%"'))
    ).toBe(true);
    expect(
      report.fidelityWarnings.some((w) => w.includes('Ungrounded metric claim: "10x"'))
    ).toBe(true);
    expect(
      report.fidelityWarnings.some((w) => w.includes('Ungrounded metric claim: "$500k"'))
    ).toBe(true);
  });

  it('flags ungrounded project names not in candidate profile', () => {
    const resumePayload = {
      experience: [
        {
          company: 'Uzaro Solutions Technology Inc.',
          role: 'Technology Developer',
          bullets: ['Worked on web applications.'],
        },
      ],
      projects: [
        {
          name: 'Fabricated Crypto DEX',
          bullets: ['Built decentralised automated market maker.'],
        },
      ],
      skills: {
        Frontend: ['React'],
      },
    };

    const report = TailoringValidatorService.validate(
      resumePayload,
      '',
      sampleKeywords,
      samplePhrases,
      sampleProfile,
      'Acme Software'
    );

    expect(report.isValid).toBe(false);
    expect(report.blocking).toBe(true);
    expect(
      report.fidelityWarnings.some((w) =>
        w.includes('Ungrounded project claim: "Fabricated Crypto DEX"')
      )
    ).toBe(true);
  });

  it('flags ungrounded dates/years outside candidate history', () => {
    const resumePayload = {
      experience: [
        {
          company: 'Uzaro Solutions Technology Inc.',
          role: 'Technology Developer',
          date_range: 'Jan 2018 - Dec 2020',
          bullets: ['Engineered fullstack systems.'],
        },
      ],
      projects: [
        {
          name: 'Bandai Namco HRIS',
          bullets: ['Enterprise platform.'],
        },
      ],
      education: [
        {
          graduation: '2015',
        },
      ],
      skills: {
        Frontend: ['React'],
      },
    };

    const report = TailoringValidatorService.validate(
      resumePayload,
      '',
      sampleKeywords,
      samplePhrases,
      sampleProfile,
      'Acme Software'
    );

    expect(report.isValid).toBe(false);
    expect(report.blocking).toBe(true);
    expect(
      report.fidelityWarnings.some((w) => w.includes('Ungrounded year "2018"'))
    ).toBe(true);
    expect(
      report.fidelityWarnings.some((w) => w.includes('Ungrounded graduation year "2015"'))
    ).toBe(true);
  });

  it('flags ungrounded employers claimed in cover letter', () => {
    const resumePayload = {
      experience: [
        {
          company: 'Uzaro Solutions Technology Inc.',
          role: 'Technology Developer',
          bullets: ['Built systems.'],
        },
      ],
      projects: [
        {
          name: 'Bandai Namco HRIS',
          bullets: ['Enterprise platform.'],
        },
      ],
      skills: {
        Frontend: ['React'],
      },
    };

    const coverLetter = `
Dear Acme Software Team,

During my previous tenure at Netflix, I served as Principal Architect leading high throughput streams.
Now I look forward to bringing that experience to Acme Software.
    `.trim();

    const report = TailoringValidatorService.validate(
      resumePayload,
      coverLetter,
      sampleKeywords,
      samplePhrases,
      sampleProfile,
      'Acme Software'
    );

    expect(report.isValid).toBe(false);
    expect(report.blocking).toBe(true);
    expect(
      report.fidelityWarnings.some((w) =>
        w.includes('Ungrounded cover letter employer claim: "Netflix"')
      )
    ).toBe(true);
  });

  it('allows mentioning target company without false positive in cover letter', () => {
    const resumePayload = {
      experience: [
        {
          company: 'Uzaro Solutions Technology Inc.',
          role: 'Technology Developer',
          bullets: ['Built systems.'],
        },
      ],
      projects: [
        {
          name: 'Bandai Namco HRIS',
          bullets: ['Enterprise platform.'],
        },
      ],
      skills: {
        Frontend: ['React'],
      },
    };

    const coverLetter = `
Dear Acme Software Team,

I am excited about the opportunity to work at Acme Software as a Full Stack Web Developer.
In my work at Uzaro Solutions Technology Inc., I delivered reliable solutions.
    `.trim();

    const report = TailoringValidatorService.validate(
      resumePayload,
      coverLetter,
      sampleKeywords,
      samplePhrases,
      sampleProfile,
      'Acme Software'
    );

    expect(report.isValid).toBe(true);
    expect(report.blocking).toBe(false);
    expect(report.fidelityWarnings).toHaveLength(0);
  });

  it('correctly calculates coverageBefore, coverageAfter, and coverageDelta', () => {
    const resumePayload = {
      experience: [
        {
          company: 'Uzaro Solutions Technology Inc.',
          role: 'Technology Developer',
          bullets: ['Worked with React and TypeScript.'],
        },
      ],
      skills: {
        Frontend: ['React', 'TypeScript', 'Node.js', 'Prisma'],
      },
    };

    const initialCoverage = 50; // 50% before tailoring
    const report = TailoringValidatorService.validate(
      resumePayload,
      '',
      ['React', 'TypeScript', 'Node.js', 'Prisma'], // 4 keywords, all present in skills
      [],
      sampleProfile,
      'Acme Software',
      initialCoverage
    );

    expect(report.coverageBefore).toBe(50);
    expect(report.coverageAfter).toBe(100);
    expect(report.coverageDelta).toBe(50); // 100 - 50 = +50% lift
  });
});
