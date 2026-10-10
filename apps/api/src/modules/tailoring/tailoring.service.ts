import crypto from 'crypto';
import fs from 'fs';
import { prisma, TimelineEventType } from '@tracker/database';
import { GenerateTailoringInput, aiTailoringOutputSchema, AiTailoringOutput } from '@tracker/validation';
import { MasterProfileDTO, GenerationQuotaDTO } from '@tracker/types';
import { JdAnalyzerService } from './jd-analyzer.service';
import { TailoringValidatorService } from './tailoring-validator.service';
import { PdfRendererService } from './pdf-renderer.service';
import { collectVerifiedCerts, shouldFloatCertifications } from './utils/cert-utils';
import { masterProfileService } from '../master-profile/master-profile.service';
import {
  AppError,
  NotFoundError,
  BadRequestError,
  ServiceUnavailableError,
  PlansRequiredError,
} from '../../middleware/error-handler';

export function determineOptimalSectionOrder(profile: MasterProfileDTO): string[] {
  const workExp = profile.workExperience || [];
  const projExp = profile.projectExperience || [];
  const totalWorkBullets = workExp.reduce((acc, w) => acc + (w.bullets?.length || 0), 0);

  let order: string[];
  // 1. Experienced Professional: >= 2 work experiences or >= 4 work bullets
  if (workExp.length >= 2 || totalWorkBullets >= 4) {
    order = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'];
  }
  // 2. Portfolio / Project-First: 0 formal work roles or 0 work bullets, but >= 2 projects
  else if ((workExp.length === 0 || totalWorkBullets === 0) && projExp.length >= 2) {
    order = ['summary', 'projects', 'skills', 'education', 'certifications', 'experience'];
  }
  // 3. Early Career / Student / Sparse Experience
  else {
    order = ['summary', 'education', 'skills', 'projects', 'experience', 'certifications'];
  }

  // Regulated professions (RN, CPA, state licensure, teaching credentials) are screened on
  // licenses first — float certifications to position 2 when 2+ are verified.
  if (shouldFloatCertifications(profile)) {
    order = ['summary', 'certifications', ...order.filter((s) => s !== 'summary' && s !== 'certifications')];
  }

  return order;
}

/**
 * Append custom-section ids that sectionOrder does not already address, so the template can place
 * them. Matching is case-insensitive by id first, then by title, mirroring the template's own lookup.
 *
 * Only the id is appended. The template registers both the id and the title as lookup keys, so an id
 * alone is sufficient to place a section, and keeping sectionOrder free of duplicates means a
 * consumer can treat it as a plain ordered list of distinct sections.
 */
function appendMissingSectionIds(order: string[], sections: any[]): string[] {
  const result = [...order];
  const normalize = (value: unknown) => String(value ?? '').toLowerCase().trim();

  const present = new Set<string>();
  result.forEach((key) => {
    const lower = normalize(key);
    present.add(lower);
    // An id already present also satisfies a title that resolves to the same section.
    const match = sections.find((s: any) => normalize(s.id) === lower);
    if (match) present.add(normalize(match.title));
  });

  sections.forEach((s: any) => {
    const id = (s?.id || '').toString().trim();
    const title = (s?.title || '').toString().trim();
    const key = id || title;
    const lower = normalize(key);
    if (!lower) return;
    if (present.has(lower)) return;
    result.push(key);
    present.add(lower);
    if (title) present.add(normalize(title));
  });

  return result;
}

export const tailoringService = {
  getDailyLimit(): number {
    return Number(process.env.FREE_DAILY_GENERATIONS) || 5;
  },

  getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  },

  async checkEntitlement(_userId: string): Promise<boolean> {
    // Entitlement stub: always entitled unless REQUIRE_PAID_PLAN is set for paywall testing
    if (process.env.REQUIRE_PAID_PLAN === 'true') {
      return false;
    }
    return true;
  },

  async getQuota(userId: string): Promise<GenerationQuotaDTO> {
    const date = this.getTodayDate();
    const usage = await prisma.generationUsage.findUnique({
      where: { userId_date: { userId, date } },
    });
    const usedToday = usage?.count || 0;
    const limit = this.getDailyLimit();
    const isEntitled = await this.checkEntitlement(userId);

    return {
      limit,
      usedToday,
      remainingToday: Math.max(0, limit - usedToday),
      isEntitled,
    };
  },

  async assertCanGenerate(userId: string): Promise<GenerationQuotaDTO> {
    const quota = await this.getQuota(userId);
    if (!quota.isEntitled) {
      throw new PlansRequiredError('A paid plan is required to generate tailored deliverables.');
    }
    if (quota.remainingToday <= 0) {
      throw new PlansRequiredError(
        `Daily free generation limit (${quota.limit}) reached. Please upgrade to a paid plan or try again tomorrow.`
      );
    }
    return quota;
  },

  async getAnalysis(userId: string, applicationId: string) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId, archivedAt: null },
      include: { job: true, company: true },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const profile = await masterProfileService.getProfile(userId);
    const jdText = application.job?.description || '';

    return JdAnalyzerService.analyze(
      jdText,
      profile,
      application.job?.title,
      application.company?.name
    );
  },

  async generatePackage(userId: string, applicationId: string, input: GenerateTailoringInput) {
    // 1. Quota & Entitlement check (fails with 402 if limit reached or unentitled)
    const currentQuota = await this.assertCanGenerate(userId);

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId, archivedAt: null },
      include: { job: true, company: true },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const jdText = application.job?.description || '';
    if (!jdText.trim()) {
      throw new BadRequestError('Cannot tailor application without a job description. Please paste or fetch the job description first.');
    }

    const profile = await masterProfileService.getProfile(userId);
    const role = input.role || application.job?.title || 'Target Role';
    const company = input.company || application.company?.name || 'Target Company';

    const analysis = JdAnalyzerService.analyze(jdText, profile, role, company);

    // 2. Platform Gemini key check (Hard error - NO silent fallback)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableError(
        'AI tailoring is temporarily unavailable (platform API key is not configured).'
      );
    }

    // 3. AI synthesis call (Hard error on failure or timeout)
    let aiResult: AiTailoringOutput;
    try {
      aiResult = await this.callGeminiSynthesis(
        profile,
        analysis,
        jdText,
        role,
        company,
        apiKey,
        input.documentType
      );
    } catch (err: any) {
      console.error('Gemini AI synthesis error:', err);
      const rawMsg = err?.message || 'synthesis failed';
      const safeMsg = apiKey ? rawMsg.replace(new RegExp(apiKey, 'g'), '[REDACTED]') : rawMsg;
      throw new ServiceUnavailableError(
        `AI tailoring is temporarily unavailable: ${safeMsg}`
      );
    }

    const resumePayload = aiResult.resume;
    const coverLetterMd = aiResult.coverLetterMarkdown;

    // Attach verified certifications from Master Profile if available
    const verifiedCerts = collectVerifiedCerts(profile);
    if (verifiedCerts.length > 0 && (!resumePayload.certifications || resumePayload.certifications.length === 0)) {
      resumePayload.certifications = verifiedCerts;
    }

    // Determine sectionOrder: caller-provided override -> automatic profile heuristic
    if (Array.isArray(input.sectionOrder) && input.sectionOrder.length > 0) {
      resumePayload.sectionOrder = input.sectionOrder;
    } else {
      resumePayload.sectionOrder = determineOptimalSectionOrder(profile);
    }

    // Custom sections (clinical rotations, board licensure, publications, ...) are copied from the
    // Master Profile rather than requested from the model. These hold licensure numbers and clinical
    // history — exactly the content the fidelity validator exists to protect — so the model may
    // reorder them but must never rewrite them. See spec-resume-fidelity.md C1.
    const profileCustomSections = profile.customSections || [];
    if (profileCustomSections.length > 0) {
      resumePayload.customSections = profileCustomSections;
      resumePayload.sectionOrder = appendMissingSectionIds(
        resumePayload.sectionOrder || [],
        profileCustomSections
      );
    }

    // 4. Automated validation & Multi-factor ATS Score Lift
    const validation = TailoringValidatorService.validate(
      resumePayload,
      coverLetterMd,
      analysis.highPriorityKeywords,
      analysis.exactPhrases,
      profile,
      company,
      analysis.matchScore
    );

    // Blocking fidelity warnings halt generation unless the caller explicitly overrides, so the
    // "Save Anyway" affordance in the UI is truthful. Rejected before any render or DB write, so a
    // blocked generation consumes no quota and leaves no artifacts.
    if (validation.blocking && !input.overrideWarnings) {
      throw new BadRequestError(
        `Tailored output failed fidelity checks and was not saved:\n- ${validation.fidelityWarnings.join('\n- ')}`
      );
    }

    // Evaluate tailored resume and compute score lift
    const tailoredEval = JdAnalyzerService.evaluateResumePayload(
      resumePayload,
      role,
      company,
      analysis.highPriorityKeywords
    );

    const scoreLift = JdAnalyzerService.computeScoreLift(
      analysis.scoreBreakdown || {
        totalScore: analysis.matchScore,
        skillsScore: analysis.matchScore,
        roleScore: 50,
        impactScore: 50,
        metricsCount: 0,
        verbsCount: 0,
        matchedSkillsCount: analysis.matchedKeywords.length,
        totalSkillsCount: analysis.highPriorityKeywords.length,
      },
      tailoredEval,
      analysis.matchedKeywords,
      tailoredEval.matchedKeywords
    );

    validation.scoreBreakdown = tailoredEval;
    validation.scoreLift = scoreLift;
    analysis.scoreLift = scoreLift;

    const uniqueId = `${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const targetArtifact = input.targetArtifact || 'package';

    let resumeRender: { html: string; pdfUrl: string; localPdfPath: string } | null = null;
    let coverLetterRender: { html: string; pdfUrl: string; localPdfPath: string } | null = null;

    try {
      // Render required PDFs
      if (targetArtifact === 'package' || targetArtifact === 'resume') {
        resumeRender = await PdfRendererService.generateResume(resumePayload, uniqueId);
      }
      if (targetArtifact === 'package' || targetArtifact === 'cover_letter') {
        coverLetterRender = await PdfRendererService.generateCoverLetter(
          coverLetterMd,
          profile.basics,
          role,
          company,
          uniqueId
        );
      }

      const todayDate = this.getTodayDate();

      // 5. Atomic DB writes and quota deduction
      const txResult = await prisma.$transaction(async (tx) => {
        let createdResume: any = null;
        let createdCoverLetter: any = null;

        if (resumeRender) {
          createdResume = await tx.resume.create({
            data: {
              userId,
              name: `Resume - ${company} (${role})`,
              targetRole: role,
              fileUrl: resumeRender.pdfUrl,
              filename: `resume_${role.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
              mimeType: 'application/pdf',
              isTailored: true,
              matchScore: scoreLift.tailored.totalScore,
              content: resumePayload,
              skills: Object.values(resumePayload.skills || {}).flat() as string[],
              notes: `Tailored for ${role} at ${company}. ATS Match score: ${scoreLift.tailored.totalScore}% (+${scoreLift.lift.totalLift}% lift).`,
            },
          });

          await tx.application.update({
            where: { id: application.id },
            data: {
              resumeId: createdResume.id,
            },
          });
        }

        if (coverLetterRender) {
          createdCoverLetter = await tx.coverLetter.create({
            data: {
              userId,
              applicationId: application.id,
              name: `Cover Letter - ${company} (${role})`,
              role,
              company,
              content: coverLetterMd,
              htmlContent: coverLetterRender.html,
              fileUrl: coverLetterRender.pdfUrl,
              matchScore: scoreLift.tailored.totalScore,
              echoedPhrases: validation.exactPhraseEchoes,
            },
          });
        }

        await tx.timelineEvent.create({
          data: {
            applicationId: application.id,
            type: TimelineEventType.CUSTOM_EVENT,
            title: `Tailored ${targetArtifact === 'package' ? 'application package' : targetArtifact} generated`,
            description: `Generated tailored deliverables (${scoreLift.tailored.totalScore}% ATS score, +${scoreLift.lift.totalLift}% lift) with AI synthesis.`,
            metadata: {
              resumeId: createdResume?.id || null,
              coverLetterId: createdCoverLetter?.id || null,
              matchScore: scoreLift.tailored.totalScore,
              baselineScore: scoreLift.baseline.totalScore,
              scoreLift: scoreLift.lift.totalLift,
            },
          },
        });

        // Increment daily quota usage inside the transaction
        await tx.generationUsage.upsert({
          where: { userId_date: { userId, date: todayDate } },
          create: { userId, date: todayDate, count: 1 },
          update: { count: { increment: 1 } },
        });

        return { resume: createdResume, coverLetter: createdCoverLetter };
      });

      return {
        resume: txResult.resume
          ? {
              ...txResult.resume,
              createdAt: txResult.resume.createdAt.toISOString(),
              updatedAt: txResult.resume.updatedAt.toISOString(),
            }
          : undefined,
        coverLetter: txResult.coverLetter
          ? {
              ...txResult.coverLetter,
              createdAt: txResult.coverLetter.createdAt.toISOString(),
              updatedAt: txResult.coverLetter.updatedAt.toISOString(),
            }
          : undefined,
        analysis,
        validation,
        scoreLift,
        quota: {
          limit: currentQuota.limit,
          usedToday: currentQuota.usedToday + 1,
          remainingToday: Math.max(0, currentQuota.remainingToday - 1),
          isEntitled: currentQuota.isEntitled,
        },
      };
    } catch (err) {
      // Roll back / clean up any created PDF files on render or DB failure
      if (resumeRender?.localPdfPath && fs.existsSync(resumeRender.localPdfPath)) {
        try {
          fs.unlinkSync(resumeRender.localPdfPath);
        } catch {}
      }
      if (coverLetterRender?.localPdfPath && fs.existsSync(coverLetterRender.localPdfPath)) {
        try {
          fs.unlinkSync(coverLetterRender.localPdfPath);
        } catch {}
      }
      throw err;
    }
  },

  async callGeminiSynthesis(
    profile: MasterProfileDTO,
    analysis: any,
    jdText: string,
    role: string,
    company: string,
    apiKey: string,
    documentType: string = 'resume'
  ): Promise<AiTailoringOutput> {
    const totalWorkBullets = (profile.workExperience || []).reduce(
      (acc, w) => acc + (w.bullets?.length || 0),
      0
    );
    const isSparse = (profile.workExperience || []).length <= 1 || totalWorkBullets < 4;
    const verifiedCerts = collectVerifiedCerts(profile);

    // A federal resume, an academic CV, and a private-sector resume are different DOCUMENTS, not
    // different templates. Length is a content-selection directive, never a typography directive.
    // See spec-resume-fidelity.md C5.
    const documentPolicy =
      documentType === 'federal'
        ? `
DOCUMENT TYPE: FEDERAL RESUME. This is a different document from a private-sector resume.
- No page limit. Never truncate content to fit one or two pages.
- Do NOT assume a Federal HR Specialist will infer anything. State everything explicitly.
- For each role include, where the Master Profile supplies them: salary or hourly rate, hours per week,
  supervisor name and contact, and security clearance.
- Preserve the full history the candidate has provided, including part-time, volunteer, and academic roles.
- Use plain section labels that map to USAJobs fields (Qualifications, Education, Work Experience, Certifications).`
        : documentType === 'cv'
        ? `
DOCUMENT TYPE: ACADEMIC / RESEARCH CV. This is a different document from a one-page resume.
- No page limit. Never truncate content.
- Lead with Education, then Research/Publications, then Teaching, then Honors/Awards and Service.
- Include full detail on scholarly output and academic appointments where the Master Profile supplies them.`
        : `
DOCUMENT TYPE: RESUME (private sector). Target one to two pages; prioritise the most relevant and most
recent experience. Select detail to fit rather than shrinking type or margins.`;

    const prompt = `
You are an expert ATS resume and cover letter tailoring engine.

Your task is to adapt the candidate's Master Profile specifically for the target role: "${role}" at "${company}".

${documentPolicy}

NON-NEGOTIABLE FIDELITY RULES:
1. Grounding: Stay 100% faithful to the candidate's Master Profile. NEVER invent employers, tools, projects, dates, or metrics.
2. Verified Metrics: ONLY use metrics and quantities that exist in the candidate's profile (e.g. from factBank or experience bullets).
3. Positioning: Follow the candidate's positioning rules: ${JSON.stringify(profile.positioningRules)}.
4. Professional Summary: ALWAYS include a concise 2-4 sentence "summary" field targeted directly to "${role}", grounded strictly in the candidate's verified factBank positioning: ${JSON.stringify(
      profile.factBank?.core_positioning || []
    )}. ${
      isSparse
        ? 'The candidate is early-career/sparse (<= 1 role), so lean harder on education, certifications, and transferable competencies.'
        : 'The candidate is experienced; lead with scope, seniority, and domain credentials.'
    } Do NOT invent claims.
5. Certifications: If verified certifications exist in the profile: ${JSON.stringify(
      verifiedCerts
    )}, include them in the "certifications" array. NEVER invent certifications.
6. Cover Letter Verbatim Echoes: Echo at least 3 exact phrases from the Job Description in the cover letter: ${JSON.stringify(
      analysis.exactPhrases
    )}.

ADAPTATION & TAILORING DIRECTIVES:
A. Resume Bullet Rewriting & Gap Closing:
   - Target Identified Gaps: ${JSON.stringify(analysis.missingKeywords)}.
   - High-Priority Skills: ${JSON.stringify(analysis.highPriorityKeywords)}.
   - Where the candidate has relevant work or project experience, rewrite and reorder achievement bullets to highlight aspects relevant to "${role}" and bridge identified keyword gaps.
   - If the candidate genuinely lacks a skill, do NOT invent it. Instead, emphasize adjacent verifiable competencies from their profile.
   - Order bullets within each role and project by relevance to "${role}".

B. Cover Letter Composition:
   - Opening: Establish direct candidacy for "${role}" at "${company}" using the candidate's core positioning: ${JSON.stringify(profile.factBank?.core_positioning || [])}.
   - Body Paragraphs: Showcase the candidate's quantified highlights: ${JSON.stringify(profile.factBank?.quantified_highlights || [])} and key achievements from their experience. Weave in the exact echo phrases naturally without buzzword stuffing.
   - Previous Employers: ONLY mention past employers from the candidate's work history: ${JSON.stringify((profile.workExperience || []).map((w) => w.company))}.
   - Closing: Reiterate enthusiasm for "${company}" and invite discussion.

Candidate Master Profile:
${JSON.stringify({
  basics: profile.basics,
  workExperience: profile.workExperience,
  projectExperience: profile.projectExperience,
  skills: profile.skills,
  education: profile.education,
  factBank: profile.factBank,
})}

Job Description:
${jdText}

Respond ONLY with valid JSON in this exact structure:
{
  "resume": {
    "basics": ...,
    "summary": "2-4 sentence professional summary targeted at the role...",
    "education": ...,
    "experience": [...],
    "projects": [...],
    "skills": { ... },
    "certifications": [...],
    "sectionTitles": { "summary": "...", "experience": "...", "projects": "...", "skills": "...", "education": "...", "certifications": "..." }
  },
  "coverLetterMarkdown": "Dear Hiring Team..."
}
For "sectionTitles", use the candidate's own naming for each section as it appears in their Master
Profile or their uploaded resume (e.g. a nurse's experience section may be "Clinical Experience", an
academician's may be "Research Experience"). Omit any section that has no entry. Only supply titles
that genuinely describe the content; never invent a title for a section the candidate does not have.
    `.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      const respText = await response.text();
      const safeRespText = apiKey ? respText.replace(new RegExp(apiKey, 'g'), '[REDACTED]') : respText;
      throw new Error(`Gemini API returned status ${response.status}: ${safeRespText}`);
    }

    const data = await response.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
      throw new Error('Empty response from Gemini API');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(textOutput);
    } catch {
      throw new Error('Invalid JSON received from Gemini API');
    }

    const validation = aiTailoringOutputSchema.safeParse(parsed);
    if (!validation.success) {
      const issues = validation.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new Error(`Malformed AI tailoring output structure: ${issues}`);
    }

    return validation.data;
  },
};
