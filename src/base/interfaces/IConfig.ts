export default interface IConfig {
  running_env: string;
  discord_bot_token: string;
  discord_client_id: string;
  mongodb_url: string;
  dev_guild_id: string;
  developer_user_ids: string[];
  port: number;
}
