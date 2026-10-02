import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await authService.register(req.body);
      res.cookie('token', token, COOKIE_OPTIONS);
      return res.status(201).json({
        data: {
          user,
          message: 'Account registered successfully',
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await authService.login(req.body);
      res.cookie('token', token, COOKIE_OPTIONS);
      return res.status(200).json({
        data: {
          user,
          message: 'Logged in successfully',
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
    });
    return res.status(200).json({
      data: {
        message: 'Logged out successfully',
      },
    });
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.id);
      return res.status(200).json({
        data: { user },
      });
    } catch (error) {
      return next(error);
    }
  },
};
