import { logger } from '../..';
import { UserInteractions } from '../database/orm/init';
import { IUserInteractions } from '../database/orm/models/UserInteractions.model';

const usageBuffer: IUserInteractions[] = [];

const FLUSH_INTERVAL = 10 * 1000; // every 10s
const MAX_BUFFER_SIZE = 50;

function logInteraction(options: IUserInteractions) {
  usageBuffer.push(options);

  if (usageBuffer.length >= MAX_BUFFER_SIZE) {
    flush();
  }
}

async function flush() {
  if (usageBuffer.length === 0) return;

  try {
    await UserInteractions.bulkCreate(usageBuffer.map((item) => ({ ...item })));
    usageBuffer.length = 0;
  } catch (err) {
    logger.error('Failed to insert user interaction:', err);
  }
}

setInterval(flush, FLUSH_INTERVAL);

async function shutdownHandler() {
  logger.info('Flushing interaction logs before shutdown...');
  await flush();
  process.exit(0);
}

process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);

export default logInteraction;
