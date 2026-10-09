import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';

export const settingsController = {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.getSettings(req.user!.id);
      return res.json({ data });
    } catch (error) {
      return next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.updateProfile(req.user!.id, req.body);
      return res.json({
        data,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.updatePreferences(req.user!.id, req.body);
      return res.json({
        data,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await settingsService.changePassword(req.user!.id, req.body);
      return res.json({
        message: 'Password updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const exportData = await settingsService.exportUserData(req.user!.id);
      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="job-tracker-export-${dateStr}.json"`
      );
      return res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      return next(error);
    }
  },

  async resetAccountData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.resetUserData(req.user!.id);
      return res.json({
        data,
        message: 'Account data has been reset successfully',
      });
    } catch (error) {
      return next(error);
    }
  },
};
