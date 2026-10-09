import crypto from 'crypto';
import fs from 'fs';
import { prisma, TimelineEventType } from '@tracker/database';
import { GenerateTailoringInput } from '@tracker/validation';
import { MasterProfileDTO } from '@tracker/types';
import { JdAnalyzerService } from './jd-analyzer.service';
import { TailoringValidatorService } from './tailoring-validator.service';
import { PdfRendererService } from './pdf-renderer.service';
import { masterProfileService } from '../master-profile/master-profile.service';
import { consolidateBullets } from './utils/bullet-utils';
import { NotFoundError, BadRequestError } from '../../middleware/error-handler';

export const tailoringService = {
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

    let resumePayload: any;
    let coverLetterMd = '';

    const apiKey = process.env.GEMINI_API_KEY;
    if (input.mode === 'ai' && apiKey) {
      try {
        const aiResult = await this.callGeminiSynthesis(profile, analysis, jdText, role, company, apiKey);
        resumePayload = aiResult.resume;
        coverLetterMd = aiResult.coverLetterMarkdown;
      } catch (err) {
        console.warn('Gemini AI synthesis failed, falling back to deterministic assembly:', err);
        const deterministic = this.assembleDeterministic(profile, analysis, role, company);
        resumePayload = deterministic.resume;
        coverLetterMd = deterministic.coverLetterMarkdown;
      }
    } else {
      const deterministic = this.assembleDeterministic(profile, analysis, role, company);
      resumePayload = deterministic.resume;
      coverLetterMd = deterministic.coverLetterMarkdown;
    }

    // Run automated validation
    const validation = TailoringValidatorService.validate(
      resumePayload,
      coverLetterMd,
      analysis.highPriorityKeywords,
      analysis.exactPhrases,
      profile
    );

    const uniqueId = `${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;

    let resumeRender: { html: string; pdfUrl: string; localPdfPath: string } | null = null;
    let coverLetterRender: { html: string; pdfUrl: string; localPdfPath: string } | null = null;

    try {
      // Render PDFs (throws ServiceUnavailableError if Chromium fails/missing)
      resumeRender = await PdfRendererService.generateResume(resumePayload, uniqueId);
      coverLetterRender = await PdfRendererService.generateCoverLetter(
        coverLetterMd,
        profile.basics,
        role,
        company,
        uniqueId
      );

      // Perform DB writes inside prisma transaction
      const { resume, coverLetter } = await prisma.$transaction(async (tx) => {
        const createdResume = await tx.resume.create({
          data: {
            userId,
            name: `Resume - ${company} (${role})`,
            targetRole: role,
            fileUrl: resumeRender!.pdfUrl,
            filename: `resume_${role.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
            mimeType: 'application/pdf',
            isTailored: true,
            matchScore: analysis.matchScore,
            content: resumePayload,
            skills: Object.values(resumePayload.skills || {}).flat() as string[],
            notes: `Tailored for ${role} at ${company}. Match score: ${analysis.matchScore}%.`,
          },
        });

        const createdCoverLetter = await tx.coverLetter.create({
          data: {
            userId,
            applicationId: application.id,
            name: `Cover Letter - ${company} (${role})`,
            role,
            company,
            content: coverLetterMd,
            htmlContent: coverLetterRender!.html,
            fileUrl: coverLetterRender!.pdfUrl,
            matchScore: analysis.matchScore,
            echoedPhrases: validation.exactPhraseEchoes,
          },
        });

        await tx.application.update({
          where: { id: application.id },
          data: {
            resumeId: createdResume.id,
          },
        });

        await tx.timelineEvent.create({
          data: {
            applicationId: application.id,
            type: TimelineEventType.CUSTOM_EVENT,
            title: 'Tailored application package generated',
            description: `Generated tailored resume (${analysis.matchScore}% match) and cover letter with ${validation.exactPhraseEchoes.length} echoed phrases.`,
            metadata: {
              resumeId: createdResume.id,
              coverLetterId: createdCoverLetter.id,
              matchScore: analysis.matchScore,
            },
          },
        });

        return { resume: createdResume, coverLetter: createdCoverLetter };
      });

      return {
        resume: {
          ...resume,
          createdAt: resume.createdAt.toISOString(),
          updatedAt: resume.updatedAt.toISOString(),
        },
        coverLetter: {
          ...coverLetter,
          createdAt: coverLetter.createdAt.toISOString(),
          updatedAt: coverLetter.updatedAt.toISOString(),
        },
        analysis,
        validation,
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

  assembleDeterministic(profile: MasterProfileDTO, analysis: any, role: string, company: string) {
    const matchedTokens = new Set<string>((analysis.matchedKeywords || []).map((k: string) => k.toLowerCase()));

    // 1. Reorder Experience: score each bullet by keyword matches
    const experience = (profile.workExperience || []).map((job: any) => {
      const consolidated = consolidateBullets(job.bullets || []);
      const scoredBullets = consolidated.map((b: string) => {
        const bLower = b.toLowerCase();
        let matchCount = 0;
        for (const kw of matchedTokens) {
          if (bLower.includes(kw)) matchCount += 1;
        }
        return { bullet: b, score: matchCount };
      });

      scoredBullets.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

      return {
        company: job.company,
        location: job.location,
        role: job.role,
        date_range: job.date_range,
        bullets: scoredBullets.map((s: { bullet: string }) => s.bullet),
      };
    });

    // 2. Reorder Projects: highlight project first, or project with highest keyword density
    const projects = [...(profile.projectExperience || [])]
      .map((p: any) => ({
        ...p,
        bullets: consolidateBullets(p.bullets || []),
      }))
      .sort((a: any, b: any) => {
        const aLower = `${a.name} ${a.subtitle || ''} ${(a.stack || []).join(' ')} ${(a.bullets || []).join(' ')}`.toLowerCase();
        const bLower = `${b.name} ${b.subtitle || ''} ${(b.stack || []).join(' ')} ${(b.bullets || []).join(' ')}`.toLowerCase();

        let aMatches = 0;
        let bMatches = 0;
        for (const kw of matchedTokens) {
          if (aLower.includes(kw)) aMatches++;
          if (bLower.includes(kw)) bMatches++;
        }
        return bMatches - aMatches;
      });

    // 3. Technical Skills: surface matched skills first
    const skills: Record<string, string[]> = {};
    for (const [cat, items] of Object.entries(profile.technicalSkills || {})) {
      const skillList = Array.isArray(items) ? (items as string[]) : [];
      const sorted = [...skillList].sort((x: string, y: string) => {
        const xMatch = matchedTokens.has(x.toLowerCase()) ? 1 : 0;
        const yMatch = matchedTokens.has(y.toLowerCase()) ? 1 : 0;
        return yMatch - xMatch;
      });
      skills[cat] = sorted;
    }

    const education = (profile.education || []).map((edu: any) => ({
      ...edu,
      bullets: consolidateBullets(edu.bullets || []),
    }));

    const resume = {
      basics: profile.basics,
      education,
      experience,
      projects,
      skills,
    };

    // 4. Assemble targeted cover letter with echoed phrases
    const echoPhrases = (analysis.exactPhrases || []).slice(0, 3);
    const quantifiedHighlights = profile.factBank?.quantified_highlights || [];
    const metric1 = quantifiedHighlights[0] || 'shipping scalable production software';
    const metric2 = quantifiedHighlights[1] || 'collaborating across cross-functional engineering teams';

    const echo1 = echoPhrases[0] ? ` ${echoPhrases[0]}` : ' build and deliver production-grade platforms';
    const echo2 = echoPhrases[1] ? ` ${echoPhrases[1]}` : ' maintain scalable engineering rigor';
    const echo3 = echoPhrases[2] ? ` ${echoPhrases[2]}` : ' drive rapid sprint delivery';

    const coverLetterMarkdown = `
Dear Hiring Team at ${company},

I am writing to express my enthusiastic interest in the ${role} position. With a solid foundation in modern full-stack engineering and proven delivery in production environments, I am eager to contribute immediately to your engineering goals.

Throughout my experience, I have focused on the ability to${echo1}. At ${experience[0]?.company || 'my recent role'}, I contributed to key enterprise systems with a focus on ${metric1}, ensuring seamless collaboration and high system reliability.

Your position emphasizes the need to${echo2} while continuing to${echo3}. My background aligns directly with these priorities, having delivered robust solutions with ${metric2}. I lead with measurable outcomes, type-safe architectures, and rapid iteration.

I welcome the opportunity to discuss how my hands-on background and technical skills can support ${company}'s upcoming milestones. Thank you for your time and consideration.

Sincerely,  
${profile.basics.name}
    `.trim();

    return {
      resume,
      coverLetterMarkdown,
    };
  },

  async callGeminiSynthesis(profile: MasterProfileDTO, analysis: any, jdText: string, role: string, company: string, apiKey: string) {
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
      throw new Error('Empty response from Gemini API');
    }

    return JSON.parse(textOutput);
  },
};
