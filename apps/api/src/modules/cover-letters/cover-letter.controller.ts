import { Request, Response, NextFunction } from 'express';
import { coverLetterService } from './cover-letter.service';

export const coverLetterController = {
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const letters = await coverLetterService.listAll(req.user!.id);
      res.json({ data: letters });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const letter = await coverLetterService.getById(req.user!.id, req.params.id);
      res.json({ data: letter });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const letter = await coverLetterService.update(req.user!.id, req.params.id, req.body);
      res.json({ data: letter, message: 'Cover letter updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await coverLetterService.delete(req.user!.id, req.params.id);
      res.json({ data: { success: true }, message: 'Cover letter deleted' });
    } catch (err) {
      next(err);
    }
  },

  async listForApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const letters = await coverLetterService.listForApplication(req.user!.id, req.params.applicationId);
      res.json({ data: letters });
    } catch (err) {
      next(err);
    }
  },
};
