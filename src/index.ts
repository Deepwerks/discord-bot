import CustomClient from './base/classes/CustomClient';
import { DeadlockClient } from './services/clients/DeadlockClient';
import SteamClient from './services/clients/SteamClient';
import config from './config';
import { DeadlockAssetsClient } from './services/clients/DeadlockAssetsClient';
import Bottleneck from 'bottleneck';
import StatlockerClient from './services/clients/StatlockerClient';
import { logtailLogger } from './services/logger';
import RedditClient from './services/clients/RedditClient';
import { JobScheduler } from './services/scheduler';
import CheckDeadlockPatches from './services/scheduler/jobs/CheckDeadlockPatches';
import MemoryCheck from './services/scheduler/jobs/MemoryCheck';

const logger = logtailLogger;

const useSteamClient = new SteamClient({
  apiKey: config.steam_api_key,
  baseURL: config.steam_api_url,
  limiter: new Bottleneck({
    maxConcurrent: 1,
    minTime: 333,
  }),
});
const useDeadlockClient = new DeadlockClient({
  apiKey: config.deadlock_api_key,
  baseURL: config.deadlock_api_url,
});
const useAssetsClient = new DeadlockAssetsClient({
  apiKey: config.deadlock_api_key,
  baseURL: config.deadlock_assets_api_url,
});
const useStatlockerClient = new StatlockerClient({
  baseURL: config.statlocker_api_url,
});
const useRedditClient = new RedditClient({});

new CustomClient().Init();

const scheduler = new JobScheduler()
  .addJob('CheckDeadlockPatches', '0 0 3 * * *', CheckDeadlockPatches)
  .addJob('CheckDeadlockPatchesAfternoon', '0 0 15 * * *', CheckDeadlockPatches)
  .addJob('MemoryCheck', '* * * * *', MemoryCheck);
scheduler.startJobs();

export {
  useSteamClient,
  useDeadlockClient,
  useAssetsClient,
  useStatlockerClient,
  useRedditClient,
  logger,
};

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
