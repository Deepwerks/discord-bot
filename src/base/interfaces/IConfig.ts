export default interface IConfig {
  discord_bot_token_prod: string;
  discord_client_id_prod: string;

  discord_bot_token_dev: string;
  discord_client_id_dev: string;
  dev_guild_id: string;

  developer_user_ids: string[];

  mongodb_url_prod: string;
  mongodb_url_dev: string;
}
