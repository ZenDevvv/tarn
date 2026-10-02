import { Router } from 'express';
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateStatusSchema,
  applicationFiltersSchema,
  parseJobUrlSchema,
} from '@tracker/validation';
import { applicationController } from './application.controller';
import { timelineRouter } from '../timeline/timeline.routes';
import { interviewController } from '../interviews/interview.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';

export const applicationRouter = Router();

applicationRouter.use(authenticate);

applicationRouter.post('/parse-job-url', validateBody(parseJobUrlSchema), applicationController.parseJobUrl);
applicationRouter.post('/', validateBody(createApplicationSchema), applicationController.create);

applicationRouter.get('/', validateQuery(applicationFiltersSchema), applicationController.list);
applicationRouter.get('/:id', applicationController.getById);
applicationRouter.patch('/:id', validateBody(updateApplicationSchema), applicationController.update);
applicationRouter.patch('/:id/status', validateBody(updateStatusSchema), applicationController.updateStatus);
applicationRouter.delete('/:id', applicationController.archive);
applicationRouter.get('/:id/interviews', interviewController.listByApplication);

// Mount timeline routes
applicationRouter.use('/', timelineRouter);
