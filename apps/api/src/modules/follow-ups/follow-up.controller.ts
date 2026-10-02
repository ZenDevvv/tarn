import { Request, Response, NextFunction } from 'express';
import { followUpService } from './follow-up.service';

export const followUpController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const followUp = await followUpService.createFollowUp(req.user!.id, req.body);
      return res.status(201).json({ data: followUp });
    } catch (error) {
      return next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const followUps = await followUpService.getFollowUps(req.user!.id, req.query as any);
      return res.status(200).json({ data: followUps });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const followUp = await followUpService.getFollowUpById(req.user!.id, req.params.id);
      return res.status(200).json({ data: followUp });
    } catch (error) {
      return next(error);
    }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const completed = await followUpService.completeFollowUp(req.user!.id, req.params.id);
      return res.status(200).json({ data: completed });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await followUpService.updateFollowUp(req.user!.id, req.params.id, req.body);
      return res.status(200).json({ data: updated });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await followUpService.deleteFollowUp(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  },
};
