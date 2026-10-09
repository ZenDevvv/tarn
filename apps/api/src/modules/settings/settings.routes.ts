import { Router } from 'express';
import {
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
} from '@tracker/validation';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validate';

export const settingsRouter = Router();

settingsRouter.use(authenticate);

settingsRouter.get('/', settingsController.getSettings);
settingsRouter.patch('/profile', validateBody(updateProfileSchema), settingsController.updateProfile);
settingsRouter.patch(
  '/preferences',
  validateBody(updatePreferencesSchema),
  settingsController.updatePreferences
);
settingsRouter.post('/password', validateBody(changePasswordSchema), settingsController.changePassword);
settingsRouter.get('/export', settingsController.exportData);
settingsRouter.post('/reset', settingsController.resetAccountData);

