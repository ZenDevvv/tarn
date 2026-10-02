import { ParsedJobMetadataDTO, WorkSetup } from '@tracker/types';
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
  public parseJobText(text: string, sourceUrl?: string): ParsedJobMetadataDTO {
    const trimmed = text.trim();
    const lines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let position = '';
    let companyName = '';
    let location = '';
    let workSetup: WorkSetup = 'ONSITE';
    let salaryMin: number | undefined;
    let salaryMax: number | undefined;
    let currency = 'USD';

    // 1. Work setup detection
    if (/\b(remote|work from home|wfh|anywhere)\b/i.test(trimmed)) {
      workSetup = 'REMOTE';
    } else if (/\bhybrid\b/i.test(trimmed)) {
      workSetup = 'HYBRID';
    }

    // 2. Salary extraction: handles PHP, ₱, $, USD, EUR, GBP, monthly and yearly
    const salaryRegex =
      /(?:(PHP|₱|\$|USD|EUR|€|£|GBP)\s*)?([0-9]{1,3}(?:,[0-9]{3})*|\d+k)\s*(?:-|to|–|—)\s*(?:(PHP|₱|\$|USD|EUR|€|£|GBP)\s*)?([0-9]{1,3}(?:,[0-9]{3})*|\d+k)(?:\s*(?:a|per|\/)\s*(month|mo|year|yr|annum))?/i;
    const salaryMatch = trimmed.match(salaryRegex);

    if (salaryMatch) {
      const rawCurr = (salaryMatch[1] || salaryMatch[3] || '').toUpperCase();
      if (rawCurr.includes('PHP') || rawCurr.includes('₱') || /PHP|₱/i.test(trimmed)) {
        currency = 'PHP';
      } else if (rawCurr.includes('EUR') || rawCurr.includes('€')) {
        currency = 'EUR';
      } else if (rawCurr.includes('GBP') || rawCurr.includes('£')) {
        currency = 'GBP';
      } else {
        currency = 'USD';
      }

      const parseNum = (str: string): number => {
        const cleaned = str.replace(/,/g, '').toLowerCase();
        if (cleaned.endsWith('k')) return parseFloat(cleaned) * 1000;
        return parseFloat(cleaned);
      };

      salaryMin = parseNum(salaryMatch[2]);
      salaryMax = parseNum(salaryMatch[4]);
    }

    // 3. Location detection (PH & Global cities)
    const locMatch = trimmed.match(
      /\b(Taguig|BGC|Makati|Quezon City|Manila|Cebu|Pasig|Mandaluyong|Pasay|Ortigas|Alabang|Clark|Davao|Iloilo|Angeles|Baguio|Cavite|Laguna|Philippines|San Francisco|New York|London|Singapore|Sydney|Toronto|Tokyo|Berlin|Paris|Amsterdam|Dublin|Austin|Seattle)\b(?:[^\n,]*)/i
    );
    if (locMatch) {
      location = locMatch[0].trim();
    }

    // 4. Role & Company line heuristics
    if (lines.length > 0) {
      let roleIdx = 0;
      while (
        roleIdx < lines.length &&
        /^(jobstreet|indeed|linkedin|apply|quick apply|save job|posted|view job|overview)/i.test(lines[roleIdx])
      ) {
        roleIdx++;
      }

      if (roleIdx < lines.length) {
        position = lines[roleIdx].replace(/\s*[-–—|•]\s*(?:Full[- ]Time|Part[- ]Time|Hybrid|Remote).*$/i, '').trim();
      }

      const compIdx = roleIdx + 1;
      if (compIdx < lines.length) {
        const line = lines[compIdx];
        if (!/[₱$€£]/.test(line) && !/^\d\.\d\s*★?/.test(line) && line.length < 80) {
          companyName = line.replace(/^\d\.\d\s*★?\s*/, '').trim();
        }
      }
    }

    // 5. Source detection from sourceUrl if provided, or from text
    let source = 'Other';
    if (sourceUrl) {
      try {
        const parsed = new URL(sourceUrl);
        source = this.extractSourcePlatform(parsed);
      } catch {
        // fallback
      }
    } else {
      if (/jobstreet/i.test(trimmed)) source = 'Jobstreet';
      else if (/linkedin/i.test(trimmed)) source = 'LinkedIn';
      else if (/indeed/i.test(trimmed)) source = 'Indeed';
      else if (/glassdoor/i.test(trimmed)) source = 'Glassdoor';
    }

    return {
      url: sourceUrl || undefined,
      companyName: companyName || undefined,
      position: position || undefined,
      source,
      location: location || undefined,
      workSetup,
      salaryMin,
      salaryMax,
      currency,
      description: trimmed.slice(0, 2500),
      extractedVia: 'text_snippet',
    };
  }


  /**
   * Extract metadata from HTML content using JSON-LD, OpenGraph, and heuristic regex.
   */
  public extractMetadataFromHtml(html: string, url: URL): Partial<ParsedJobMetadataDTO> {
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
      result.companyName = this.cleanText(ogSiteName);
    }

    if (ogTitle) {
      // Often formats like "Senior Frontend Engineer at Stripe" or "Stripe - Senior Frontend Engineer"
      const parsedTitle = this.splitTitleRoleAndCompany(ogTitle);
      result.position = parsedTitle.role || this.cleanText(ogTitle);
      if (!result.companyName && parsedTitle.company) {
        result.companyName = parsedTitle.company;
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
    };
  }

  private splitTitleRoleAndCompany(title: string): { role?: string; company?: string } {
    const cleaned = this.cleanText(title);

    // Matches: "Role at Company" or "Role @ Company"
    const atMatch = cleaned.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (atMatch) {
      return { role: atMatch[1].trim(), company: atMatch[2].trim() };
    }

    // Matches: "Company - Role" or "Company | Role" or "Role - Company"
    const dashMatch = cleaned.split(/\s+[-–—|•]\s+/);
    if (dashMatch.length === 2) {
      return { role: dashMatch[0].trim(), company: dashMatch[1].trim() };
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
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 2000);
  }
}

export const jobParserService = new JobParserService();
