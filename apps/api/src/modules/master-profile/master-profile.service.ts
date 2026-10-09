import { prisma } from '@tracker/database';
import { MasterProfileDTO } from '@tracker/types';
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
          positioningRules: [
            'Lead with professional full-stack delivery.',
            'Emphasize measurable outcomes and production systems.',
          ],
          factBank: {
            core_positioning: ['Professional developer shipping production software'],
            priority_themes: ['Frontend engineering', 'Full-stack delivery'],
            quantified_highlights: [],
          },
          summaryCandidates: [],
          workExperience: [],
          projectExperience: [],
          technicalSkills: {
            'Core': ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Git'],
          },
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
      technicalSkills: (profile.technicalSkills as Record<string, string[]>) || {},
      education: (profile.education as any[]) || [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  },

  async updateProfile(userId: string, input: UpdateMasterProfileInput): Promise<MasterProfileDTO> {
    const profile = await prisma.masterProfile.upsert({
      where: { userId },
      create: {
        userId,
        basics: input.basics,
        positioningRules: input.positioningRules || [],
        factBank: input.factBank || {},
        summaryCandidates: input.summaryCandidates || [],
        workExperience: input.workExperience || [],
        projectExperience: input.projectExperience || [],
        technicalSkills: input.technicalSkills || {},
        education: input.education || [],
      },
      update: {
        basics: input.basics,
        positioningRules: input.positioningRules || [],
        factBank: input.factBank || {},
        summaryCandidates: input.summaryCandidates || [],
        workExperience: input.workExperience || [],
        projectExperience: input.projectExperience || [],
        technicalSkills: input.technicalSkills || {},
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
      technicalSkills: (profile.technicalSkills as Record<string, string[]>) || {},
      education: (profile.education as any[]) || [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  },

  async uploadResume(userId: string, input: UploadProfileResumeInput): Promise<MasterProfileDTO> {
    const base64Data = input.fileData.includes('base64,')
      ? input.fileData.split('base64,')[1]
      : input.fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestError('File size exceeds 10MB limit');
    }

    let parsedSections: any;

    if (input.mimeType === 'application/json' || input.filename.endsWith('.json')) {
      try {
        parsedSections = JSON.parse(buffer.toString('utf-8'));
      } catch {
        throw new BadRequestError('Invalid JSON format in resume file');
      }
    } else {
      const extractedText = ProfileExtractorService.extractTextFromBuffer(buffer, input.mimeType);
      parsedSections = ProfileExtractorService.parseResumeText(extractedText);
    }

    return this.updateProfile(userId, {
      basics: parsedSections.basics || { name: 'Applicant', links: [] },
      positioningRules: parsedSections.positioningRules || parsedSections.meta?.positioning_rules || [],
      factBank: parsedSections.factBank || parsedSections.fact_bank || {},
      summaryCandidates: parsedSections.summaryCandidates || parsedSections.summary_candidates || [],
      workExperience: parsedSections.workExperience || parsedSections.work_experience || [],
      projectExperience: parsedSections.projectExperience || parsedSections.project_experience || [],
      technicalSkills: parsedSections.technicalSkills || parsedSections.technical_skills || {},
      education: parsedSections.education || [],
    });
  },

  async importJson(userId: string, jsonPayload: any): Promise<MasterProfileDTO> {
    if (!jsonPayload || typeof jsonPayload !== 'object') {
      throw new BadRequestError('Invalid JSON payload');
    }

    const basics = jsonPayload.basics || { name: 'Applicant', links: [] };
    const positioningRules = jsonPayload.positioningRules || jsonPayload.meta?.positioning_rules || [];
    const factBank = jsonPayload.factBank || jsonPayload.fact_bank || {};
    const summaryCandidates = jsonPayload.summaryCandidates || jsonPayload.summary_candidates || [];
    const workExperience = jsonPayload.workExperience || jsonPayload.work_experience || [];
    const projectExperience = jsonPayload.projectExperience || jsonPayload.project_experience || [];
    const technicalSkills = jsonPayload.technicalSkills || jsonPayload.technical_skills || {};
    const education = jsonPayload.education || [];

    return this.updateProfile(userId, {
      basics,
      positioningRules,
      factBank,
      summaryCandidates,
      workExperience,
      projectExperience,
      technicalSkills,
      education,
    });
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
      technical_skills: profile.technicalSkills,
      education: profile.education,
    };
  },
};
