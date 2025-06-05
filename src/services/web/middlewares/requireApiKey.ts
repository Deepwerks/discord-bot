import { NextFunction, Request, Response } from 'express';
import config from '../../../config';

export const requireMetricsApiKey = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!config.metrics_api_key || token !== config.metrics_api_key) {
    return next(new Error('Unauthorized'));
  }

  next();
};
