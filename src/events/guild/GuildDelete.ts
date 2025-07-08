import { Events, Guild } from 'discord.js';
import CustomClient from '../../base/classes/CustomClient';
import Event from '../../base/classes/Event';
import { logger } from '../..';
import { Guilds } from '../../services/database/orm/init';

export default class GuildDelete extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildDelete,
      description: 'Guild leave event',
      once: false,
    });
  }

  async Execute(guild: Guild) {
    try {
      await Guilds.destroy({
        where: {
          guildId: guild.id,
        },
      });

      logger.info(`${this.client.user?.tag} has been removed from a Guild.`, {
        guildId: guild.id,
        guildName: guild.name,
        guildOwnerId: guild.ownerId,
      });
    } catch (error) {
      logger.error(error);
    }
  }
}
