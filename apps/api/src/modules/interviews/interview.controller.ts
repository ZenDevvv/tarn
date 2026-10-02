import { Request, Response, NextFunction } from 'express';
import { interviewService } from './interview.service';

export const interviewController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await interviewService.createInterview(req.user!.id, req.body);
      return res.status(201).json({ data: interview });
    } catch (error) {
      return next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const interviews = await interviewService.getInterviews(req.user!.id, req.query as any);
      return res.status(200).json({ data: interviews });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await interviewService.getInterviewById(req.user!.id, req.params.id);
      return res.status(200).json({ data: interview });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await interviewService.updateInterview(req.user!.id, req.params.id, req.body);
      return res.status(200).json({ data: updated });
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await interviewService.updateInterviewStatus(req.user!.id, req.params.id, req.body);
      return res.status(200).json({ data: updated });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.deleteInterview(req.user!.id, req.params.id);
      return res.status(200).json({ data: { success: result } });
    } catch (error) {
      return next(error);
    }
  },

  async listByApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const applicationId = req.params.applicationId || req.params.id;
      const interviews = await interviewService.getInterviewsByApplication(req.user!.id, applicationId);
      return res.status(200).json({ data: interviews });
    } catch (error) {
      return next(error);
    }
  },
};
