import { Router } from 'express';
import { registerSchema, loginSchema } from '@tracker/validation';
import { authController } from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rate-limit';

export const authRouter = Router();

// Apply authLimiter specifically to brute-force sensitive routes (login & register)
authRouter.post('/register', authLimiter, validateBody(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validateBody(loginSchema), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.getMe);
