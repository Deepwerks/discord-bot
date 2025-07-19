export default interface IConfig {
  running_env: string;

  deadlock_api_key: string;
  deadlock_api_url: string;
  ai_assistant_api_key: string;

  deadlock_assets_api_url: string;

  dev_guild_id: string;
  discord_bot_token: string;
  discord_client_id: string;

  logtail_endpoint: string;
  logtail_source_token: string;

  mongodb_url: string;

  developer_user_ids: string[];

  steam_api_key: string;
  steam_api_url: string;

  statlocker_api_url: string;

  reddit_client_id: string;
  reddit_client_secret: string;

  deadlock_assistant_url: string;
  port: number;

  secret: string;

  bot_version: string;

  metrics_api_key: string;

  db_host: string;
  db_port: number;
  db_name: string;
  db_user: string;
  db_password: string;
}
