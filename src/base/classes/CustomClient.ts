import { Client, Collection, GatewayIntentBits } from "discord.js";
import ICustomClient from "../interfaces/ICustomClient";
import IConfig from "../interfaces/IConfig";
import Handler from "./Handler";
import Command from "./Command.";
import SubCommand from "./SubCommand";
import { connect } from "mongoose";
import config from "../../config";

export default class CustomClient extends Client implements ICustomClient {
  config: IConfig;
  handler: Handler;
  commands: Collection<string, Command>;
  subCommands: Collection<string, SubCommand>;
  cooldowns: Collection<string, Collection<string, number>>;
  developmentMode: boolean;

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds] });
    this.config = config;
    this.handler = new Handler(this);
    this.commands = new Collection();
    this.subCommands = new Collection();
    this.cooldowns = new Collection();
    this.developmentMode = this.config.running_env === "development";
  }

  Init(): void {
    console.log(
      `Starting the bot in ${
        this.developmentMode ? "development" : "production"
      } mode...`
    );
    this.LoadHandlers();

    this.login(this.config.discord_bot_token).catch((err) =>
      console.error(err)
    );

    connect(this.config.mongodb_url)
      .then(() => console.log("Connected to MongoDB!"))
      .catch((err) => console.error(err));
  }

  LoadHandlers(): void {
    this.handler.LoadEvents();
    this.handler.LoadCommands();
  }
}
