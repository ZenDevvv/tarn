import { Request, Response, NextFunction } from 'express';
import { companyService } from './company.service';

export const companyController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const companies = await companyService.getCompanies(req.user!.id, req.query as any);
      return res.status(200).json({ data: companies });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.getCompanyById(req.user!.id, req.params.id);
      return res.status(200).json({ data: company });
    } catch (error) {
      return next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.createCompany(req.user!.id, req.body);
      return res.status(201).json({ data: company });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.updateCompany(req.user!.id, req.params.id, req.body);
      return res.status(200).json({ data: company });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.deleteCompany(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  },
};
