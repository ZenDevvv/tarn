import { app } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from '@tracker/database';

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      healthUrl: `http://localhost:${env.PORT}/api/v1/health`,
    },
    `Tracker API server running on port ${env.PORT} (${env.NODE_ENV})`
  );
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, `Received ${signal}. Initiating graceful shutdown...`);

  // Force shutdown after 10 seconds timeout
  const forceTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during HTTP server close');
    } else {
      logger.info('HTTP server closed successfully.');
    }

    try {
      await prisma.$disconnect();
      logger.info('Prisma database connection disconnected cleanly.');
    } catch (dbErr) {
      logger.error({ dbErr }, 'Error disconnecting Prisma client');
    }

    process.exit(err ? 1 : 0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception detected');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection detected');
});
