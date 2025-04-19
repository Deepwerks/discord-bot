import CustomClient from "./base/classes/CustomClient";
import { DeadlockClient } from "./services/clients/DeadlockClient";
import SteamClient from "./services/clients/SteamClient";
import config from "./config";
import { DeadlockAssetsClient } from "./services/clients/DeadlockAssetsClient";
import logger from "./services/logger";

const useSteamClient = new SteamClient({
  apiKey: config.steam_api_key,
  baseURL: config.steam_api_url,
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

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

export { useSteamClient, useDeadlockClient, useAssetsClient };
