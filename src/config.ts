import dotenv from "dotenv";
dotenv.config();

import IConfig from "./base/interfaces/IConfig";
import logger from "./services/logger";

let config: IConfig | null = null;

let running_env = process.env.NODE_ENV;

if (running_env === undefined) {
  logger.error("NODE_ENV is undefined. Shutting down...");
  process.exit(1);
}

switch (running_env) {
  case "production":
    config = {
      running_env,
      discord_bot_token: process.env.DISCORD_BOT_TOKEN!,
      discord_client_id: process.env.DISCORD_CLIENT_ID!,
      mongodb_url: process.env.MONGODB_URL!,
      dev_guild_id: process.env.DEV_GUILD_ID!,
      developer_user_ids: ["282548643142172672"],
      port: Number(process.env.PORT!),
    };
    break;
  case "development":
    dotenv.config({ path: "dev.env" });

    config = {
      running_env,
      discord_bot_token: process.env.DISCORD_BOT_TOKEN!,
      discord_client_id: process.env.DISCORD_CLIENT_ID!,
      mongodb_url: process.env.MONGODB_URL!,
      dev_guild_id: process.env.DEV_GUILD_ID!,
      developer_user_ids: ["282548643142172672"],
      port: Number(process.env.PORT!),
    };
    break;
  case "test":
    config = {
      running_env,
      discord_bot_token: "nokedli",
      discord_client_id: "123",
      mongodb_url: "mongodb:aaa",
      dev_guild_id: "12345",
      developer_user_ids: ["23423"],
      port: 9000,
    };
    break;

  default:
    logger.error(
      "Failed to initialize config: no valid environment found. Shutting down..."
    );
    process.exit(1);
}

if (config === null) {
  logger.error("Failed to initialize config: config is null. Shutting down...");
  process.exit(1);
}

export default config!;
