import { describe, it, expect, vi } from 'vitest';
import { JdAnalyzerService } from '../src/modules/tailoring/jd-analyzer.service';
import { TailoringValidatorService } from '../src/modules/tailoring/tailoring-validator.service';
import { ProfileExtractorService } from '../src/modules/master-profile/profile-extractor.service';
import { buildResumeHtml } from '../src/modules/tailoring/templates/resume-template';
import { determineOptimalSectionOrder } from '../src/modules/tailoring/tailoring.service';
import { tailoringService } from '../src/modules/tailoring/tailoring.service';
import { MasterProfileDTO } from '@tracker/types';

/**
 * Persona regression suite — guards the domain-agnostic remediation (spec-domain-agnostic.md §1).
 * Persona A: Registered Nurse (ICU) -> Clinical Nurse Specialist
 * Persona B: Senior Financial Controller -> VP of Finance
 * Persona C: K-12 Elementary Teacher -> Curriculum Coordinator
 */

const NOW = new Date().toISOString();

function makeProfile(overrides: Partial<MasterProfileDTO>): MasterProfileDTO {
  return {
    id: 'persona',
    userId: 'u1',
    basics: { name: 'Persona', links: [] },
    positioningRules: [],
    factBank: {},
    workExperience: [],
    projectExperience: [],
    skills: {},
    education: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

async function captureSynthesisPrompt(
  profile: MasterProfileDTO,
  analysis: any,
  jdText: string,
  role: string,
  company: string
): Promise<string> {
  const geminiJson = JSON.stringify({
    resume: {
      basics: { name: profile.basics.name },
      education: [],
      experience: [],
      skills: {},
      certifications: [],
    },
    coverLetterMarkdown: 'Dear Hiring Team, I am excited to apply.',
  });

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: geminiJson }] } }] }),
  } as any);

  await tailoringService.callGeminiSynthesis(profile, analysis, jdText, role, company, 'test-key');
  const prompt = JSON.parse((fetchSpy.mock.calls[0]?.[1] as any).body).contents[0].parts[0].text;
  fetchSpy.mockRestore();
  return prompt;
}

// ---------------------------------------------------------------------------
// Persona A — Registered Nurse (ICU) -> Clinical Nurse Specialist
// ---------------------------------------------------------------------------
describe('Persona A: Registered Nurse (ICU) -> Clinical Nurse Specialist', () => {
  const nurseResumeText = `
Maria Santos
maria.santos@rn.org | Chicago, IL | 555-0142

WORK EXPERIENCE
Mercy General Hospital | Registered Nurse, ICU | Jan 2020 - Present
• Triaged 30+ emergency patients per shift under 1:1 acuity protocols.
• Administered critical medications and coordinated with attending physicians.

St. Luke Medical Center | Staff Nurse | Jun 2017 - Dec 2019
• Assessed patient acuity for a 12-bed telemetry unit.
• Educated patients and families on discharge care plans.

SKILLS
Patient Care: Epic EHR, Cerner, triage protocols, BLS, ACLS, PALS

EDUCATION
University of Illinois Chicago
BS Nursing | 2017
  `.trim();

  const nurseProfile = makeProfile({
    basics: { name: 'Maria Santos', links: [] },
    factBank: {
      core_positioning: ['Registered Nurse, ICU with expertise in Patient Care'],
      quantified_highlights: ['Triaged 30+ emergency patients per shift under 1:1 acuity protocols.'],
      certifications: [
        'Registered Nurse (RN) — Illinois',
        'Basic Life Support (BLS)',
        'Advanced Cardiac Life Support (ACLS)',
      ],
    },
    workExperience: [
      {
        company: 'Mercy General Hospital',
        role: 'Registered Nurse, ICU',
        date_range: 'Jan 2020 - Present',
        bullets: [
          'Triaged 30+ emergency patients per shift under 1:1 acuity protocols.',
          'Administered critical medications and coordinated with attending physicians.',
          'Educated nursing staff on evidence-based Epic EHR documentation workflows.',
        ],
      },
      {
        company: 'St. Luke Medical Center',
        role: 'Staff Nurse',
        date_range: 'Jun 2017 - Dec 2019',
        bullets: [
          'Assessed patient acuity for a 12-bed telemetry unit.',
          'Coordinated discharge planning with interdisciplinary care teams.',
          'Mentored 8 new graduate nurses through unit orientation.',
        ],
      },
    ],
    skills: { 'Patient Care': ['Epic EHR', 'Cerner', 'triage protocols', 'BLS', 'ACLS', 'PALS'] },
    education: [{ school: 'University of Illinois Chicago', degree: 'BS Nursing', graduation: '2017' }],
  });

  const nurseJd = `
Clinical Nurse Specialist — ICU
We are seeking a Clinical Nurse Specialist to provide direct patient care and clinical leadership
in our 24-bed ICU. You will triage emergency patients, administer medications per protocol, and
assess patient acuity with attending physicians.
Requirements:
- BLS, ACLS, and PALS certifications required.
- 3+ years ICU experience with Epic EHR and triage protocols.
- Experience coordinating discharge planning and mentoring nursing staff.
  `.trim();

  it('A1: ingests role and employer correctly (no swap, no mangling)', () => {
    const { profile, warnings } = ProfileExtractorService.parseResumeText(nurseResumeText);
    expect(profile.workExperience[0].role).toBe('Registered Nurse, ICU');
    expect(profile.workExperience[0].company).toBe('Mercy General Hospital');
    expect(warnings.some((w) => w.includes('Verify role/employer split'))).toBe(false);
  });

  it('A1b: derives positioning from parsed content without tech contamination', () => {
    const { profile } = ProfileExtractorService.parseResumeText(nurseResumeText);
    expect(profile.positioningRules).toEqual([]);
    const factBankJson = JSON.stringify(profile.factBank);
    expect(factBankJson).not.toContain('full-stack');
    expect(profile.factBank.core_positioning?.[0]).toContain('Registered Nurse');
  });

  it('A2/A3: extracts keyVerbs and exact echo phrases from a nursing JD', () => {
    const analysis = JdAnalyzerService.analyze(nurseJd, nurseProfile, 'Clinical Nurse Specialist', 'Mercy General Hospital');
    expect(analysis.keyVerbs).toContain('triage');
    expect(analysis.keyVerbs).toContain('assess');
    expect(analysis.exactPhrases.length).toBeGreaterThanOrEqual(3);
  });

  it('A4/A5: credits clinical verbs and clinical metrics in impact scoring', () => {
    const breakdown = JdAnalyzerService.calculateMultiFactorAtsScore({
      matchedKeywords: [],
      totalKeywords: [],
      bullets: nurseProfile.workExperience.flatMap((w) => w.bullets),
      titles: nurseProfile.workExperience.map((w) => w.role),
      targetRole: 'Clinical Nurse Specialist',
      targetCompany: 'Mercy General Hospital',
      candidateCorpusLower: 'mercy general hospital registered nurse icu epic ehr triage protocols bls acls pals',
    });
    expect(breakdown.verbsCount).toBeGreaterThanOrEqual(4);
    expect(breakdown.metricsCount).toBeGreaterThanOrEqual(2);
  });

  it('A6: counts license keywords in coverage and tailored evaluation', () => {
    const analysis = JdAnalyzerService.analyze(nurseJd, nurseProfile, 'Clinical Nurse Specialist', 'Mercy General Hospital');
    expect(analysis.matchedKeywords.map((k) => k.toLowerCase())).toEqual(expect.arrayContaining(['bls', 'acls']));

    const tailored = JdAnalyzerService.evaluateResumePayload(
      {
        basics: nurseProfile.basics,
        experience: nurseProfile.workExperience,
        skills: nurseProfile.skills,
        certifications: ['Registered Nurse (RN)', 'Basic Life Support (BLS)', 'ACLS'],
      },
      'Clinical Nurse Specialist',
      'Mercy General Hospital',
      analysis.highPriorityKeywords
    );
    expect(tailored.matchedKeywords.map((k) => k.toLowerCase())).toEqual(
      expect.arrayContaining(['bls', 'acls'])
    );

    const report = TailoringValidatorService.validate(
      {
        basics: nurseProfile.basics,
        experience: nurseProfile.workExperience,
        skills: nurseProfile.skills,
        certifications: ['Registered Nurse (RN)', 'Basic Life Support (BLS)', 'ACLS'],
      },
      'Dear Hiring Team, my BLS and ACLS certifications and triage experience fit this role.',
      analysis.highPriorityKeywords,
      analysis.exactPhrases,
      nurseProfile,
      'Mercy General Hospital'
    );
    expect(report.matchedKeywords.map((k) => k.toLowerCase())).toEqual(
      expect.arrayContaining(['bls', 'acls'])
    );
  });

  it('A7/A8: synthesis prompt is tech-clean and always requests a summary', async () => {
    const analysis = JdAnalyzerService.analyze(nurseJd, nurseProfile, 'Clinical Nurse Specialist', 'Mercy General Hospital');
    const prompt = await captureSynthesisPrompt(
      nurseProfile,
      analysis,
      nurseJd,
      'Clinical Nurse Specialist',
      'Mercy General Hospital'
    );
    expect(prompt).not.toContain('full-stack');
    expect(prompt).not.toContain('Full-stack engineer');
    expect(prompt).not.toContain('production systems');
    expect(prompt).not.toContain('Do NOT include a summary');
    expect(prompt).toContain('summary');
  });

  it('A9/A10: floats certifications second and renders a neutral skills kicker', () => {
    const order = determineOptimalSectionOrder(nurseProfile);
    expect(order[0]).toBe('summary');
    expect(order[1]).toBe('certifications');

    const html = buildResumeHtml({
      basics: nurseProfile.basics,
      experience: nurseProfile.workExperience,
      education: nurseProfile.education,
      skills: nurseProfile.skills,
      certifications: nurseProfile.factBank.certifications,
      sectionOrder: order,
    });
    expect(html).toContain('Patient Care');
    expect(html).not.toContain('Technical Skills');
    // Certifications section renders before Work Experience
    expect(html.indexOf('Certifications & Licenses')).toBeLessThan(html.indexOf('Work Experience'));
  });
});

// ---------------------------------------------------------------------------
// Persona B — Senior Financial Controller -> VP of Finance
// ---------------------------------------------------------------------------
describe('Persona B: Senior Financial Controller -> VP of Finance', () => {
  const controllerProfile = makeProfile({
    basics: { name: 'Dana Whitfield', links: [] },
    factBank: {
      core_positioning: ['Division Controller with expertise in US GAAP'],
      quantified_highlights: ['Closed monthly P&L for a $400M revenue unit.'],
      certifications: ['Certified Public Accountant (CPA)'],
    },
    workExperience: [
      {
        company: 'Acme Manufacturing, Inc.',
        role: 'Division Controller',
        date_range: '2018 - Present',
        bullets: [
          'Closed monthly P&L for a $400M revenue unit within 4 business days.',
          'Led 6 SOX audits across 3 legal entities with zero material weaknesses.',
          'Modeled quarterly EBITDA forecasts within 2% variance.',
        ],
      },
      {
        company: 'Beta Industries LLC',
        role: 'Senior Accountant',
        date_range: '2014 - 2018',
        bullets: [
          'Reconciled 12 bank accounts and automated 30% of journal entries.',
          'Prepared SEC filings and supported annual audit management.',
        ],
      },
    ],
    skills: { 'Core Competencies': ['US GAAP', 'SOX compliance', 'NetSuite', 'SAP', 'EBITDA', 'FP&A'] },
    education: [{ school: 'Michigan State University', degree: 'BS Accounting', graduation: '2014' }],
  });

  const vpFinanceJd = `
VP of Finance
We are seeking a VP of Finance to own the P&L, US GAAP reporting, and SOX compliance for a
multi-entity manufacturer. You will close the books, model EBITDA forecasts, and lead audit
management with external firms.
Requirements:
- CPA required; 10+ years progressive accounting experience.
- Deep NetSuite or SAP ERP expertise and reconciliation ownership.
- Track record of EBITDA forecasting and audit management.
  `.trim();

  it('B2/B3: extracts finance verbs and exact echo phrases', () => {
    const analysis = JdAnalyzerService.analyze(vpFinanceJd, controllerProfile, 'VP of Finance', 'Acme Manufacturing');
    expect(analysis.keyVerbs).toContain('reconcile');
    expect(analysis.keyVerbs).toContain('model');
    expect(analysis.exactPhrases.length).toBeGreaterThanOrEqual(3);
  });

  it('B4/B5: credits finance verbs and finance metrics in impact scoring', () => {
    const breakdown = JdAnalyzerService.calculateMultiFactorAtsScore({
      matchedKeywords: [],
      totalKeywords: [],
      bullets: controllerProfile.workExperience.flatMap((w) => w.bullets),
      titles: controllerProfile.workExperience.map((w) => w.role),
      targetRole: 'VP of Finance',
      targetCompany: 'Acme Manufacturing',
      candidateCorpusLower: 'acme manufacturing us gaap sox compliance netsuite sap ebitda fp&a cpa',
    });
    expect(breakdown.verbsCount).toBeGreaterThanOrEqual(4);
    expect(breakdown.metricsCount).toBeGreaterThanOrEqual(3);
  });

  it('B7/B8: synthesis prompt is tech-clean and includes an executive summary', async () => {
    const analysis = JdAnalyzerService.analyze(vpFinanceJd, controllerProfile, 'VP of Finance', 'Acme Manufacturing');
    const prompt = await captureSynthesisPrompt(controllerProfile, analysis, vpFinanceJd, 'VP of Finance', 'Acme Manufacturing');
    expect(prompt).not.toContain('full-stack');
    expect(prompt).not.toContain('Do NOT include a summary');
    expect(prompt).toContain('summary');
  });

  it('B10: renders a finance-appropriate skills kicker', () => {
    const html = buildResumeHtml({
      basics: controllerProfile.basics,
      experience: controllerProfile.workExperience,
      education: controllerProfile.education,
      skills: controllerProfile.skills,
    });
    expect(html).toContain('Core Competencies');
    expect(html).not.toContain('Technical Skills');
  });
});

// ---------------------------------------------------------------------------
// Persona C — K-12 Elementary Teacher -> Curriculum Coordinator
// ---------------------------------------------------------------------------
describe('Persona C: Elementary School Teacher -> Curriculum Coordinator', () => {
  const teacherProfile = makeProfile({
    basics: { name: 'Priya Raman', links: [] },
    factBank: {
      core_positioning: ['Elementary School Teacher with expertise in Literacy Pedagogy'],
      quantified_highlights: ['Raised 3rd-grade literacy proficiency to 95% across 28 students.'],
      certifications: ['Illinois Professional Educator License (K-9)'],
    },
    workExperience: [
      {
        company: 'Lincoln Elementary School',
        role: 'Elementary School Teacher',
        date_range: '2019 - Present',
        bullets: [
          'Differentiated literacy instruction for 28 students across 4 IEPs.',
          'Facilitated parent-teacher conferences for 26 families each semester.',
          'Led PLC meetings and mentored 2 student teachers.',
        ],
      },
      {
        company: 'Roosevelt Elementary',
        role: 'Student Teacher',
        date_range: '2018 - 2019',
        bullets: [
          'Designed unit assessments aligned to state standards.',
          'Managed classroom behavior for 24 students.',
        ],
      },
    ],
    skills: { 'Teaching Competencies': ['IEP compliance', 'Literacy pedagogy', 'Classroom management'] },
    education: [{ school: 'Northern Illinois University', degree: 'MEd Curriculum & Instruction', graduation: '2019' }],
  });

  const coordinatorJd = `
Curriculum Coordinator
We are seeking a Curriculum Coordinator to lead literacy pedagogy, IEP compliance, and
assessment design across our K-5 faculty. You will differentiate instruction, facilitate
professional learning communities, and mentor teachers.
Requirements:
- State teaching certification and IEP compliance experience required.
- 5+ years classroom experience with demonstrated literacy gains.
- Experience mentoring teachers and leading parent-teacher conferences.
  `.trim();

  it('C2/C3: extracts education verbs and exact echo phrases', () => {
    const analysis = JdAnalyzerService.analyze(coordinatorJd, teacherProfile, 'Curriculum Coordinator', 'Lincoln Elementary');
    expect(analysis.keyVerbs).toContain('facilitate');
    expect(analysis.keyVerbs).toContain('mentor');
    expect(analysis.exactPhrases.length).toBeGreaterThanOrEqual(3);
  });

  it('C4/C5: credits teaching verbs and classroom metrics in impact scoring', () => {
    const breakdown = JdAnalyzerService.calculateMultiFactorAtsScore({
      matchedKeywords: [],
      totalKeywords: [],
      bullets: teacherProfile.workExperience.flatMap((w) => w.bullets),
      titles: teacherProfile.workExperience.map((w) => w.role),
      targetRole: 'Curriculum Coordinator',
      targetCompany: 'Lincoln Elementary',
      candidateCorpusLower: 'lincoln elementary school iep compliance literacy pedagogy classroom management',
    });
    expect(breakdown.verbsCount).toBeGreaterThanOrEqual(4);
    expect(breakdown.metricsCount).toBeGreaterThanOrEqual(2);
  });

  it('C7/C8: synthesis prompt is tech-clean and includes a summary', async () => {
    const analysis = JdAnalyzerService.analyze(coordinatorJd, teacherProfile, 'Curriculum Coordinator', 'Lincoln Elementary');
    const prompt = await captureSynthesisPrompt(teacherProfile, analysis, coordinatorJd, 'Curriculum Coordinator', 'Lincoln Elementary');
    expect(prompt).not.toContain('full-stack');
    expect(prompt).not.toContain('Do NOT include a summary');
    expect(prompt).toContain('summary');
  });

  it('C10: renders a teaching-appropriate skills kicker', () => {
    const html = buildResumeHtml({
      basics: teacherProfile.basics,
      experience: teacherProfile.workExperience,
      education: teacherProfile.education,
      skills: teacherProfile.skills,
    });
    expect(html).toContain('Teaching Competencies');
    expect(html).not.toContain('Technical Skills');
  });
});

// ---------------------------------------------------------------------------
// Cross-persona score parity (A9)
// ---------------------------------------------------------------------------
describe('Cross-domain score parity', () => {
  const techProfile = makeProfile({
    basics: { name: 'Zen Developer', links: [] },
    factBank: {
      core_positioning: ['Full Stack Developer with expertise in Web Platforms'],
      quantified_highlights: ['Shipped an HRIS handling 6,000+ employee records.'],
    },
    workExperience: [
      {
        company: 'Uzaro Solutions Technology Inc.',
        role: 'Technology Developer',
        date_range: 'Nov 2024 - Present',
        bullets: [
          'Built an HRIS handling 6,000+ employee records with React and TypeScript.',
          'Designed REST APIs reducing latency by 45%.',
          'Mentored 4 junior developers through code review.',
        ],
      },
      {
        company: 'Pixel Forge LLC',
        role: 'Junior Developer',
        date_range: '2022 - 2024',
        bullets: [
          'Shipped 12 product features with React and Node.js.',
          'Automated deployments reducing release time by 30%.',
          'Collaborated with designers on 8 client projects.',
        ],
      },
    ],
    skills: { 'Web Platforms': ['React', 'TypeScript', 'Node.js', 'Prisma'] },
    education: [{ school: 'Biliran Province State University', degree: 'BS Computer Science', graduation: '2024' }],
  });

  const techJd = `
Full Stack Developer
We are seeking a Full Stack Developer to build and ship web platforms with React and TypeScript.
You will design REST APIs, mentor junior developers, and collaborate with designers.
Requirements:
- React, TypeScript, and Node.js expertise.
- Experience shipping product features and automating deployments.
- Strong collaboration and code review discipline.
  `.trim();

  it('A9: non-technical personas score within 5 points of an equivalent technical persona', () => {
    const tech = JdAnalyzerService.analyze(techJd, techProfile, 'Full Stack Developer', 'Uzaro Solutions Technology Inc.');

    const nurse = JdAnalyzerService.analyze(
      `
Clinical Nurse Specialist — ICU
Provide direct patient care in our 24-bed ICU. You will triage emergency patients, administer
medications per protocol, assess patient acuity, and educate nursing staff.
Requirements:
- BLS, ACLS, and PALS certifications. Epic EHR experience. Triage protocols.
- ICU experience coordinating discharge planning and mentoring nursing staff.
      `.trim(),
      {
        ...techProfile,
        basics: { name: 'Maria Santos', links: [] },
        factBank: {
          core_positioning: ['ICU Registered Nurse pursuing Clinical Nurse Specialist practice'],
        },
        workExperience: [
          {
            company: 'Mercy General Hospital',
            role: 'Registered Nurse, ICU',
            date_range: '2020 - Present',
            bullets: [
              'Triaged 30+ patients per shift under 1:1 acuity protocols.',
              'Educated nursing staff on Epic EHR documentation across 4 units.',
              'Assessed patient acuity for a 12-bed telemetry unit.',
            ],
          },
          {
            company: 'St. Luke Medical Center',
            role: 'Staff Nurse',
            date_range: '2017 - 2019',
            bullets: [
              'Mentored 8 nursing students through clinical rotations.',
              'Coordinated discharge planning with interdisciplinary teams.',
              'Administered critical medications per protocol with physicians.',
            ],
          },
        ],
        skills: { 'Patient Care': ['Epic EHR', 'triage protocols', 'BLS', 'ACLS', 'PALS'] },
        education: [{ school: 'University of Illinois Chicago', degree: 'BS Nursing', graduation: '2017' }],
      } as MasterProfileDTO,
      'Clinical Nurse Specialist',
      'Mercy General Hospital'
    );

    expect(tech.matchScore).toBeGreaterThan(60);
    expect(nurse.matchScore).toBeGreaterThan(60);
    expect(Math.abs(tech.matchScore - nurse.matchScore)).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Persona D — ICU RN carrying custom sections (regression: spec-resume-fidelity C1-C3)
// ---------------------------------------------------------------------------
describe('Persona D: custom sections survive generation and render', () => {
  const profileWithCustomSections = {
    basics: { name: 'Maria Elena Santos', email: 'msantos@example.org', links: [] },
    positioningRules: [],
    factBank: { core_positioning: ['ICU Registered Nurse'], quantified_highlights: [] },
    workExperience: [
      {
        company: 'Mayo Clinic',
        role: 'Critical Care Registered Nurse',
        date_range: '2019 - Present',
        bullets: ['Managed 12 high-acuity ICU patients per shift across two units.'],
      },
    ],
    projectExperience: [],
    skills: { Leadership: ['Precepting'], 'Clinical Competencies': ['Critical Care'] },
    education: [],
    customSections: [
      {
        id: 'clinical_rotations',
        title: 'Clinical Rotations',
        type: 'timeline',
        items: [
          {
            organization: 'Mayo Clinic',
            role: 'Critical Care Rotation',
            location: 'Rochester, MN',
            date_range: '2023',
            bullets: ['Completed 800 hours in tertiary ICU.'],
          },
        ],
      },
      {
        id: 'licensure',
        title: 'Licensure & Board Certifications',
        type: 'credentials',
        items: [
          { name: 'Registered Nurse', issuer: 'Minnesota Board of Nursing', licenseNumber: 'RN-441782', jurisdiction: 'MN', date: '2016' },
        ],
      },
    ],
  } as unknown as MasterProfileDTO;

  // A model response that omits customSections entirely, as the real prompt produced.
  const modelOutputWithoutCustomSections = {
    basics: { name: 'Maria Elena Santos' },
    summary: 'ICU nurse seeking a CNS role.',
    education: [],
    experience: [
      {
        company: 'Mayo Clinic',
        role: 'Critical Care Registered Nurse',
        date_range: '2019 - Present',
        bullets: ['Managed 12 high-acuity ICU patients per shift across two units.'],
      },
    ],
    projects: [],
    skills: { Leadership: ['Precepting'], 'Clinical Competencies': ['Critical Care'] },
    certifications: [],
  };

  it('renders custom sections from a profile that the model ignored', () => {
    // The service merges profile customSections before rendering; this asserts the end state.
    const payload = {
      ...modelOutputWithoutCustomSections,
      customSections: profileWithCustomSections.customSections,
      sectionOrder: [...determineOptimalSectionOrder(profileWithCustomSections), 'clinical_rotations', 'licensure'],
    };

    const html = buildResumeHtml(payload);

    expect(html).toContain('Clinical Rotations');
    expect(html).toContain('Licensure &amp; Board Certifications');
    expect(html).toContain('Completed 800 hours in tertiary ICU.');
    expect(html).toContain('Minnesota Board of Nursing');
  });

  it('reports custom_section_coverage as clean when sections are merged', () => {
    const report = TailoringValidatorService.validate(
      {
        ...modelOutputWithoutCustomSections,
        customSections: profileWithCustomSections.customSections,
      } as any,
      'Dear Hiring Team.',
      [],
      [],
      profileWithCustomSections
    );

    expect(report.checkedDimensions).toContain('custom_section_coverage');
    expect(report.fidelityWarnings.filter((w) => w.includes('dropped'))).toHaveLength(0);
    expect(report.isValid).toBe(true);
  });

  it('uses a neutral kicker for a bucket-style first category', () => {
    const html = buildResumeHtml({ ...modelOutputWithoutCustomSections });

    expect(html).toContain('Skills &amp; Competencies');
    expect(html).not.toContain('>Leadership</div>');
  });

  it('declares pagination CSS so entries never split across pages', () => {
    const html = buildResumeHtml({ ...modelOutputWithoutCustomSections });

    expect(html).toContain('break-inside: avoid');
    expect(html).toContain('break-inside: avoid-page');
    expect(html).toContain('orphans: 2');
    expect(html).toContain('widows: 2');
  });
});
