import dotenv from "dotenv";
dotenv.config();

import IConfig from "./base/interfaces/IConfig";

let config: IConfig | null = null;

let running_env = process.env.NODE_ENV;

if (running_env === undefined) {
  console.error("NODE_ENV is undefined. Shutting down...");
  process.exit(1);
}

running_env = running_env.trim();
dotenv.config({ path: "dev.env" });

switch (running_env) {
  case "production":
    config = {
      running_env,
      discord_bot_token_prod: process.env.DISCORD_BOT_TOKEN_PROD!,
      discord_client_id_prod: process.env.DISCORD_CLIENT_ID_PROD!,
      mongodb_url_prod: process.env.MONGODB_URL_PROD!,
      discord_bot_token_dev: process.env.DISCORD_BOT_TOKEN_DEV!,
      discord_client_id_dev: process.env.DISCORD_CLIENT_ID_DEV!,
      mongodb_url_dev: process.env.MONGODB_URL_DEV!,
      dev_guild_id: process.env.DEV_GUILD_ID!,
      developer_user_ids: ["282548643142172672"],
    };
    break;
  case "development":
    config = {
      running_env,
      discord_bot_token_prod: process.env.DISCORD_BOT_TOKEN_PROD!,
      discord_client_id_prod: process.env.DISCORD_CLIENT_ID_PROD!,
      mongodb_url_prod: process.env.MONGODB_URL_PROD!,
      discord_bot_token_dev: process.env.DISCORD_BOT_TOKEN_DEV!,
      discord_client_id_dev: process.env.DISCORD_CLIENT_ID_DEV!,
      mongodb_url_dev: process.env.MONGODB_URL_DEV!,
      dev_guild_id: process.env.DEV_GUILD_ID!,
      developer_user_ids: ["282548643142172672"],
    };
    break;
  case "test":
    config = {
      running_env,
      discord_bot_token_prod: process.env.DISCORD_BOT_TOKEN_PROD!,
      discord_client_id_prod: process.env.DISCORD_CLIENT_ID_PROD!,
      mongodb_url_prod: process.env.MONGODB_URL_PROD!,
      discord_bot_token_dev: process.env.DISCORD_BOT_TOKEN_DEV!,
      discord_client_id_dev: process.env.DISCORD_CLIENT_ID_DEV!,
      mongodb_url_dev: process.env.MONGODB_URL_DEV!,
      dev_guild_id: process.env.DEV_GUILD_ID!,
      developer_user_ids: ["282548643142172672"],
    };
    break;

  default:
    console.error(
      "Failed to initialize config: no valid environment found. Shutting down..."
    );
    process.exit(1);
}

if (config === null) {
  console.error(
    "Failed to initialize config: config is null. Shutting down..."
  );
  process.exit(1);
}

export default config!;
