import { Request, Response, NextFunction } from 'express';
import { resumeService } from './resume.service';

export const resumeController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const resumes = await resumeService.listResumes(req.user!.id, req.query as any);
      return res.status(200).json({ data: resumes });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const resume = await resumeService.getResume(req.user!.id, req.params.id);
      return res.status(200).json({ data: resume });
    } catch (error) {
      return next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const resume = await resumeService.createResume(req.user!.id, req.body);
      return res.status(201).json({ data: resume });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const resume = await resumeService.updateResume(req.user!.id, req.params.id, req.body);
      return res.status(200).json({ data: resume });
    } catch (error) {
      return next(error);
    }
  },

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const resume = await resumeService.setDefaultResume(req.user!.id, req.params.id);
      return res.status(200).json({ data: resume });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.deleteResume(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.uploadFile(req.user!.id, req.body);
      return res.status(201).json({ data: result });
    } catch (error) {
      return next(error);
    }
  },
};
