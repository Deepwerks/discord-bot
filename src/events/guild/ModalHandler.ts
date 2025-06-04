import { EmbedBuilder, Events, ModalSubmitInteraction } from 'discord.js';
import CustomClient from '../../base/classes/CustomClient';
import Event from '../../base/classes/Event';
import IModalHandler from '../../base/interfaces/IModalHandler';
import CommandError from '../../base/errors/CommandError';
import { logger } from '../..';

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

    const modalHandler = this.client.modals.get(modalId);
    if (!modalHandler) {
      throw new CommandError(`No modal handler found for ID: ${modalId}`);
    }

    try {
      await modalHandler.Execute(interaction);
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.name,
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
