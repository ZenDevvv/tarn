import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { jobParserService } from '../src/modules/applications/job-parser.service';
import { BadRequestError } from '../src/middleware/error-handler';


describe('JobParserService', () => {
  describe('validateUrlSafety (SSRF Guard)', () => {
    it('allows valid external HTTP/HTTPS URLs', () => {
      const parsed = jobParserService.validateUrlSafety('https://boards.greenhouse.io/stripe/jobs/123');
      expect(parsed.hostname).toBe('boards.greenhouse.io');
    });

    it('rejects loopback and localhost addresses', () => {
      expect(() => jobParserService.validateUrlSafety('http://localhost:4000/api')).toThrow(BadRequestError);
      expect(() => jobParserService.validateUrlSafety('http://127.0.0.1:8080')).toThrow(BadRequestError);
      expect(() => jobParserService.validateUrlSafety('http://127.0.0.2')).toThrow(BadRequestError);
    });

    it('rejects private IPv4 networks (RFC 1918)', () => {
      expect(() => jobParserService.validateUrlSafety('http://10.0.0.1/admin')).toThrow(BadRequestError);
      expect(() => jobParserService.validateUrlSafety('http://192.168.1.1/secret')).toThrow(BadRequestError);
      expect(() => jobParserService.validateUrlSafety('http://172.16.0.5/api')).toThrow(BadRequestError);
      expect(() => jobParserService.validateUrlSafety('http://172.31.255.255')).toThrow(BadRequestError);
    });

    it('rejects link-local and cloud metadata addresses (169.254.169.254)', () => {
      expect(() => jobParserService.validateUrlSafety('http://169.254.169.254/latest/meta-data')).toThrow(BadRequestError);
    });

    it('rejects non-HTTP protocols', () => {
      expect(() => jobParserService.validateUrlSafety('ftp://example.com/file')).toThrow(BadRequestError);
      expect(() => jobParserService.validateUrlSafety('file:///etc/passwd')).toThrow(BadRequestError);
    });
  });

  describe('URL & Platform Heuristics', () => {
    it('detects Greenhouse and company slug', () => {
      const url = new URL('https://boards.greenhouse.io/figma/jobs/45678');
      expect(jobParserService.extractSourcePlatform(url)).toBe('Greenhouse');
      expect(jobParserService.extractCompanyFromUrlSlug(url)).toBe('Figma');
    });

    it('detects Lever and company slug with hyphen', () => {
      const url = new URL('https://jobs.lever.co/acme-corp/9876');
      expect(jobParserService.extractSourcePlatform(url)).toBe('Lever');
      expect(jobParserService.extractCompanyFromUrlSlug(url)).toBe('Acme Corp');
    });

    it('detects Ashby and company slug', () => {
      const url = new URL('https://jobs.ashbyhq.com/linear/111');
      expect(jobParserService.extractSourcePlatform(url)).toBe('Ashby');
      expect(jobParserService.extractCompanyFromUrlSlug(url)).toBe('Linear');
    });

    it('detects LinkedIn platform', () => {
      const url = new URL('https://www.linkedin.com/jobs/view/123456789');
      expect(jobParserService.extractSourcePlatform(url)).toBe('LinkedIn');
    });
  });

  describe('HTML Metadata Extraction', () => {
    it('extracts high-fidelity Schema.org JobPosting JSON-LD', () => {
      const sampleHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": "Staff Frontend Engineer",
            "description": "<p>We are seeking a <strong>Staff Engineer</strong> to lead our web app team.</p>",
            "hiringOrganization": {
              "@type": "Organization",
              "name": "Stripe"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "addressLocality": "San Francisco",
                "addressRegion": "CA",
                "addressCountry": "US"
              }
            },
            "jobLocationType": "TELECOMMUTE",
            "baseSalary": {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": {
                "@type": "QuantitativeValue",
                "minValue": 190000,
                "maxValue": 240000,
                "unitText": "YEAR"
              }
            }
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const parsed = jobParserService.extractMetadataFromHtml(sampleHtml, new URL('https://stripe.com/jobs/123'));
      expect(parsed.extractedVia).toBe('json-ld');
      expect(parsed.position).toBe('Staff Frontend Engineer');
      expect(parsed.companyName).toBe('Stripe');
      expect(parsed.location).toBe('San Francisco, CA, US');
      expect(parsed.workSetup).toBe('REMOTE');
      expect(parsed.salaryMin).toBe(190000);
      expect(parsed.salaryMax).toBe(240000);
      expect(parsed.currency).toBe('USD');
      expect(parsed.description).toContain('We are seeking a Staff Engineer');
    });

    it('falls back to OpenGraph meta tags when JSON-LD is absent', () => {
      const ogHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:site_name" content="Vercel" />
          <meta property="og:title" content="Senior Systems Engineer at Vercel" />
          <meta property="og:description" content="Join our remote-first edge infrastructure team building next-generation web platforms." />
        </head>
        <body></body>
        </html>
      `;

      const parsed = jobParserService.extractMetadataFromHtml(ogHtml, new URL('https://vercel.com/careers/456'));
      expect(parsed.extractedVia).toBe('opengraph');
      expect(parsed.position).toBe('Senior Systems Engineer');
      expect(parsed.companyName).toBe('Vercel');
      expect(parsed.workSetup).toBe('REMOTE');
      expect(parsed.description).toContain('Join our remote-first');
    });
  });

  describe('POST /api/v1/applications/parse-job-url Integration Test', () => {
    let authCookie: string[];

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `parser_user_${Date.now()}@example.com`,
          password: 'password123',
          name: 'Parser Tester',
        });
      authCookie = res.headers['set-cookie'];
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/applications/parse-job-url')
        .send({ url: 'https://boards.greenhouse.io/figma/jobs/123' });
      expect(res.status).toBe(401);
    });

    it('rejects SSRF loopback URLs with 400', async () => {
      const res = await request(app)
        .post('/api/v1/applications/parse-job-url')
        .set('Cookie', authCookie)
        .send({ url: 'http://127.0.0.1:4000/internal' });
      expect(res.status).toBe(400);
    });

    it('successfully extracts URL heuristics on valid external posting URL', async () => {
      const res = await request(app)
        .post('/api/v1/applications/parse-job-url')
        .set('Cookie', authCookie)
        .send({ url: 'https://boards.greenhouse.io/figma/jobs/999888' });

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBe('https://boards.greenhouse.io/figma/jobs/999888');
      expect(res.body.data.source).toBe('Greenhouse');
      expect(res.body.data.companyName).toBe('Figma');
    });

    it('identifies bot-protected sites (e.g. JobStreet 403)', async () => {
      const res = await request(app)
        .post('/api/v1/applications/parse-job-url')
        .set('Cookie', authCookie)
        .send({ url: 'https://ph.jobstreet.com/job/94515945' });

      expect(res.status).toBe(200);
      expect(res.body.data.source).toBe('Jobstreet');
      expect(res.body.data.isBotProtected).toBe(true);
      expect(res.body.data.extractedVia).toBe('bot_protected');
      expect(res.body.data.message).toContain('Cloudflare bot verification');
    });
  });

  describe('parseJobText Snippet Extraction', () => {
    it('parses role, company, PH location, PHP salary, and hybrid setup from text snippet', () => {
      const text = `
        Senior Full Stack Engineer
        Globe Telecom
        Taguig, National Capital Region, Philippines
        PHP 95,000 - PHP 140,000 a month
        Hybrid working environment with great benefits.
      `;

      const result = jobParserService.parseJobText(text, 'https://ph.jobstreet.com/job/94515945');
      expect(result.position).toBe('Senior Full Stack Engineer');
      expect(result.companyName).toBe('Globe Telecom');
      expect(result.location).toContain('Taguig');
      expect(result.workSetup).toBe('HYBRID');
      expect(result.salaryMin).toBe(95000);
      expect(result.salaryMax).toBe(140000);
      expect(result.currency).toBe('PHP');
      expect(result.source).toBe('Jobstreet');
      expect(result.extractedVia).toBe('text_snippet');
    });

    it('POST /api/v1/applications/parse-job-text integration endpoint works', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `text_parser_${Date.now()}@example.com`,
          password: 'password123',
          name: 'Text Parser Tester',
        });
      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/v1/applications/parse-job-text')
        .set('Cookie', cookie)
        .send({
          text: 'Frontend Developer\nAccenture\nMakati City\nPHP 60,000 - 90,000\nRemote setup',
          sourceUrl: 'https://ph.jobstreet.com/job/12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.position).toBe('Frontend Developer');
      expect(res.body.data.companyName).toBe('Accenture');
      expect(res.body.data.workSetup).toBe('REMOTE');
      expect(res.body.data.currency).toBe('PHP');
    });
  });
});


