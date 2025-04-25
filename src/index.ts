import CustomClient from "./base/classes/CustomClient";
import { DeadlockClient } from "./services/clients/DeadlockClient";
import SteamClient from "./services/clients/SteamClient";
import config from "./config";
import { DeadlockAssetsClient } from "./services/clients/DeadlockAssetsClient";
import logger from "./services/logger";
import Bottleneck from "bottleneck";
import StatlockerClient from "./services/clients/StatlockerClient";
import {
  deadlockAssetsDefaultCache,
  deadlockAssetsHeroCache,
  statlockerProfileCache,
  steamProfileCache,
} from "./services/cache";

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
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
  const usage = memoryUsage.heapUsed / memoryUsage.heapTotal;

  logger.info(
    `Heap Used: ${heapUsedMB} MB / ${heapTotalMB} MB (${(usage * 100).toFixed(
      2
    )}%)`
  );

  if (usage > 0.8) {
    logger.warn("Memory usage above 80%, flushing node-cache...");

    steamProfileCache.clear();
    statlockerProfileCache.clear();
  }
}, 10000);
