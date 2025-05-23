import { logger } from '../../..';
import { steamProfileCache, statlockerProfileCache } from '../../cache';

export default () => {
  const MAX_MEMORY_MB = 4000;

  const used = process.memoryUsage().rss;
  const mem = used / 1024 / 1024;

  const usage = process.memoryUsage();

  logger.debug(`[MEMORY] RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`, {
    memory: usage.rss / 1024 / 1024,
  });

  if (mem > MAX_MEMORY_MB * 0.8) {
    logger.warn(`[MEMORY] High memory usage: flushing cache (>${MAX_MEMORY_MB * 0.8})...`);

    steamProfileCache.clear();
    statlockerProfileCache.clear();
  }
};
