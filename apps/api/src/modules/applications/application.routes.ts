import { Router } from 'express';
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
  submitResumeSchema,
  applicationFiltersSchema,
  parseJobUrlSchema,
  parseJobTextSchema,
} from '@tracker/validation';
import { applicationController } from './application.controller';
import { timelineRouter } from '../timeline/timeline.routes';
import { interviewController } from '../interviews/interview.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { scraperLimiter } from '../../middleware/rate-limit';

export const applicationRouter = Router();

applicationRouter.use(authenticate);

applicationRouter.post('/parse-job-url', scraperLimiter, validateBody(parseJobUrlSchema), applicationController.parseJobUrl);
applicationRouter.post('/parse-job-text', validateBody(parseJobTextSchema), applicationController.parseJobText);
applicationRouter.post('/', validateBody(createApplicationSchema), applicationController.create);


applicationRouter.get('/', validateQuery(applicationFiltersSchema), applicationController.list);
applicationRouter.get('/:id', applicationController.getById);
applicationRouter.patch('/:id', validateBody(updateApplicationSchema), applicationController.update);
applicationRouter.patch('/:id/status', validateBody(updateApplicationStatusSchema), applicationController.updateStatus);
applicationRouter.post('/:id/submitted-resume', validateBody(submitResumeSchema), applicationController.submitResume);
applicationRouter.delete('/:id', applicationController.archive);
applicationRouter.get('/:id/interviews', interviewController.listByApplication);

// Mount timeline routes
applicationRouter.use('/', timelineRouter);
