import { Client, Collection, GatewayIntentBits } from "discord.js";
import ICustomClient from "../interfaces/ICustomClient";
import IConfig from "../interfaces/IConfig";
import Handler from "./Handler";
import Command from "./Command.";
import SubCommand from "./SubCommand";
import { connect } from "mongoose";
import config from "../../config";
import logger from "../../services/logger";
import { initI18n } from "../../services/i18n";
import WebService from "../../services/web";
import SteamClient from "../../services/clients/SteamClient";
import { DeadlockClient } from "../../services/clients/DeadlockClient";

export default class CustomClient extends Client implements ICustomClient {
  config: IConfig;
  handler: Handler;
  commands: Collection<string, Command>;
  subCommands: Collection<string, SubCommand>;
  cooldowns: Collection<string, Collection<string, number>>;
  developmentMode: boolean;

  SteamClient: SteamClient;
  DeadlockClient: DeadlockClient;

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds] });
    this.config = config;
    this.handler = new Handler(this);
    this.commands = new Collection();
    this.subCommands = new Collection();
    this.cooldowns = new Collection();
    this.developmentMode = this.config.running_env === "development";

    this.SteamClient = new SteamClient({
      apiKey: this.config.steam_api_key,
      baseURL: this.config.steam_api_url,
    });
    this.DeadlockClient = new DeadlockClient({
      apiKey: this.config.deadlock_api_key,
      baseURL: this.config.deadlock_api_url,
    });
  }

  async Init() {
    logger.info(
      `Starting the bot in ${
        this.developmentMode ? "development" : "production"
      } mode...`
    );
    await initI18n();

    this.LoadHandlers();

    this.login(this.config.discord_bot_token).catch((err) => logger.error(err));

    connect(this.config.mongodb_url)
      .then(() => logger.info(`Connected to MongoDB!`))
      .catch((err) => logger.error(err));

    new WebService(this.config).Init();
  }

  LoadHandlers(): void {
    this.handler.LoadEvents();
    this.handler.LoadCommands();
  }
}
