import { logger } from '../..';
import { FailedUserInteractions } from '../database/orm/init';
import { IFailedUserInteractions } from '../database/orm/models/FailedUserInteractions.model';

const usageBuffer: IFailedUserInteractions[] = [];

const FLUSH_INTERVAL = 10 * 1000; // every 10s
const MAX_BUFFER_SIZE = 50;

function logFailedInteraction(options: IFailedUserInteractions) {
  logger.error(`[INTERACTION ERROR] ${options.userId} used ${options.name}`, options.error);
  usageBuffer.push(options);

  if (usageBuffer.length >= MAX_BUFFER_SIZE) {
    flush();
  }
}

async function flush() {
  if (usageBuffer.length === 0) return;

  try {
    await FailedUserInteractions.bulkCreate(usageBuffer.map((item) => ({ ...item })));
    usageBuffer.length = 0;
  } catch (err) {
    logger.error('Failed to insert failed user interaction:', err);
  }
}

setInterval(flush, FLUSH_INTERVAL);

async function shutdownHandler() {
  logger.info('Flushing failed interaction logs before shutdown...');
  await flush();
  process.exit(0);
}

process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);

export default logFailedInteraction;
