import CustomClient from "./base/classes/CustomClient";
import { DeadlockClient } from "./services/clients/DeadlockClient";
import SteamClient from "./services/clients/SteamClient";
import config from "./config";
import { DeadlockAssetsClient } from "./services/clients/DeadlockAssetsClient";
import logger from "./services/logger";
import Bottleneck from "bottleneck";

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

new CustomClient().Init();

export { useSteamClient, useDeadlockClient, useAssetsClient };

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("exit", (code) => {
  console.log(`About to exit with code: ${code}`);
});
