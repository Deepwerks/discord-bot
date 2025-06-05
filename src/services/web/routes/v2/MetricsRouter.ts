import express from 'express';
import { register } from '../../../metrics';
import { requireMetricsApiKey } from '../../middlewares/requireApiKey';

const router = express.Router();

router.get('/metrics', requireMetricsApiKey, async (_req, res, next) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metricsPayload = await register.metrics();
    res.end(metricsPayload);
  } catch (e) {
    next(e);
  }
});

export default router;
