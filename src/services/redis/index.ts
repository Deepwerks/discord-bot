import { createClient, RedisClientType } from 'redis';
import { logger } from '../..';

export const redisClient: RedisClientType = createClient();

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

export async function initRedis() {
  await redisClient.connect().then(() => {
    logger.info('Connected to Redis!');
  });
}
