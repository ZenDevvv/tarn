import { describe, it, expect } from 'vitest';
import { ProfileExtractorService } from '../src/modules/master-profile/profile-extractor.service';
import { updateMasterProfileSchema } from '@tracker/validation';

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

  // spec-resume-ingestion.md §2.3 — real-world header layouts must never yield an
  // empty company or role, because updateMasterProfileSchema rejects both and a
  // single empty field 400s the entire profile import.
  const REAL_WORLD_LAYOUTS: Array<{ id: string; text: string }> = [
    {
      id: 'A — stacked: company line, then role+date line',
      text: `
Jane Doe
jane@x.io

WORK EXPERIENCE
Acme Corp Ltd
Software Engineer | Jan 2020 - Present
• Built things that shipped.
      `.trim(),
    },
    {
      id: 'B — "role | dates" line, then company line',
      text: `
Jane Doe
jane@x.io

WORK EXPERIENCE
Registered Nurse | Jan 2020 - Present
St Mary Hospital
• Triaged patients.
      `.trim(),
    },
    {
      id: 'C — single pipe line "company | role | dates"',
      text: `
Jane Doe
jane@x.io

WORK EXPERIENCE
Acme Corp Ltd | Software Engineer | Jan 2020 - Present
• Built things that shipped.
      `.trim(),
    },
    {
      id: 'D — nursing: "Registered Nurse | dates", employer below',
      text: `
Jane Doe
jane@x.io

WORK EXPERIENCE
Registered Nurse | Jan 2020 - Present
St Mary Hospital
• Triaged patients.
      `.trim(),
    },
  ];

  for (const layout of REAL_WORLD_LAYOUTS) {
    it(`never emits an empty company or role — layout ${layout.id}`, () => {
      const { profile, warnings } = ProfileExtractorService.parseResumeText(layout.text);

      expect(profile.workExperience.length).toBeGreaterThan(0);
      for (const job of profile.workExperience) {
        expect(job.company.trim()).not.toBe('');
        expect(job.role.trim()).not.toBe('');
      }

      // The invariant that actually matters: the draft must survive schema validation,
      // because a single empty field 400s the whole profile on confirm-import.
      const parsed = updateMasterProfileSchema.safeParse({
        ...profile,
        basics: { ...profile.basics, name: profile.basics.name || 'Jane Doe' },
      });
      expect(parsed.success, JSON.stringify(parsed.success ? [] : parsed.error.issues)).toBe(true);
      expect(warnings.some((w) => w.includes('Dropped unparseable experience segment'))).toBe(false);
    });
  }

  it('drops a segment with no company and no role signal, naming it in warnings', () => {
    const { profile, warnings } = ProfileExtractorService.parseResumeText(`
Jane Doe
jane@x.io

WORK EXPERIENCE
| Jan 2020 - Present
• Did work with no employer or title anywhere.
    `.trim());

    expect(profile.workExperience).toEqual([]);
    expect(warnings).toContain('Work experience not found — please verify');
  });

  // D2: a stacked header is two segments split across lines. Today the parser
  // assigns the earlier line to `role` and the dated line to `company`, which
  // silently swaps them whenever the earlier line is actually the employer.
  describe('stacked-header disambiguation', () => {
    it('assigns the company segment to company and the title segment to role', () => {
      const { profile, warnings } = ProfileExtractorService.parseResumeText(`
Jane Doe
jane@x.io

WORK EXPERIENCE
Acme Corp Ltd
Software Engineer | Jan 2020 - Present
• Built things that shipped.
      `.trim());

      expect(profile.workExperience[0].company).toBe('Acme Corp Ltd');
      expect(profile.workExperience[0].role).toBe('Software Engineer');
      expect(warnings.some((w) => w.includes('Missing'))).toBe(false);
    });

    it('keeps positional order and warns once when neither stacked segment disambiguates', () => {
      const { profile, warnings } = ProfileExtractorService.parseResumeText(`
Jane Doe
jane@x.io

WORK EXPERIENCE
Nightingale Health
Care Delivery Unit | Jan 2020 - Present
• Coordinated care across units.
      `.trim());

      // Ambiguous: first segment is the role, never a silent swap.
      expect(profile.workExperience[0].role).toBe('Nightingale Health');
      expect(profile.workExperience[0].company).toBe('Care Delivery Unit');
      expect(warnings.filter((w) => w.includes('Verify role/employer'))).toHaveLength(1);
    });

    it('keeps positional order and warns once when both stacked segments look like titles', () => {
      const { profile, warnings } = ProfileExtractorService.parseResumeText(`
Jane Doe
jane@x.io

WORK EXPERIENCE
Senior Project Manager
Operations Lead | Jan 2020 - Present
• Ran the operations portfolio.
      `.trim());

      expect(profile.workExperience[0].role).toBe('Senior Project Manager');
      expect(profile.workExperience[0].company).toBe('Operations Lead');
      expect(warnings.filter((w) => w.includes('Verify role/employer'))).toHaveLength(1);
    });

    it('lifts the employer line below a title-only dated header', () => {
      const { profile, warnings } = ProfileExtractorService.parseResumeText(`
Jane Doe
jane@x.io

WORK EXPERIENCE
Registered Nurse | Jan 2020 - Present
St Mary Hospital
• Triaged patients.
      `.trim());

      expect(profile.workExperience[0].role).toBe('Registered Nurse');
      expect(profile.workExperience[0].company).toBe('St Mary Hospital');
      expect(profile.workExperience[0].bullets).toEqual(['Triaged patients.']);
      expect(warnings.some((w) => w.includes('Missing'))).toBe(false);
    });
  });

  // D3 (spec-resume-ingestion.md §2.3 layout E): education entries are read positionally,
  // so a degree-first entry — qualification on line 1, institution on line 2 — inverts
  // school and degree. Silent data corruption, same class as the stacked-header swap.
  describe('education degree-first ordering', () => {
    const DEGREE_FIRST_RESUME = `
Jane Doe
jane@x.io

EDUCATION
BS Computer Science
Some University, 2020
    `.trim();

    it('assigns the institution line to school and the qualification line to degree', () => {
      const { profile } = ProfileExtractorService.parseResumeText(DEGREE_FIRST_RESUME);

      expect(profile.education).toHaveLength(1);
      expect(profile.education[0].school).toBe('Some University');
      expect(profile.education[0].degree).toBe('BS Computer Science');
      expect(profile.education[0].graduation).toBe('2020');
    });

    it('produces a schema-valid draft from the degree-first layout', () => {
      const { profile } = ProfileExtractorService.parseResumeText(DEGREE_FIRST_RESUME);

      const parsed = updateMasterProfileSchema.safeParse(profile);
      expect(parsed.success, JSON.stringify(parsed.success ? [] : parsed.error.issues)).toBe(true);
    });

    it('keeps the school-first layout assigned positionally', () => {
      const { profile } = ProfileExtractorService.parseResumeText(`
Jane Doe
jane@x.io

EDUCATION
Some University
BS Computer Science, 2020
      `.trim());

      expect(profile.education[0].school).toBe('Some University');
      expect(profile.education[0].degree).toBe('BS Computer Science, 2020');
    });

    it('keeps positional assignment when neither education line carries an institution signal', () => {
      const { profile } = ProfileExtractorService.parseResumeText(`
Jane Doe
jane@x.io

EDUCATION
Apprenticeship Certificate
Continuing Studies, 2019
      `.trim());

      expect(profile.education[0].school).toBe('Apprenticeship Certificate');
      expect(profile.education[0].degree).toBe('Continuing Studies, 2019');
    });
  });

  // Defence-in-depth behind the parse-time coalescing in pushJob. A parsed resume is
  // not an authored one: a header can carry neither an employer nor a title signal, and
  // min(1) on either field turns that single ambiguous segment into a 400 that
  // discards the entire profile. The user corrects the field in the review UI; nobody
  // should lose the whole import over one unreadable line.
  describe('updateMasterProfileSchema accepts an ambiguous work segment', () => {
    const profileWithEmptySignals = {
      basics: { name: 'Jane Doe' },
      workExperience: [
        {
          company: 'Acme Corp Ltd',
          role: 'Software Engineer',
          date_range: 'Jan 2020 - Present',
          bullets: ['Built things that shipped.'],
        },
        {
          company: '',
          role: '',
          date_range: 'Mar 2024 - May 2024',
          bullets: ['Supported an internship team.'],
        },
      ],
    };

    it('accepts a work entry whose company and role are empty strings', () => {
      const parsed = updateMasterProfileSchema.safeParse(profileWithEmptySignals);

      expect(parsed.success, JSON.stringify(parsed.success ? [] : parsed.error.issues)).toBe(true);
    });

    it('still rejects a non-string company so junk cannot enter the store', () => {
      const parsed = updateMasterProfileSchema.safeParse({
        ...profileWithEmptySignals,
        workExperience: [{ ...profileWithEmptySignals.workExperience[0], company: 42 }],
      });

      expect(parsed.success).toBe(false);
    });
  });
});
