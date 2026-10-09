import { ParsedJobMetadataDTO, WorkSetup, EmploymentType } from '@tracker/types';
import { BadRequestError } from '../../middleware/error-handler';

export class JobParserService {
  /**
   * SSRF Protection: validate that target URL does not point to internal/private IP ranges or loopback.
   */
  public validateUrlSafety(urlString: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new BadRequestError('Invalid URL format');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestError('Only http and https protocols are supported');
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check loopback & internal domain names
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      throw new BadRequestError('Access to internal or loopback addresses is restricted');
    }

    // Check IPv4 private and link-local ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, o1, o2] = ipv4Match.map(Number);
      // 10.0.0.0/8
      if (o1 === 10) throw new BadRequestError('Access to private network addresses is restricted');
      // 172.16.0.0/12
      if (o1 === 172 && o2 >= 16 && o2 <= 31) throw new BadRequestError('Access to private network addresses is restricted');
      // 192.168.0.0/16
      if (o1 === 192 && o2 === 168) throw new BadRequestError('Access to private network addresses is restricted');
      // 169.254.0.0/16 (Link-local & AWS metadata)
      if (o1 === 169 && o2 === 254) throw new BadRequestError('Access to link-local metadata addresses is restricted');
      // 127.0.0.0/8
      if (o1 === 127) throw new BadRequestError('Access to loopback addresses is restricted');
    }

    return parsed;
  }

  /**
   * Extract platform name from known job board hostnames or format the domain.
   */
  public extractSourcePlatform(url: URL): string {
    const host = url.hostname.toLowerCase();
    if (host.includes('onlinejobs.ph') || host.includes('onlinejobs')) return 'OnlineJobsPH';
    if (host.includes('jobstreet')) return 'Jobstreet';
    if (host.includes('greenhouse.io')) return 'Greenhouse';
    if (host.includes('lever.co')) return 'Lever';
    if (host.includes('ashbyhq.com')) return 'Ashby';
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('indeed.com')) return 'Indeed';
    if (host.includes('glassdoor.com')) return 'Glassdoor';
    if (host.includes('wellfound.com') || host.includes('angel.co')) return 'Wellfound';
    if (host.includes('workday') || host.includes('myworkdayjobs')) return 'Workday';
    if (host.includes('bamboohr.com')) return 'BambooHR';
    if (host.includes('ziprecruiter.com')) return 'ZipRecruiter';
    if (host.includes('kalibrr.com')) return 'Kalibrr';
    if (host.includes('bossjob')) return 'Bossjob';
    if (host.includes('foundit') || host.includes('monster')) return 'Foundit';
    if (host.includes('techinasia.com')) return 'Tech in Asia';
    if (host.includes('workable.com')) return 'Workable';
    if (host.includes('smartrecruiters.com')) return 'SmartRecruiters';
    if (host.includes('ycombinator.com')) return 'Work at a Startup';
    if (host.includes('remotive.com')) return 'Remotive';

    // Format company domain e.g. jobs.stripe.com -> Stripe
    const parts = host.split('.');
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      if (name.length > 2) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
    return host;
  }

  /**
   * Extract company slug from ATS URL paths (e.g. boards.greenhouse.io/{company}/jobs/...).
   */
  public extractCompanyFromUrlSlug(url: URL): string | undefined {
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;

    let rawSlug: string | undefined;

    if (host.includes('greenhouse.io')) {
      const match = pathname.match(/^\/([^/]+)/);
      if (match && match[1] !== 'jobs') rawSlug = match[1];
    } else if (host.includes('lever.co')) {
      const match = pathname.match(/^\/([^/]+)/);
      if (match) rawSlug = match[1];
    } else if (host.includes('ashbyhq.com')) {
      const match = pathname.match(/^\/([^/]+)/);
      if (match) rawSlug = match[1];
    }

    if (rawSlug) {
      return this.formatSlugToName(rawSlug);
    }
    return undefined;
  }

  private formatSlugToName(slug: string): string {
    return slug
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /**
   * Main entry point to parse metadata from a job posting URL.
   */
  public async parseJobUrl(urlString: string): Promise<ParsedJobMetadataDTO> {
    const parsedUrl = this.validateUrlSafety(urlString);
    const source = this.extractSourcePlatform(parsedUrl);
    const companyFromSlug = this.extractCompanyFromUrlSlug(parsedUrl);

    const fallbackResult: ParsedJobMetadataDTO = {
      url: urlString,
      companyName: companyFromSlug,
      source,
      extractedVia: companyFromSlug ? 'url' : 'heuristic',
    };

    try {
      const response = await fetch(urlString, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          return {
            url: urlString,
            companyName: companyFromSlug,
            source,
            isBotProtected: true,
            botPlatform: source,
            extractedVia: 'bot_protected',
            message: `${source} protects job postings with Cloudflare bot verification which blocks direct server access. Paste the job text or snippet below to auto-fill instantly!`,
          };
        }
        return fallbackResult;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        return fallbackResult;
      }

      // Read max 1MB
      const html = await response.text();

      // Check if response contains Cloudflare challenge page
      if (
        html.includes('challenges.cloudflare.com') ||
        html.includes('<title>Just a moment...</title>') ||
        html.includes('Attention Required! | Cloudflare')
      ) {
        return {
          url: urlString,
          companyName: companyFromSlug,
          source,
          isBotProtected: true,
          botPlatform: source,
          extractedVia: 'bot_protected',
          message: `${source} protects job postings with Cloudflare bot verification. Paste the job text or snippet below to auto-fill instantly!`,
        };
      }

      const parsedMetadata = this.extractMetadataFromHtml(html, parsedUrl);

      return {
        url: urlString,
        companyName: parsedMetadata.companyName || companyFromSlug,
        position: parsedMetadata.position,
        source: parsedMetadata.source || source,
        location: parsedMetadata.location,
        workSetup: parsedMetadata.workSetup,
        salaryMin: parsedMetadata.salaryMin,
        salaryMax: parsedMetadata.salaryMax,
        currency: parsedMetadata.currency || 'USD',
        description: parsedMetadata.description,
        extractedVia: parsedMetadata.extractedVia || 'heuristic',
      };
    } catch {
      // If fetching fails or times out, return URL-derived heuristic metadata safely
      return fallbackResult;
    }
  }

  /**
   * Parse job details directly from pasted text or job description snippet.
   */
  /**
   * Parse job details directly from pasted text or job description snippet.
   * Handles both small targeted snippets and full-page Ctrl+A text dumps from
   * Jobstreet, LinkedIn, Indeed, etc., stripping navigation headers and footer boilerplates.
   */
  public parseJobText(text: string, sourceUrl?: string): ParsedJobMetadataDTO {
    // 0. Extract company from markdown links if present e.g. [White Cloak Technologies, Inc.](https://www.linkedin.com/company/whitecloak/life/)
    let companyFromLink: string | undefined;
    const compLinkMatch = text.match(/\[([^\]]+)\]\(https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/[^)]+\)/i);
    if (compLinkMatch) {
      const cand = compLinkMatch[1]
        .replace(/[\d,]+\+?\s+followers/i, '')
        .replace(/\s+logo$/i, '')
        .trim();
      if (cand && cand.length < 80 && !this.isJobBoardOrPlatform(cand)) {
        companyFromLink = cand;
      }
    }

    // Convert all markdown links [Text](URL) into just Text for uniform processing
    const normalizedText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    const trimmed = normalizedText.trim();
    const rawLines = trimmed.split('\n').map((l) => l.trim());
    const nonEmptyLines = rawLines.filter(Boolean);

    let position = '';
    let companyName = companyFromLink || '';
    let location = '';
    let workSetup: WorkSetup = 'ONSITE';
    let employmentType: EmploymentType | undefined;
    let salaryMin: number | undefined;
    let salaryMax: number | undefined;
    let currency = 'USD';

    // 1. Source detection from sourceUrl if provided, or from text
    let source = 'Other';
    if (sourceUrl) {
      try {
        const parsed = new URL(sourceUrl);
        source = this.extractSourcePlatform(parsed);
      } catch {
        // fallback
      }
    }
    if (source === 'Other') {
      if (/onlinejobs(?:\.ph)?/i.test(trimmed) || /TYPE OF WORK[\s\S]*?HOURS PER WEEK/i.test(trimmed)) source = 'OnlineJobsPH';
      else if (/jobstreet/i.test(trimmed)) source = 'Jobstreet';
      else if (/linkedin/i.test(trimmed)) source = 'LinkedIn';
      else if (/indeed/i.test(trimmed)) source = 'Indeed';
      else if (/glassdoor/i.test(trimmed)) source = 'Glassdoor';
      else if (/greenhouse/i.test(trimmed)) source = 'Greenhouse';
      else if (/lever\.co/i.test(trimmed)) source = 'Lever';
      else if (/ashby/i.test(trimmed)) source = 'Ashby';
      else if (/workable/i.test(trimmed)) source = 'Workable';
      else if (/smartrecruiters/i.test(trimmed)) source = 'SmartRecruiters';
      else if (/kalibrr/i.test(trimmed)) source = 'Kalibrr';
      else if (/bossjob/i.test(trimmed)) source = 'Bossjob';
      else if (/foundit|monster/i.test(trimmed)) source = 'Foundit';
    }

    // 2. Work setup & employment type detection
    if (/\b(remote|work from home|wfh|telecommute|anywhere)\b/i.test(trimmed)) {
      workSetup = 'REMOTE';
    } else if (/\bhybrid\b/i.test(trimmed) || /\(hybrid\)/i.test(trimmed)) {
      workSetup = 'HYBRID';
    }

    if (/\b(?:full[- ]time|permanent)\b/i.test(trimmed)) {
      employmentType = 'FULL_TIME';
    } else if (/\bpart[- ]time\b/i.test(trimmed)) {
      employmentType = 'PART_TIME';
    } else if (/\bcontract\b/i.test(trimmed)) {
      employmentType = 'CONTRACT';
    } else if (/\bfreelance\b/i.test(trimmed)) {
      employmentType = 'FREELANCE';
    } else if (/\binternship\b/i.test(trimmed)) {
      employmentType = 'INTERNSHIP';
    }

    // 3. Salary extraction: handles ranges, single amounts ($250/week, USD $250 per week), and currency
    const sal = this.extractSalaryDetails(trimmed, source);
    if (sal) {
      if (sal.salaryMin !== undefined) salaryMin = sal.salaryMin;
      if (sal.salaryMax !== undefined) salaryMax = sal.salaryMax;
      if (sal.currency) currency = sal.currency;
    }

    // 4. Location detection & cleaning (PH & Global hubs)
    const locMatch = trimmed.match(
      /\b(Taguig|BGC|Makati|Quezon City|Manila|Cebu|Pasig|Mandaluyong|Pasay|Ortigas|Alabang|Clark|Davao|Iloilo|Angeles|Baguio|Cavite|Laguna|National Capital Region|Metro Manila|Philippines|San Francisco|New York|London|Singapore|Sydney|Toronto|Tokyo|Berlin|Paris|Amsterdam|Dublin|Austin|Seattle|Boston|Chicago|Los Angeles|Denver|Vancouver|Montreal|Stockholm|Bangalore|Bengaluru|Hong Kong|Melbourne|Auckland|Zurich|Munich)\b/i
    );
    if (locMatch) {
      const matchedCity = locMatch[1];
      const locLine = nonEmptyLines.find(
        (l) =>
          new RegExp(`\\b${matchedCity}\\b`, 'i').test(l) &&
          !/^(job search|browse|saved|similar|about us|careers|salary)/i.test(l)
      );

      if (locLine) {
        if (/\(hybrid\)/i.test(locLine)) workSetup = 'HYBRID';
        if (/\(remote\)/i.test(locLine)) workSetup = 'REMOTE';

        let cleanedLoc = locLine
          .replace(/\s*\((?:Hybrid|Remote|Onsite|On-site)\)/gi, '')
          .replace(/\s*[-–—|•]\s*(?:Full[- ]Time|Part[- ]Time|Permanent|Contract).*$/i, '')
          .trim();

        // If line is multi-segment separated by [·•|] e.g. "Pasig, National Capital Region, Philippines · Reposted 5 days ago · Over 100 people clicked apply"
        // or "Canva · Manila, Metro Manila, Philippines"
        if (/[·•|]/.test(cleanedLoc)) {
          const segments = cleanedLoc.split(/\s+[·•|]\s+/);
          const bestSeg = segments.find((s) => new RegExp(`\\b${matchedCity}\\b`, 'i').test(s));
          if (bestSeg) {
            cleanedLoc = bestSeg.trim();
          } else {
            cleanedLoc = segments[0].trim();
          }
        }

        location = cleanedLoc;
      } else {
        location = locMatch[0].trim();
      }
    }

    // 5. Role & Company line heuristics
    const roleAndCompany = this.extractRoleAndCompanyFromLines(nonEmptyLines, companyFromLink);
    if (roleAndCompany.position) position = roleAndCompany.position;
    if (roleAndCompany.companyName) companyName = roleAndCompany.companyName;

    // 6. Clean Description Extraction (stripping header nav and footer boilerplates)
    const description = this.extractCleanDescription(rawLines, position, companyName);

    return {
      url: sourceUrl || undefined,
      companyName: companyName || undefined,
      position: position || undefined,
      source,
      location: location || undefined,
      workSetup,
      employmentType,
      salaryMin,
      salaryMax,
      currency,
      description: description || undefined,
      extractedVia: 'text_snippet',
    };
  }

  /**
   * Intelligently extract Position title and Company Name from snippet lines across
   * LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, Ashby, Jobstreet, and generic formats.
   */
  private extractRoleAndCompanyFromLines(
    lines: string[],
    companyHint?: string
  ): { position?: string; companyName?: string } {
    let position: string | undefined;
    let companyName: string | undefined = companyHint;

    const isNoiseLine = (line: string): boolean => {
      const l = line.toLowerCase().trim();
      if (!l) return true;
      if (/^skip to (?:main |search )?content/i.test(l)) return true;
      if (/^back to (?:open )?roles|back to jobs|view all (?:open )?positions/i.test(l)) return true;
      if (
        /^(?:ph\.)?(?:onlinejobs(?:\.ph)?|onlinejobsph|jobstreet|indeed|linkedin|glassdoor|kalibrr|bossjob|foundit|monster|workable|smartrecruiters|greenhouse|lever|ashby)(?:\.com)?$/i.test(
          l
        )
      )
        return true;
      if (
        /^(jobs|people|learning|my network|network|messaging|notifications|\d+\s*notifications|home|job search|people search|career advice|companies|employer site|find jobs|company reviews|find salaries|sign in|sign up|log in|register|download apps|join now|start of main content|employers \/ post job|for business|me)$/i.test(
          l
        )
      )
        return true;
      if (
        /^(strong applicant|be an early applicant|high application volume|actively recruiting|urgently hiring|featured|promoted|promoted by hirer|responses managed off linkedin|easy apply|apply|apply now|apply for this job|apply on company website|submit application|save|save job|bookmark|share|responsive employer|direct employer|hybrid|remote|onsite|on-site|contract|full[- ]time|part[- ]time)$/i.test(
          l
        )
      )
        return true;
      if (/^(?:\d+|over\s+\d+)\s+(?:applicants|people clicked apply)/i.test(l)) return true;
      if (
        /^(?:see how you compare|try premium|get notified about new|reposted|show match details|beta\s*[•·]|set alert for similar jobs|job search faster with premium|activate premium|access company insights|interested in working with us|members who share|i’m interested|show more|more jobs|looking for talent|post a job|status is online|messagingyou are on the messaging|compose message|navigating to jobs|learn more|commitments|career growth|grow your career|become an advanced|see more jobs like this|follow|software development)/i.test(
          l
        )
      )
        return true;
      if (/^your profile and resume are missing/i.test(l)) return true;
      if (/^\d+[\d,]*\+?\s+employees/i.test(l)) return true;
      if (/^\d+[\d,]*\+?\s+followers/i.test(l)) return true;
      if (/^\d+[\d,]*\+?\s+on linkedin/i.test(l)) return true;
      if (/^posted\s+\d+.*ago/i.test(l)) return true;
      if (/^(full[- ]time|part[- ]time|contract|permanent|temporary|internship|mid-senior level|entry level)$/i.test(l))
        return true;
      if (/^(salary undisclosed|competitive salary|pay:?|job type:?|shift and schedule:?)$/i.test(l)) return true;
      if (/^how you match|here's how the job details align/i.test(l)) return true;
      if (/^\d+\s+skills?(?:\s+and\s+credentials)?\s+match/i.test(l)) return true;
      if (/^\+\d+\s+more$/i.test(l)) return true;
      if (/^•$/i.test(l)) return true;
      if (/^(type of work|wage\s*\/\s*salary|hours per week|date updated|skill requirement|about the employer)$/i.test(l))
        return true;
      if (/^(member since:|total job posts:|business or contact name:)/i.test(l)) return true;
      return false;
    };

    const isLocationLine = (str: string): boolean => {
      return (
        /\b(Taguig|BGC|Makati|Quezon City|Manila|Cebu|Pasig|Mandaluyong|Pasay|Ortigas|Alabang|Clark|Davao|Iloilo|Angeles|Baguio|Cavite|Laguna|National Capital Region|Metro Manila|Philippines|San Francisco|New York|London|Singapore|Sydney|Toronto|Tokyo|Berlin|Paris|Amsterdam|Dublin|Austin|Seattle|Boston|Chicago|Los Angeles|Denver|Vancouver|Montreal|Stockholm|Bangalore|Bengaluru|Hong Kong|Melbourne|Auckland|Zurich|Munich)\b/i.test(
          str
        ) || /\b(remote|hybrid|onsite|on-site)\b/i.test(str)
      );
    };

    const ROLE_KEYWORDS =
      /\b(engineer|developer|designer|architect|programmer|manager|lead|director|analyst|specialist|consultant|officer|administrator|coordinator|technician|associate|scientist|intern|executive|qa|tester|devops|sre|scrum master|product owner)\b/i;

    // 1. Logo line hint e.g. "SB Finance logo" or "Canva logo"
    let logoCompanyHint: string | undefined;
    for (const line of lines.slice(0, 15)) {
      const match = line.match(/^(.+?)\s+logo$/i);
      if (match && match[1].length < 60 && !isNoiseLine(match[1])) {
        logoCompanyHint = match[1].trim();
        break;
      }
    }

    // 2. Pattern: "View all jobs" (Jobstreet layout where company is right above it)
    const viewAllJobsIdx = lines.findIndex((l) => /^view all jobs$/i.test(l));
    if (viewAllJobsIdx > 0) {
      const compCandidate = lines[viewAllJobsIdx - 1];
      if (!isNoiseLine(compCandidate) && compCandidate.length < 80) {
        companyName = compCandidate.replace(/^\d\.\d\s*★?\s*/, '').trim();
      }

      // Look upwards for position (skipping badges, logos, noise)
      for (let i = viewAllJobsIdx - 2; i >= 0; i--) {
        const cand = lines[i];
        if (!isNoiseLine(cand) && !cand.toLowerCase().endsWith('logo') && cand.length < 90) {
          position = cand.replace(/\s*[-–—|•]\s*(?:Full[- ]Time|Part[- ]Time|Hybrid|Remote).*$/i, '').trim();
          break;
        }
      }
    }

    // 3. Pattern: LinkedIn detail line e.g. "Pasig, National Capital Region, Philippines · Reposted 5 days ago · Over 100 people clicked apply"
    if (!position || !companyName) {
      const linkedInMetaIdx = lines.findIndex((l) =>
        /[·•|]\s*(?:reposted|posted|\d+\s+days?\s+ago|\d+\s+weeks?\s+ago|\d+\s+months?\s+ago|over\s+\d+|clicked apply|applicants)/i.test(
          l
        )
      );

      if (linkedInMetaIdx > 0) {
        // Find non-noise line above metadata line -> Position Title
        let foundRoleIdx = -1;
        for (let i = linkedInMetaIdx - 1; i >= 0; i--) {
          const cand = lines[i];
          if (!isNoiseLine(cand) && !cand.toLowerCase().endsWith('logo') && !isLocationLine(cand)) {
            foundRoleIdx = i;
            position = cand.replace(/\s*[-–—|•]\s*(?:Full[- ]Time|Part[- ]Time|Hybrid|Remote|Contract).*$/i, '').trim();
            break;
          }
        }

        // Find non-noise line above Position -> Company Name
        if (foundRoleIdx > 0 && !companyName) {
          for (let i = foundRoleIdx - 1; i >= 0; i--) {
            const cand = lines[i];
            if (!isNoiseLine(cand) && !cand.toLowerCase().endsWith('logo') && !isLocationLine(cand)) {
              companyName = cand.replace(/[\d,]+\+?\s+followers/i, '').trim();
              break;
            }
          }
        }
      }
    }

    // 4. Pattern: LinkedIn separator "Company · Location (Setup)"
    if (!companyName) {
      const dotLineIdx = lines.slice(0, 15).findIndex((l) => /^[^\n·•|]{2,60}\s+[·•|]\s+[^\n]{2,80}$/.test(l));
      if (dotLineIdx >= 0) {
        const parts = lines[dotLineIdx].split(/\s+[·•|]\s+/);
        // Only treat parts[0] as company if it is NOT a location and NOT a noise line
        if (parts[0] && !isNoiseLine(parts[0]) && !isLocationLine(parts[0])) {
          companyName = parts[0].trim();
        }

        // Look for position above dotLine
        if (!position) {
          for (let i = dotLineIdx - 1; i >= 0; i--) {
            const cand = lines[i];
            if (!isNoiseLine(cand) && !cand.toLowerCase().endsWith('logo') && cand.length < 90) {
              position = cand.replace(/\s*[-–—|•]\s*(?:Full[- ]Time|Part[- ]Time|Hybrid|Remote).*$/i, '').trim();
              break;
            }
          }
        }
      }
    }

    // 5. Pattern: Rating pattern e.g. "4.1 ★" right after company / location (Indeed / Glassdoor)
    if (!companyName) {
      const ratingIdx = lines.findIndex((l) => /^\d\.\d\s*★?/.test(l));
      if (ratingIdx > 0) {
        let compCandidate = lines[ratingIdx - 1];
        if (isLocationLine(compCandidate) && ratingIdx > 1) {
          compCandidate = lines[ratingIdx - 2];
        }
        if (!isNoiseLine(compCandidate) && compCandidate.length < 80) {
          companyName = compCandidate.replace(/\s*[-–—|•]\s*.*$/, '').trim();
        }
      }
    }

    // 6. Pattern: ATS and general clean candidates
    const cleanCandidates = lines.filter((l) => !isNoiseLine(l) && !l.toLowerCase().endsWith('logo'));

    if (!position) {
      const roleMatch = cleanCandidates.find(
        (l) =>
          ROLE_KEYWORDS.test(l) &&
          !isLocationLine(l) &&
          l.length < 90 &&
          !/^(?:we are|you will|a leading|our client|looking for)\b/i.test(l)
      );
      if (roleMatch) {
        position = roleMatch.replace(/\s*[-–—|•]\s*(?:Full[- ]Time|Part[- ]Time|Hybrid|Remote).*$/i, '').trim();
      } else if (cleanCandidates.length > 0 && cleanCandidates[0].length < 90) {
        position = cleanCandidates[0].replace(/\s*[-–—|•]\s*(?:Full[- ]Time|Part[- ]Time|Hybrid|Remote).*$/i, '').trim();
      }
    }

    if (!companyName) {
      const bizMatch = lines.join('\n').match(/Business or Contact Name:\s*([^\n]+)/i);
      if (bizMatch && !/not given/i.test(bizMatch[1].trim()) && bizMatch[1].trim().length < 80) {
        companyName = bizMatch[1].trim();
      } else if (companyHint) {
        companyName = companyHint;
      } else if (logoCompanyHint) {
        companyName = logoCompanyHint;
      } else {
        const compCandidate = cleanCandidates.find(
          (l) => l !== position && !isLocationLine(l) && !/[₱$€£]/.test(l) && l.length < 70
        );
        if (compCandidate) {
          companyName = compCandidate.split(/\s+[·•|-]\s+/)[0].replace(/^\d\.\d\s*★?\s*/, '').trim();
        }
      }
    }

    // Fallback company from hint or logo hint if needed
    if ((!companyName || companyName === position) && (companyHint || logoCompanyHint)) {
      companyName = companyHint || logoCompanyHint;
    }

    if (position) {
      position = position.replace(/\s*[-–—|•]\s*(?:Full[- ]Time|Part[- ]Time|Hybrid|Remote|Contract).*$/i, '').trim();
    }
    if (companyName) {
      companyName = companyName
        .replace(/\s+logo$/i, '')
        .replace(/[\d,]+\+?\s+followers/i, '')
        .trim();
    }

    return { position, companyName };
  }

  /**
   * Extract clean job description from lines, removing navigation headers,
   * platform widgets, and footer boilerplates (like employer questions & copyright).
   */
  private extractCleanDescription(rawLines: string[], position?: string, companyName?: string): string {
    const trimmedLines = rawLines.map((l) => l.trim());

    const DESCRIPTION_START_REGEX =
      /^(duties\s+(?:and|&)\s+responsibilities|responsibilities\s*(?:and|&)?\s*(?:duties)?|key\s+responsibilities|job\s+description|full\s+job\s+description|job\s+details|job\s+summary|job\s+overview|role\s+overview|about\s+the\s+role|about\s+the\s+job|about\s+the\s+position|about\s+the\s+opportunity|the\s+opportunity|the\s+role|what\s+you(?:'ll|\swill)\s+do|what\s+you(?:'ll|\swill)\s+be\s+doing|what\s+you(?:'ll|\swill)\s+work\s+on|what\s+we(?:'re|\sare)\s+looking\s+for|who\s+you\s+are|requirements|qualifications|position\s+overview|scope\s+of\s+work|role\s+description|your\s+impact|our\s+mission|overview\b|summary\b)/i;

    const DESCRIPTION_END_REGEX =
      /^(employer\s+questions|your\s+application\s+will\s+include|report\s+this\s+job|report\s+this\s+advert|report\s+this\s+listing|report\s+job|be\s+careful|don['’]t\s+provide\s+your\s+bank|never\s+provide\s+your\s+bank|learn\s+how\s+to\s+protect\s+yourself|salary\s+teaser|what\s+can\s+i\s+earn\s+as|see\s+more\s+detailed\s+salary|job\s+seekers|explore\s+careers|explore\s+salaries|download\s+apps|register\s+for\s+free|post\s+a\s+job\s+ad|recruitment\s+software|similar\s+jobs|people\s+also\s+viewed|recommended\s+jobs|recommended\s+opportunities|related\s+jobs|terms\s+(?:and|&)\s+conditions|terms\s+of\s+service|copyright\s+©|all\s+rights\s+reserved|privacy\s+policy|hiring\s+lab|indeed\s+events|work\s+at\s+indeed|esg\s+at\s+indeed|©\s+\d+\s+indeed|about\s+the\s+company|sign\s+in\s+to\s+create\s+job\s+alert|explore\s+collaborative\s+articles|linkedin\s+corporation|submit\s+your\s+application|submit\s+application|resume\/cv|attach\s+resume|powered\s+by\s+(?:greenhouse|lever|ashby|workable|smartrecruiters)|set\s+alert\s+for\s+similar\s+jobs|job\s+search\s+faster\s+with\s+premium|access\s+company\s+insights|more\s+jobs\b|looking\s+for\s+talent\??|post\s+a\s+job\b|interested\s+in\s+working\s+with\s+us|commitments\b|career\s+growth\s+and\s+learning|skill\s+requirement|about\s+the\s+employer|business\s+or\s+contact\s+name|member\s+since:|total\s+job\s+posts:|share\s+this\s+post|view\s+other\s+job\s+posts\s+from)/i;

    let startIndex = -1;

    // 1. Try to find explicit description heading
    for (let i = 0; i < trimmedLines.length; i++) {
      const line = trimmedLines[i];
      if (DESCRIPTION_START_REGEX.test(line)) {
        startIndex = i;
        break;
      }
    }

    // 2. If no explicit heading found, find end of header metadata block
    if (startIndex === -1) {
      let metaIndex = 0;
      for (let i = 0; i < trimmedLines.length && i < 25; i++) {
        const line = trimmedLines[i];
        if (!line) continue;

        if (
          /^(skip to|back to|jobstreet|indeed|linkedin|glassdoor|kalibrr|bossjob|workable|greenhouse|lever|ashby|job search|people search|career advice|companies|employer site)/i.test(
            line
          ) ||
          /^(strong applicant|be an early applicant|high application volume|actively recruiting|featured|promoted|easy apply|apply now|save|share)/i.test(
            line
          ) ||
          /^(posted\s+\d+|how you match|\d+\s+skills|\+\d+\s+more|view all jobs|\d+\s+applicants)/i.test(line) ||
          line.toLowerCase().endsWith('logo') ||
          (position && line.toLowerCase() === position.toLowerCase()) ||
          (companyName && line.toLowerCase() === companyName.toLowerCase()) ||
          /^(full[- ]time|part[- ]time|salary undisclosed)/i.test(line) ||
          /^(makati|taguig|manila|cebu|quezon|pasig|hybrid|remote|onsite)/i.test(line)
        ) {
          metaIndex = i + 1;
        } else if (line.length > 40 || /^[1-9]\.|\bwe are\b|\byou will\b|\bresponsible for\b/i.test(line)) {
          break;
        }
      }
      startIndex = metaIndex;
    }

    // 3. Find where the description ends (footer / boilerplate boundary)
    let endIndex = trimmedLines.length;
    for (let i = startIndex; i < trimmedLines.length; i++) {
      const line = trimmedLines[i];
      if (DESCRIPTION_END_REGEX.test(line)) {
        endIndex = i;
        break;
      }
      if (/^about us$/i.test(line) && i > startIndex + 15 && i > trimmedLines.length - 35) {
        endIndex = i;
        break;
      }
    }

    if (startIndex >= endIndex || startIndex >= trimmedLines.length) {
      return '';
    }

    const descLines = trimmedLines.slice(startIndex, endIndex);

    const cleaned = descLines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleaned.slice(0, 15000);
  }


  /**
   * Universal salary extraction handling ranges, single amounts, and currency inference.
   */
  public extractSalaryDetails(
    text: string,
    source?: string
  ): { salaryMin?: number; salaryMax?: number; currency: string } | null {
    // 1. Range match: e.g. PHP 95,000 - PHP 140,000 or $2,000 - $3,000 / month or 80k - 100k
    const salaryRangeRegex =
      /(?:(PHP|₱|\$|USD|EUR|€|£|GBP|SGD|S\$|AUD|A\$|CAD)\s*)?([0-9]{1,3}(?:,[0-9]{3})*|\d+k)\s*(?:-|to|–|—)\s*(?:(PHP|₱|\$|USD|EUR|€|£|GBP|SGD|S\$|AUD|A\$|CAD)\s*)?([0-9]{1,3}(?:,[0-9]{3})*|\d+k)(?:\s*(?:a|per|\/)\s*(week|wk|month|mo|year|yr|annum|day|hr|hour))?/i;

    const parseNum = (str: string): number => {
      const cleaned = str.replace(/,/g, '').toLowerCase();
      if (cleaned.endsWith('k')) return parseFloat(cleaned) * 1000;
      return parseFloat(cleaned);
    };

    const getCurrency = (rawCurr: string, fullContext: string): string => {
      const c = rawCurr.toUpperCase();
      if (c.includes('PHP') || c.includes('₱')) return 'PHP';
      if (c.includes('EUR') || c.includes('€')) return 'EUR';
      if (c.includes('GBP') || c.includes('£')) return 'GBP';
      if (c.includes('SGD') || c.includes('S$')) return 'SGD';
      if (c.includes('AUD') || c.includes('A$')) return 'AUD';
      if (c.includes('CAD')) return 'CAD';
      if (c.includes('USD') || c.includes('$')) return 'USD';
      if (/USD|\$/i.test(fullContext)) return 'USD';
      if (/PHP|₱/i.test(fullContext)) return 'PHP';
      return 'USD';
    };

    const rangeMatch = text.match(salaryRangeRegex);
    if (rangeMatch && rangeMatch[2] && rangeMatch[4]) {
      const rawCurr = rangeMatch[1] || rangeMatch[3] || '';
      const currency = getCurrency(rawCurr, rangeMatch[0]);
      return {
        salaryMin: parseNum(rangeMatch[2]),
        salaryMax: parseNum(rangeMatch[4]),
        currency,
      };
    }

    // 2. Single amount match: e.g. "$250/week", "USD $250 per week", "₱50,000 / month", "Wage / Salary: $250"
    const singleSalaryRegex =
      /(?:(?:(USD|PHP|AUD|SGD|GBP|EUR|CAD)\s*[\$₱€£]?|([\$₱€£])|(?:wage|salary|pay|compensation)[:\s]*)\s*)([0-9]{1,3}(?:,[0-9]{3})*|\d+k)(?:\s*(USD|PHP|AUD|SGD|GBP|EUR|CAD))?(?:\s*(?:a|per|\/)\s*(week|wk|month|mo|year|yr|annum|day|hr|hour))?/i;

    const wageLabelMatch = text.match(/WAGE\s*\/\s*SALARY\s*\n+([^\n]+)/i);
    const targetSingleText = wageLabelMatch ? wageLabelMatch[1] : text;
    const singleMatch = targetSingleText.match(singleSalaryRegex);

    if (singleMatch && singleMatch[3]) {
      const rawCurr = singleMatch[1] || singleMatch[2] || singleMatch[4] || '';
      const num = parseNum(singleMatch[3]);
      if (num > 0) {
        const currency = getCurrency(rawCurr, singleMatch[0]);
        return {
          salaryMin: num,
          salaryMax: num,
          currency,
        };
      }
    }

    // 3. Fallback currency when salary amount wasn't extracted
    let fallbackCurrency = 'USD';
    if (
      source === 'Jobstreet' ||
      source === 'Kalibrr' ||
      source === 'Bossjob' ||
      /Makati|Taguig|Manila|Cebu|Pasig|BGC/i.test(text)
    ) {
      fallbackCurrency = 'PHP';
    } else if (source === 'OnlineJobsPH') {
      fallbackCurrency = 'USD';
    }

    return {
      currency: fallbackCurrency,
    };
  }

  /**
   * Dedicated HTML parser for OnlineJobs.ph postings
   */
  public parseOnlineJobsHtml(html: string): Partial<ParsedJobMetadataDTO> | null {
    const result: Partial<ParsedJobMetadataDTO> = {
      source: 'OnlineJobsPH',
      extractedVia: 'heuristic',
    };

    // 1. Position Title: from <h1 class="... job__title"> or <title>
    const titleMatch = html.match(/<h1[^>]*class=["'][^"']*job__title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) {
      result.position = this.cleanText(titleMatch[1].replace(/<[^>]+>/g, ''));
    } else {
      const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleTagMatch) {
        let t = this.cleanText(titleTagMatch[1]);
        t = t.replace(/\s*[-–—|•]\s*OnlineJobs(?:\.ph)?.*$/i, '').trim();
        t = t.replace(/\s+\d{5,}\s*$/, '').trim();
        result.position = t;
      }
    }

    // 2. Company Name: from <h3 class="... job__logo">
    const logoMatch = html.match(/<h3[^>]*class=["'][^"']*job__logo[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i);
    if (logoMatch) {
      const rawLogo = logoMatch[1].replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '');
      const cleanLogo = this.cleanText(rawLogo);
      if (cleanLogo && cleanLogo.length < 80 && !this.isJobBoardOrPlatform(cleanLogo)) {
        result.companyName = cleanLogo;
      }
    }

    // Fallback company from "ABOUT THE EMPLOYER" -> "Business or Contact Name: ..."
    if (!result.companyName) {
      const bizMatch = html.match(/Business or Contact Name:\s*(?:<\/strong>)?\s*([^<\n]+)/i);
      if (bizMatch) {
        const biz = this.cleanText(bizMatch[1]);
        if (biz && !/not given/i.test(biz)) {
          result.companyName = biz;
        }
      }
    }

    // 3. Description: from <p id="job-description"> or class="job-description"
    const descMatch =
      html.match(/<p[^>]*id=["']job-description["'][^>]*>([\s\S]*?)<\/p>/i) ||
      html.match(/<(?:p|div)[^>]*class=["'][^"']*job-description[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div)>/i);
    if (descMatch) {
      result.description = this.cleanHtmlSnippet(descMatch[1]);
    }

    // 4. Employment Type: from "TYPE OF WORK"
    const typeMatch = html.match(/TYPE OF WORK[\s\S]*?<p[^>]*class=["'][^"']*fs-18[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    const typeText = typeMatch ? this.cleanText(typeMatch[1]).toLowerCase() : (result.description || '').toLowerCase();
    if (typeText.includes('full time') || typeText.includes('full-time')) {
      result.employmentType = 'FULL_TIME';
    } else if (typeText.includes('part time') || typeText.includes('part-time')) {
      result.employmentType = 'PART_TIME';
    } else if (typeText.includes('contract')) {
      result.employmentType = 'CONTRACT';
    } else if (typeText.includes('freelance')) {
      result.employmentType = 'FREELANCE';
    } else if (typeText.includes('internship')) {
      result.employmentType = 'INTERNSHIP';
    }

    // 5. Salary: from "WAGE / SALARY" block or description
    const wageMatch = html.match(/WAGE\s*\/\s*SALARY[\s\S]*?<p[^>]*class=["'][^"']*fs-18[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    const wageText = wageMatch ? this.cleanText(wageMatch[1]) : '';
    const salarySource = wageText ? `${wageText}\n${result.description || ''}` : (result.description || '');
    const sal = this.extractSalaryDetails(salarySource, 'OnlineJobsPH');
    if (sal) {
      result.salaryMin = sal.salaryMin;
      result.salaryMax = sal.salaryMax;
      result.currency = sal.currency;
    } else {
      result.currency = 'USD';
    }

    // 6. Work Setup & Location
    const contextText = `${result.description || ''} ${html}`;
    if (/\b(remote|work from home|wfh)\b/i.test(contextText)) {
      result.workSetup = 'REMOTE';
    } else if (/\bhybrid\b/i.test(contextText)) {
      result.workSetup = 'HYBRID';
    } else {
      result.workSetup = 'REMOTE';
    }

    if (/\bremote\s*\(([^)]+)\)/i.test(result.description || '')) {
      const locM = (result.description || '').match(/\bremote\s*\(([^)]+)\)/i);
      result.location = `Remote (${locM![1].trim()})`;
    } else if (/Philippines/i.test(contextText)) {
      result.location = 'Philippines';
    }

    return result;
  }

  /**
   * Extract metadata from HTML content using JSON-LD, OpenGraph, and heuristic regex.
   */
  public extractMetadataFromHtml(html: string, url: URL): Partial<ParsedJobMetadataDTO> {
    // 0. Dedicated OnlineJobs.ph HTML parser
    if (url.hostname.toLowerCase().includes('onlinejobs') || /class=["'][^"']*card-jobseeker/i.test(html)) {
      const ojResult = this.parseOnlineJobsHtml(html);
      if (ojResult && (ojResult.position || ojResult.companyName || ojResult.description)) {
        return ojResult;
      }
    }

    // 1. Try Schema.org JSON-LD first (highest fidelity)
    const jsonLdResult = this.parseJsonLd(html);
    if (jsonLdResult && (jsonLdResult.position || jsonLdResult.companyName)) {
      return {
        ...jsonLdResult,
        extractedVia: 'json-ld',
      };
    }

    // 2. Fall back to OpenGraph & standard meta tags
    const metaResult = this.parseMetaTags(html);
    if (metaResult && (metaResult.position || metaResult.companyName)) {
      return {
        ...metaResult,
        extractedVia: 'opengraph',
      };
    }

    // 3. Fall back to Title tag parsing
    const titleResult = this.parseTitleTag(html);
    return {
      ...titleResult,
      extractedVia: 'heuristic',
    };
  }

  /**
   * Parse Schema.org JobPosting from <script type="application/ld+json">
   */
  private parseJsonLd(html: string): Partial<ParsedJobMetadataDTO> | null {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const rawJson = match[1].trim();
        const data = JSON.parse(rawJson);

        const jobPosting = this.findJobPostingObject(data);
        if (jobPosting) {
          const result: Partial<ParsedJobMetadataDTO> = {};

          if (jobPosting.title && typeof jobPosting.title === 'string') {
            result.position = this.cleanText(jobPosting.title);
          }

          if (jobPosting.hiringOrganization) {
            if (typeof jobPosting.hiringOrganization === 'string') {
              result.companyName = this.cleanText(jobPosting.hiringOrganization);
            } else if (typeof jobPosting.hiringOrganization.name === 'string') {
              result.companyName = this.cleanText(jobPosting.hiringOrganization.name);
            }
          }

          // Location
          if (jobPosting.jobLocation) {
            result.location = this.formatJobLocation(jobPosting.jobLocation);
          }

          // Work setup
          if (
            jobPosting.jobLocationType === 'TELECOMMUTE' ||
            (typeof jobPosting.jobLocationType === 'string' && jobPosting.jobLocationType.toLowerCase().includes('telecommute'))
          ) {
            result.workSetup = 'REMOTE';
          } else if (result.location && result.location.toLowerCase().includes('remote')) {
            result.workSetup = 'REMOTE';
          } else if (result.location && result.location.toLowerCase().includes('hybrid')) {
            result.workSetup = 'HYBRID';
          }

          // Salary
          if (jobPosting.baseSalary) {
            const salary = this.parseBaseSalary(jobPosting.baseSalary);
            if (salary) {
              result.salaryMin = salary.salaryMin;
              result.salaryMax = salary.salaryMax;
              result.currency = salary.currency;
            }
          }

          // Description
          if (jobPosting.description && typeof jobPosting.description === 'string') {
            result.description = this.cleanHtmlSnippet(jobPosting.description);
          }

          return result;
        }
      } catch {
        // Skip malformed JSON script block
        continue;
      }
    }

    return null;
  }

  private findJobPostingObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return null;

    if (obj['@type'] === 'JobPosting' || (Array.isArray(obj['@type']) && obj['@type'].includes('JobPosting'))) {
      return obj;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = this.findJobPostingObject(item);
        if (found) return found;
      }
    }

    if (Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        const found = this.findJobPostingObject(item);
        if (found) return found;
      }
    }

    return null;
  }

  private formatJobLocation(loc: any): string | undefined {
    if (typeof loc === 'string') return this.cleanText(loc);
    if (Array.isArray(loc) && loc.length > 0) return this.formatJobLocation(loc[0]);
    if (loc && typeof loc === 'object' && loc.address) {
      const addr = loc.address;
      if (typeof addr === 'string') return this.cleanText(addr);
      const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
      return parts.join(', ');
    }
    return undefined;
  }

  private parseBaseSalary(salary: any): { salaryMin?: number; salaryMax?: number; currency?: string } | null {
    if (!salary) return null;
    const currency = salary.currency || 'USD';
    const val = salary.value;

    if (typeof val === 'number') {
      return { salaryMin: val, salaryMax: val, currency };
    }

    if (val && typeof val === 'object') {
      const min = typeof val.minValue === 'number' ? val.minValue : undefined;
      const max = typeof val.maxValue === 'number' ? val.maxValue : undefined;
      const single = typeof val.value === 'number' ? val.value : undefined;
      return {
        salaryMin: min ?? single,
        salaryMax: max ?? single,
        currency,
      };
    }

    return null;
  }

  /**
   * Helper to check if a string is a job board or ATS platform name rather than a hiring company.
   */
  public isJobBoardOrPlatform(name: string): boolean {
    const n = name.toLowerCase().replace(/^@/, '').trim();
    return /^(?:ph\.)?(?:onlinejobs(?:\.ph)?|onlinejobsph|linkedin(?:\s+jobs)?|jobstreet|indeed(?:\.com)?|glassdoor|kalibrr|bossjob|foundit|monster|greenhouse|lever|ashby|workable|smartrecruiters|ziprecruiter|remotive|wellfound|angel|ycombinator)(?:\.com)?$/i.test(
      n
    );
  }

  /**
   * Parse OpenGraph and Twitter meta tags.
   */
  private parseMetaTags(html: string): Partial<ParsedJobMetadataDTO> | null {
    const metaMap: Record<string, string> = {};
    const metaRegex = /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = metaRegex.exec(html)) !== null) {
      const prop = match[1].toLowerCase();
      metaMap[prop] = match[2];
    }

    const ogTitle = metaMap['og:title'] || metaMap['twitter:title'];
    const ogSiteName = metaMap['og:site_name'] || metaMap['twitter:site'];
    const ogDescription = metaMap['og:description'] || metaMap['twitter:description'] || metaMap['description'];

    if (!ogTitle && !ogSiteName) return null;

    const result: Partial<ParsedJobMetadataDTO> = {};

    if (ogSiteName) {
      const cleanSite = this.cleanText(ogSiteName);
      if (this.isJobBoardOrPlatform(cleanSite)) {
        result.source = cleanSite.replace(/^@/, '');
      } else {
        result.companyName = cleanSite;
      }
    }

    if (ogTitle) {
      const parsedTitle = this.splitTitleRoleAndCompany(ogTitle);
      if (parsedTitle.role) {
        result.position = parsedTitle.role;
      }
      if (parsedTitle.company && (!result.companyName || this.isJobBoardOrPlatform(result.companyName))) {
        result.companyName = parsedTitle.company;
      }
      if (parsedTitle.location && !result.location) {
        result.location = parsedTitle.location;
      }
    }

    if (ogDescription) {
      result.description = this.cleanText(ogDescription).slice(0, 1000);
      if (/\bremote\b/i.test(ogDescription)) result.workSetup = 'REMOTE';
      else if (/\bhybrid\b/i.test(ogDescription)) result.workSetup = 'HYBRID';
    }

    return result;
  }

  /**
   * Parse <title> tag.
   */
  private parseTitleTag(html: string): Partial<ParsedJobMetadataDTO> {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!titleMatch) return {};

    const rawTitle = titleMatch[1];
    const parsed = this.splitTitleRoleAndCompany(rawTitle);

    return {
      position: parsed.role,
      companyName: parsed.company,
      location: parsed.location,
    };
  }

  private splitTitleRoleAndCompany(title: string): { role?: string; company?: string; location?: string } {
    let cleaned = this.cleanText(title);

    // Strip trailing platform suffixes e.g. " | LinkedIn Jobs", " - Indeed.com", " | Glassdoor", etc.
    cleaned = cleaned
      .replace(
        /\s*[-–—|•]\s*(?:OnlineJobs(?:\.ph)?|LinkedIn(?:\s+Jobs)?|Indeed(?:\.com)?|Jobstreet|Glassdoor|ZipRecruiter|Greenhouse|Lever|Ashby|Workable).*$/i,
        ''
      )
      .trim();

    // Strip trailing job IDs if present (e.g. "Senior Specialist 1746806" -> "Senior Specialist")
    cleaned = cleaned.replace(/\s+\d{5,}\s*$/, '').trim();

    const ROLE_KEYWORDS =
      /\b(engineer|developer|designer|architect|programmer|manager|lead|director|analyst|specialist|consultant|officer|administrator|coordinator|technician|associate|scientist|intern|executive|qa|tester|devops|sre|scrum master|product owner)\b/i;

    // 1. Format: "{Company} hiring {Role} in {Location}" (common LinkedIn og:title)
    // e.g. "White Cloak Technologies, Inc. hiring ReactJS Software Engineer in Pasig, National Capital Region, Philippines"
    const hiringMatch = cleaned.match(/^(.+?)\s+(?:is\s+)?hiring(?:\s+(?:a|an)\s+)?(.+?)(?:\s+in\s+([^\n|–—]+))?$/i);
    if (hiringMatch) {
      const candComp = hiringMatch[1].trim();
      const candRole = hiringMatch[2].trim();
      const candLoc = hiringMatch[3] ? hiringMatch[3].trim() : undefined;

      if (ROLE_KEYWORDS.test(candRole) || !ROLE_KEYWORDS.test(candComp)) {
        return {
          company: candComp,
          role: candRole,
          location: candLoc,
        };
      }
    }

    // 2. Format: "{Role} at {Company} — {Location}" or "{Role} @ {Company}"
    // e.g. "ReactJS Software Engineer at White Cloak Technologies, Inc. — Pasig, National Capital Region, Philippines"
    const atMatch = cleaned.match(/^(.+?)\s+(?:at|@)\s+([^–—-—|]+?)(?:\s*(?:[-–—|•]|(?:\s+in\s+))\s*(.+))?$/i);
    if (atMatch) {
      const candRole = atMatch[1].trim();
      const candComp = atMatch[2].trim();
      const candLoc = atMatch[3] ? atMatch[3].trim() : undefined;

      return {
        role: candRole,
        company: candComp,
        location: candLoc,
      };
    }

    // 3. Format: "{Company} - {Role}" or "{Role} - {Company}"
    const parts = cleaned.split(/\s+[-–—|•]\s+/);
    if (parts.length >= 2) {
      const p0 = parts[0].trim();
      const p1 = parts[1].trim();
      const p2 = parts[2]?.trim();

      if (ROLE_KEYWORDS.test(p1) && !ROLE_KEYWORDS.test(p0)) {
        return {
          company: p0,
          role: p1,
          location: p2,
        };
      } else if (ROLE_KEYWORDS.test(p0) && !ROLE_KEYWORDS.test(p1)) {
        return {
          role: p0,
          company: p1,
          location: p2,
        };
      }
    }

    return { role: cleaned };
  }

  private cleanText(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanHtmlSnippet(htmlText: string): string {
    return htmlText
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 15000);
  }
}

export const jobParserService = new JobParserService();
