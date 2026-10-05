import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { analyticsQuerySchema } from '@tracker/validation';

export const analyticsController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getDashboardAnalytics(req.user!.id);
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  },

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedQuery = analyticsQuerySchema.safeParse(req.query);
      const range = parsedQuery.success ? parsedQuery.data.range : 'all';
      const data = await analyticsService.getAnalyticsOverview(req.user!.id, range);
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  },
};

