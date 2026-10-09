import { prisma } from '@tracker/database';
import { MasterProfileDTO, MasterProfileDraftDTO } from '@tracker/types';
import { UpdateMasterProfileInput, UploadProfileResumeInput } from '@tracker/validation';
import { ProfileExtractorService } from './profile-extractor.service';
import { BadRequestError, NotFoundError } from '../../middleware/error-handler';

export const masterProfileService = {
  async getProfile(userId: string): Promise<MasterProfileDTO> {
    let profile = await prisma.masterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Find user name and email to bootstrap default profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      profile = await prisma.masterProfile.create({
        data: {
          userId,
          basics: {
            name: user?.name || 'Applicant',
            email: user?.email || '',
            phone: user?.phone || '',
            location: user?.location || '',
            links: [],
          },
          positioningRules: [],
          factBank: {
            core_positioning: [],
            priority_themes: [],
            quantified_highlights: [],
          },
          summaryCandidates: [],
          workExperience: [],
          projectExperience: [],
          skills: {},
          education: [],
        },
      });
    }

    return {
      id: profile.id,
      userId: profile.userId,
      basics: profile.basics as any,
      positioningRules: profile.positioningRules,
      factBank: profile.factBank as any,
      summaryCandidates: (profile.summaryCandidates as any[]) || [],
      workExperience: (profile.workExperience as any[]) || [],
      projectExperience: (profile.projectExperience as any[]) || [],
      skills: (profile.skills as Record<string, string[]>) || {},
      education: (profile.education as any[]) || [],
      customSections: (profile.factBank as any)?.customSections || [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  },

  async updateProfile(userId: string, input: UpdateMasterProfileInput): Promise<MasterProfileDTO> {
    const customSections = input.customSections ?? (input.factBank as any)?.customSections ?? [];
    const factBankData = {
      ...(input.factBank || {}),
      customSections,
    };

    const profile = await prisma.masterProfile.upsert({
      where: { userId },
      create: {
        userId,
        basics: input.basics,
        positioningRules: input.positioningRules || [],
        factBank: factBankData,
        summaryCandidates: input.summaryCandidates || [],
        workExperience: input.workExperience || [],
        projectExperience: input.projectExperience || [],
        skills: input.skills || {},
        education: input.education || [],
      },
      update: {
        basics: input.basics,
        positioningRules: input.positioningRules || [],
        factBank: factBankData,
        summaryCandidates: input.summaryCandidates || [],
        workExperience: input.workExperience || [],
        projectExperience: input.projectExperience || [],
        skills: input.skills || {},
        education: input.education || [],
      },
    });

    return {
      id: profile.id,
      userId: profile.userId,
      basics: profile.basics as any,
      positioningRules: profile.positioningRules,
      factBank: profile.factBank as any,
      summaryCandidates: (profile.summaryCandidates as any[]) || [],
      workExperience: (profile.workExperience as any[]) || [],
      projectExperience: (profile.projectExperience as any[]) || [],
      skills: (profile.skills as Record<string, string[]>) || {},
      education: (profile.education as any[]) || [],
      customSections: (profile.factBank as any)?.customSections || customSections,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  },

  async uploadResume(userId: string, input: UploadProfileResumeInput): Promise<MasterProfileDraftDTO> {
    const base64Data = input.fileData.includes('base64,')
      ? input.fileData.split('base64,')[1]
      : input.fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestError('File size exceeds 10MB limit');
    }

    if (input.mimeType === 'application/json' || input.filename.endsWith('.json')) {
      try {
        const parsedJson = JSON.parse(buffer.toString('utf-8'));
        return this.importJson(userId, parsedJson);
      } catch (err: any) {
        if (err instanceof BadRequestError) throw err;
        throw new BadRequestError('Invalid JSON format in resume file');
      }
    }

    const extractedText = ProfileExtractorService.extractTextFromBuffer(buffer, input.mimeType);
    return ProfileExtractorService.extractWithAi(extractedText, process.env.GEMINI_API_KEY);
  },

  async importJson(_userId: string, jsonPayload: any): Promise<MasterProfileDraftDTO> {
    if (!jsonPayload || typeof jsonPayload !== 'object') {
      throw new BadRequestError('Invalid JSON payload');
    }

    const warnings: string[] = [];
    const basics = jsonPayload.basics || { name: '', links: [] };
    if (!basics.name) {
      warnings.push('Candidate name not found — please verify');
    }
    if (!basics.email) {
      warnings.push('Email not found — please verify');
    }
    if (!basics.phone) {
      warnings.push('Phone number not found — please verify');
    }
    if (!basics.location) {
      warnings.push('Location not found — please verify');
    }

    const positioningRules = jsonPayload.positioningRules || jsonPayload.meta?.positioning_rules || [];
    const factBank = jsonPayload.factBank || jsonPayload.fact_bank || {};
    const summaryCandidates = jsonPayload.summaryCandidates || jsonPayload.summary_candidates || [];
    const workExperience = jsonPayload.workExperience || jsonPayload.work_experience || [];
    if (!workExperience.length) {
      warnings.push('Work experience not found — please verify');
    }

    const projectExperience = jsonPayload.projectExperience || jsonPayload.project_experience || [];
    if (!projectExperience.length) {
      warnings.push('Project experience not found — please verify');
    }

    const skills = jsonPayload.skills || jsonPayload.technicalSkills || jsonPayload.technical_skills || {};
    if (Object.keys(skills).length === 0) {
      warnings.push('Skills not found — please verify');
    }

    const education = jsonPayload.education || [];
    if (!education.length) {
      warnings.push('Education not found — please verify');
    }

    const customSections = jsonPayload.customSections || jsonPayload.factBank?.customSections || jsonPayload.custom_sections || [];

    const profile = {
      basics: {
        name: basics.name || 'Applicant',
        location: basics.location || null,
        phone: basics.phone || null,
        email: basics.email || null,
        links: Array.isArray(basics.links) ? basics.links : [],
      },
      positioningRules,
      factBank,
      summaryCandidates,
      workExperience,
      projectExperience,
      skills,
      education,
      customSections,
    };

    return { profile, warnings };
  },

  async confirmImport(userId: string, input: UpdateMasterProfileInput): Promise<MasterProfileDTO> {
    return this.updateProfile(userId, input);
  },

  async exportJson(userId: string): Promise<Record<string, any>> {
    const profile = await this.getProfile(userId);
    return {
      meta: {
        candidate_name: profile.basics.name,
        exported_on: new Date().toISOString(),
        positioning_rules: profile.positioningRules,
      },
      basics: profile.basics,
      fact_bank: profile.factBank,
      summary_candidates: profile.summaryCandidates,
      work_experience: profile.workExperience,
      project_experience: profile.projectExperience,
      skills: profile.skills,
      education: profile.education,
      custom_sections: profile.customSections || [],
    };
  },
};
