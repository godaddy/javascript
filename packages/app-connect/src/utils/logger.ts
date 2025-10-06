import pino from 'pino';

/**
 * Configure pino logger for structured logging
 * Creates JSON formatted logs suitable for ECS and cloud environments
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  // For ECS/production environments, use JSON format
  // For test environments, also use JSON format to avoid transport issues
  ...(process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
          },
        },
      }),
});

export default logger;
