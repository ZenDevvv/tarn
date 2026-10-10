export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const RESUME_CSS = `
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #000000;
  font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
  line-height: 1.35;
  font-size: 11pt;
}
body { padding: 0; }
.resume-page {
  width: 8.5in;
  margin: 0 auto;
  background: #ffffff;
  padding: 0.5in 0.65in 0.45in;
}
.hero {
  text-align: center;
  margin-bottom: 12px;
}
.hero-name {
  margin: 0;
  font-size: 20pt;
  line-height: 1.15;
  font-weight: 700;
  color: #000000;
}
.hero-meta {
  margin-top: 4px;
  color: #000000;
  font-size: 10.5pt;
}
.hero-links {
  margin-top: 3px;
  font-size: 10.5pt;
}
.hero-link {
  color: #0563c1;
  text-decoration: underline;
}
.hero-link + .hero-link::before {
  content: " | ";
  color: #000000;
  text-decoration: none;
  margin: 0 3px;
}
.section {
  margin: 0 0 11px;
}
.section-kicker {
  color: #000000;
  font-size: 11pt;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding-bottom: 2px;
  margin-bottom: 6px;
  border-bottom: 1px solid #000000;
}
.entry {
  margin-bottom: 8px;
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.entry:last-child {
  margin-bottom: 0;
}
.section {
  break-inside: avoid;
  page-break-inside: avoid;
}
.cert-row {
  break-inside: avoid;
  page-break-inside: avoid;
}
.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.entry-title {
  font-size: 11pt;
  font-weight: 700;
  color: #000000;
}
.entry-subtitle {
  font-style: italic;
  font-size: 10.5pt;
}
.entry-date {
  font-style: italic;
  font-size: 10.5pt;
  text-align: right;
  white-space: nowrap;
}
.entry-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}
.entry-meta {
  margin: 1px 0 2px;
  font-size: 10pt;
  color: #000000;
}
.entry-list {
  margin: 2px 0 0;
  padding-left: 18px;
}
.entry-list li {
  margin: 0 0 2.5px;
  font-size: 10.5pt;
  color: #000000;
  text-align: left;
  orphans: 2;
  widows: 2;
}
.shared-stack {
  margin: 0 0 6px;
  font-size: 10pt;
  font-style: italic;
  color: #0563c1;
}
.project-name {
  font-size: 11pt;
  font-weight: 700;
}
.project-subtitle {
  font-style: italic;
  font-size: 10pt;
  margin-bottom: 2px;
}
.skills-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.skill-row {
  font-size: 10.5pt;
}
.skill-label {
  font-weight: 700;
  margin-right: 4px;
}
.professional-dev {
  margin-top: 6px;
  font-size: 10pt;
  font-style: italic;
}
.summary-text {
  margin: 0;
  font-size: 10.5pt;
  line-height: 1.4;
  text-align: left;
}
.cert-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10.5pt;
  margin-bottom: 3.5px;
}
.cert-row:last-child {
  margin-bottom: 0;
}
.cert-label {
  font-weight: 700;
}
.cert-issuer {
  font-style: italic;
  font-size: 10pt;
  margin-left: 4px;
}
.cert-date {
  font-style: italic;
  font-size: 10.5pt;
  white-space: nowrap;
}
@media print {
  body { padding: 0; background: #fff; }
  .resume-page { padding: 0.4in 0.5in; width: 100%; border: none; box-shadow: none; }
}
`;

import { consolidateBullets } from '../utils/bullet-utils';

/**
 * Render the optional detail a federal resume carries beyond title and dates: pay, hours per week,
 * supervisor and contact, and security clearance. Every field is optional and omitted silently when
 * absent, so private-sector resumes are unaffected. See spec-resume-fidelity.md C5.
 */
function renderEntryAttributes(attributes: any): string {
  if (!attributes || typeof attributes !== 'object') return '';
  const parts: string[] = [];
  if (attributes.salary) parts.push(escapeHtml(String(attributes.salary)));
  if (attributes.hoursPerWeek) {
    parts.push(`${escapeHtml(String(attributes.hoursPerWeek))} hrs/wk`);
  }
  const compensation = parts.join(' | ');
  const supervisor = attributes.supervisor
    ? `Supervisor: ${escapeHtml(String(attributes.supervisor))}${
        attributes.supervisorPhone
          ? ` (${escapeHtml(String(attributes.supervisorPhone))})`
          : ''
      }`
    : '';
  const clearance = attributes.securityClearance
    ? `Clearance: ${escapeHtml(String(attributes.securityClearance))}`
    : '';

  const lines = [compensation, supervisor, clearance].filter(Boolean);
  if (lines.length === 0) return '';
  return `<div class="entry-meta">${lines.join('</div><div class="entry-meta">')}</div>`;
}

/**
 * Credential detail line: issuer, licence number, and jurisdiction where present.
 */
function credentialDetail(cert: any): string {
  const bits: string[] = [];
  if (cert?.issuer) bits.push(escapeHtml(String(cert.issuer)));
  if (cert?.licenseNumber) bits.push(`Lic. ${escapeHtml(String(cert.licenseNumber))}`);
  if (cert?.jurisdiction) bits.push(escapeHtml(String(cert.jurisdiction)));
  return bits.length > 0 ? ` — ${bits.join(' · ')}` : '';
}

/**
 * Resolve a section heading from the payload, falling back to the document default.
 *
 * This is how the document stays agnostic without a profession classifier: the headings come from
 * the candidate's own naming (a nurse's timeline section can read "Clinical Experience") rather
 * than from a lexicon that has to guess and can be wrong. See spec-resume-fidelity.md C6.
 */
function resolveKicker(payload: any, key: string, fallback: string): string {
  const supplied = payload?.sectionTitles?.[key];
  const title = typeof supplied === 'string' && supplied.trim() ? supplied.trim() : fallback;
  return escapeHtml(title);
}

export function buildResumeHtml(payload: any): string {
  const basics = payload.basics || {};
  const education = payload.education || [];
  const experience = payload.experience || [];
  const projects = payload.projects || [];
  const skills = payload.skills || {};

  const linksHtml = (basics.links || [])
    .map((l: any) => `<a class="hero-link" href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`)
    .join('');

  // 1. Summary
  const summaryText = typeof payload.summary === 'string' ? payload.summary.trim() : '';
  const summarySectionHtml = summaryText
    ? `<section class="section">
      <div class="section-kicker">${resolveKicker(payload, 'summary', 'Professional Summary')}</div>
      <div class="section-body">
        <p class="summary-text">${escapeHtml(summaryText)}</p>
      </div>
    </section>`
    : '';

  // 2. Education
  const educationEntriesHtml = education
    .map((edu: any) => {
      const degreeLine = [edu.degree, edu.honors].filter(Boolean).join(' | ') || edu.details || '';
      const bullets = consolidateBullets(edu.bullets || [])
        .map((b: string) => `<li>${escapeHtml(b)}</li>`)
        .join('');
      return `
        <article class="entry">
          <div class="entry-header">
            <div class="entry-title">${escapeHtml(edu.school)}</div>
            <div class="entry-date">${escapeHtml(edu.location)}</div>
          </div>
          <div class="entry-meta-row">
            <div class="entry-subtitle">${escapeHtml(degreeLine)}</div>
            <div class="entry-date">${escapeHtml(edu.graduation)}</div>
          </div>
          ${bullets ? `<ul class="entry-list">${bullets}</ul>` : ''}
        </article>
      `;
    })
    .join('');

  const educationSectionHtml = educationEntriesHtml
    ? `<section class="section">
      <div class="section-kicker">${resolveKicker(payload, 'education', 'Education')}</div>
      <div class="section-body">
        ${educationEntriesHtml}
      </div>
    </section>`
    : '';

  // 3. Work Experience
  const profDev = payload.professional_development
    ? `<div class="professional-dev">${escapeHtml(
        Array.isArray(payload.professional_development)
          ? payload.professional_development.join(' ')
          : payload.professional_development
      )}</div>`
    : '';

  const experienceEntriesHtml = experience
    .map((exp: any) => {
      const bullets = consolidateBullets(exp.bullets || [])
        .map((b: string) => `<li>${escapeHtml(b)}</li>`)
        .join('');
      return `
        <article class="entry">
          <div class="entry-header">
            <div class="entry-title">${escapeHtml(exp.company)}</div>
            <div class="entry-date">${escapeHtml(exp.location)}</div>
          </div>
          <div class="entry-meta-row">
            <div class="entry-subtitle">${escapeHtml(exp.role)}</div>
            <div class="entry-date">${escapeHtml(exp.date_range)}</div>
          </div>
          ${renderEntryAttributes(exp.attributes)}
          <ul class="entry-list">${bullets}</ul>
        </article>
      `;
    })
    .join('');

  const experienceSectionHtml = experienceEntriesHtml
    ? `<section class="section">
      <div class="section-kicker">${resolveKicker(payload, 'experience', 'Work Experience')}</div>
      <div class="section-body">
        ${experienceEntriesHtml}
        ${profDev}
      </div>
    </section>`
    : '';

  // 4. Projects
  const sharedStack = payload.shared_stack
    ? `<div class="shared-stack"><strong>Shared Stack:</strong> ${escapeHtml(
        Array.isArray(payload.shared_stack) ? payload.shared_stack.join(', ') : payload.shared_stack
      )}</div>`
    : '';

  const projectsEntriesHtml = projects
    .map((proj: any) => {
      const bullets = consolidateBullets(proj.bullets || [])
        .map((b: string) => `<li>${escapeHtml(b)}</li>`)
        .join('');
      const subtitle = proj.subtitle ? `<div class="project-subtitle">${escapeHtml(proj.subtitle)}</div>` : '';
      return `
        <article class="entry">
          <div class="project-name">${escapeHtml(proj.name)}</div>
          ${subtitle}
          <ul class="entry-list">${bullets}</ul>
        </article>
      `;
    })
    .join('');

  const projectsSectionHtml = projectsEntriesHtml
    ? `<section class="section">
      <div class="section-kicker">${resolveKicker(payload, 'projects', 'Project Experience')}</div>
      <div class="section-body">
        ${sharedStack}
        ${projectsEntriesHtml}
      </div>
    </section>`
    : '';

  // 5. Skills
  // Kicker is data-driven: a self-describing first category (e.g. "Clinical Competencies",
  // "Teaching Competencies") becomes the section label; generic buckets fall back to a neutral label.
  // Bucket-style names ("Leadership", "Management", "Technical") describe one group of skills rather
  // than the whole section, so they must not head a section that also renders other categories.
  const GENERIC_SKILL_CATEGORIES =
    /^(general|core|skills|other|misc|key|leadership|management|technical|tools|software|systems|professional|competenc)/i;
  const firstSkillCategory = Object.keys(skills)[0];
  const skillsKicker =
    firstSkillCategory && !GENERIC_SKILL_CATEGORIES.test(firstSkillCategory)
      ? firstSkillCategory
      : 'Skills & Competencies';

  const skillsRowsHtml = Object.entries(skills)
    .map(([cat, items]: [string, any]) => {
      const val = Array.isArray(items) ? items.join(', ') : String(items);
      return `
        <div class="skill-row">
          <span class="skill-label">${escapeHtml(cat)}:</span><span class="skill-value">${escapeHtml(val)}</span>
        </div>
      `;
    })
    .join('');

  const skillsSectionHtml = skillsRowsHtml
    ? `<section class="section">
      <div class="section-kicker">${resolveKicker(payload, 'skills', skillsKicker)}</div>
      <div class="section-body">
        <div class="skills-grid">
          ${skillsRowsHtml}
        </div>
      </div>
    </section>`
    : '';

  // 6. Certifications
  const rawCerts = payload.certifications || [];
  const certItems: Array<{ name: string; issuer?: string; date?: string }> = Array.isArray(rawCerts)
    ? rawCerts
        .map((c: any) => {
          if (typeof c === 'string') {
            const match = c.match(/^(.*?)(?:\s*\((.*?)\))?$/);
            return {
              name: match ? match[1].trim() : c.trim(),
              issuer: match && match[2] ? match[2].trim() : undefined,
            };
          }
          return {
            name: c?.name || '',
            issuer: c?.issuer,
            date: c?.date,
          };
        })
        .filter((c) => Boolean(c.name))
    : [];

  const certRowsHtml = certItems
    .map(
      (cert) => `
        <div class="cert-row">
          <div>
            <span class="cert-label">${escapeHtml(cert.name)}</span>
            ${cert.issuer ? `<span class="cert-issuer">— ${escapeHtml(cert.issuer)}</span>` : ''}
          </div>
          ${cert.date ? `<div class="cert-date">${escapeHtml(cert.date)}</div>` : ''}
        </div>
      `
    )
    .join('');

  const certificationsSectionHtml = certRowsHtml
    ? `<section class="section">
      <div class="section-kicker">${resolveKicker(payload, 'certifications', 'Certifications & Licenses')}</div>
      <div class="section-body">
        ${certRowsHtml}
      </div>
    </section>`
    : '';

  // 7. Custom / Polymorphic Sections
  const customSections = Array.isArray(payload.customSections) ? payload.customSections : [];
  const customSectionsHtmlMap: Record<string, string> = {};

  customSections.forEach((sec: any) => {
    if (!sec || !sec.title) return;
    const secId = (sec.id || sec.title).toLowerCase().trim();
    const items = Array.isArray(sec.items) ? sec.items : [];
    let itemsHtml = '';

    if (sec.type === 'timeline') {
      itemsHtml = items
        .map((item: any) => {
          const bullets = consolidateBullets(item.bullets || [])
            .map((b: string) => `<li>${escapeHtml(b)}</li>`)
            .join('');
          return `
            <article class="entry">
              <div class="entry-header">
                <div class="entry-title">${escapeHtml(item.organization || item.company || '')}</div>
                <div class="entry-date">${escapeHtml(item.location || '')}</div>
              </div>
              <div class="entry-meta-row">
                <div class="entry-subtitle">${escapeHtml(item.role || item.title || '')}</div>
                <div class="entry-date">${escapeHtml(item.date_range || item.date || '')}</div>
              </div>
              ${renderEntryAttributes(item.attributes)}
              ${bullets ? `<ul class="entry-list">${bullets}</ul>` : ''}
            </article>
          `;
        })
        .join('');
    } else if (sec.type === 'credentials') {
      itemsHtml = items
        .map((cert: any) => {
          const name = typeof cert === 'string' ? cert : cert.name || '';
          const issuer = typeof cert === 'object' ? cert.issuer : undefined;
          const date = typeof cert === 'object' ? cert.date : undefined;
          const detail = typeof cert === 'object' ? credentialDetail(cert) : '';
          return `
            <div class="cert-row">
              <div>
                <span class="cert-label">${escapeHtml(name)}</span>
                ${issuer || detail ? `<span class="cert-issuer">${detail || `— ${escapeHtml(issuer)}`}</span>` : ''}
              </div>
              ${date ? `<div class="cert-date">${escapeHtml(date)}</div>` : ''}
            </div>
          `;
        })
        .join('');
    } else if (sec.type === 'publications') {
      itemsHtml = items
        .map((pub: any) => {
          const authors = Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors || '';
          const metaLine = [authors, pub.venue, pub.date].filter(Boolean).join(' | ');
          return `
            <article class="entry">
              <div class="entry-title">${escapeHtml(pub.title || '')}</div>
              ${metaLine ? `<div class="entry-subtitle">${escapeHtml(metaLine)}</div>` : ''}
            </article>
          `;
        })
        .join('');
    } else if (sec.type === 'skills_matrix') {
      const rows = items
        .map((grp: any) => {
          const skillsStr = Array.isArray(grp.skills) ? grp.skills.join(', ') : String(grp.skills || '');
          return `
            <div class="skill-row">
              <span class="skill-label">${escapeHtml(grp.category || 'Skills')}:</span><span class="skill-value">${escapeHtml(skillsStr)}</span>
            </div>
          `;
        })
        .join('');
      itemsHtml = `<div class="skills-grid">${rows}</div>`;
    } else {
      itemsHtml = items
        .map((item: any) => {
          if (typeof item === 'string') {
            return `<p class="summary-text">${escapeHtml(item)}</p>`;
          }
          return `
            <article class="entry">
              ${item.heading ? `<div class="entry-title">${escapeHtml(item.heading)}</div>` : ''}
              <div class="summary-text">${escapeHtml(item.content || '')}</div>
            </article>
          `;
        })
        .join('');
    }

    if (itemsHtml) {
      const sectionHtml = `
        <section class="section">
          <div class="section-kicker">${escapeHtml(sec.title)}</div>
          <div class="section-body">
            ${itemsHtml}
          </div>
        </section>
      `;
      customSectionsHtmlMap[secId] = sectionHtml;
      customSectionsHtmlMap[sec.title.toLowerCase().trim()] = sectionHtml;
    }
  });

  // Section mapping
  const sectionMap: Record<string, string> = {
    summary: summarySectionHtml,
    experience: experienceSectionHtml,
    projects: projectsSectionHtml,
    skills: skillsSectionHtml,
    education: educationSectionHtml,
    certifications: certificationsSectionHtml,
    ...customSectionsHtmlMap,
  };

  // Determine section ordering
  const totalWorkBullets = experience.reduce(
    (acc: number, exp: any) => acc + (exp.bullets || []).length,
    0
  );
  const isExperienced = experience.length >= 2 || totalWorkBullets >= 4;
  const isProjectFirst = (experience.length === 0 || totalWorkBullets === 0) && projects.length >= 2;

  let activeOrder: string[];
  if (Array.isArray(payload.sectionOrder) && payload.sectionOrder.length > 0) {
    activeOrder = payload.sectionOrder;
  } else if (isExperienced) {
    // Experienced: Work Experience top, Education towards bottom, no summary unless explicitly supplied
    activeOrder = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'];
  } else if (isProjectFirst) {
    // Portfolio / Project-First: Projects top, Education / Skills next, Experience bottom
    activeOrder = ['summary', 'projects', 'skills', 'education', 'certifications', 'experience'];
  } else {
    // Early Career / Student: Summary (if sparse) -> Education -> Skills -> Projects -> Experience -> Certifications
    activeOrder = ['summary', 'education', 'skills', 'projects', 'experience', 'certifications'];
  }

  const renderedKeys = new Set<string>();
  const renderedSections: string[] = [];

  for (const secKey of activeOrder) {
    const keyLower = secKey.toLowerCase().trim();
    if (sectionMap[keyLower] && !renderedKeys.has(keyLower)) {
      renderedSections.push(sectionMap[keyLower]);
      renderedKeys.add(keyLower);
      const matchedCustom = customSections.find(
        (s: any) => (s.id || '').toLowerCase() === keyLower || (s.title || '').toLowerCase() === keyLower
      );
      if (matchedCustom) {
        if (matchedCustom.id) renderedKeys.add(matchedCustom.id.toLowerCase().trim());
        if (matchedCustom.title) renderedKeys.add(matchedCustom.title.toLowerCase().trim());
      }
    }
  }

  // Append any custom sections not explicitly specified in activeOrder
  for (const sec of customSections) {
    const idKey = (sec.id || '').toLowerCase().trim();
    const titleKey = (sec.title || '').toLowerCase().trim();
    if (!renderedKeys.has(idKey) && !renderedKeys.has(titleKey)) {
      const html = customSectionsHtmlMap[idKey] || customSectionsHtmlMap[titleKey];
      if (html) {
        renderedSections.push(html);
        if (idKey) renderedKeys.add(idKey);
        if (titleKey) renderedKeys.add(titleKey);
      }
    }
  }

  const renderedSectionsHtml = renderedSections.join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(basics.name)} Resume</title>
  <style>${RESUME_CSS}</style>
</head>
<body>
  <main class="resume-page">
    <header class="hero">
      <h1 class="hero-name">${escapeHtml(basics.name)}</h1>
      <div class="hero-meta">${[basics.location, basics.phone, basics.email].filter(Boolean).map(escapeHtml).join(' | ')}</div>
      ${linksHtml ? `<div class="hero-links">${linksHtml}</div>` : ''}
    </header>

    ${renderedSectionsHtml}
  </main>
</body>
</html>`;
}
