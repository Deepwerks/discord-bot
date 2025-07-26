import { logger } from '../..';
import DiscordService from '../../services/amrm/managers/guildAMRMManager/services/discordService';

export default class DiscordTransaction {
  private createdChannelIds: string[] = [];
  private discordService: DiscordService;

  constructor(discordService: DiscordService) {
    this.discordService = discordService;
  }

  addCreatedChannel(channelId: string) {
    this.createdChannelIds.push(channelId);
  }

  async rollback() {
    for (const channelId of this.createdChannelIds.reverse()) {
      try {
        await this.discordService.deleteChannel(channelId);
      } catch (err) {
        logger.warn(`Failed to rollback Discord channel ${channelId}:`, err);
      }
    }
    this.createdChannelIds = [];
  }
}
