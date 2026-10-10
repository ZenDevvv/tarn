import { prisma } from '@tracker/database';
import { CoverLetterDTO, CoverLetterWithDetailsDTO } from '@tracker/types';
import { UpdateCoverLetterInput } from '@tracker/validation';
import { NotFoundError, BadRequestError } from '../../middleware/error-handler';
import { PdfRendererService } from '../tailoring/pdf-renderer.service';
import crypto from 'crypto';

export const coverLetterService = {
  async listAll(userId: string): Promise<CoverLetterWithDetailsDTO[]> {
    const letters = await prisma.coverLetter.findMany({
      where: { userId },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            priority: true,
            appliedAt: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      // Newest revision first, tie-broken by time: the UI treats index 0 as "current",
      // and a second edit must fork from the revision the first edit produced.
      orderBy: [{ revision: 'desc' }, { createdAt: 'desc' }],
    });

    return letters.map((cl) => ({
      id: cl.id,
      userId: cl.userId,
      applicationId: cl.applicationId,
      name: cl.name,
      role: cl.role,
      company: cl.company,
      content: cl.content,
      htmlContent: cl.htmlContent,
      fileUrl: cl.fileUrl,
      matchScore: cl.matchScore,
      echoedPhrases: cl.echoedPhrases,
      revision: cl.revision,
      parentCoverLetterId: cl.parentCoverLetterId,
      isCanonical: cl.isCanonical,
      createdAt: cl.createdAt.toISOString(),
      updatedAt: cl.updatedAt.toISOString(),
      application: cl.application
        ? {
            id: cl.application.id,
            status: (cl.application.status?.name as any) || 'SAVED',
            priority: cl.application.priority,
            appliedAt: cl.application.appliedAt ? cl.application.appliedAt.toISOString() : null,
            company: cl.application.company ? { id: cl.application.company.id, name: cl.application.company.name } : null,
            job: cl.application.job ? { id: cl.application.job.id, title: cl.application.job.title } : null,
          }
        : null,
    }));
  },
  async getById(userId: string, id: string): Promise<CoverLetterDTO> {
    const cl = await prisma.coverLetter.findFirst({
      where: { id, userId },
    });
    if (!cl) {
      throw new NotFoundError('Cover letter not found');
    }
    return {
      id: cl.id,
      userId: cl.userId,
      applicationId: cl.applicationId,
      name: cl.name,
      role: cl.role,
      company: cl.company,
      content: cl.content,
      htmlContent: cl.htmlContent,
      fileUrl: cl.fileUrl,
      matchScore: cl.matchScore,
      echoedPhrases: cl.echoedPhrases,
      revision: cl.revision,
      parentCoverLetterId: cl.parentCoverLetterId,
      isCanonical: cl.isCanonical,
      createdAt: cl.createdAt.toISOString(),
      updatedAt: cl.updatedAt.toISOString(),
    };
  },

  async listForApplication(userId: string, applicationId: string): Promise<CoverLetterDTO[]> {
    const letters = await prisma.coverLetter.findMany({
      where: { userId, applicationId },
      // Newest revision first, tie-broken by time: the UI treats index 0 as "current",
      // and a second edit must fork from the revision the first edit produced.
      orderBy: [{ revision: 'desc' }, { createdAt: 'desc' }],
    });
    return letters.map((cl) => ({
      id: cl.id,
      userId: cl.userId,
      applicationId: cl.applicationId,
      name: cl.name,
      role: cl.role,
      company: cl.company,
      content: cl.content,
      htmlContent: cl.htmlContent,
      fileUrl: cl.fileUrl,
      matchScore: cl.matchScore,
      echoedPhrases: cl.echoedPhrases,
      revision: cl.revision,
      parentCoverLetterId: cl.parentCoverLetterId,
      isCanonical: cl.isCanonical,
      createdAt: cl.createdAt.toISOString(),
      updatedAt: cl.updatedAt.toISOString(),
    }));
  },

  async update(userId: string, id: string, input: UpdateCoverLetterInput): Promise<CoverLetterDTO> {
    const existing = await prisma.coverLetter.findFirst({
      where: { id, userId },
      include: { user: { include: { masterProfile: true } } },
    });
    if (!existing) {
      throw new NotFoundError('Cover letter not found');
    }

    const uniqueId = `${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const basics = (existing.user?.masterProfile?.basics as any) || { name: existing.user?.name || 'Applicant', links: [] };
    const role = input.role !== undefined ? input.role : existing.role;
    const company = input.company !== undefined ? input.company : existing.company;

    const render = await PdfRendererService.generateCoverLetter(
      input.content,
      basics,
      role,
      company,
      uniqueId
    );

    // Editing forks a revision rather than mutating in place. This is what makes a submitted
    // letter immutable: once a letter is marked as sent, no later edit can change its content.
    // See spec-cover-letter-revisions.md C3.
    // Fork from the current head, not from the row being edited. Regeneration and editing are
    // two independent ways to produce a new attempt, so both can follow the same parent — taking
    // `existing.revision + 1` would give two siblings the same number whenever a letter was
    // regenerated after the one being edited was written.
    const head = await prisma.coverLetter.findFirst({
      where: { userId, applicationId: existing.applicationId },
      orderBy: [{ revision: 'desc' }, { createdAt: 'desc' }],
    });

    const updated = await prisma.coverLetter.create({
      data: {
        userId,
        applicationId: existing.applicationId,
        name: input.name || existing.name,
        role,
        company,
        content: input.content,
        htmlContent: render.html,
        fileUrl: render.pdfUrl,
        // Provenance is inherited, not recomputed: an edited letter is still the one the
        // tailoring engine built from those echoed JD phrases.
        matchScore: existing.matchScore,
        echoedPhrases: existing.echoedPhrases,
        revision: (head?.revision ?? existing.revision) + 1,
        parentCoverLetterId: head?.id ?? existing.id,
        isCanonical: false,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      applicationId: updated.applicationId,
      name: updated.name,
      role: updated.role,
      company: updated.company,
      content: updated.content,
      htmlContent: updated.htmlContent,
      fileUrl: updated.fileUrl,
      matchScore: updated.matchScore,
      echoedPhrases: updated.echoedPhrases,
      revision: updated.revision,
      parentCoverLetterId: updated.parentCoverLetterId,
      isCanonical: updated.isCanonical,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  /**
   * Mark the letter the user chose to keep for this application. Canonical is defined relative
   * to an application, so a standalone letter has no siblings and is rejected.
   */
  async setCanonical(userId: string, id: string): Promise<CoverLetterDTO | 'NO_APPLICATION'> {
    const existing = await prisma.coverLetter.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError('Cover letter not found');
    }
    if (!existing.applicationId) {
      return 'NO_APPLICATION';
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.coverLetter.updateMany({
        where: { userId, applicationId: existing.applicationId, isCanonical: true },
        data: { isCanonical: false },
      });
      return tx.coverLetter.update({ where: { id }, data: { isCanonical: true } });
    });

    return {
      id: updated.id,
      userId: updated.userId,
      applicationId: updated.applicationId,
      name: updated.name,
      role: updated.role,
      company: updated.company,
      content: updated.content,
      htmlContent: updated.htmlContent,
      fileUrl: updated.fileUrl,
      matchScore: updated.matchScore,
      echoedPhrases: updated.echoedPhrases,
      revision: updated.revision,
      parentCoverLetterId: updated.parentCoverLetterId,
      isCanonical: updated.isCanonical,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.coverLetter.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Cover letter not found');
    }
    await prisma.coverLetter.delete({ where: { id } });
    return true;
  },
};
