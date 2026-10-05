import { Router } from 'express';
import {
  createContactSchema,
  updateContactSchema,
  contactFiltersSchema,
} from '@tracker/validation';
import { contactController } from './contact.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';

export const contactRouter = Router();

contactRouter.use(authenticate);

contactRouter.get('/', validateQuery(contactFiltersSchema), contactController.list);
contactRouter.get('/:id', contactController.getById);
contactRouter.post('/', validateBody(createContactSchema), contactController.create);
contactRouter.patch('/:id', validateBody(updateContactSchema), contactController.update);
contactRouter.delete('/:id', contactController.delete);
