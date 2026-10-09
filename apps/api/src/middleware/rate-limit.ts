import { rateLimit, Options } from 'express-rate-limit';
import { env } from '../config/env';

export interface AuthLimiterConfig {
  windowMs: number;
  limit: number;
}

export function getAuthLimiterConfig(nodeEnv: string): AuthLimiterConfig {
  if (nodeEnv === 'development') {
    return {
      windowMs: 15 * 60 * 1000,
      limit: 100, // Generous 100 attempts for local development and UI debugging
    };
  }
  // Production & default
  return {
    windowMs: 15 * 60 * 1000,
    limit: 10, // Strict 10 attempts in production against brute force attacks
  };
}

export function createAuthLimiter(overrides?: Partial<Options>) {
  const config = getAuthLimiterConfig(env.NODE_ENV);
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
      },
    },
    ...overrides,
  });
}

export const authLimiter = createAuthLimiter();

export const scraperLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Scraping rate limit exceeded. Please wait a minute before trying again.',
    },
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please slow down and try again later.',
    },
  },
});

export const tailoringLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Tailoring rate limit exceeded. Please wait a few minutes before trying again.',
    },
  },
});

