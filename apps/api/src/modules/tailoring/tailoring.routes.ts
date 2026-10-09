import { Router } from 'express';
import { generateTailoringSchema } from '@tracker/validation';
import { tailoringController } from './tailoring.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validate';
import { tailoringLimiter } from '../../middleware/rate-limit';

export const tailoringRouter = Router();

tailoringRouter.use(authenticate);

tailoringRouter.get('/quota', tailoringController.getQuota);
tailoringRouter.get('/applications/:id/analysis', tailoringController.getAnalysis);
tailoringRouter.post('/applications/:id/generate', tailoringLimiter, validateBody(generateTailoringSchema), tailoringController.generatePackage);
tailoringRouter.get('/resumes/:id/preview-html', tailoringController.previewResumeHtml);
tailoringRouter.get('/cover-letters/:id/preview-html', tailoringController.previewCoverLetterHtml);

