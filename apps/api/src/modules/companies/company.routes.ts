import { Router } from 'express';
import {
  createCompanySchema,
  updateCompanySchema,
  companyFiltersSchema,
} from '@tracker/validation';
import { companyController } from './company.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';

export const companyRouter = Router();

companyRouter.use(authenticate);

companyRouter.get('/', validateQuery(companyFiltersSchema), companyController.list);
companyRouter.get('/:id', companyController.getById);
companyRouter.post('/', validateBody(createCompanySchema), companyController.create);
companyRouter.patch('/:id', validateBody(updateCompanySchema), companyController.update);
companyRouter.delete('/:id', companyController.delete);
