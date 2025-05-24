import dotenv from 'dotenv';
dotenv.config();

import IConfig from './base/interfaces/IConfig';
import { logger } from '.';
import { getBotVersion } from './services/utils/getBotVersion';

let config: IConfig | null = null;

const running_env = process.env.NODE_ENV;
const botVersion = getBotVersion() || '1.0.0';

if (running_env === undefined) {
  logger.error('NODE_ENV is undefined. Shutting down...');
  process.exit(1);
}

switch (running_env) {
  case 'production':
    config = {
      running_env,
      discord_bot_token: process.env.DISCORD_BOT_TOKEN!,
      discord_client_id: process.env.DISCORD_CLIENT_ID!,
      mongodb_url: process.env.MONGODB_URL!,
      dev_guild_id: process.env.DEV_GUILD_ID!,
      developer_user_ids: ['282548643142172672'], //leave the first record for the lead dev
      port: Number(process.env.PORT!),
      steam_api_key: process.env.STEAM_API_KEY!,
      steam_api_url: process.env.STEAM_API_URL!,
      deadlock_api_key: process.env.DEADLOCK_API_KEY!,
      deadlock_api_url: process.env.DEADLOCK_API_URL!,
      deadlock_assets_api_url: process.env.DEADLOCK_ASSETS_API_URL!,
      statlocker_api_url: process.env.STATLOCKER_API_URL!,
      deadlock_assistant_url: process.env.DEADLOCKASSISTANT_URL!,
      reddit_client_id: process.env.REDDIT_CLIENT_ID!,
      reddit_client_secret: process.env.REDDIT_CLIENT_SECRET!,
      logtail_endpoint: process.env.LOGTAIL_ENDPOINT!,
      logtail_source_token: process.env.LOGTAIL_SOURCE_TOKEN!,
      secret: process.env.SECRET!,
      bot_version: botVersion,
    };
    break;
  case 'development':
    dotenv.config({ path: 'dev.env' });

    config = {
      running_env,
      discord_bot_token: process.env.DISCORD_BOT_TOKEN!,
      discord_client_id: process.env.DISCORD_CLIENT_ID!,
      mongodb_url: process.env.MONGODB_URL!,
      dev_guild_id: process.env.DEV_GUILD_ID!,
      developer_user_ids: ['282548643142172672'],
      port: Number(process.env.PORT!),
      steam_api_key: process.env.STEAM_API_KEY!,
      steam_api_url: process.env.STEAM_API_URL!,
      deadlock_api_key: process.env.DEADLOCK_API_KEY!,
      deadlock_api_url: process.env.DEADLOCK_API_URL!,
      deadlock_assets_api_url: process.env.DEADLOCK_ASSETS_API_URL!,
      statlocker_api_url: process.env.STATLOCKER_API_URL!,
      deadlock_assistant_url: process.env.DEADLOCKASSISTANT_URL!,
      reddit_client_id: process.env.REDDIT_CLIENT_ID!,
      reddit_client_secret: process.env.REDDIT_CLIENT_SECRET!,
      logtail_endpoint: process.env.LOGTAIL_ENDPOINT!,
      logtail_source_token: process.env.LOGTAIL_SOURCE_TOKEN!,
      secret: process.env.SECRET!,
      bot_version: botVersion,
    };
    break;
  case 'test':
    config = {
      running_env,
      discord_bot_token: '',
      discord_client_id: '',
      mongodb_url: '',
      dev_guild_id: '',
      developer_user_ids: [''],
      port: 9000,
      steam_api_key: '',
      steam_api_url: '',
      deadlock_api_key: '',
      deadlock_api_url: '',
      deadlock_assets_api_url: '',
      statlocker_api_url: '',
      deadlock_assistant_url: '',
      reddit_client_id: '',
      reddit_client_secret: '',
      logtail_endpoint: '',
      logtail_source_token: '',
      secret: '',
      bot_version: botVersion,
    };
    break;

  default:
    logger.error('Failed to initialize config: no valid environment found. Shutting down...');
    process.exit(1);
}

if (config === null) {
  logger.error('Failed to initialize config: config is null. Shutting down...');
  process.exit(1);
}

export default config!;
