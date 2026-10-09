import { Router } from 'express';
import { updateCoverLetterSchema } from '@tracker/validation';
import { coverLetterController } from './cover-letter.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validate';

export const coverLetterRouter = Router();

coverLetterRouter.use(authenticate);

coverLetterRouter.get('/', coverLetterController.listAll);
coverLetterRouter.get('/:id', coverLetterController.getById);
coverLetterRouter.patch('/:id', validateBody(updateCoverLetterSchema), coverLetterController.update);
coverLetterRouter.delete('/:id', coverLetterController.delete);
coverLetterRouter.get('/application/:applicationId', coverLetterController.listForApplication);
