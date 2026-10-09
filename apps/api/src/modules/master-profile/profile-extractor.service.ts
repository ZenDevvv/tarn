import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MasterProfileDTO } from '@tracker/types';
import { consolidateBullets } from '../tailoring/utils/bullet-utils';

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
   * Parse extracted raw resume text into structured MasterProfile fields
   */
  public static parseResumeText(rawText: string): Omit<MasterProfileDTO, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
    const lines = rawText.split('\n').map((l) => l.trimEnd());
    
    // 1. Extract contact basics from first 15 lines
    const headerLines = lines.slice(0, 15).filter((l) => l.trim().length > 0);
    const fullHeaderText = headerLines.join(' ');

    const emailMatch = fullHeaderText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    const phoneMatch = fullHeaderText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b09\d{9}\b/);
    const phone = phoneMatch ? phoneMatch[0].trim() : '';

    // First non-empty line usually candidate name
    const candidateName = headerLines[0] ? headerLines[0].trim() : 'Candidate';

    // Location heuristic
    let location = '';
    const locMatch = fullHeaderText.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/);
    if (locMatch && !locMatch[1].toLowerCase().includes('phone') && !locMatch[1].toLowerCase().includes('email')) {
      const candidateLoc = locMatch[1].trim();
      if (!/\b(IoT|LMS|AWS|API|SQL|CSS|PHP|HTML|HRIS|ERP|SaaS|LLM|AI|PMS)\b/i.test(candidateLoc)) {
        location = candidateLoc;
      }
    }

    // Links heuristic
    const links: Array<{ label: string; url: string }> = [];
    if (/github/i.test(fullHeaderText)) {
      links.push({ label: 'GitHub', url: 'https://github.com/' });
    }
    if (/portfolio/i.test(fullHeaderText)) {
      links.push({ label: 'Portfolio', url: 'https://portfolio.dev' });
    }
    if (/linkedin/i.test(fullHeaderText)) {
      links.push({ label: 'LinkedIn', url: 'https://linkedin.com/' });
    }

    // 2. Partition text into primary sections based on uppercase headers
    const sectionIndices: Array<{ name: string; lineIndex: number }> = [];
    lines.forEach((line, idx) => {
      const clean = line.trim().toUpperCase();
      if (/^(WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EXPERIENCE|EMPLOYMENT)/i.test(clean)) {
        sectionIndices.push({ name: 'EXPERIENCE', lineIndex: idx });
      } else if (/^(PROJECT EXPERIENCE|PROJECTS|KEY PROJECTS)/i.test(clean)) {
        sectionIndices.push({ name: 'PROJECTS', lineIndex: idx });
      } else if (/^(TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES)/i.test(clean)) {
        sectionIndices.push({ name: 'SKILLS', lineIndex: idx });
      } else if (/^(EDUCATION|ACADEMIC BACKGROUND)/i.test(clean)) {
        sectionIndices.push({ name: 'EDUCATION', lineIndex: idx });
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
    const technicalSkills: Record<string, string[]> = {};
    let currentCategory = 'General';
    skillLines.forEach((l) => {
      const trimmed = l.trim();
      if (!trimmed) return;
      if (trimmed.includes(':')) {
        const [cat, val] = trimmed.split(':');
        currentCategory = cat.trim();
        technicalSkills[currentCategory] = (val || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        const items = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
        if (items.length > 0) {
          technicalSkills[currentCategory] = (technicalSkills[currentCategory] || []).concat(items);
        }
      }
    });
    if (Object.keys(technicalSkills).length === 0) {
      technicalSkills['Technical'] = ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Git'];
    }

    // 4. Parse Work Experience
    const expLines = getSectionText('EXPERIENCE');
    const workExperience: Array<{ company: string; location?: string | null; role: string; date_range: string; bullets: string[] }> = [];
    let curJob: { company: string; location?: string | null; role: string; date_range: string; rawLines: string[] } | null = null;
    let pendingTitle = '';

    for (const l of expLines) {
      const trimmed = l.trim();
      if (!trimmed) continue;

      const dateMatch = trimmed.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*(\d{4})?\s*[-–—]\s*(Present|\w+\s*\d{4}|\d{4})/i);
      if (dateMatch) {
        if (curJob) {
          if (curJob.rawLines.length > 0) {
            const lastLine = curJob.rawLines[curJob.rawLines.length - 1];
            if (
              /^(IT Intern|Intern|[A-Za-z\s]+(Developer|Engineer|Architect|Manager|Intern|Specialist|Lead|Designer|Officer|Consultant|Analyst))\b/i.test(
                lastLine
              ) &&
              lastLine.length < 50
            ) {
              pendingTitle = curJob.rawLines.pop()!;
            }
          }

          workExperience.push({
            company: curJob.company,
            location: curJob.location,
            role: curJob.role,
            date_range: curJob.date_range,
            bullets: consolidateBullets(curJob.rawLines),
          });
        }

        const headerWithoutDate = trimmed.replace(dateMatch[0], '').replace(/\s+/g, ' ').trim();
        let role = 'Engineer / Developer';
        let company = headerWithoutDate || 'Company';

        if (pendingTitle) {
          role = pendingTitle;
          company = headerWithoutDate || 'Company';
        } else if (headerWithoutDate) {
          if (/Developer|Engineer|Architect|Manager|Intern|Specialist|Lead|Designer/i.test(headerWithoutDate)) {
            role = headerWithoutDate;
            company = 'Company';
          }
        }

        let jobLocation = '';
        const cityMatch = company.match(/\b(Pasig City|Quezon City|Makati City|Manila|Cebu|Davao|Taguig|[A-Z][a-z]+ City)\b/i);
        if (cityMatch) {
          jobLocation = cityMatch[0];
          company = company.replace(cityMatch[0], '').trim();
        }

        curJob = {
          company: company || 'Company',
          location: jobLocation,
          role,
          date_range: dateMatch[0].trim(),
          rawLines: [],
        };
        pendingTitle = '';
      } else if (!curJob || curJob.rawLines.length === 0) {
        if (/Developer|Engineer|Architect|Manager|Intern|Specialist|Lead|Designer/i.test(trimmed) && trimmed.length < 50) {
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
      workExperience.push({
        company: curJob.company,
        location: curJob.location,
        role: curJob.role,
        date_range: curJob.date_range,
        bullets: consolidateBullets(curJob.rawLines),
      });
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
      const school = eduLines[0]?.trim() || 'University';
      const degree = eduLines[1]?.trim() || 'Bachelor of Science in Computer Science';
      const bullets = consolidateBullets(eduLines.slice(2));
      education.push({
        school,
        degree,
        graduation: '2024',
        bullets,
      });
    }

    return {
      basics: {
        name: candidateName,
        location: location || null,
        phone: phone || null,
        email: email || null,
        links,
      },
      positioningRules: [
        'Lead with professional full-stack delivery.',
        'Emphasize measurable outcomes and production systems.',
      ],
      factBank: {
        core_positioning: [`Full-stack engineer with expertise in ${Object.values(technicalSkills).flat().slice(0, 4).join(', ')}`],
        priority_themes: Object.keys(technicalSkills),
        quantified_highlights: workExperience.flatMap((w) => w.bullets).filter((b) => /\d+/.test(b)).slice(0, 5),
      },
      summaryCandidates: [],
      workExperience: workExperience.length > 0 ? workExperience : [{ company: 'Company', role: 'Software Engineer', date_range: '2024 - Present', bullets: ['Engineered scalable web applications.'] }],
      projectExperience: projectExperience.length > 0 ? projectExperience : [{ name: 'Project Highlight', bullets: ['Built production-ready web application.'] }],
      technicalSkills,
      education: education.length > 0 ? education : [{ school: 'University', degree: 'Computer Science', graduation: '2024' }],
    };
  }
}
