import { logger } from '../..';
import UserInteractionSchema, {
  InteractionType,
  IUserInteractionSchema,
} from '../../base/schemas/UserInteractionSchema';

const usageBuffer: IUserInteractionSchema[] = [];

const FLUSH_INTERVAL = 10 * 1000; // flush every 10s
const MAX_BUFFER_SIZE = 50;

function logInteraction(
  interactionName: string,
  interactionType: InteractionType,
  userId: string,
  guildId: string | null
) {
  usageBuffer.push({
    interactionName,
    interactionType,
    userId,
    guildId,
    timestamp: new Date(),
  });

  if (usageBuffer.length >= MAX_BUFFER_SIZE) {
    flush();
  }
}

async function flush() {
  if (usageBuffer.length === 0) return;

  try {
    await UserInteractionSchema.insertMany(usageBuffer);
    usageBuffer.length = 0;
  } catch (err) {
    logger.error('Failed to insert command usage:', err);
  }
}

setInterval(flush, FLUSH_INTERVAL);

async function shutdownHandler() {
  logger.info('Flushing usage logs before shutdown...');
  await flush();
  process.exit(0);
}

process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);

export default logInteraction;
