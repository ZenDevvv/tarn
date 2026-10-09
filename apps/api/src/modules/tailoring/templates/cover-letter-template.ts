import { escapeHtml } from './resume-template';

export const COVER_LETTER_CSS = `
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #000000;
  font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
  line-height: 1.5;
  font-size: 11pt;
}
body { padding: 0; }
.letter-page {
  width: 8.5in;
  margin: 0 auto;
  background: #ffffff;
  padding: 0.65in 0.8in 0.6in;
}
.letter-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #000000;
  padding-bottom: 12px;
}
.letter-name {
  margin: 0;
  font-size: 20pt;
  font-weight: 700;
  color: #000000;
}
.letter-role {
  font-size: 11.5pt;
  font-style: italic;
  margin-top: 2px;
}
.letter-meta {
  margin-top: 4px;
  font-size: 10.5pt;
  color: #000000;
}
.letter-target {
  margin-top: 6px;
  font-size: 10.5pt;
  font-weight: 700;
}
.letter-links {
  margin-top: 4px;
  font-size: 10.5pt;
}
.letter-link {
  color: #0563c1;
  text-decoration: underline;
  margin-right: 12px;
}
.letter-body {
  font-size: 11pt;
  text-align: justify;
}
.letter-body p {
  margin: 0 0 14px;
}
.letter-body h1, .letter-body h2 {
  font-size: 12pt;
  margin: 16px 0 8px;
}
.letter-body ul {
  margin: 6px 0 14px;
  padding-left: 20px;
}
.letter-body li {
  margin-bottom: 4px;
}
@media print {
  body { padding: 0; background: #fff; }
  .letter-page { padding: 0.5in 0.6in; width: 100%; border: none; box-shadow: none; }
}
`;

export function markdownToHtml(md: string): string {
  const blocks: string[] = [];
  const lines = md.split('\n');
  let currentP: string[] = [];
  let currentList: string[] = [];

  const flushP = () => {
    if (currentP.length > 0) {
      blocks.push(`<p>${formatInline(currentP.join(' '))}</p>`);
      currentP = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push(`<ul>${currentList.map((item) => `<li>${formatInline(item)}</li>`).join('')}</ul>`);
      currentList = [];
    }
  };

  const formatInline = (text: string): string => {
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/`(.+?)`/g, '<code>$1</code>');
    return escaped;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushP();
      flushList();
      continue;
    }
    if (line.startsWith('# ')) {
      flushP();
      flushList();
      blocks.push(`<h1>${formatInline(line.slice(2).trim())}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      flushP();
      flushList();
      blocks.push(`<h2>${formatInline(line.slice(3).trim())}</h2>`);
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushP();
      currentList.push(line.slice(2).trim());
      continue;
    }
    flushList();
    currentP.push(line);
  }

  flushP();
  flushList();
  return blocks.join('\n');
}

export function buildCoverLetterHtml(
  markdownText: string,
  basics: any,
  role?: string | null,
  company?: string | null
): string {
  const targetParts = [role, company].filter(Boolean);
  const targetLine = targetParts.length > 0 ? targetParts.join(' | ') : 'General Application';
  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const linksHtml = (basics.links || [])
    .map((l: any) => `<a class="letter-link" href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(basics.name)} Cover Letter</title>
  <style>${COVER_LETTER_CSS}</style>
</head>
<body>
  <main class="letter-page">
    <header class="letter-header">
      <h1 class="letter-name">${escapeHtml(basics.name)}</h1>
      <div class="letter-role">${escapeHtml(role || 'Targeted Application')}</div>
      <div class="letter-meta">${[basics.location, basics.phone, basics.email].filter(Boolean).map(escapeHtml).join(' | ')}</div>
      <div class="letter-target">${escapeHtml(todayStr)} | ${escapeHtml(targetLine)}</div>
      ${linksHtml ? `<div class="letter-links">${linksHtml}</div>` : ''}
    </header>

    <section class="letter-body">
      ${markdownToHtml(markdownText)}
    </section>
  </main>
</body>
</html>`;
}
