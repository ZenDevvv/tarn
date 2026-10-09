import { describe, it, expect } from 'vitest';
import { ProfileExtractorService } from '../src/modules/master-profile/profile-extractor.service';

describe('ProfileExtractorService Tests', () => {
  const FABRICATED_STRINGS = [
    'Engineered scalable web applications',
    'Built production-ready web application.',
    'Project Highlight',
    'Company',
    'Engineer / Developer',
    'University',
    'Bachelor of Science in Computer Science',
    'https://github.com/',
    'https://linkedin.com/',
    'https://portfolio.dev',
  ];

  it('never invents facts on a bare-bones resume and surfaces warnings', () => {
    const bareResume = `
Jane Plain
jane@plain.io
555-0199
    `.trim();

    const { profile, warnings } = ProfileExtractorService.parseResumeText(bareResume);

    // Verify basics
    expect(profile.basics.name).toBe('Jane Plain');
    expect(profile.basics.email).toBe('jane@plain.io');
    expect(profile.basics.phone).toBe('555-0199');
    expect(profile.basics.location).toBeNull();
    expect(profile.basics.links).toEqual([]);

    // Verify empty arrays for unparsed sections
    expect(profile.workExperience).toEqual([]);
    expect(profile.projectExperience).toEqual([]);
    expect(profile.skills).toEqual({});
    expect(profile.education).toEqual([]);

    // Verify NO fabricated strings exist anywhere in the output JSON
    const jsonString = JSON.stringify(profile);
    for (const placeholder of FABRICATED_STRINGS) {
      expect(jsonString).not.toContain(placeholder);
    }

    // Verify warnings for empty expected fields
    expect(warnings).toContain('Location not found — please verify');
    expect(warnings).toContain('Skills not found — please verify');
    expect(warnings).toContain('Work experience not found — please verify');
    expect(warnings).toContain('Education not found — please verify');
  });

  it('derives positioning from parsed content without tech-biased seeds', () => {
    const nurseResume = `
Maria Santos
maria.santos@rn.org | Chicago, IL

WORK EXPERIENCE
Mercy General Hospital | Registered Nurse, ICU | Jan 2020 - Present
• Triaged 30+ emergency patients per shift under 1:1 acuity protocols.

SKILLS
Patient Care: BLS, ACLS, PALS, Epic EHR, triage

LICENSES
• Registered Nurse (RN) — Illinois
• Basic Life Support (BLS)
    `.trim();

    const { profile } = ProfileExtractorService.parseResumeText(nurseResume);

    expect(profile.positioningRules).toEqual([]);
    const factBankJson = JSON.stringify(profile.factBank);
    expect(factBankJson).not.toContain('full-stack');
    expect(factBankJson).not.toContain('Full-stack engineer');
    expect(profile.factBank.core_positioning?.[0]).toContain('Registered Nurse');
  });

  it('extracts only literal URLs and labels them from hostname without inventing fake links', () => {
    const resumeWithKeywordsAndUrls = `
Dev Person
dev@example.com
Check out my GitHub and portfolio online!
Links:
https://github.com/devperson/repo
https://devperson.me
https://linkedin.com/in/devperson
    `.trim();

    const { profile } = ProfileExtractorService.parseResumeText(resumeWithKeywordsAndUrls);

    expect(profile.basics.links).toEqual([
      { label: 'GitHub', url: 'https://github.com/devperson/repo' },
      { label: 'devperson.me', url: 'https://devperson.me' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/devperson' },
    ]);
  });

  it('does not create fake links when only keywords are mentioned without URLs', () => {
    const resumeWithOnlyKeywords = `
Dev Person
dev@example.com
Portfolio | GitHub | LinkedIn
    `.trim();

    const { profile } = ProfileExtractorService.parseResumeText(resumeWithOnlyKeywords);
    expect(profile.basics.links).toEqual([]);
  });

  it('parses generic international and remote locations without PH-centrism', () => {
    const testCases = [
      { text: 'Dev Person\nRemote\n555-1234', expected: 'Remote' },
      { text: 'Dev Person\nSan Francisco, CA\n555-1234', expected: 'San Francisco, CA' },
      { text: 'Dev Person\nLondon, UK\n555-1234', expected: 'London, UK' },
      { text: 'Dev Person\nToronto, ON\n555-1234', expected: 'Toronto, ON' },
      { text: 'Dev Person\nBerlin, DE\n555-1234', expected: 'Berlin, DE' },
      { text: 'Dev Person\nPasig City, PH\n555-1234', expected: 'Pasig City, PH' },
    ];

    for (const tc of testCases) {
      const { profile } = ProfileExtractorService.parseResumeText(tc.text);
      expect(profile.basics.location).toBe(tc.expected);
    }
  });

  it('guards against acronyms being misidentified as locations', () => {
    const textWithAcronyms = `
Dev Person
AWS, SaaS, REST API developer
dev@example.com
    `.trim();

    const { profile, warnings } = ProfileExtractorService.parseResumeText(textWithAcronyms);
    expect(profile.basics.location).toBeNull();
    expect(warnings).toContain('Location not found — please verify');
  });

  it('parses real sections faithfully without adding fabricated defaults', () => {
    const realResume = `
Alice Wonder
alice@wonder.tech | Austin, TX
https://alicewonder.dev

WORK EXPERIENCE
TechFlow Inc | Senior Developer | 2022 - Present
• Reduced API latency by 45% using Redis caching.
• Designed event-driven pipeline handling 10M daily events.

TECHNICAL SKILLS
Languages: TypeScript, Go, Python
Databases: PostgreSQL, Redis

EDUCATION
University of Texas at Austin
Bachelor of Science in Electrical Engineering | 2021
    `.trim();

    const { profile, warnings } = ProfileExtractorService.parseResumeText(realResume);

    expect(profile.basics.name).toBe('Alice Wonder');
    expect(profile.basics.location).toBe('Austin, TX');
    expect(profile.basics.email).toBe('alice@wonder.tech');
    expect(profile.basics.links).toEqual([{ label: 'alicewonder.dev', url: 'https://alicewonder.dev' }]);

    expect(profile.workExperience).toHaveLength(1);
    expect(profile.workExperience[0].company).toBe('TechFlow Inc');
    expect(profile.workExperience[0].role).toBe('Senior Developer');
    expect(profile.workExperience[0].bullets).toHaveLength(2);

    expect(profile.skills.Languages).toEqual(['TypeScript', 'Go', 'Python']);
    expect(profile.skills.Databases).toEqual(['PostgreSQL', 'Redis']);

    expect(profile.education).toHaveLength(1);
    expect(profile.education[0].school).toBe('University of Texas at Austin');
    expect(profile.education[0].degree).toContain('Bachelor of Science in Electrical Engineering');
    expect(profile.education[0].graduation).toBe('2021');

    // Should not have warnings for fields that were present
    expect(warnings).not.toContain('Work experience not found — please verify');
    expect(warnings).not.toContain('Education not found — please verify');
    expect(warnings).not.toContain('Skills not found — please verify');
    expect(warnings).not.toContain('Location not found — please verify');
  });

  it('extracts CERTIFICATIONS section into factBank.certifications', () => {    const resumeWithCerts = `
David Cloud
david@cloud.io | Seattle, WA

WORK EXPERIENCE
Cloud Native Co | Cloud Architect | 2021 - Present
• Deployed Kubernetes clusters across multi-cloud regions.

TECHNICAL SKILLS
Cloud: AWS, GCP, Kubernetes

EDUCATION
University of Washington
BS Computer Science | 2020

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate
• Certified Kubernetes Administrator (CKA)
• HashiCorp Certified: Terraform Associate
    `.trim();

    const { profile } = ProfileExtractorService.parseResumeText(resumeWithCerts);

    expect(profile.factBank.certifications).toBeDefined();
    expect(profile.factBank.certifications).toEqual([
      'AWS Certified Solutions Architect - Associate',
      'Certified Kubernetes Administrator (CKA)',
      'HashiCorp Certified: Terraform Associate',
    ]);
  });

  it('disambiguates role and employer across professions via two-signal detection', () => {
    const cases = [
      {
        // employer first, non-tech title
        header: 'Mercy General Hospital | Registered Nurse, ICU | Jan 2020 - Present',
        role: 'Registered Nurse, ICU',
        company: 'Mercy General Hospital',
      },
      {
        // title first, non-tech employer
        header: 'Registered Nurse, ICU | Mercy General Hospital | Jan 2020 - Present',
        role: 'Registered Nurse, ICU',
        company: 'Mercy General Hospital',
      },
      {
        // finance
        header: 'Acme Manufacturing, Inc. | Division Controller | Mar 2018 - Present',
        role: 'Division Controller',
        company: 'Acme Manufacturing, Inc.',
      },
      {
        // education
        header: 'Lincoln Elementary School | Elementary School Teacher | Aug 2019 - Present',
        role: 'Elementary School Teacher',
        company: 'Lincoln Elementary School',
      },
    ];

    for (const tc of cases) {
      const { profile, warnings } = ProfileExtractorService.parseResumeText(
        `Jane Doe\njane@x.io\n\nWORK EXPERIENCE\n${tc.header}\n• Delivered measurable outcomes in the role.`
      );
      expect(profile.workExperience[0].role).toBe(tc.role);
      expect(profile.workExperience[0].company).toBe(tc.company);
      expect(warnings.some((w) => w.includes('Verify role/employer split'))).toBe(false);
    }
  });

  it('warns instead of silently guessing on ambiguous role/employer split', () => {
    const { profile, warnings } = ProfileExtractorService.parseResumeText(`
Jane Doe
jane@x.io

WORK EXPERIENCE
Acme Group | Nightingale Health | 2021 - 2024
• Did important work.
    `.trim());

    expect(profile.workExperience[0].company).toBe('Acme Group');
    expect(warnings.some((w) => w.includes('Verify role/employer split'))).toBe(true);
  });
});
