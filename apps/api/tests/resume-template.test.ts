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

    // Kick titles now resolve through resolveKicker and are escaped consistently.
    expect(html).toContain('Certifications &amp; Licenses');
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
  // Updated 2026-10-09 (domain-agnostic remediation): the professional summary is now
  // always part of the order (summary policy inversion), so every canonical order leads
  // with 'summary'. Cert-float behavior is covered in tailoring-section-order.test.ts.
  it('returns summary-first, experience-first order for experienced candidates (>=2 roles)', () => {    const profile: any = {
      workExperience: [
        { company: 'A', role: 'Dev', bullets: ['Built APIs'] },
        { company: 'B', role: 'Dev', bullets: ['Built UI'] },
      ],
      projectExperience: [],
    };
    const order = determineOptimalSectionOrder(profile);
    expect(order).toEqual(['summary', 'experience', 'projects', 'skills', 'education', 'certifications']);
  });

  it('returns summary-first order for candidate with 1 role but >=4 bullets', () => {
    const profile: any = {
      workExperience: [
        { company: 'A', role: 'Dev', bullets: ['b1', 'b2', 'b3', 'b4'] },
      ],
      projectExperience: [],
    };
    const order = determineOptimalSectionOrder(profile);
    expect(order).toEqual(['summary', 'experience', 'projects', 'skills', 'education', 'certifications']);
  });

  it('returns summary-first portfolio/project-first order for candidates with 0 roles and >=2 projects', () => {
    const profile: any = {
      workExperience: [],
      projectExperience: [
        { name: 'Proj 1', bullets: ['b1'] },
        { name: 'Proj 2', bullets: ['b2'] },
      ],
    };
    const order = determineOptimalSectionOrder(profile);
    expect(order).toEqual(['summary', 'projects', 'skills', 'education', 'certifications', 'experience']);
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

describe('buildResumeHtml Skills Kicker & Shared Stack Tests', () => {
  const baseBasics = {
    basics: { name: 'Maria Santos', email: 'maria@rn.org' },
    experience: [
      {
        company: 'Mercy General Hospital',
        role: 'Registered Nurse, ICU',
        date_range: '2020 - Present',
        bullets: ['Triaged 30+ emergency patients per shift.'],
      },
    ],
    education: [],
  };

  it('uses a self-describing first category as the skills kicker (e.g. Clinical Competencies)', () => {
    const html = buildResumeHtml({
      ...baseBasics,
      skills: { 'Clinical Competencies': ['Epic EHR', 'Triage protocols'] },
    });

    expect(html).toContain('Clinical Competencies');
    expect(html).not.toContain('Technical Skills');
  });

  it('falls back to "Skills & Competencies" for generic category names', () => {
    const html = buildResumeHtml({
      ...baseBasics,
      skills: { General: ['Communication', 'Charting'] },
    });

    expect(html).toContain('Skills &amp; Competencies');
    expect(html).not.toContain('Technical Skills');
  });

  it('does not label a multi-category section with a bucket-style first category', () => {
    // Reproduced 2026-10-10: `{ Leadership, 'Clinical Competencies' }` rendered the kicker
    // "LEADERSHIP" above content that was mostly clinical. A first category that names a bucket
    // rather than the whole section must not become the heading.
    const html = buildResumeHtml({
      ...baseBasics,
      skills: {
        Leadership: ['Precepting', 'Charge Assignment'],
        'Clinical Competencies': ['Critical Care', 'Triage'],
      },
    });

    expect(html).toContain('Skills &amp; Competencies');
    expect(html).not.toContain('>Leadership</div>');
  });

  it('omits the Shared Stack line when there are no projects', () => {
    const html = buildResumeHtml({
      ...baseBasics,
      skills: { General: ['Communication'] },
    });

    expect(html).not.toContain('Shared Stack');
  });

  describe('Phase 2 polymorphic custom sections rendering', () => {
    it('renders timeline and credential custom sections with proper headers and entries', () => {
      const html = buildResumeHtml({
        ...baseBasics,
        customSections: [
          {
            id: 'clinical_rotations',
            title: 'Clinical Rotations',
            type: 'timeline',
            items: [
              {
                role: 'Pediatric ICU Resident',
                organization: 'Childrens Hospital of Philadelphia',
                date_range: '2022 - 2023',
                location: 'Philadelphia, PA',
                bullets: ['Managed ventilator care for 15+ neonatal patients.'],
              },
            ],
          },
          {
            id: 'bar_admissions',
            title: 'Bar Admissions & Licensure',
            type: 'credentials',
            items: [
              {
                name: 'State Bar of California',
                issuer: 'Supreme Court of California',
                date: 'Dec 2021',
              },
            ],
          },
        ],
      });

      expect(html).toContain('Clinical Rotations');
      expect(html).toContain('Childrens Hospital of Philadelphia');
      expect(html).toContain('Pediatric ICU Resident');
      expect(html).toContain('Managed ventilator care for 15+ neonatal patients.');
      expect(html).toContain('Bar Admissions &amp; Licensure');
      expect(html).toContain('State Bar of California');
      expect(html).toContain('Supreme Court of California');
    });

    it('honors custom section placement in sectionOrder', () => {
      const html = buildResumeHtml({
        ...baseBasics,
        sectionOrder: ['clinical_rotations', 'experience', 'skills'],
        customSections: [
          {
            id: 'clinical_rotations',
            title: 'Clinical Rotations',
            type: 'timeline',
            items: [
              {
                role: 'Rotational Intern',
                organization: 'Metro Hospital',
                date_range: '2023',
                bullets: ['Supported patient triage.'],
              },
            ],
          },
        ],
      });

      const rotIndex = html.indexOf('Clinical Rotations');
      const expIndex = html.indexOf('Work Experience');
      expect(rotIndex).toBeGreaterThan(-1);
      expect(expIndex).toBeGreaterThan(-1);
      expect(rotIndex).toBeLessThan(expIndex);
    });
  });
});

describe('Pagination CSS (spec-resume-fidelity.md C3)', () => {
  const longPayload = {
    basics: { name: 'Maria Santos', email: 'maria@rn.org' },
    experience: Array.from({ length: 6 }, (_, i) => ({
      company: `Hospital ${i + 1}`,
      role: 'Registered Nurse',
      date_range: '2020 - Present',
      bullets: [
        'Managed care for 12 high-acuity ICU patients per shift across two units.',
        'Designed protocol reducing sepsis mortality by 18%.',
        'Precepted 14 new nurses through onboarding and competency validation.',
        'Triaged incoming referrals and coordinated interdisciplinary rounds.',
      ],
    })),
    education: [
      { school: 'University of Minnesota', degree: 'BSN', graduation: '2016' },
    ],
    skills: { General: ['Triage'] },
  };

  it('declares break-inside protection so entries never split mid-bullet across pages', () => {
    const html = buildResumeHtml(longPayload);

    expect(html).toContain('break-inside: avoid');
    expect(html).toContain('page-break-inside: avoid');
    expect(html).toContain('break-inside: avoid-page');
  });

  it('applies orphan and widow control to bullet list items', () => {
    const html = buildResumeHtml(longPayload);

    expect(html).toContain('orphans: 2');
    expect(html).toContain('widows: 2');
  });
});

describe('Left-aligned body text (spec-resume-fidelity.md C7)', () => {
  const payload = {
    basics: { name: 'Maria Santos', email: 'maria@rn.org' },
    experience: [
      { company: 'Mercy General Hospital', role: 'Registered Nurse', date_range: '2020 - Present', bullets: ['Triaged 30+ emergency patients per shift.'] },
    ],
    education: [],
    summary: 'Experienced ICU nurse with a background in critical care and telemetry.',
    skills: { General: ['Triage'] },
  };

  it('never justifies bullets or the summary', () => {
    const html = buildResumeHtml(payload);

    // Justified text in a ~6in measure produces uneven word spacing that hurts skim-readability
    // with no ATS benefit.
    expect(html).not.toContain('text-align: justify');
    expect(html).toContain('text-align: left');
  });
});

describe('Federal attributes & credential detail (spec-resume-fidelity.md C5)', () => {
  const baseBasics = { basics: { name: 'Maria Santos', email: 'maria@rn.org' }, education: [] };

  it('renders salary, hours, supervisor, and clearance from entry attributes', () => {
    const html = buildResumeHtml({
      ...baseBasics,
      experience: [
        {
          company: 'Mayo Clinic',
          role: 'Critical Care Registered Nurse',
          date_range: '2019 - Present',
          bullets: ['Managed 12 high-acuity ICU patients per shift.'],
          attributes: {
            salary: '$92,000',
            hoursPerWeek: '40',
            supervisor: 'Dr. A. Osei',
            supervisorPhone: '(507) 555-0100',
            securityClearance: 'Secret',
          },
        },
      ],
    });

    expect(html).toContain('$92,000');
    expect(html).toContain('40 hrs/wk');
    expect(html).toContain('Dr. A. Osei');
    expect(html).toContain('(507) 555-0100');
    expect(html).toContain('Secret');
  });

  it('renders nothing extra when attributes are absent', () => {
    const html = buildResumeHtml({
      ...baseBasics,
      experience: [
        {
          company: 'Mayo Clinic',
          role: 'Critical Care Registered Nurse',
          date_range: '2019 - Present',
          bullets: ['Managed 12 high-acuity ICU patients per shift.'],
        },
      ],
    });

    expect(html).not.toContain('hrs/wk');
    expect(html).not.toContain('Clearance');
    expect(html).not.toContain('Supervisor:');
    // The attribute block itself must be absent (entry-meta-row is a distinct pre-existing class).
    expect(html).not.toContain('class="entry-meta"');
  });

  it('renders license number and jurisdiction for credential custom sections', () => {
    const html = buildResumeHtml({
      ...baseBasics,
      customSections: [
        {
          id: 'licensure',
          title: 'Licensure',
          type: 'credentials',
          items: [
            {
              name: 'Registered Nurse',
              issuer: 'Minnesota Board of Nursing',
              licenseNumber: 'RN-441782',
              jurisdiction: 'MN',
              date: '2016',
            },
          ],
        },
      ],
      sectionOrder: ['licensure'],
    });

    expect(html).toContain('RN-441782');
    expect(html).toContain('MN');
  });

  it('escapes attribute values', () => {
    const html = buildResumeHtml({
      ...baseBasics,
      experience: [
        {
          company: 'X',
          role: 'Y',
          date_range: '2020',
          bullets: ['b'],
          attributes: { supervisor: '<script>alert(1)</script>' },
        },
      ],
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('Data-driven section titles (spec-resume-fidelity.md C6)', () => {
  const base = {
    basics: { name: 'Maria Santos', email: 'maria@rn.org' },
    experience: [
      { company: 'Mercy General Hospital', role: 'Registered Nurse', date_range: '2020 - Present', bullets: ['Triaged 30+ patients.'] },
    ],
    education: [{ school: 'University of Minnesota', degree: 'BSN', graduation: '2016' }],
    projects: [{ name: 'Quality Improvement Project', bullets: ['Reduced falls by 30%.'] }],
    skills: { 'Clinical Competencies': ['Triage'] },
    certifications: [{ name: 'RN', issuer: 'MN Board of Nursing' }],
    summary: 'Experienced ICU nurse.',
  };

  it('uses a profile-supplied title in place of the default kicker', () => {
    const html = buildResumeHtml({
      ...base,
      sectionTitles: { experience: 'Clinical Experience' },
    });

    expect(html).toContain('Clinical Experience');
    expect(html).not.toContain('>Work Experience<');
  });

  it('supports renaming every fixed section', () => {
    const html = buildResumeHtml({
      ...base,
      sectionTitles: {
        summary: 'Professional Profile',
        experience: 'Clinical Experience',
        projects: 'Practice Initiatives',
        skills: 'Core Competencies',
        education: 'Academic Background',
        certifications: 'Active Licenses',
      },
    });

    ['Professional Profile', 'Clinical Experience', 'Practice Initiatives', 'Core Competencies', 'Academic Background', 'Active Licenses'].forEach(
      (title) => expect(html).toContain(title)
    );
    expect(html).not.toContain('>Work Experience<');
    expect(html).not.toContain('>Project Experience<');
  });

  it('falls back to defaults when sectionTitles is absent', () => {
    const html = buildResumeHtml({ ...base });

    expect(html).toContain('Work Experience');
    expect(html).toContain('Project Experience');
    expect(html).toContain('Education');
    // Kick titles resolve through resolveKicker and are escaped consistently.
    expect(html).toContain('Certifications &amp; Licenses');
  });

  it('escapes a hostile section title', () => {
    const html = buildResumeHtml({ ...base, sectionTitles: { experience: '<script>x</script>' } });

    expect(html).not.toContain('<script>x</script>');
  });
});
