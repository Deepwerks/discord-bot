import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const apiRequestCounter = new client.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'url', 'status', 'success'] as const,
});

const apiRequestDuration = new client.Histogram({
  name: 'api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['method', 'url', 'status'] as const,
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

const apiRequestErrors = new client.Counter({
  name: 'api_request_errors_total',
  help: 'Number of API request errors',
  labelNames: ['method', 'url', 'type'] as const,
});

const commandExecutions = new client.Counter({
  name: 'discord_interactions_total',
  help: 'Total number of interactions received',
  labelNames: ['command'],
});

const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache'],
});

const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache'],
});

const cacheEntries = new client.Gauge({
  name: 'cache_entries',
  help: 'Current number of items in cache',
  labelNames: ['cache'],
});

register.registerMetric(apiRequestCounter);
register.registerMetric(apiRequestDuration);
register.registerMetric(apiRequestErrors);
register.registerMetric(commandExecutions);
register.registerMetric(cacheEntries);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);

export {
  register,
  apiRequestCounter,
  apiRequestDuration,
  apiRequestErrors,
  commandExecutions,
  cacheEntries,
  cacheHits,
  cacheMisses,
};
