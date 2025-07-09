import { ButtonInteraction, ThreadChannel } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { lobbyStore } from '../services/stores/LobbyStore';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';
export default class CloseThreadButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'close_thread',
      description: 'Close private lobby thread',
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [action, threadId, creatorId] = interaction.customId.split(':');

    if (interaction.user.id !== creatorId) {
      throw new CommandError(t('buttons.close_thread.not_creator'));
    }

    const channel = await this.client.channels.fetch(threadId);

    if (channel?.isThread()) {
      const thread = channel as ThreadChannel;

      await thread.send({ content: t('buttons.close_thread.closing') });

      lobbyStore.removeLobby(creatorId);

      await thread.delete('Closed by the private lobby creator.');
      return;
    } else {
      await interaction.reply({
        content: t('buttons.close_thread.close_failed'),
        flags: ['Ephemeral'],
      });
    }
  }
}
