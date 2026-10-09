import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MasterProfileDTO, MasterProfileDraftDTO } from '@tracker/types';
import { consolidateBullets } from '../tailoring/utils/bullet-utils';

const ACRONYM_GUARD = /\b(IoT|LMS|AWS|API|SQL|CSS|PHP|HTML|HRIS|ERP|SaaS|LLM|AI|PMS)\b/i;

const REGION_ALLOWLIST = /\b(PH|Philippines|US|USA|United States|UK|United Kingdom|CA|Canada|AU|Australia|SG|Singapore|JP|Japan|IN|India|DE|Germany|NL|Netherlands|IE|Ireland|AL|AK|AZ|AR|CO|CT|FL|GA|HI|ID|IL|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|AB|BC|MB|NB|NS|NT|NU|ON|PE|QC|SK|YT)\b/i;

export class ProfileExtractorService {
  /**
   * Extract text from PDF buffer using pdftotext or text fallback
   */
  public static extractTextFromBuffer(buffer: Buffer, mimeType: string): string {
    const isPdf = mimeType.includes('pdf') || buffer.slice(0, 5).toString('ascii').startsWith('%PDF');
    if (isPdf) {
      const tmpDir = path.resolve(process.cwd(), 'uploads', 'tmp');
      fs.mkdirSync(tmpDir, { recursive: true });
      const tmpFile = path.join(tmpDir, `extract_${Date.now()}_${crypto.randomUUID().slice(0, 6)}.pdf`);
      try {
        fs.writeFileSync(tmpFile, buffer);
        const output = execFileSync('/usr/bin/pdftotext', ['-layout', tmpFile, '-'], {
          encoding: 'utf-8',
          timeout: 10000,
        });
        return output;
      } catch (err) {
        console.warn('pdftotext extraction error, falling back to raw string decoding:', err);
        return buffer.toString('utf-8');
      } finally {
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      }
    }
    return buffer.toString('utf-8');
  }

  /**
   * Parse extracted raw resume text into structured MasterProfile draft and warnings
   */
  public static parseResumeText(rawText: string): MasterProfileDraftDTO {
    const warnings: string[] = [];
    const lines = rawText.split('\n').map((l) => l.trimEnd());

    // 1. Extract contact basics from first 15 lines
    const headerLines = lines.slice(0, 15).filter((l) => l.trim().length > 0);
    const fullHeaderText = headerLines.join(' ');

    // Email
    const emailMatch = fullHeaderText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;
    if (!email) {
      warnings.push('Email not found — please verify');
    }

    // Phone (supports 7-digit, 10-digit, international, or PH mobile)
    const phoneMatch = fullHeaderText.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b|\b09\d{9}\b/);
    const phone = phoneMatch ? phoneMatch[0].trim() : null;
    if (!phone) {
      warnings.push('Phone number not found — please verify');
    }

    // Candidate name (first non-empty line that isn't a doc title)
    let candidateName = '';
    for (const hLine of headerLines) {
      const trimmed = hLine.trim();
      if (/^(curriculum vitae|resume|cv)$/i.test(trimmed)) {
        continue;
      }
      candidateName = trimmed;
      break;
    }
    if (!candidateName) {
      warnings.push('Candidate name not found — please verify');
    }

    // Location: Generic parsing with Remote detection, two-token pattern, and acronym guard
    let location: string | null = null;
    if (/\bRemote\b/i.test(fullHeaderText)) {
      location = 'Remote';
    }

    const headerSegments = headerLines.flatMap((l) => l.split(/[|•·]/)).map((s) => s.trim()).filter(Boolean);
    const locPattern = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}),\s*([A-Z]{2,}|[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/;

    for (const segment of headerSegments) {
      if (segment.toLowerCase() === 'remote') {
        location = 'Remote';
        break;
      }
      const match = segment.match(locPattern);
      if (match) {
        const cityPart = match[1].trim();
        const regionPart = match[2].trim();

        if (
          /\d/.test(cityPart) ||
          /\d/.test(regionPart) ||
          cityPart.includes('@') ||
          regionPart.includes('@') ||
          ACRONYM_GUARD.test(cityPart) ||
          ACRONYM_GUARD.test(regionPart)
        ) {
          continue;
        }

        if (
          /^(Phone|Email|Links|Portfolio|GitHub|LinkedIn|Skills|Education)$/i.test(cityPart) ||
          /^(Phone|Email|Links|Portfolio|GitHub|LinkedIn|Skills|Education)$/i.test(regionPart)
        ) {
          continue;
        }

        if (REGION_ALLOWLIST.test(regionPart) || /City$/i.test(cityPart)) {
          location = `${cityPart}, ${regionPart}`;
          break;
        }
      }
    }

    if (!location) {
      warnings.push('Location not found — please verify');
    }

    // Links: extract only literal https?:// URLs
    const links: Array<{ label: string; url: string }> = [];
    const urlMatches = rawText.match(/https?:\/\/[^\s)>,]+/g) || [];
    for (const rawUrl of urlMatches) {
      const cleanUrl = rawUrl.replace(/[.,;:)]+$/, '');
      try {
        const parsedUrl = new URL(cleanUrl);
        const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
        let label = host;
        if (host.includes('github.com')) {
          label = 'GitHub';
        } else if (host.includes('linkedin.com')) {
          label = 'LinkedIn';
        } else if (host.includes('gitlab.com')) {
          label = 'GitLab';
        } else if (host.includes('twitter.com') || host === 'x.com') {
          label = 'Twitter';
        }

        if (!links.some((l) => l.url === cleanUrl)) {
          links.push({ label, url: cleanUrl });
        }
      } catch {
        // Skip invalid URLs
      }
    }

    // 2. Partition text into primary sections based on uppercase headers
    const sectionIndices: Array<{ name: string; lineIndex: number }> = [];
    lines.forEach((line, idx) => {
      const clean = line.trim().toUpperCase();
      if (/^(WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EXPERIENCE|EMPLOYMENT HISTORY|EMPLOYMENT)\b/i.test(clean)) {
        sectionIndices.push({ name: 'EXPERIENCE', lineIndex: idx });
      } else if (/^(PROJECT EXPERIENCE|PROJECTS|KEY PROJECTS|PERSONAL PROJECTS)\b/i.test(clean)) {
        sectionIndices.push({ name: 'PROJECTS', lineIndex: idx });
      } else if (/^(TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|AREAS OF EXPERTISE|TECHNOLOGIES)\b/i.test(clean)) {
        sectionIndices.push({ name: 'SKILLS', lineIndex: idx });
      } else if (/^(EDUCATION|ACADEMIC BACKGROUND|ACADEMIC HISTORY)\b/i.test(clean)) {
        sectionIndices.push({ name: 'EDUCATION', lineIndex: idx });
      } else if (/^(CERTIFICATIONS|CERTIFICATES|LICENSES|LICENSES & CERTIFICATIONS|CREDENTIALS)\b/i.test(clean)) {
        sectionIndices.push({ name: 'CERTIFICATIONS', lineIndex: idx });
      }
    });

    const getSectionText = (name: string): string[] => {
      const cur = sectionIndices.find((s) => s.name === name);
      if (!cur) return [];
      const next = sectionIndices.find((s) => s.lineIndex > cur.lineIndex);
      const endIdx = next ? next.lineIndex : lines.length;
      return lines.slice(cur.lineIndex + 1, endIdx);
    };

    // 3. Parse Skills
    const skillLines = getSectionText('SKILLS');
    const skills: Record<string, string[]> = {};
    let currentCategory = 'General';
    skillLines.forEach((l) => {
      const trimmed = l.trim();
      if (!trimmed) return;
      if (trimmed.includes(':')) {
        const [cat, val] = trimmed.split(':');
        currentCategory = cat.trim();
        skills[currentCategory] = (val || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        const items = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
        if (items.length > 0) {
          skills[currentCategory] = (skills[currentCategory] || []).concat(items);
        }
      }
    });

    if (Object.keys(skills).length === 0) {
      warnings.push('Skills not found — please verify');
    }

    // 4. Parse Work Experience
    const expLines = getSectionText('EXPERIENCE');
    const workExperience: Array<{ company: string; location?: string | null; role: string; date_range: string; bullets: string[] }> = [];
    let curJob: { company: string; location?: string | null; role: string; date_range: string; rawLines: string[] } | null = null;
    let pendingTitle = '';

    // Two-signal role/employer disambiguation (domain-agnostic).
    // A segment is a TITLE if it carries a profession suffix; an EMPLOYER if it carries an org suffix.
    const TITLE_SUFFIX_REGEX =
      /\b(Nurse|Teacher|Professor|Instructor|Accountant|Controller|Comptroller|Auditor|Therapist|Technician|Technologist|Paramedic|Counselor|Attorney|Paralegal|Coordinator|Administrator|Director|Manager|Supervisor|Engineer|Developer|Architect|Designer|Specialist|Lead|Officer|Consultant|Analyst|Intern|Executive|President|Owner|Operator|Salesperson|Sales|Representative|Agent|Clerk|Practitioner|Resident|Dietitian|Electrician|Plumber|Welder|Mechanic|Machinist|Carpenter|Scientist|Researcher|Librarian|Social Worker|Case Manager|Program Manager|Product Manager)\b/i;
    const COMPANY_SIGNAL_REGEX =
      /\b(Inc|LLC|Ltd|Corp|Corporation|Company|Co|Hospital|University|College|School|District|Bank|Group|Systems|Technologies|Labs|Center|Centre|Clinic|Department|Agency|Association|GmbH|Foundation|Partners|Industries)\b/i;

    const looksLikeTitle = (s: string) => TITLE_SUFFIX_REGEX.test(s);
    const looksLikeEmployer = (s: string) => !TITLE_SUFFIX_REGEX.test(s) && COMPANY_SIGNAL_REGEX.test(s);

    // D1 invariant: parseResumeText must never return an entry with an empty company or role —
    // updateMasterProfileSchema rejects both, so one ambiguous header 400s the whole profile.
    // Degrade one field (coalesce) instead of discarding the profile.
    const pushJob = (job: NonNullable<typeof curJob>) => {
      const company = job.company.trim();
      const role = job.role.trim();
      if (!company && !role) {
        warnings.push(`Dropped unparseable experience segment "${job.date_range}" — verify manually`);
        return;
      }
      if (!company || !role) {
        warnings.push(`Missing ${company ? 'role' : 'company'} for "${job.date_range}" — filled from the other field, please verify`);
      }
      workExperience.push({
        company: job.company || job.role,
        location: job.location || null,
        role: job.role || job.company,
        date_range: job.date_range,
        bullets: consolidateBullets(job.rawLines),
      });
    };

    for (const l of expLines) {
      const trimmed = l.trim();
      if (!trimmed) continue;

      const dateMatch = trimmed.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*(\d{4})?\s*[-–—]\s*(Present|Current|\w+\s*\d{4}|\d{4})/i);
      if (dateMatch) {
        if (curJob) {
          if (curJob.rawLines.length > 0) {
            const lastLine = curJob.rawLines[curJob.rawLines.length - 1];
            if (looksLikeTitle(lastLine) && lastLine.length < 50) {
              pendingTitle = curJob.rawLines.pop()!;
            }
          }

          pushJob(curJob);
        }

        const headerWithoutDate = trimmed.replace(dateMatch[0], '').replace(/\s+/g, ' ').trim();
        let role = '';
        let company = '';
        let jobLocation = '';

        if (headerWithoutDate.includes('|')) {
          const parts = headerWithoutDate.split('|').map((p) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            const titleIdx = parts.findIndex((p) => looksLikeTitle(p));
            const employerIdx = parts.findIndex((p) => looksLikeEmployer(p));
            if (titleIdx >= 0 && employerIdx >= 0 && titleIdx !== employerIdx) {
              role = parts[titleIdx];
              company = parts[employerIdx];
            } else if (titleIdx >= 0) {
              role = parts[titleIdx];
              company = parts.find((p, i) => i !== titleIdx) || '';
            } else {
              // Neither segment carries a title signal — keep legacy order but warn, never silently swap.
              company = parts[0];
              role = parts.slice(1).join(' | ');
              warnings.push(`Verify role/employer split for "${headerWithoutDate}"`);
            }
          } else if (parts.length === 1) {
            company = parts[0];
          }
        } else if (pendingTitle) {
          role = pendingTitle;
          company = headerWithoutDate;
        } else if (headerWithoutDate) {
          if (looksLikeTitle(headerWithoutDate)) {
            role = headerWithoutDate;
          } else {
            company = headerWithoutDate;
          }
        }

        // Generic job location detection — region must be a 2-letter code (TX, IL, UK) so
        // employer suffixes like "Inc" / "Ltd" are never mistaken for regions.
        const cityMatch = company.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*(?:[A-Z]{2}\b)|[A-Z][a-z]+\sCity|San Francisco|New York|London|Toronto|Berlin|Remote)\b/);
        if (cityMatch) {
          jobLocation = cityMatch[0];
          company = company.replace(cityMatch[0], '').trim();
        }

        curJob = {
          company: company.replace(/[|,-]+$/, '').trim(),
          location: jobLocation || null,
          role: role.replace(/[|,-]+$/, '').trim(),
          date_range: dateMatch[0].trim(),
          rawLines: [],
        };
        pendingTitle = '';
      } else if (!curJob || curJob.rawLines.length === 0) {
        if (looksLikeTitle(trimmed) && trimmed.length < 50) {
          pendingTitle = trimmed;
        } else if (curJob) {
          curJob.rawLines.push(trimmed);
        } else {
          pendingTitle = trimmed;
        }
      } else {
        curJob.rawLines.push(trimmed);
      }
    }

    if (curJob) {
      pushJob(curJob);
    }

    if (workExperience.length === 0) {
      warnings.push('Work experience not found — please verify');
    }

    // 5. Parse Projects
    const projLines = getSectionText('PROJECTS');
    const projectExperience: Array<{ name: string; subtitle?: string | null; stack?: string[]; bullets: string[] }> = [];
    let curProj: { name: string; subtitle?: string | null; stack?: string[]; rawLines: string[] } | null = null;

    for (const l of projLines) {
      const trimmed = l.trim();
      if (!trimmed) continue;
      if (trimmed.toLowerCase().startsWith('shared stack:')) {
        continue;
      }
      const isHeader =
        !l.startsWith(' ') &&
        !trimmed.startsWith('•') &&
        !trimmed.startsWith('-') &&
        !trimmed.startsWith('*') &&
        trimmed.length < 60 &&
        (!curProj || curProj.rawLines.length > 0);

      if (isHeader) {
        if (curProj) {
          projectExperience.push({
            name: curProj.name,
            subtitle: curProj.subtitle,
            stack: curProj.stack,
            bullets: consolidateBullets(curProj.rawLines),
          });
        }
        curProj = {
          name: trimmed,
          subtitle: '',
          stack: [],
          rawLines: [],
        };
      } else if (curProj) {
        curProj.rawLines.push(trimmed);
      }
    }
    if (curProj) {
      projectExperience.push({
        name: curProj.name,
        subtitle: curProj.subtitle,
        stack: curProj.stack,
        bullets: consolidateBullets(curProj.rawLines),
      });
    }

    // 6. Parse Education
    const eduLines = getSectionText('EDUCATION');
    const education: Array<{ school: string; location?: string | null; degree?: string | null; honors?: string | null; graduation?: string | null; bullets?: string[] }> = [];
    if (eduLines.length > 0) {
      const school = eduLines[0]?.trim() || '';
      const degree = eduLines[1]?.trim() || null;
      const allEduText = eduLines.join(' ');
      const gradMatch = allEduText.match(/\b(19\d{2}|20\d{2})\b/);
      const graduation = gradMatch ? gradMatch[0] : null;
      const bullets = consolidateBullets(eduLines.slice(2));
      education.push({
        school,
        degree,
        graduation,
        bullets,
      });
    }

    if (education.length === 0) {
      warnings.push('Education not found — please verify');
    }

    // 7. Parse Certifications
    const certLines = getSectionText('CERTIFICATIONS');
    const certifications: string[] = [];
    certLines.forEach((l) => {
      const trimmed = l.trim();
      if (!trimmed) return;
      const cleaned = trimmed
        .replace(/^[•·*–—▪▫◦►✓○\u2022\u25E6\u25AA\u25CF\u25CB\u2043\u2219\u25B6\-]\s*/, '')
        .trim();
      if (cleaned && !certifications.includes(cleaned)) {
        certifications.push(cleaned);
      }
    });

    const allSkills = Object.values(skills).flat();

    // Positioning is derived strictly from parsed content — never seeded with industry defaults.
    const mostRecentRole = workExperience[0]?.role?.trim();
    const topSkillCategory = Object.keys(skills)[0];
    const corePositioning = mostRecentRole
      ? topSkillCategory
        ? [`${mostRecentRole} with expertise in ${topSkillCategory}`]
        : [mostRecentRole]
      : [];

    return {
      profile: {
        basics: {
          name: candidateName,
          location,
          phone,
          email,
          links,
        },
        positioningRules: [],
        factBank: {
          core_positioning: corePositioning,
          priority_themes: Object.keys(skills),
          quantified_highlights: workExperience.flatMap((w) => w.bullets).filter((b) => /\d+/.test(b)).slice(0, 5),
          certifications,
        },
        summaryCandidates: [],
        workExperience,
        projectExperience,
        skills,
        education,
      },
      warnings,
    };
  }
}
