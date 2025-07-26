import { EmbedBuilder, Events, ModalSubmitInteraction } from 'discord.js';
import CustomClient from '../../base/classes/CustomClient';
import Event from '../../base/classes/Event';
import IModalHandler from '../../base/interfaces/IModalHandler';
import CommandError from '../../base/errors/CommandError';
import logFailedInteraction from '../../services/logger/logFailedInteractions';
import { InteractionType } from '../../services/database/orm/models/FailedUserInteractions.model';
import ConfigService from '../../services/amrm/managers/guildAMRMManager/services/configService';
import DiscordService from '../../services/amrm/managers/guildAMRMManager/services/discordService';
import GuildAMRMManager from '../../services/amrm/managers/guildAMRMManager';

export default class ModalHandler extends Event implements IModalHandler {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: 'Modal handler event',
      once: false,
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return;

    const modalId = interaction.customId;
    const [action, _id] = modalId.split(':');

    if (action.startsWith('amrm_')) {
      const configService = new ConfigService(interaction.guildId!);
      const discordService = new DiscordService(this.client);

      const manager = new GuildAMRMManager(discordService, configService);
      await manager.handleModalEvent(interaction);
      return;
    }

    const modalHandler = this.client.modals.get(action);

    try {
      if (!modalHandler) {
        throw new CommandError(`No modal handler found for ID: ${action}`);
      }

      await modalHandler.Execute(interaction);
    } catch (error) {
      logFailedInteraction({
        id: interaction.id,
        guildId: interaction.inGuild() ? interaction.guildId : null,
        name: action,
        type: InteractionType.Modal,
        userId: interaction.user.id,
        options: null,
        error: {
          name: error instanceof CommandError ? error.name : 'Unknown',
          message: error instanceof CommandError ? error.message : error,
          stack: error instanceof CommandError ? error.stack : undefined,
        },
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(
          error instanceof CommandError
            ? error.message
            : 'An error occurred while processing the modal.'
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
      }
    }
  }
}
