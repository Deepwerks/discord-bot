import { ButtonInteraction, EmbedBuilder, ThreadChannel } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { logger } from '..';
import { lobbyStore } from '../services/stores/LobbyStore';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';
export default class CloseThreadButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'archive_thread',
      description: 'Arhieves private lobby thread',
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [action, threadId, creatorId] = interaction.customId.split(':');

      if (interaction.user.id !== creatorId) {
        throw new CommandError(t('buttons.archive_thread.not_creator'));
      }

      const channel = await this.client.channels.fetch(threadId);

      if (channel?.isThread()) {
        const thread = channel as ThreadChannel;

        await thread.send({ content: t('buttons.archive_thread.archiving') });

        lobbyStore.removeLobby(creatorId);
        await thread.setArchived(true, 'Closed by the private lobby creator.');
        return;
      } else {
        await interaction.reply({
          content: t('buttons.archive_thread.archive_failed'),
          flags: ['Ephemeral'],
        });
      }
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(
          error instanceof CommandError ? error.message : t('buttons.archive_thread.error_generic')
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
