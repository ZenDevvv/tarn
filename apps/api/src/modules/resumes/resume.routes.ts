import { Router } from 'express';
import {
  createResumeSchema,
  updateResumeSchema,
  resumeFiltersSchema,
  uploadResumeFileSchema,
} from '@tracker/validation';
import { resumeController } from './resume.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';

export const resumeRouter = Router();

resumeRouter.use(authenticate);

resumeRouter.get('/', validateQuery(resumeFiltersSchema), resumeController.list);
resumeRouter.post('/upload', validateBody(uploadResumeFileSchema), resumeController.upload);
resumeRouter.get('/:id', resumeController.getById);
resumeRouter.post('/', validateBody(createResumeSchema), resumeController.create);
resumeRouter.patch('/:id', validateBody(updateResumeSchema), resumeController.update);
resumeRouter.post('/:id/default', resumeController.setDefault);
resumeRouter.post('/:id/canonical', resumeController.setCanonical);
resumeRouter.delete('/:id', resumeController.delete);
