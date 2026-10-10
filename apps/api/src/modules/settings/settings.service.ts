import bcrypt from "bcryptjs";
import { prisma } from "@tracker/database";
import {
  UserSettingsDTO,
  UpdateProfileInput,
  UpdatePreferencesInput,
  ChangePasswordInput,
  UserDataExportDTO,
} from "@tracker/types";
import {
  AuthenticationError,
  NotFoundError,
} from "../../middleware/error-handler";
import { DEFAULT_STATUSES } from "../statuses/status.repository";

export const settingsService = {
  async getSettings(userId: string): Promise<UserSettingsDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const [
      totalApplications,
      activeApplications,
      totalInterviews,
      totalContacts,
      totalCompanies,
      totalResumes,
    ] = await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.application.count({
        where: {
          userId,
          status: { closeType: null },
          archivedAt: null,
        },
      }),
      prisma.interview.count({ where: { userId } }),
      prisma.contact.count({ where: { userId } }),
      prisma.company.count({ where: { userId } }),
      prisma.resume.count({ where: { userId } }),
    ]);

    let defaultResumeName: string | null = null;
    if (user.defaultResumeId) {
      const defaultResume = await prisma.resume.findUnique({
        where: { id: user.defaultResumeId },
        select: { name: true, revision: true, applicationId: true },
      });
      if (defaultResume) {
        // Tailored attempts carry a lineage number worth showing; manual resumes do not.
        defaultResumeName = defaultResume.applicationId
          ? `${defaultResume.name} (r${defaultResume.revision})`
          : defaultResume.name;
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      headline: user.headline,
      location: user.location,
      timezone: user.timezone || "UTC",
      phone: user.phone,
      website: user.website,
      linkedinUrl: user.linkedinUrl,
      bio: user.bio,
      defaultCurrency: user.defaultCurrency || "PHP",
      defaultWorkSetup: user.defaultWorkSetup as any,
      defaultResumeId: user.defaultResumeId,
      defaultResumeName,
      emailNotifications: user.emailNotifications,
      interviewReminders: user.interviewReminders,
      followUpAlerts: user.followUpAlerts,
      weeklyDigest: user.weeklyDigest,
      themePreference: (user.themePreference as any) || "system",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      stats: {
        totalApplications,
        activeApplications,
        totalInterviews,
        totalContacts,
        totalCompanies,
        totalResumes,
      },
    };
  },

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserSettingsDTO> {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundError("User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        headline: input.headline !== undefined ? input.headline : undefined,
        location: input.location !== undefined ? input.location : undefined,
        timezone: input.timezone !== undefined ? input.timezone : undefined,
        phone: input.phone !== undefined ? input.phone : undefined,
        website: input.website !== undefined ? input.website : undefined,
        linkedinUrl:
          input.linkedinUrl !== undefined ? input.linkedinUrl : undefined,
        bio: input.bio !== undefined ? input.bio : undefined,
      },
    });

    return this.getSettings(userId);
  },

  async updatePreferences(
    userId: string,
    input: UpdatePreferencesInput,
  ): Promise<UserSettingsDTO> {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundError("User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        defaultCurrency:
          input.defaultCurrency !== undefined
            ? input.defaultCurrency
            : undefined,
        defaultWorkSetup:
          input.defaultWorkSetup !== undefined
            ? (input.defaultWorkSetup as any)
            : undefined,
        defaultResumeId:
          input.defaultResumeId !== undefined
            ? input.defaultResumeId
            : undefined,
        emailNotifications:
          input.emailNotifications !== undefined
            ? input.emailNotifications
            : undefined,
        interviewReminders:
          input.interviewReminders !== undefined
            ? input.interviewReminders
            : undefined,
        followUpAlerts:
          input.followUpAlerts !== undefined ? input.followUpAlerts : undefined,
        weeklyDigest:
          input.weeklyDigest !== undefined ? input.weeklyDigest : undefined,
        themePreference:
          input.themePreference !== undefined
            ? input.themePreference
            : undefined,
      },
    });

    return this.getSettings(userId);
  },

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isMatch = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new AuthenticationError(
        "Current password does not match our records",
      );
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },

  async exportUserData(userId: string): Promise<UserDataExportDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        applications: {
          include: {
            company: true,
            job: true,
            status: true,
            timelineEvents: true,
            interviews: true,
            followUps: true,
            contacts: true,
            resume: {
              select: {
                id: true,
                name: true,
                revision: true,
                applicationId: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        statuses: {
          orderBy: { order: "asc" },
        },
        companies: {
          orderBy: { createdAt: "desc" },
        },
        contacts: {
          orderBy: { createdAt: "desc" },
        },
        interviews: {
          orderBy: { scheduledAt: "desc" },
        },
        followUps: {
          orderBy: { dueAt: "desc" },
        },
        resumes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        headline: user.headline,
        location: user.location,
        timezone: user.timezone,
        phone: user.phone,
        website: user.website,
        linkedinUrl: user.linkedinUrl,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
      },
      applications: user.applications,
      companies: user.companies,
      contacts: user.contacts,
      interviews: user.interviews,
      followUps: user.followUps,
      resumes: user.resumes,
    };
  },

  async resetUserData(userId: string): Promise<UserSettingsDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Clear foreign key reference on user
      await tx.user.update({
        where: { id: userId },
        data: { defaultResumeId: null },
      });

      // 2. Delete timeline events tied to the user's applications
      await tx.timelineEvent.deleteMany({
        where: { application: { userId } },
      });

      // 3. Delete follow-ups, interviews, and cover letters
      await tx.followUp.deleteMany({ where: { userId } });
      await tx.interview.deleteMany({ where: { userId } });
      await tx.coverLetter.deleteMany({ where: { userId } });

      // 4. Delete applications
      await tx.application.deleteMany({ where: { userId } });

      // 5. Delete contacts, jobs, companies, resumes, and master profile
      await tx.contact.deleteMany({ where: { userId } });
      await tx.job.deleteMany({ where: { userId } });
      await tx.company.deleteMany({ where: { userId } });
      await tx.resume.deleteMany({ where: { userId } });
      await tx.masterProfile.deleteMany({ where: { userId } });

      // 6. Delete custom application statuses
      await tx.applicationStatus.deleteMany({ where: { userId } });

      // 7. Re-seed default pipeline statuses
      for (const status of DEFAULT_STATUSES) {
        await tx.applicationStatus.create({
          data: {
            userId,
            name: status.name,
            order: status.order,
            closeType: status.closeType,
            isDefault: status.isDefault,
          },
        });
      }
    });

    return this.getSettings(userId);
  },
};
