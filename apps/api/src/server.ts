import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Tracker API server running on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`🔗 Health check: http://localhost:${env.PORT}/api/v1/health`);
});

const gracefulShutdown = () => {
  console.log('Stopping server gracefully...');
  server.close(() => {
    console.log('Server terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
