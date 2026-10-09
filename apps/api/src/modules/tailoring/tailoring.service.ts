import crypto from 'crypto';
import fs from 'fs';
import { prisma, TimelineEventType } from '@tracker/database';
import { GenerateTailoringInput, aiTailoringOutputSchema, AiTailoringOutput } from '@tracker/validation';
import { MasterProfileDTO, GenerationQuotaDTO } from '@tracker/types';
import { JdAnalyzerService } from './jd-analyzer.service';
import { TailoringValidatorService } from './tailoring-validator.service';
import { PdfRendererService } from './pdf-renderer.service';
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

  // 1. Experienced Professional: >= 2 work experiences or >= 4 work bullets
  if (workExp.length >= 2 || totalWorkBullets >= 4) {
    return ['experience', 'projects', 'skills', 'education', 'certifications'];
  }

  // 2. Portfolio / Project-First: 0 formal work roles or 0 work bullets, but >= 2 projects
  if ((workExp.length === 0 || totalWorkBullets === 0) && projExp.length >= 2) {
    return ['projects', 'skills', 'education', 'certifications', 'experience'];
  }

  // 3. Early Career / Student / Sparse Experience
  return ['summary', 'education', 'skills', 'projects', 'experience', 'certifications'];
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
      aiResult = await this.callGeminiSynthesis(profile, analysis, jdText, role, company, apiKey);
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
    const verifiedCerts = [
      ...(Array.isArray(profile.factBank?.certifications) ? profile.factBank.certifications : []),
      ...((profile.technicalSkills && Array.isArray(profile.technicalSkills['Certifications']))
        ? profile.technicalSkills['Certifications']
        : []),
      ...((profile.technicalSkills && Array.isArray(profile.technicalSkills['Licenses & Certifications']))
        ? profile.technicalSkills['Licenses & Certifications']
        : []),
    ];
    if (verifiedCerts.length > 0 && (!resumePayload.certifications || resumePayload.certifications.length === 0)) {
      resumePayload.certifications = verifiedCerts;
    }

    // Determine sectionOrder: caller-provided override -> automatic profile heuristic
    if (Array.isArray(input.sectionOrder) && input.sectionOrder.length > 0) {
      resumePayload.sectionOrder = input.sectionOrder;
    } else {
      resumePayload.sectionOrder = determineOptimalSectionOrder(profile);
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
    apiKey: string
  ): Promise<AiTailoringOutput> {
    const totalWorkBullets = (profile.workExperience || []).reduce(
      (acc, w) => acc + (w.bullets?.length || 0),
      0
    );
    const isSparse = (profile.workExperience?.length || 0) <= 1 || totalWorkBullets < 4;

    const verifiedCerts = [
      ...(Array.isArray(profile.factBank?.certifications) ? profile.factBank.certifications : []),
      ...((profile.technicalSkills && Array.isArray(profile.technicalSkills['Certifications']))
        ? profile.technicalSkills['Certifications']
        : []),
      ...((profile.technicalSkills && Array.isArray(profile.technicalSkills['Licenses & Certifications']))
        ? profile.technicalSkills['Licenses & Certifications']
        : []),
    ];

    const prompt = `
You are an expert ATS resume and cover letter tailoring engine.

Your task is to adapt the candidate's Master Profile specifically for the target role: "${role}" at "${company}".

NON-NEGOTIABLE FIDELITY RULES:
1. Grounding: Stay 100% faithful to the candidate's Master Profile. NEVER invent employers, tools, projects, dates, or metrics.
2. Verified Metrics: ONLY use metrics and quantities that exist in the candidate's profile (e.g. from factBank or experience bullets).
3. Positioning: Follow the candidate's positioning rules: ${JSON.stringify(profile.positioningRules)}.
${
  isSparse
    ? `4. Sparse Profile Summary: The candidate's profile is early-career/sparse (<= 1 role). Include a concise 2-sentence "summary" field targeted directly to "${role}" using their verified factBank positioning: ${JSON.stringify(
        profile.factBank?.core_positioning || []
      )}. Do NOT invent claims.`
    : `4. No Summary: Do NOT include a summary section in the resume. Focus strictly on concrete achievements in experience, projects, and skills.`
}
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
  technicalSkills: profile.technicalSkills,
  education: profile.education,
  factBank: profile.factBank,
})}

Job Description:
${jdText}

Respond ONLY with valid JSON in this exact structure:
{
  "resume": {
    "basics": ...,
    ${isSparse ? '"summary": "2-sentence targeted summary...",' : ''}
    "education": ...,
    "experience": [...],
    "projects": [...],
    "skills": { ... },
    "certifications": [...]
  },
  "coverLetterMarkdown": "Dear Hiring Team..."
}
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
