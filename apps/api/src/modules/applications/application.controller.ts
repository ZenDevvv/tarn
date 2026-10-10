import { Request, Response, NextFunction } from 'express';
import { applicationService } from './application.service';
import { jobParserService } from './job-parser.service';

export const applicationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.createApplication(req.user!.id, req.body);
      return res.status(201).json({ data: application });
    } catch (error) {
      return next(error);
    }
  },

  async parseJobUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobParserService.parseJobUrl(req.body.url);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  },

  parseJobText(req: Request, res: Response, next: NextFunction) {
    try {
      const result = jobParserService.parseJobText(req.body.text, req.body.sourceUrl);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  },


  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.getApplications(req.user!.id, req.query as any);
      return res.status(200).json({
        data: result.items,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.getApplicationById(req.user!.id, req.params.id);
      return res.status(200).json({ data: application });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await applicationService.updateApplication(req.user!.id, req.params.id, req.body);
      return res.status(200).json({ data: updated });
    } catch (error) {
      return next(error);
    }
  },

  async submitPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await applicationService.submitPackage(
        req.user!.id,
        req.params.id,
        req.body?.resumeId,
        req.body?.coverLetterId
      );
      return res.status(200).json({ data: updated });
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const statusParam = req.body.statusId || req.body.status;
      const updated = await applicationService.updateStatus(req.user!.id, req.params.id, statusParam);
      return res.status(200).json({ data: updated });
    } catch (error) {
      return next(error);
    }
  },

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.archiveApplication(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  },
};

