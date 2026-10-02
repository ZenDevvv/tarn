import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getDashboardAnalytics(req.user!.id);
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  },
};
