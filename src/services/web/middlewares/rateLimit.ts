import rateLimit from 'express-rate-limit';
import { logger } from '../../..';
import RateLimitError from '../../../base/errors/RateLimitError';

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again later.',
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res, next) => {
    logger.warn('Steam auth rate limit hit', {
      ip: req.ip,
      route: req.originalUrl,
    });

    next(new RateLimitError('Too many Steam auth attempts. Please wait a bit and try again.'));
  },
});

export default limiter;
