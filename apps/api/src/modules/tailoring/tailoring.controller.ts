import { Request, Response, NextFunction } from 'express';
import { tailoringService } from './tailoring.service';
import { prisma } from '@tracker/database';
import { buildResumeHtml } from './templates/resume-template';
import { buildCoverLetterHtml } from './templates/cover-letter-template';
import { NotFoundError } from '../../middleware/error-handler';

export const tailoringController = {
  async getQuota(req: Request, res: Response, next: NextFunction) {
    try {
      const quota = await tailoringService.getQuota(req.user!.id);
      res.json({ data: quota });
    } catch (err) {
      next(err);
    }
  },

  async getAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const analysis = await tailoringService.getAnalysis(req.user!.id, req.params.id);
      res.json({ data: analysis });
    } catch (err) {
      next(err);
    }
  },

  async generatePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tailoringService.generatePackage(req.user!.id, req.params.id, req.body);
      res.json({ data: result, message: 'Application tailored successfully' });
    } catch (err) {
      next(err);
    }
  },

  async previewResumeHtml(req: Request, res: Response, next: NextFunction) {
    try {
      const resume = await prisma.resume.findFirst({
        where: { id: req.params.id, userId: req.user!.id },
      });
      if (!resume || !resume.content) {
        throw new NotFoundError('Resume or tailored content not found');
      }

      const html = buildResumeHtml(resume.content);
      res.removeHeader('X-Frame-Options');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *");
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      next(err);
    }
  },

  async previewCoverLetterHtml(req: Request, res: Response, next: NextFunction) {
    try {
      const coverLetter = await prisma.coverLetter.findFirst({
        where: { id: req.params.id, userId: req.user!.id },
        include: { user: { include: { masterProfile: true } } },
      });
      if (!coverLetter) {
        throw new NotFoundError('Cover letter not found');
      }

      const basics = (coverLetter.user?.masterProfile?.basics as any) || { name: coverLetter.user?.name || 'Applicant', links: [] };
      const html = buildCoverLetterHtml(coverLetter.content, basics, coverLetter.role, coverLetter.company);
      res.removeHeader('X-Frame-Options');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *");
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      next(err);
    }
  },
};
