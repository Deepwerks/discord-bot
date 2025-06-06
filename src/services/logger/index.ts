import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import config from '../../config';

const { combine, timestamp, printf, errors, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logtail = new Logtail(config.logtail_source_token, {
  endpoint: config.logtail_endpoint,
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    ),
  }),
];

transports.push(new LogtailTransport(logtail));

export const logtailLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(errors({ stack: true })),
  transports,
  exitOnError: false,
  defaultMeta: {
    service: 'DeadlockAssistant',
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
});
