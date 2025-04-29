import CustomClient from "./base/classes/CustomClient";
import { DeadlockClient } from "./services/clients/DeadlockClient";
import SteamClient from "./services/clients/SteamClient";
import config from "./config";
import { DeadlockAssetsClient } from "./services/clients/DeadlockAssetsClient";
import Bottleneck from "bottleneck";
import StatlockerClient from "./services/clients/StatlockerClient";
import {
  deadlockAssetsDefaultCache,
  deadlockAssetsHeroCache,
  statlockerProfileCache,
  steamProfileCache,
} from "./services/cache";
import { logtailLogger } from "./services/logger";

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

new CustomClient().Init();

export {
  useSteamClient,
  useDeadlockClient,
  useAssetsClient,
  useStatlockerClient,
  logger,
};

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("exit", (code) => {
  console.log(`About to exit with code: ${code}`);
});

setInterval(() => {
  const MAX_MEMORY_MB = 512;

  const used = process.memoryUsage().rss;
  const mem = used / 1024 / 1024;

  const usage = process.memoryUsage();

  logger.debug(`[MEMORY] RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`, {
    memory: usage.rss / 1024 / 1024,
  });

  if (mem > MAX_MEMORY_MB * 0.8) {
    logger.warn(
      `[MEMORY] High memory usage: flushing cache (>${MAX_MEMORY_MB * 0.8})...`
    );

    steamProfileCache.clear();
    statlockerProfileCache.clear();
    deadlockAssetsHeroCache.clear();
    deadlockAssetsDefaultCache.clear();
  }
}, 60_000);
