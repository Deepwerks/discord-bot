import CustomClient from './base/classes/CustomClient';
import config from './config';
import DeadlockAssetsClient from './services/clients/DeadlockAssetsClient';
import DeadlockClient from './services/clients/DeadlockClient';
import RedditClient from './services/clients/RedditClient';
import StatlockerClient from './services/clients/StatlockerClient';
import { logtailLogger } from './services/logger';
import { JobScheduler } from './services/scheduler';
import CheckDeadlockPatches from './services/scheduler/jobs/CheckDeadlockPatches';
import RenewSubscriptions from './services/scheduler/jobs/RenewSubscriptions';
import AIAssistantClient from './services/clients/AIAssistantClient';
import RefreshDeadlockAvgStats from './services/scheduler/jobs/RefreshDeadlockAvgStats';

const logger = logtailLogger;

const useDeadlockClient = new DeadlockClient({
  config,
  baseURL: config.deadlock_api_url,
});
const useAssetsClient = new DeadlockAssetsClient({
  config,
  baseURL: config.deadlock_assets_api_url,
});
const useStatlockerClient = new StatlockerClient({
  config,
  baseURL: config.statlocker_api_url,
});
const useRedditClient = new RedditClient({
  config,
});
const useAIAssistantClient = new AIAssistantClient({
  config,
});

(async () => {
  const client = await new CustomClient().Init();

  const scheduler = new JobScheduler()
    .addJob('CheckDeadlockPatches', '0 0 3 * * *', CheckDeadlockPatches)
    .addJob('CheckDeadlockPatchesAfternoon', '0 0 15 * * *', CheckDeadlockPatches)
    .addJob('RenewSubscriptions', '0 0 * * *', () => RenewSubscriptions(client))
    .addJob('RefreshDeadlockAvgStats', '0 */6 * * *', RefreshDeadlockAvgStats);
  scheduler.startJobs();
})();

export {
  useDeadlockClient,
  useAssetsClient,
  useStatlockerClient,
  useRedditClient,
  useAIAssistantClient,
  logger,
};

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
