import { Router } from 'express';
import {
  createInterviewSchema,
  updateInterviewSchema,
  updateInterviewStatusSchema,
  interviewFilterSchema,
} from '@tracker/validation';
import { interviewController } from './interview.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';

export const interviewRouter = Router();

interviewRouter.use(authenticate);

interviewRouter.post('/', validateBody(createInterviewSchema), interviewController.create);
interviewRouter.get('/', validateQuery(interviewFilterSchema), interviewController.list);
interviewRouter.get('/:id', interviewController.getById);
interviewRouter.patch('/:id', validateBody(updateInterviewSchema), interviewController.update);
interviewRouter.patch('/:id/status', validateBody(updateInterviewStatusSchema), interviewController.updateStatus);
interviewRouter.delete('/:id', interviewController.delete);
