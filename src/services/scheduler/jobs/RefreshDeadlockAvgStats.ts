import { logger, useDeadlockClient } from '../../..';
import { deadlockAvgStatsStore } from '../../redis/stores/DeadlockAvgStatsStore';

export default async () => {
  try {
    logger.info('Refreshing Deadlock stats...');
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const averages = await useDeadlockClient.SQLService.GetAverageMatchStats(oneDayAgo, now);
    await deadlockAvgStatsStore.set(averages);
  } catch (error) {
    logger.error('Error refreshing DeadlockAvgStats:', error);
  }
};
