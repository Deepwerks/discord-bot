import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { paginationStore } from '../services/stores/PaginationStore';
import CommandError from '../base/errors/CommandError';
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
    } else if (direction === 'start' && session.page > 0) {
      session.page = 0;
    } else if (direction === 'end' && session.page < totalPages - 1) {
      session.page = totalPages - 1;
    }

    const embed = session.generateEmbed(session.data[session.page], session.page, totalPages);

    const startButton = new ButtonBuilder()
      .setCustomId(`pagination:start:${sessionId}`)
      .setLabel('⏮️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(session.page === 0);

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

    const endButton = new ButtonBuilder()
      .setCustomId(`pagination:end:${sessionId}`)
      .setLabel('⏭️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(session.page >= totalPages - 1);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      startButton,
      backButton,
      nextButton,
      endButton
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  }
}
