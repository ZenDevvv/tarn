import { Router } from 'express';
import { createFollowUpSchema, updateFollowUpSchema, followUpFilterSchema } from '@tracker/validation';
import { followUpController } from './follow-up.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';

export const followUpRouter = Router();

followUpRouter.use(authenticate);

followUpRouter.post('/', validateBody(createFollowUpSchema), followUpController.create);
followUpRouter.get('/', validateQuery(followUpFilterSchema), followUpController.list);
followUpRouter.get('/:id', followUpController.getById);
followUpRouter.patch('/:id/complete', followUpController.complete);
followUpRouter.patch('/:id', validateBody(updateFollowUpSchema), followUpController.update);
followUpRouter.delete('/:id', followUpController.delete);
