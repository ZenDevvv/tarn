import { Router } from 'express';
import {
  updateMasterProfileSchema,
  uploadProfileResumeSchema,
  confirmImportMasterProfileSchema,
} from '@tracker/validation';
import { masterProfileController } from './master-profile.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validate';

export const masterProfileRouter = Router();

masterProfileRouter.use(authenticate);

masterProfileRouter.get('/', masterProfileController.get);
masterProfileRouter.put('/', validateBody(updateMasterProfileSchema), masterProfileController.update);
masterProfileRouter.post('/upload-resume', validateBody(uploadProfileResumeSchema), masterProfileController.uploadResume);
masterProfileRouter.post('/import-json', masterProfileController.importJson);
masterProfileRouter.post('/confirm-import', validateBody(confirmImportMasterProfileSchema), masterProfileController.confirmImport);
masterProfileRouter.get('/export-json', masterProfileController.exportJson);

