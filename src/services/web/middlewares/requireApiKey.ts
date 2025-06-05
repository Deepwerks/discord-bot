import { NextFunction, Request, Response } from 'express';
import config from '../../../config';

export const requireMetricsApiKey = (req: Request, res: Response, next: NextFunction) => {
  const incomingKey = req.header('x-api-key');

  if (!config.metrics_api_key || incomingKey !== config.metrics_api_key) {
    return next(new Error('Unauthorized'));
  }

  next();
};
