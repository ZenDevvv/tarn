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

    it('successfully parses live LinkedIn job URL without setting company to @LinkedIn', async () => {
      const res = await request(app)
        .post('/api/v1/applications/parse-job-url')
        .set('Cookie', authCookie)
        .send({ url: 'https://www.linkedin.com/jobs/view/4463953153/' });

      expect(res.status).toBe(200);
      expect(res.body.data.source).toBe('LinkedIn');
      if (!res.body.data.isBotProtected) {
        expect(res.body.data.companyName).toBe('White Cloak Technologies, Inc.');
        expect(res.body.data.position).toBe('ReactJS Software Engineer');
        expect(res.body.data.companyName).not.toBe('@LinkedIn');
      }
    }, 15000);
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

    it('parses full page Ctrl+A text dump from Jobstreet without polluting fields with navigation or footer junk', () => {
      const fullPageText = `
Skip to content
Jobstreet
Job search
People search
Career advice
Companies
Employer site

SB Finance logo

Strong applicant
Full Stack Developer

SB Finance 
View all jobs
Makati City, Metro Manila (Hybrid)
Developers/Programmers (Information & Communication Technology)
Full time
Salary undisclosed

Posted 15d ago
High application volume

How you match
8 skills and credentials match your profile
 API
 MySQL
 REST APIs
 React.JS
+4 more
Duties and Responsibilities

1. Full Stack Application Development - Design, develop, and maintain end-to-end web and mobile applications. Build scalable backend services, APIs, and microservices using Java technologies. Develop responsive web front-end interfaces and mobile applications for Android and/or iOS platforms

2.Take a technical lead on the digital solution developments, ensuring that all work is prioritized, quality-assured, and delivered on time whilst ensuring liaison with both users internal and external to the teams.

3.Work closely with service areas and technology partners to deliver effective, integrated digital solutions. Act as a key contact with platform suppliers for any problems identified by solutions development areas.

4.Use development languages, tools, and eForms to create, review and update online content based on evidence from user research, user testing, feedback, and analytics.

5.Provide support to internal users with any operational and development issues.

6.Provide analytics on use of content, and digital customer portal to support transformation work.

7. Be a Subject Matter Expert on the fit and suitability of digital solutions for directorate operations throughout the company.

8. Implementing quality control systems, processes and schedule of improvements to the digital environment to ensure that all digital solutions are fit for purposes and meet the company’s on-line standards and guidelines.

9. Gather requirements, design, develop and deploy digital solutions.

10. Take responsibility for your own personal and professional development, ensuring that technical knowledge and skills are current and meet the demands of the post.

11. To carry out regular site maintenance including link-checking, accessibility checks, site reliability, archiving, and audience usage analysis.

12. To work within the context of legislative frameworks and carry out the responsibilities of the post with standard given.

13. Such other duties as may be reasonably required, commensurate with the nature and grade of the post.

14. Develop solutions using desired programming languages based on business requirements.

15 Learn new technology and be able to apply it. Developer needs to know and implement and program the following language – PHP, mySQL, Angular JS, Java, Spring Boot, Spring MVC, RESTful APIs, Microservices, React Native, ReactJS, JavaScript, CSS3



Qualifications

Experience:

1-4 years experience in Software Development.

1-4 years experience in Front-End Development.

1-4 years experience in Java Backend Development.

2+ years experience in Mobile Application Development.

Experience working in Waterfall and Agile/Scrum environments.



Technical Skills:

·        In-depth skills of; (at least two for each category)

Backend technologies - Java, Spring Boot, Spring MVC, Spring Security, Hibernate/JPA, RESTful APIs, Microservices Architecture, Maven/Gradle

Mobile Development – Flutter, React Native, Kotlin (Android), Swift (iOS)

Frontend Development – PHP, ReactJS, JavaScript, Angular, TypeScript, HTML5, CSS3

Database Technologies - MySQL, MongoDB, PostgreSQL, SQL Server

Cloud and DevOps – AWS, Azure, Docker, Kubernetes, Jenkins, Github Actions, CI/CD pipelines

Tools – Git, Bitbucket, Jira, Postman, SonarQube. Swagger/OpenAPI



Employer questions
Your application will include the following questions:
What's your expected monthly basic salary?
How many years' experience do you have as a full stack developer?
How many years of Mobile App Development experience do you have?
How many years' experience do you have as a Backend Java Developer?
How many years' experience do you have as a Front End React Developer?
Report this job advert
Be careful
Don’t provide your bank or credit card details when applying for jobs.
Learn how to protect yourself
salary teaser image
What can I earn as a Full Stack Developer
See more detailed salary information
salary teaser link arrow
Job seekers
Job search
Profile
People search
Saved searches
Saved jobs
Job applications
Career advice
Explore careers
Explore salaries
Companies
Download apps
Employers
Register for free
Post a job ad
Products & prices
Customer service
Hiring advice
Market insights
Recruitment software partners
About us
About us
Newsroom
Investors
Careers
International partners
Partner services
Contact
Help centre
Contact us
Product & tech blog
Social
Terms & conditions
Security
Privacy
Copyright © 2026, Jobstreet
`;

      const result = jobParserService.parseJobText(fullPageText, 'https://ph.jobstreet.com/job/78910');

      expect(result.position).toBe('Full Stack Developer');
      expect(result.companyName).toBe('SB Finance');
      expect(result.location).toBe('Makati City, Metro Manila');
      expect(result.workSetup).toBe('HYBRID');
      expect(result.source).toBe('Jobstreet');

      // Description checks:
      expect(result.description).toBeDefined();
      expect(result.description).toContain('Duties and Responsibilities');
      expect(result.description).toContain('Full Stack Application Development');
      expect(result.description).toContain('Technical Skills');
      expect(result.description).toContain('Tools – Git, Bitbucket, Jira, Postman, SonarQube');

      // Crucial: Must NOT contain header navigation or Jobstreet platform fluff
      expect(result.description).not.toContain('Skip to content');
      expect(result.description).not.toContain('Job search');
      expect(result.description).not.toContain('People search');
      expect(result.description).not.toContain('Career advice');
      expect(result.description).not.toContain('SB Finance logo');
      expect(result.description).not.toContain('Strong applicant');
      expect(result.description).not.toContain('View all jobs');
      expect(result.description).not.toContain('How you match');
      expect(result.description).not.toContain('8 skills and credentials match your profile');

      // Crucial: Must NOT contain footer boilerplate or employer questions
      expect(result.description).not.toContain('Employer questions');
      expect(result.description).not.toContain('Your application will include the following questions');
      expect(result.description).not.toContain('Report this job advert');
      expect(result.description).not.toContain('Be careful');
      expect(result.description).not.toContain('Don’t provide your bank or credit card details');
      expect(result.description).not.toContain('salary teaser');
      expect(result.description).not.toContain('Job seekers');
      expect(result.description).not.toContain('Copyright © 2026, Jobstreet');
    });

    it('parses full page text dump from LinkedIn without polluting description with navigation or footer links', () => {
      const linkedInDump = `
Skip to main content
LinkedIn
Jobs
People
Learning
Sign in
Join now

Senior Frontend Engineer
Canva · Manila, Metro Manila, Philippines (Hybrid)
Posted 3 days ago · 62 applicants · Full-time · Mid-Senior level
10,001+ employees · Software Development
Actively recruiting
Easy Apply
Save

About the job
Canva's mission is to empower everyone in the world to design anything.
We are looking for a Senior Frontend Engineer to lead Web Platform initiatives.

What you'll do:
- Architect high performance React & TypeScript web applications
- Collaborate with product designers and backend engineers
- Build delightful UI animations and design systems

What we are looking for:
- 5+ years experience with React, TypeScript, and modern state management
- Deep understanding of browser internals and Web Vitals

About the company
Canva is a free online visual communications platform.
Show more
Sign in to create job alert
Similar jobs
Full Stack Developer at Google
LinkedIn Corporation © 2026
About
Accessibility
Privacy Policy
`;

      const result = jobParserService.parseJobText(linkedInDump, 'https://www.linkedin.com/jobs/view/123456');

      expect(result.position).toBe('Senior Frontend Engineer');
      expect(result.companyName).toBe('Canva');
      expect(result.location).toBe('Manila, Metro Manila, Philippines');
      expect(result.workSetup).toBe('HYBRID');
      expect(result.source).toBe('LinkedIn');

      // Description contains core role text
      expect(result.description).toBeDefined();
      expect(result.description).toContain('About the job');
      expect(result.description).toContain("What you'll do");
      expect(result.description).toContain('What we are looking for');

      // Description strips LinkedIn nav and footer
      expect(result.description).not.toContain('Skip to main content');
      expect(result.description).not.toContain('Easy Apply');
      expect(result.description).not.toContain('62 applicants');
      expect(result.description).not.toContain('About the company');
      expect(result.description).not.toContain('Show more');
      expect(result.description).not.toContain('Sign in to create job alert');
      expect(result.description).not.toContain('Similar jobs');
      expect(result.description).not.toContain('LinkedIn Corporation');
    });

    it('parses full page text dump from Indeed with ratings, PHP salary, and stripped footer', () => {
      const indeedDump = `
Indeed Home
Find jobs
Company reviews
Find salaries
Sign in
Employers / Post Job

Start of main content
Staff Cloud Architect
Accenture
Taguig, National Capital Region
4.1 ★
3,400 reviews
Full-time
PHP 150,000 - PHP 220,000 a month
Apply now
Save job

Job details
Here's how the job details align with your profile.

Full job description
Accenture is hiring a Staff Cloud Architect to lead AWS/GCP enterprise migrations.

Responsibilities:
- Design multi-region cloud landing zones on AWS and Azure
- Ensure SOC2 compliance across distributed microservices
- Mentor senior DevOps engineers and drive CI/CD best practices

Requirements:
- 8+ years experience in Cloud and Infrastructure architecture
- Hands-on expertise with Terraform, Kubernetes, and Docker

Hiring Lab
Career Advice
Browse Jobs
Browse Companies
Salaries
Indeed Events
Work at Indeed
© 2026 Indeed
Report job
`;

      const result = jobParserService.parseJobText(indeedDump, 'https://ph.indeed.com/viewjob?jk=abcdef');

      expect(result.position).toBe('Staff Cloud Architect');
      expect(result.companyName).toBe('Accenture');
      expect(result.location).toBe('Taguig, National Capital Region');
      expect(result.salaryMin).toBe(150000);
      expect(result.salaryMax).toBe(220000);
      expect(result.currency).toBe('PHP');
      expect(result.source).toBe('Indeed');

      // Description contains core role text
      expect(result.description).toBeDefined();
      expect(result.description).toContain('Full job description');
      expect(result.description).toContain('Responsibilities:');
      expect(result.description).toContain('Requirements:');

      // Description strips Indeed nav, ratings, and footer
      expect(result.description).not.toContain('Indeed Home');
      expect(result.description).not.toContain('Find jobs');
      expect(result.description).not.toContain('4.1 ★');
      expect(result.description).not.toContain('3,400 reviews');
      expect(result.description).not.toContain('Hiring Lab');
      expect(result.description).not.toContain('Career Advice');
      expect(result.description).not.toContain('© 2026 Indeed');
      expect(result.description).not.toContain('Report job');
    });

    it('parses ATS text dump (Greenhouse/Lever) with clean application form cutoff', () => {
      const greenhouseDump = `
Back to open roles
Linear
Lead Product Designer
San Francisco, CA / Remote (US, Canada)
Apply for this job

The Opportunity
Linear helps software teams build better software. We are looking for a Lead Product Designer.

What you will work on:
- Own end-to-end design for core project management flows
- Refine our bespoke design system and micro-interactions
- Collaborate daily with engineers and founders

Qualifications:
- 6+ years designing SaaS products
- High craft in typography, spatial layouts, and motion

Submit your application
Resume/CV *
Attach Resume
Full Name *
Email *
Powered by Greenhouse
`;

      const result = jobParserService.parseJobText(greenhouseDump, 'https://boards.greenhouse.io/linear/jobs/999');

      expect(result.position).toBe('Lead Product Designer');
      expect(result.companyName).toBe('Linear');
      expect(result.location).toContain('San Francisco');
      expect(result.workSetup).toBe('REMOTE');
      expect(result.source).toBe('Greenhouse');

      // Description contains opportunity & qualifications
      expect(result.description).toBeDefined();
      expect(result.description).toContain('The Opportunity');
      expect(result.description).toContain('What you will work on');
      expect(result.description).toContain('Qualifications');

      // Description cuts off before the application form
      expect(result.description).not.toContain('Back to open roles');
      expect(result.description).not.toContain('Submit your application');
      expect(result.description).not.toContain('Resume/CV');
      expect(result.description).not.toContain('Powered by Greenhouse');
    });

    it('parses real LinkedIn HTML with twitter:site @LinkedIn and og:title without setting company to @LinkedIn', () => {
      const linkedInHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="twitter:site" content="@LinkedIn" />
          <meta property="og:title" content="ReactJS Software Engineer at White Cloak Technologies, Inc. — Pasig, National Capital Region, Philippines | LinkedIn Jobs" />
          <meta property="og:description" content="White Cloak Technologies, Inc. is hiring a ReactJS Software Engineer in Pasig. Hybrid setup." />
        </head>
        <body></body>
        </html>
      `;

      const parsed = jobParserService.extractMetadataFromHtml(linkedInHtml, new URL('https://www.linkedin.com/jobs/view/4463953153/'));
      expect(parsed.position).toBe('ReactJS Software Engineer');
      expect(parsed.companyName).toBe('White Cloak Technologies, Inc.');
      expect(parsed.companyName).not.toBe('@LinkedIn');
      expect(parsed.location).toBe('Pasig, National Capital Region, Philippines');
      expect(parsed.source).toBe('LinkedIn');
      expect(parsed.workSetup).toBe('HYBRID');
    });

    it('parses alternative LinkedIn og:title format "{Company} hiring {Role} in {Location}"', () => {
      const linkedInHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="twitter:site" content="@LinkedIn" />
          <meta property="og:title" content="White Cloak Technologies, Inc. hiring ReactJS Software Engineer in Pasig, National Capital Region, Philippines | LinkedIn" />
        </head>
        <body></body>
        </html>
      `;

      const parsed = jobParserService.extractMetadataFromHtml(linkedInHtml, new URL('https://www.linkedin.com/jobs/view/4463953153/'));
      expect(parsed.position).toBe('ReactJS Software Engineer');
      expect(parsed.companyName).toBe('White Cloak Technologies, Inc.');
      expect(parsed.companyName).not.toBe('@LinkedIn');
      expect(parsed.location).toBe('Pasig, National Capital Region, Philippines');
      expect(parsed.source).toBe('LinkedIn');
    });

    it('parses user pasted Ctrl+A text snippet from LinkedIn with markdown links and notification noise', () => {
      const userSnippet = `
0 notifications
Home
[Network](https://www.linkedin.com/mynetwork)
[Jobs](https://www.linkedin.com/jobs/)
[Messaging](https://www.linkedin.com/messaging/)
[25Notifications](https://www.linkedin.com/notifications/)
Me
For Business
Try Premium for ₱0
[White Cloak Technologies, Inc.](https://www.linkedin.com/company/whitecloak/life/)
ReactJS Software Engineer
Pasig, National Capital Region, Philippines · Reposted 5 days ago · Over 100 people clicked apply
Promoted by hirer · Responses managed off LinkedIn
[Hybrid](https://www.linkedin.com/jobs/view/4463953153/)
[Contract](https://www.linkedin.com/jobs/view/4463953153/)
Apply
Save
Your profile and resume are missing some required qualifications
[Show match details](https://www.linkedin.com/preload/guideOverlay/)
BETA • Is this information helpful?
About the job
Front-End Developer role focused on building and enhancing the user interface of a transaction processing platform. You will develop new ReactJS screens and improve existing workflows for internal operations teams and external clients, including dashboard-heavy experiences, transaction status views, and role-based interfaces. Working closely with Java-based backend services and cross-functional teams (product, design, backend, and engineering), you will deliver intuitive, responsive, accessible, and consistent UI that accurately reflects transaction workflows and business requirements.

Responsibilities:
- Develop new front-end screens and features for the transaction processing platform using ReactJS.
- Build an upload and manual-processing interface for internal operations teams.
- Enhance client-facing dashboards, including transaction and workflow status views.

Required Qualifications:
- Bachelor’s degree in Computer Science, Information Technology, Software Engineering, or a related field.
- 3+ years of experience in front-end development.
- Strong hands-on experience with ReactJS and modern front-end development practices.

Set alert for similar jobs
Software Engineer, Pasig, National Capital Region, Philippines
Off
Job search faster with Premium
About the company
[White Cloak Technologies, Inc.18,500 followers](https://www.linkedin.com/company/whitecloak/life/)Follow
Software Development
•
201-500 employees
•
253 on LinkedIn
More jobs
Looking for talent?
Post a job
`;

      const result = jobParserService.parseJobText(userSnippet, 'https://www.linkedin.com/jobs/view/4463953153/');

      expect(result.position).toBe('ReactJS Software Engineer');
      expect(result.companyName).toBe('White Cloak Technologies, Inc.');
      expect(result.companyName).not.toContain('@LinkedIn');
      expect(result.location).toBe('Pasig, National Capital Region, Philippines');
      expect(result.workSetup).toBe('HYBRID');
      expect(result.employmentType).toBe('CONTRACT');
      expect(result.source).toBe('LinkedIn');

      // Description verification
      expect(result.description).toBeDefined();
      expect(result.description).toContain('About the job');
      expect(result.description).toContain('Front-End Developer role focused on building');
      expect(result.description).toContain('Develop new front-end screens and features');
      expect(result.description).toContain('Required Qualifications');

      // Crucial: Must NOT contain header navigation or noise
      expect(result.description).not.toContain('0 notifications');
      expect(result.description).not.toContain('Try Premium');
      expect(result.description).not.toContain('BETA • Is this information helpful');
      expect(result.description).not.toContain('Set alert for similar jobs');
      expect(result.description).not.toContain('More jobs');
      expect(result.description).not.toContain('Looking for talent');
    });
  });
});



