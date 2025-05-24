import { NextFunction, Request, Response } from 'express';
import config from '../../../config';
import { logger } from '../../..';

export default (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = hasStatus(err) ? err.status : res.statusCode !== 200 ? res.statusCode : 500;

  if (config.running_env !== 'production') {
    logger.error(`[${req.method}] ${req.originalUrl} →`, err);
  }

  if (typeof err === 'string') {
    res.status(status).json({ error: err });
    return;
  }

  if (err instanceof Error) {
    res.status(status).json({
      error: err.message,
      stack: config.running_env !== 'production' ? err.stack : undefined,
    });
    return;
  }

  res.status(status).json({
    error: 'Unexpected error',
  });
};

function hasStatus(err: unknown): err is { status: number } {
  return (
    typeof err === 'object' && err !== null && 'status' in err && typeof err.status === 'number'
  );
}
