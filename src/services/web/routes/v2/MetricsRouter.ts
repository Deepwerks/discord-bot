import express from 'express';
import promClient from 'prom-client';

promClient.collectDefaultMetrics();
const router = express.Router();

router.get('/metrics', async (_req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

const uptimeGauge = new promClient.Gauge({
  name: 'bot_uptime_seconds',
  help: 'Bot uptime in seconds',
});
setInterval(() => uptimeGauge.set(process.uptime()), 5000);

export default router;
