import { Client, Collection, GatewayIntentBits } from "discord.js";
import ICustomClient from "../interfaces/ICustomClient";
import IConfig from "../interfaces/IConfig";
import Handler from "./Handler";
import Command from "./Command.";
import SubCommand from "./SubCommand";
import { connect } from "mongoose";

export default class CustomClient extends Client implements ICustomClient {
  config: IConfig;
  handler: Handler;
  commands: Collection<string, Command>;
  subCommands: Collection<string, SubCommand>;
  cooldowns: Collection<string, Collection<string, number>>;
  developmentMode: boolean;

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds] });
    this.config = require(`${process.cwd()}/data/config.json`);
    this.handler = new Handler(this);
    this.commands = new Collection();
    this.subCommands = new Collection();
    this.cooldowns = new Collection();
    this.developmentMode = process.argv.slice(2).includes("--development");
  }

  Init(): void {
    console.log(
      `Starting the bot in ${
        this.developmentMode ? "development" : "production"
      } mode...`
    );
    this.LoadHandlers();

    this.login(
      this.developmentMode
        ? this.config.discord_bot_token_dev
        : this.config.discord_bot_token_prod
    ).catch((err) => console.error(err));

    connect(
      this.developmentMode
        ? this.config.mongodb_url_dev
        : this.config.mongodb_url_prod
    )
      .then(() => console.log("Connected to MongoDB!"))
      .catch((err) => console.error(err));
  }

  LoadHandlers(): void {
    this.handler.LoadEvents();
    this.handler.LoadCommands();
  }
}
