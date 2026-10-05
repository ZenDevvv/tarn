import { Request, Response, NextFunction } from 'express';
import { contactService } from './contact.service';

export const contactController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const contacts = await contactService.getContacts(req.user!.id, req.query as any);
      return res.status(200).json({ data: contacts });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await contactService.getContactById(req.user!.id, req.params.id);
      return res.status(200).json({ data: contact });
    } catch (error) {
      return next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await contactService.createContact(req.user!.id, req.body);
      return res.status(201).json({ data: contact });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await contactService.updateContact(req.user!.id, req.params.id, req.body);
      return res.status(200).json({ data: contact });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.deleteContact(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  },
};
