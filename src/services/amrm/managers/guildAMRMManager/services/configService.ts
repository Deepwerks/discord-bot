import { Transaction } from 'sequelize';
import { GuildAMRMConfig } from '../../../../database/orm/init';

export default class ConfigService {
  guildId: string;

  constructor(guildId: string) {
    this.guildId = guildId;
  }

  async getConfig(transaction?: Transaction) {
    return GuildAMRMConfig.findByPk(this.guildId, { paranoid: false, transaction });
  }

  async saveChannels(
    categoryId: string,
    forumId: string,
    dashboardId: string,
    transaction?: Transaction
  ) {
    const config = await this.getConfig(transaction);
    if (!config) return;

    await config.update({ categoryId, forumId, dashboardId }, { transaction });
  }

  async deleteChannels(transaction?: Transaction) {
    const config = await this.getConfig(transaction);
    if (!config) return;

    await config.update({ categoryId: null, forumId: null, dashboardId: null }, { transaction });
  }

  async enableAMRM(transaction?: Transaction) {
    let config = await this.getConfig(transaction);
    if (!config) {
      config = await GuildAMRMConfig.create({ guildId: this.guildId }, { transaction });
    }

    await config.restore({ transaction });
  }

  async disableAMRM(transaction?: Transaction) {
    const config = await this.getConfig(transaction);
    if (!config) return;

    await config.destroy({ transaction });
  }
}
