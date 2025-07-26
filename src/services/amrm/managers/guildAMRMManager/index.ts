import { logger } from '../../../..';
import DiscordTransaction from '../../../../base/classes/DiscordTransaction';
import { sequelize } from '../../../database/orm/init';
import ConfigService from './services/configService';
import DiscordService from './services/discordService';

export default class GuildAMRMManager {
  private discordService: DiscordService;
  private configService: ConfigService;

  constructor(discordService: DiscordService, configService: ConfigService) {
    this.discordService = discordService;
    this.configService = configService;
  }

  async handleEnableAMRM() {
    logger.info(`Enabling AMRM in server: ${this.configService.guildId}`);

    const transaction = await sequelize.transaction();
    const discordTx = new DiscordTransaction(this.discordService);

    try {
      await this.configService.enableAMRM(transaction);

      const config = (await this.configService.getConfig(transaction))!;

      const categoryId = this.discordService.isChannelExists(config.categoryId, 'CategoryChannel')
        ? config.categoryId!
        : await this.discordService.createCategoryChannel(this.configService.guildId, discordTx);
      const forumId = this.discordService.isChannelExists(config.forumId, 'ForumChannel')
        ? config.forumId!
        : await this.discordService.createForumChannel(discordTx);
      const dashboardId = this.discordService.isChannelExists(
        config.dashboardId,
        'DashboardChannel'
      )
        ? config.dashboardId!
        : await this.discordService.createDashboardChannel(discordTx);

      await this.discordService.sendDashboard();
      await this.configService.saveChannels(categoryId, forumId, dashboardId, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      await discordTx.rollback();
      logger.error(`AMRM enable failed: ${error}`);
    }
  }
  async handleDisableAMRM() {
    logger.info(`Disabling AMRM in server: ${this.configService.guildId}`);
    const transaction = await sequelize.transaction();

    try {
      await this.configService.disableAMRM(transaction);

      const config = await this.configService.getConfig();
      if (!config) return;

      await Promise.all([
        this.discordService.deleteChannel(config.dashboardId),
        this.discordService.deleteChannel(config.forumId),
        this.discordService.deleteChannel(config.categoryId),
      ]);

      await this.configService.deleteChannels(transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      logger.error(`AMRM disable failed: ${error}`);
    }
  }
}
