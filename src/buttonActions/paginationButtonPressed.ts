import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { paginationStore } from '../services/stores/PaginationStore';
import CommandError from '../base/errors/CommandError';
import { logger } from '..';
import { TFunction } from 'i18next';

export default class PaginationButtonPressed extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'pagination',
      description: 'Handles all pagination',
      cooldown: 0,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    try {
      const [_, direction, sessionId] = interaction.customId.split(':');

      const session = paginationStore.get(sessionId);
      if (!session || session.userId !== interaction.user.id) {
        throw new CommandError(t('buttons.pagination.session_invalid'));
      }

      const totalPages = session.data.length;

      if (direction === 'next' && session.page < totalPages - 1) {
        session.page++;
      } else if (direction === 'back' && session.page > 0) {
        session.page--;
      }

      const embed = session.generateEmbed(session.data[session.page], session.page, totalPages);

      const backButton = new ButtonBuilder()
        .setCustomId(`pagination:back:${sessionId}`)
        .setLabel(t('buttons.pagination.back'))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(session.page === 0);

      const nextButton = new ButtonBuilder()
        .setCustomId(`pagination:next:${sessionId}`)
        .setLabel(t('buttons.pagination.next'))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(session.page >= totalPages - 1);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);

      await interaction.update({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(
          error instanceof CommandError ? error.message : t('buttons.pagination.error_generic')
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
