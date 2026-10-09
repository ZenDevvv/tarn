import { Request, Response, NextFunction } from 'express';
import { masterProfileService } from './master-profile.service';

export const masterProfileController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await masterProfileService.getProfile(req.user!.id);
      res.json({ data: profile });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await masterProfileService.updateProfile(req.user!.id, req.body);
      res.json({ data: profile });
    } catch (err) {
      next(err);
    }
  },

  async uploadResume(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await masterProfileService.uploadResume(req.user!.id, req.body);
      res.json({ data: profile, message: 'Resume parsed and profile updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async importJson(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await masterProfileService.importJson(req.user!.id, req.body);
      res.json({ data: profile, message: 'Profile imported successfully' });
    } catch (err) {
      next(err);
    }
  },

  async exportJson(req: Request, res: Response, next: NextFunction) {
    try {
      const json = await masterProfileService.exportJson(req.user!.id);
      res.json({ data: json });
    } catch (err) {
      next(err);
    }
  },
};
