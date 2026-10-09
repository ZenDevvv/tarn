import crypto from 'crypto';
import fs from 'fs';
import { prisma, TimelineEventType } from '@tracker/database';
import { GenerateTailoringInput } from '@tracker/validation';
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
    let aiResult: { resume: any; coverLetterMarkdown: string };
    try {
      aiResult = await this.callGeminiSynthesis(profile, analysis, jdText, role, company, apiKey);
    } catch (err: any) {
      console.error('Gemini AI synthesis error:', err);
      throw new ServiceUnavailableError(
        `AI tailoring is temporarily unavailable: ${err.message || 'synthesis failed'}`
      );
    }

    const resumePayload = aiResult.resume;
    const coverLetterMd = aiResult.coverLetterMarkdown;

    // 4. Automated validation
    const validation = TailoringValidatorService.validate(
      resumePayload,
      coverLetterMd,
      analysis.highPriorityKeywords,
      analysis.exactPhrases,
      profile,
      company
    );

    if (validation.blocking && !input.overrideWarnings) {
      throw new AppError(
        `Tailoring produced ungrounded claims that violate candidate facts: ${validation.fidelityWarnings.join('; ')}`,
        422,
        'UNGROUNDED_CLAIMS_DETECTED',
        validation.fidelityWarnings.map((w) => ({ message: w }))
      );
    }

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
              matchScore: analysis.matchScore,
              content: resumePayload,
              skills: Object.values(resumePayload.skills || {}).flat() as string[],
              notes: `Tailored for ${role} at ${company}. Match score: ${analysis.matchScore}%.`,
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
              matchScore: analysis.matchScore,
              echoedPhrases: validation.exactPhraseEchoes,
            },
          });
        }

        await tx.timelineEvent.create({
          data: {
            applicationId: application.id,
            type: TimelineEventType.CUSTOM_EVENT,
            title: `Tailored ${targetArtifact === 'package' ? 'application package' : targetArtifact} generated`,
            description: `Generated tailored deliverables (${analysis.matchScore}% match score) with AI synthesis.`,
            metadata: {
              resumeId: createdResume?.id || null,
              coverLetterId: createdCoverLetter?.id || null,
              matchScore: analysis.matchScore,
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
  ): Promise<{ resume: any; coverLetterMarkdown: string }> {
    const prompt = `
You are an expert ATS resume and cover letter tailoring engine.
Follow these non-negotiable rules:
1. Stay 100% faithful to the candidate's Master Profile. NEVER invent employers, tools, dates, or metrics.
2. Follow the candidate's positioning rules: ${JSON.stringify(profile.positioningRules)}.
3. Do NOT include a Professional Summary section in the resume.
4. Echo at least 3 exact phrases from the Job Description in the cover letter.
5. High-priority keywords: ${JSON.stringify(analysis.highPriorityKeywords)}.
6. Exact phrases to echo: ${JSON.stringify(analysis.exactPhrases)}.

Target Role: ${role}
Target Company: ${company}

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
    "education": ...,
    "experience": [...],
    "projects": [...],
    "skills": { ... }
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
      throw new Error(`Gemini API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(textOutput);
    if (!parsed.resume || !parsed.coverLetterMarkdown) {
      throw new Error('Malformed JSON output from Gemini API');
    }

    return parsed;
  },
};
