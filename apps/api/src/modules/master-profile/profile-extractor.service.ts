import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MasterProfileDTO, MasterProfileDraftDTO } from '@tracker/types';
import { consolidateBullets, isBulletLine } from '../tailoring/utils/bullet-utils';
import { ServiceUnavailableError } from '../../middleware/error-handler';

const ACRONYM_GUARD = /\b(IoT|LMS|AWS|API|SQL|CSS|PHP|HTML|HRIS|ERP|SaaS|LLM|AI|PMS)\b/i;

const REGION_ALLOWLIST =
  /\b(PH|Philippines|US|USA|United States|UK|United Kingdom|CA|Canada|AU|Australia|SG|Singapore|JP|Japan|IN|India|DE|Germany|NL|Netherlands|IE|Ireland|FR|France|ES|Spain|IT|Italy|SE|Sweden|CH|Switzerland|BR|Brazil|MX|Mexico|CO|Colombia|AR|Argentina|CL|Chile|ZA|South Africa|AE|UAE|United Arab Emirates|NZ|New Zealand|NSW|VIC|QLD|WA|SA|TAS|MH|KA|DL|TN|TS|UP|WB|GJ|AL|AK|AZ|AR|CO|CT|FL|GA|HI|ID|IL|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|AB|BC|MB|NB|NS|NT|NU|ON|PE|QC|SK|YT)\b/i;

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
      if (
        /^(WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EXPERIENCE|EMPLOYMENT HISTORY|EMPLOYMENT|CLINICAL EXPERIENCE|CLINICAL ROTATIONS|TEACHING EXPERIENCE|RESEARCH EXPERIENCE|RESIDENCIES|FELLOWSHIPS|CLERKSHIPS|APPRENTICESHIPS|MILITARY SERVICE|MILITARY EXPERIENCE|VOLUNTEER EXPERIENCE|PROFESSIONAL PRACTICE|PRACTICUM|INTERNSHIPS|EXPERIENCIA LABORAL|EXPÉRIENCE PROFESSIONNELLE|BERUFSERFAHRUNG)\b/i.test(
          clean
        )
      ) {
        sectionIndices.push({ name: 'EXPERIENCE', lineIndex: idx });
      } else if (
        /^(PROJECT EXPERIENCE|PROJECTS|KEY PROJECTS|PERSONAL PROJECTS|REPRESENTATIVE MATTERS|SELECTED CASES|PUBLICATIONS|RESEARCH)\b/i.test(
          clean
        )
      ) {
        sectionIndices.push({ name: 'PROJECTS', lineIndex: idx });
      } else if (
        /^(TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|AREAS OF EXPERTISE|TECHNOLOGIES|COMPETENCIES|SKILLS & COMPETENCIES|SKILLS AND COMPETENCIES|COMPÉTENCES)\b/i.test(
          clean
        )
      ) {
        sectionIndices.push({ name: 'SKILLS', lineIndex: idx });
      } else if (
        /^(EDUCATION|ACADEMIC BACKGROUND|ACADEMIC HISTORY|ACADEMIC TRAINING|EDUCATION & TRAINING|EDUCATION AND TRAINING|DEGREES|HIGHER EDUCATION|FORMACIÓN ACADÉMICA|FORMATION|AUSBILDUNG)\b/i.test(
          clean
        )
      ) {
        sectionIndices.push({ name: 'EDUCATION', lineIndex: idx });
      } else if (
        /^(CERTIFICATIONS|CERTIFICATES|LICENSES|LICENSES & CERTIFICATIONS|LICENSES AND CERTIFICATIONS|CREDENTIALS|BOARD CERTIFICATIONS|STATE LICENSES|LICENSURE|BAR ADMISSIONS|CREDENTIALS & LICENSES|ACCREDITATIONS|CERTIFICACIONES)\b/i.test(
          clean
        )
      ) {
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
      /\b(Nurse|Teacher|Professor|Instructor|Accountant|Controller|Comptroller|Auditor|Therapist|Technician|Technologist|Paramedic|Counselor|Attorney|Paralegal|Coordinator|Administrator|Director|Manager|Supervisor|Engineer|Developer|Architect|Designer|Specialist|Lead|Officer|Consultant|Analyst|Intern|Executive|President|Owner|Operator|Salesperson|Sales|Representative|Agent|Clerk|Practitioner|Resident|Dietitian|Electrician|Plumber|Welder|Mechanic|Machinist|Carpenter|Scientist|Researcher|Librarian|Social Worker|Case Manager|Program Manager|Product Manager|Head|Chief|Doctor|Physician|Surgeon|Fellow|Dean|Principal|Faculty|Counsel|Advocate|Partner)\b/i;
    const COMPANY_SIGNAL_REGEX =
      /\b(Inc|LLC|Ltd|Corp|Corporation|Company|Co|Hospital|University|College|School|Institute|Academy|Polytechnic|District|Bank|Group|Systems|Technologies|Labs|Center|Centre|Clinic|Department|Agency|Association|GmbH|Foundation|Partners|Industries)\b/i;

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

      const dateMatch = trimmed.match(
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Abr|Ago|Dic|Fév|Avr|Mai|Aoû|Okt|Dez|\d{4})\s*(\d{4})?\s*[-–—]\s*(Presente|Present|Current|Now|Ongoing|Actualidad|Présent|Heute|至今|\w+\s*\d{4}|\d{4})\b/i
      );
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

        // Removing the date leaves a dangling separator ("Software Engineer |"), which
        // would fake a single-part pipe header — strip it before choosing a branch.
        const headerWithoutDate = trimmed.replace(dateMatch[0], '').replace(/[|•·]+\s*$/, '').replace(/\s+/g, ' ').trim();
        let role = '';
        let company = '';
        let jobLocation = '';

        const headerToSplit = headerWithoutDate.includes('|')
          ? headerWithoutDate
          : pendingTitle && pendingTitle.includes('|')
          ? pendingTitle
          : null;

        if (headerToSplit) {
          const parts = headerToSplit.split('|').map((p) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            const titleIdx = parts.findIndex(looksLikeTitle);
            const employerIdx = parts.findIndex(looksLikeEmployer);
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
              warnings.push(`Verify role/employer split for "${headerToSplit}"`);
            }
          } else if (parts.length === 1) {
            company = parts[0];
          }
          if (headerToSplit === pendingTitle) {
            pendingTitle = '';
          }
        } else if (pendingTitle) {
          // Stacked header — the date sat on its own line, so `pendingTitle` holds the
          // preceding header segment. Classify both with the same two signals the pipe
          // branch uses. Exactly one title settles the split; the other segment is the
          // employer. Neither or both means we cannot tell: keep the earlier segment on
          // the role and warn, never silently swap.
          const stacked = [pendingTitle, headerWithoutDate];
          const titleCount = stacked.filter(looksLikeTitle).length;
          if (titleCount === 1) {
            role = stacked.find(looksLikeTitle)!;
            company = stacked.find((s) => s !== role)!;
          } else {
            role = stacked[0];
            company = stacked[1];
            warnings.push(`Verify role/employer for "${stacked[0]} | ${stacked[1]}"`);
          }
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
      } else if (curJob && !curJob.rawLines.length && !isBulletLine(trimmed) && !curJob.company && !looksLikeTitle(trimmed) && trimmed.length < 50) {
        // Layout D: the employer is stacked under a dated header that carried only a
        // title. The line is the job's company, not an achievement bullet.
        curJob.company = trimmed;
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
      const isDegreeSegment = (s: string) =>
        /\b(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|Ph\.?D\.?|M\.?D\.?|J\.?D\.?|Bachelor|Master|Doctor|Doctorate|Diploma|Associate|Certificate)\b/i.test(
          s
        );

      // Split eduLines into candidate entry line groups.
      // Groups are separated by empty lines OR by a new institution signal after an existing entry.
      const eduBlocks: string[][] = [];
      let currentBlock: string[] = [];
      let hasInstitutionInBlock = false;
      let hasDegreeInBlock = false;

      for (const l of eduLines) {
        const trimmed = l.trim();
        if (!trimmed) {
          if (currentBlock.length > 0) {
            eduBlocks.push(currentBlock);
            currentBlock = [];
            hasInstitutionInBlock = false;
            hasDegreeInBlock = false;
          }
          continue;
        }

        const looksInst = looksLikeEmployer(trimmed) && !isDegreeSegment(trimmed);
        const looksDeg = isDegreeSegment(trimmed);

        if ((hasInstitutionInBlock || hasDegreeInBlock) && (looksInst || (looksDeg && hasDegreeInBlock)) && currentBlock.length >= 2) {
          eduBlocks.push(currentBlock);
          currentBlock = [l];
          hasInstitutionInBlock = looksInst;
          hasDegreeInBlock = looksDeg;
        } else {
          currentBlock.push(l);
          if (looksInst) hasInstitutionInBlock = true;
          if (looksDeg) hasDegreeInBlock = true;
        }
      }
      if (currentBlock.length > 0) {
        eduBlocks.push(currentBlock);
      }

      for (const block of eduBlocks) {
        const eduSegments = block
          .flatMap((l) => l.trim().split(/\s{6,}/))
          .map((l) => l.trim())
          .filter(Boolean);

        if (eduSegments.length === 0) continue;

        const institutionIdx = eduSegments.findIndex((s) => looksLikeEmployer(s) && !isDegreeSegment(s));
        const degreeIdx = institutionIdx >= 0 ? eduSegments.findIndex(isDegreeSegment) : -1;
        const [firstEdu, secondEdu] = eduSegments;
        let school = firstEdu?.trim() || '';
        let degree = degreeIdx >= 0 ? eduSegments[degreeIdx] : secondEdu?.trim() || null;
        if (institutionIdx >= 0) {
          school = eduSegments[institutionIdx].replace(/[,|–—]?\s*\b(?:19|20)\d{2}\b\s*$/, '').trim();
        }
        if (looksLikeEmployer(school) && degree === school) {
          degree = null;
        }
        const consumed = new Set([institutionIdx, degreeIdx].filter((i) => i >= 0));
        const allEduText = eduSegments.join(' ');
        const gradMatch = allEduText.match(/\b(19\d{2}|20\d{2})\b/);
        const graduation = gradMatch ? gradMatch[0] : null;

        let eduLocation: string | null = null;
        const leftovers = eduSegments.filter((_s, i) => !consumed.has(i));
        const placeOnly = /^[A-Z][a-zA-Z.\- ]*,\s*[A-Z][a-zA-Z.\- ]+$/.test(leftovers[0] || '');
        const rest = placeOnly ? leftovers.slice(1) : leftovers;
        if (placeOnly) {
          eduLocation = leftovers[0];
        }
        const bullets = consolidateBullets(rest);
        education.push({
          school,
          location: eduLocation,
          degree,
          graduation,
          bullets,
        });
      }
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
        customSections: [],
      },
      warnings,
    };
  }

  /**
   * Extract structured resume via Gemini AI zero-shot schema induction,
   * with automatic fallback and consensus verification against deterministic parser.
   */
  public static async extractWithAi(
    rawText: string,
    apiKey?: string,
    options: { throwOnError?: boolean } = {}
  ): Promise<MasterProfileDraftDTO> {
    const fallbackDraft = this.parseResumeText(rawText);

    if (!apiKey) {
      if (options.throwOnError) {
        throw new ServiceUnavailableError('AI extraction service is currently unavailable. No AI credits were deducted.');
      }
      return fallbackDraft;
    }

    try {
      const prompt = `
You are an expert universal resume parser and schema induction engine.
Your task is to accurately extract all information from the provided raw resume text into a structured, domain-agnostic MasterProfile JSON format.

INSTRUCTIONS:
1. Extract contact basics: name, email, phone, location, and web links.
2. Extract work experience: company, role, date_range, location, and achievement bullets.
3. Extract education: school, degree, graduation year, location, honors, and bullets.
4. Extract skills: group into sensible domain categories (e.g. Clinical, Technical, Management, Languages).
5. Extract credentials & licenses: place verified certifications, state licenses, or bar admissions into factBank.certifications.
6. POLYMORPHIC CUSTOM SECTIONS:
   If the candidate has non-traditional sections such as:
   - Clinical Rotations / Medical Residencies
   - Bar Admissions / Judicial Clerkships
   - Scholarly Publications / Patents
   - Trade Apprenticeships
   - Security Clearances
   Extract them into "customSections": [
     {
       "id": "kebab-case-id",
       "title": "Section Title",
       "type": "timeline" | "credentials" | "publications" | "skills_matrix" | "freeform",
       "items": [...]
     }
   ]

OUTPUT SCHEMA:
Return ONLY valid JSON matching this structure:
{
  "basics": {
    "name": "Full Name",
    "email": "email or null",
    "phone": "phone or null",
    "location": "City, Country or null",
    "links": [{ "label": "string", "url": "string" }]
  },
  "workExperience": [
    {
      "company": "Organization Name",
      "role": "Title / Position",
      "date_range": "Dates",
      "location": "Location or null",
      "bullets": ["achievement bullet"]
    }
  ],
  "education": [
    {
      "school": "Institution Name",
      "degree": "Degree / Qualification or null",
      "graduation": "Year or null",
      "location": "Location or null",
      "bullets": []
    }
  ],
  "skills": {
    "Category": ["skill1", "skill2"]
  },
  "factBank": {
    "certifications": ["cert1"],
    "core_positioning": ["Role or title positioning"]
  },
  "customSections": [
    {
      "id": "clinical_rotations",
      "title": "Clinical Rotations",
      "type": "timeline",
      "items": [
        {
          "organization": "Hospital",
          "role": "Fellow",
          "date_range": "2020",
          "bullets": []
        }
      ]
    }
  ]
}

RAW RESUME TEXT:
${rawText}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(20000),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('Gemini response missing text part');
      }

      const parsed = JSON.parse(rawJson);

      // Consensus reconciliation with deterministic fallback
      const basics = parsed.basics || {};
      const rawAiLinks = Array.isArray(basics.links)
        ? basics.links
            .filter((l: any) => l && typeof l === 'object' && typeof l.url === 'string' && l.url.trim().length > 0)
            .map((l: any) => ({
              label: String(l.label || l.url).trim(),
              url: String(l.url).trim(),
            }))
        : [];
      const finalLinks = rawAiLinks.length > 0 ? rawAiLinks : fallbackDraft.profile.basics.links;

      const finalBasics = {
        name: (basics.name && String(basics.name).trim()) || fallbackDraft.profile.basics.name || 'Applicant',
        email: basics.email || fallbackDraft.profile.basics.email || null,
        phone: basics.phone || fallbackDraft.profile.basics.phone || null,
        location: basics.location || fallbackDraft.profile.basics.location || null,
        links: finalLinks,
      };

      const rawAiWork = Array.isArray(parsed.workExperience) && parsed.workExperience.length > 0
        ? parsed.workExperience
        : fallbackDraft.profile.workExperience;
      const finalWork = rawAiWork.map((w: any) => ({
        company: String(w.company || '').trim(),
        role: String(w.role || '').trim(),
        date_range: w.date_range ? String(w.date_range).trim() : null,
        location: w.location ? String(w.location).trim() : null,
        bullets: Array.isArray(w.bullets) ? w.bullets.map((b: any) => String(b).trim()).filter(Boolean) : [],
      }));

      const rawAiEdu = Array.isArray(parsed.education) && parsed.education.length > 0
        ? parsed.education
        : fallbackDraft.profile.education;
      const finalEdu = rawAiEdu.map((e: any) => ({
        school: String(e.school || '').trim(),
        degree: e.degree ? String(e.degree).trim() : null,
        graduation: e.graduation ? String(e.graduation).trim() : null,
        location: e.location ? String(e.location).trim() : null,
        bullets: Array.isArray(e.bullets) ? e.bullets.map((b: any) => String(b).trim()).filter(Boolean) : [],
      }));

      const finalProfile: MasterProfileDraftDTO['profile'] = {
        basics: finalBasics,
        positioningRules: parsed.positioningRules || fallbackDraft.profile.positioningRules || [],
        factBank: {
          core_positioning: parsed.factBank?.core_positioning || fallbackDraft.profile.factBank.core_positioning || [],
          priority_themes: Object.keys(parsed.skills || {}),
          quantified_highlights: fallbackDraft.profile.factBank.quantified_highlights,
          certifications: parsed.factBank?.certifications || fallbackDraft.profile.factBank.certifications || [],
          customSections: parsed.customSections || [],
        },
        summaryCandidates: parsed.summaryCandidates || [],
        workExperience: finalWork,
        projectExperience: Array.isArray(parsed.projectExperience) ? parsed.projectExperience : fallbackDraft.profile.projectExperience,
        skills: parsed.skills || fallbackDraft.profile.skills,
        education: finalEdu,
        customSections: parsed.customSections || [],
      };

      const warnings: string[] = [];
      if (!finalBasics.email) warnings.push('Email not found — please verify');
      if (!finalBasics.phone) warnings.push('Phone number not found — please verify');
      if (!finalBasics.location) warnings.push('Location not found — please verify');

      return {
        profile: finalProfile,
        warnings,
      };
    } catch (err: any) {
      if (options.throwOnError) {
        throw new ServiceUnavailableError(
          `AI extraction failed: ${err?.message || 'External service error'}. No AI credits were deducted. Please retry or select Standard extraction.`
        );
      }
      console.warn('Gemini zero-shot resume extraction failed; falling back to deterministic parser:', err?.message || err);
      return {
        profile: fallbackDraft.profile,
        warnings: [
          ...fallbackDraft.warnings,
          'AI extraction unavailable; extracted via deterministic engine',
        ],
      };
    }
  }
}
