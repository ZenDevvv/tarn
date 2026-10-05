import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get('/dashboard', analyticsController.getDashboard);
analyticsRouter.get('/overview', analyticsController.getOverview);

