import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import ICustomClient from '../interfaces/ICustomClient';
import IConfig from '../interfaces/IConfig';
import Handler from './Handler';
import Command from './Command';
import SubCommand from './SubCommand';
import { connect } from 'mongoose';
import config from '../../config';
import { initI18n } from '../../services/i18n';
import WebService from '../../services/web';
import ModalHandler from '../interfaces/IModalHandler';
import { logger, useAssetsClient, useRedditClient } from '../..';
import ButtonAction from './ButtonAction';
import SelectMenu from './SelectMenu';
import { initRedis } from '../../services/redis';

export default class CustomClient extends Client implements ICustomClient {
  config: IConfig;
  handler: Handler;
  commands: Collection<string, Command>;
  subCommands: Collection<string, SubCommand>;
  buttons: Collection<string, ButtonAction>;
  modals: Collection<string, ModalHandler>;
  selectMenus: Collection<string, SelectMenu>;
  cooldowns: Collection<string, Collection<string, number>>;
  developmentMode: boolean;

  constructor() {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      partials: [Partials.Channel],
    });
    this.config = config;
    this.handler = new Handler(this);
    this.commands = new Collection();
    this.subCommands = new Collection();
    this.buttons = new Collection();
    this.modals = new Collection();
    this.selectMenus = new Collection();
    this.cooldowns = new Collection();
    this.developmentMode = this.config.running_env === 'development';
  }

  async Init() {
    logger.info(
      `Starting the bot in ${this.developmentMode ? 'development' : 'production'} mode...`
    );

    await initRedis();
    await initI18n();
    await useRedditClient.Init();

    this.LoadHandlers();
    await this.LoadCache();

    this.login(this.config.discord_bot_token).catch((err) => logger.error(err));

    connect(this.config.mongodb_url)
      .then(() => logger.info(`Connected to MongoDB!`))
      .catch((err) => logger.error(err));

    new WebService(this.config).Init();
    return this;
  }

  LoadHandlers(): void {
    this.handler.LoadEvents();
    this.handler.LoadModals();
    this.handler.LoadCommands();
    this.handler.LoadButtonActions();
    this.handler.LoadSelectMenus();
  }

  async LoadCache() {
    try {
      await Promise.all([
        useAssetsClient.DefaultService.LoadAllRanksToCache(),
        useAssetsClient.HeroService.LoadAllHeroesToCache(),
        useAssetsClient.ItemService.LoadAllItemsToCache(),
      ]);
    } catch (error) {
      logger.error('Failed to load static deadlock data to cache...', error);
    }
  }
}
