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
}
.entry:last-child {
  margin-bottom: 0;
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
.entry-list {
  margin: 2px 0 0;
  padding-left: 18px;
}
.entry-list li {
  margin: 0 0 2.5px;
  font-size: 10.5pt;
  color: #000000;
  text-align: justify;
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
@media print {
  body { padding: 0; background: #fff; }
  .resume-page { padding: 0.4in 0.5in; width: 100%; border: none; box-shadow: none; }
}
`;

import { consolidateBullets } from '../utils/bullet-utils';

export function buildResumeHtml(payload: any): string {
  const basics = payload.basics || {};
  const education = payload.education || [];
  const experience = payload.experience || [];
  const projects = payload.projects || [];
  const skills = payload.skills || {};

  const linksHtml = (basics.links || [])
    .map((l: any) => `<a class="hero-link" href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`)
    .join('');

  const educationHtml = education
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

  const experienceHtml = experience
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
          <ul class="entry-list">${bullets}</ul>
        </article>
      `;
    })
    .join('');

  const sharedStack = payload.shared_stack
    ? `<div class="shared-stack"><strong>Shared Stack:</strong> ${escapeHtml(
        Array.isArray(payload.shared_stack) ? payload.shared_stack.join(', ') : payload.shared_stack
      )}</div>`
    : '';

  const projectsHtml = projects
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

  const skillsHtml = Object.entries(skills)
    .map(([cat, items]: [string, any]) => {
      const val = Array.isArray(items) ? items.join(', ') : String(items);
      return `
        <div class="skill-row">
          <span class="skill-label">${escapeHtml(cat)}:</span><span class="skill-value">${escapeHtml(val)}</span>
        </div>
      `;
    })
    .join('');

  const profDev = payload.professional_development
    ? `<div class="professional-dev">${escapeHtml(
        Array.isArray(payload.professional_development)
          ? payload.professional_development.join(' ')
          : payload.professional_development
      )}</div>`
    : '';

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

    <section class="section">
      <div class="section-kicker">Education</div>
      <div class="section-body">
        ${educationHtml}
      </div>
    </section>

    <section class="section">
      <div class="section-kicker">Work Experience</div>
      <div class="section-body">
        ${experienceHtml}
        ${profDev}
      </div>
    </section>

    <section class="section">
      <div class="section-kicker">Project Experience</div>
      <div class="section-body">
        ${sharedStack}
        ${projectsHtml}
      </div>
    </section>

    <section class="section">
      <div class="section-kicker">Technical Skills</div>
      <div class="section-body">
        <div class="skills-grid">
          ${skillsHtml}
        </div>
      </div>
    </section>
  </main>
</body>
</html>`;
}
