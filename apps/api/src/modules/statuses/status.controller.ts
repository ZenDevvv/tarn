import { Request, Response, NextFunction } from 'express';
import { statusService } from './status.service';

export const statusController = {
  async getStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await statusService.getStatuses(req.user!.id);
      return res.json({ data });
    } catch (error) {
      return next(error);
    }
  },

  async createStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await statusService.createStatus(req.user!.id, req.body);
      return res.status(201).json({
        data,
        message: 'Status created successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await statusService.updateStatus(req.user!.id, req.params.id, req.body);
      return res.json({
        data,
        message: 'Status updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  async reorderStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await statusService.reorderStatuses(req.user!.id, req.body);
      return res.json({
        data,
        message: 'Statuses reordered successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  async deleteStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await statusService.deleteStatus(req.user!.id, req.params.id);
      return res.json(data);
    } catch (error) {
      return next(error);
    }
  },
};
