import { describe, it, expect } from 'vitest';
import { JdAnalyzerService } from '../src/modules/tailoring/jd-analyzer.service';
import { TailoringValidatorService } from '../src/modules/tailoring/tailoring-validator.service';
import { MasterProfileDTO } from '@tracker/types';

describe('JD Analyzer & Tailoring Validator Service Tests', () => {
  const mockProfile: MasterProfileDTO = {
    id: 'profile_1',
    userId: 'user_1',
    basics: {
      name: 'Zen Andrei Obrero',
      links: [{ label: 'GitHub', url: 'https://github.com/ZenDevvv' }],
    },
    positioningRules: ['Lead with fullstack React and TypeScript.'],
    factBank: {
      core_positioning: ['Professional fullstack developer'],
      priority_themes: ['React', 'TypeScript', 'Prisma', 'HRIS'],
      quantified_highlights: ['6,000+ employee records in Bandai Namco HRIS'],
    },
    workExperience: [
      {
        company: 'Uzaro Solutions Technology Inc.',
        role: 'Technology Developer',
        date_range: 'Nov 2024 - Present',
        bullets: [
          'Built and shipped Bandai Namco HRIS handling 6,000+ employee records using React, TypeScript, and Prisma.',
          'Integrated IoT devices with sub-500ms latency via REST APIs.',
        ],
      },
    ],
    projectExperience: [
      {
        name: 'Bandai Namco HRIS',
        stack: ['React', 'TypeScript', 'Node.js', 'Prisma', 'MongoDB'],
        bullets: ['Multi-tenant HRIS module with role-based visibility across tenants.'],
      },
    ],
    technicalSkills: {
      Frontend: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      Backend: ['Node.js', 'Express', 'Prisma', 'MongoDB'],
    },
    education: [
      {
        school: 'Biliran Province State University',
        degree: 'BS Computer Science',
        graduation: '2024',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleJd = `
    Job Description: Senior Full Stack Developer (React & TypeScript)
    We are seeking a Full Stack Developer to build and iterate clickable prototypes and production enterprise applications.
    Requirements:
    - 3+ years experience with React and TypeScript.
    - Strong knowledge of Node.js, Express, and Prisma ORM with MongoDB or PostgreSQL.
    - Ability to design REST APIs, integrate IoT smart devices, and manage CI/CD pipelines.
    - Excellent communication and ability to lead sprint delivery in an Agile environment.
  `;

  it('JdAnalyzerService extracts keywords, verbs, and exact phrases from JD', () => {
    const analysis = JdAnalyzerService.analyze(sampleJd, mockProfile, 'Senior Full Stack Developer', 'TechCorp');

    expect(analysis.matchScore).toBeGreaterThan(50);
    expect(analysis.highPriorityKeywords.some((k) => k.toLowerCase().includes('react'))).toBe(true);
    expect(analysis.highPriorityKeywords.some((k) => k.toLowerCase().includes('typescript'))).toBe(true);
    expect(analysis.keyVerbs).toContain('build');
    expect(analysis.keyVerbs).toContain('design');
    expect(analysis.matchedKeywords.some((k) => k.toLowerCase().includes('react'))).toBe(true);
    expect(analysis.exactPhrases.length).toBeGreaterThan(0);
  });

  it('TailoringValidatorService validates high keyword coverage and phrase echoes', () => {
    const tailoredResume = {
      experience: [
        {
          company: 'Uzaro Solutions Technology Inc.',
          role: 'Technology Developer',
          bullets: [
            'Built and iterate clickable prototypes and enterprise applications with React and TypeScript.',
            'Designed REST APIs and integrated IoT smart devices using Node.js and Prisma ORM.',
          ],
        },
      ],
      projects: mockProfile.projectExperience,
      skills: mockProfile.technicalSkills,
    };

    const tailoredCoverLetter = `
      Dear Hiring Manager,
      I am thrilled to apply for the Senior Full Stack Developer role.
      During my work at Uzaro Solutions, I have helped build and iterate clickable prototypes
      while scaling systems to 6,000+ employee records.
    `;

    const keywords = ['react', 'typescript', 'node.js', 'prisma', 'iot'];
    const exactPhrases = ['build and iterate clickable prototypes'];

    const report = TailoringValidatorService.validate(
      tailoredResume,
      tailoredCoverLetter,
      keywords,
      exactPhrases,
      mockProfile
    );

    expect(report.keywordCoveragePercent).toBeGreaterThanOrEqual(80);
    expect(report.exactPhraseEchoes).toContain('build and iterate clickable prototypes');
    expect(report.fidelityWarnings).toHaveLength(0);
    expect(report.isValid).toBe(true);
  });

  it('TailoringValidatorService flags ungrounded skills not present in MasterProfile', () => {
    const hallucinatedResume = {
      experience: mockProfile.workExperience,
      projects: mockProfile.projectExperience,
      skills: {
        Frontend: ['React', 'TypeScript', 'Notion', 'Webflow', 'Zapier'], // Not in master
      },
    };

    const report = TailoringValidatorService.validate(
      hallucinatedResume,
      'Generic cover letter',
      ['react'],
      [],
      mockProfile
    );

    expect(report.fidelityWarnings.length).toBeGreaterThanOrEqual(3);
    expect(report.fidelityWarnings.some((w) => w.includes('Notion'))).toBe(true);
    expect(report.isValid).toBe(false);
  });

  describe('Task 7 Keyword Extraction Improvements', () => {
    it('stems common inflections (manage, management, managing, managed)', () => {
      expect(JdAnalyzerService.stemWord('manage')).toBe('manag');
      expect(JdAnalyzerService.stemWord('management')).toBe('manag');
      expect(JdAnalyzerService.stemWord('managing')).toBe('manag');
      expect(JdAnalyzerService.stemWord('managed')).toBe('manag');
      expect(JdAnalyzerService.stemWord('deployments')).toBe('deploy');
      expect(JdAnalyzerService.stemWord('deployment')).toBe('deploy');
      expect(JdAnalyzerService.stemWord('microservices')).toBe('microservic');
    });

    it('matches "managing deployments" when candidate profile has "management"', () => {
      const jd = `
        We need an experienced lead to handle managing deployments across global cloud infrastructure.
      `;
      const profileWithManagement: MasterProfileDTO = {
        ...mockProfile,
        technicalSkills: {
          Management: ['Release Management'],
        },
      };

      const analysis = JdAnalyzerService.analyze(jd, profileWithManagement);
      expect(
        analysis.matchedKeywords.some((k) =>
          k.toLowerCase().includes('managing') || k.toLowerCase().includes('deployments')
        )
      ).toBe(true);
    });

    it('partial-matches multi-word keyword "microservices architecture" when profile contains "microservices"', () => {
      const jd = `
        Requires strong experience in microservices architecture and distributed systems.
      `;
      const profileWithMicroservices: MasterProfileDTO = {
        ...mockProfile,
        technicalSkills: {
          Backend: ['Microservices'],
        },
      };

      const analysis = JdAnalyzerService.analyze(jd, profileWithMicroservices);
      expect(
        analysis.matchedKeywords.some((k) => k.toLowerCase().includes('microservices'))
      ).toBe(true);
    });

    it('treats candidate profile skills as tech priors even if not in hardcoded TECH_PATTERN', () => {
      const jd = `
        Building scalable apps using Solidity and decentralized protocols.
      `;
      const profileWithSolidity: MasterProfileDTO = {
        ...mockProfile,
        technicalSkills: {
          Blockchain: ['Solidity'],
        },
      };

      const analysis = JdAnalyzerService.analyze(jd, profileWithSolidity);
      expect(analysis.highPriorityKeywords.some((k) => k.toLowerCase().includes('solidity'))).toBe(true);
      expect(analysis.matchedKeywords.some((k) => k.toLowerCase().includes('solidity'))).toBe(true);
    });
  });
});

