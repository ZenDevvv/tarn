import { Router } from 'express';
import {
  createStatusSchema,
  updateStatusSchema,
  reorderStatusesSchema,
} from '@tracker/validation';
import { statusController } from './status.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validate';

export const statusRouter = Router();

statusRouter.use(authenticate);

statusRouter.get('/', statusController.getStatuses);
statusRouter.post('/', validateBody(createStatusSchema), statusController.createStatus);
statusRouter.put('/reorder', validateBody(reorderStatusesSchema), statusController.reorderStatuses);
statusRouter.patch('/:id', validateBody(updateStatusSchema), statusController.updateStatus);
statusRouter.delete('/:id', statusController.deleteStatus);
