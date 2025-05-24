import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { logger } from '..';
import { lobbyStore } from '../services/stores/LobbyStore';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';

export default class JoinPartyButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'join_party',
      description: 'Join a party/lobby',
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    try {
      const parts = interaction.customId.split(':');
      if (parts.length < 4) {
        throw new CommandError(t('buttons.join_party.invalid_id'));
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, creatorId, maxPlayersRaw, lobbyId] = parts;
      const lobby = lobbyStore.getLobby(lobbyId);

      if (!lobby) {
        throw new CommandError(t('buttons.join_party.lobby_not_found'));
      }

      const userId = interaction.user.id;

      // Already in lobby?
      if (lobby.players.has(userId)) {
        throw new CommandError(t('buttons.join_party.already_joined'));
      }

      // Lobby full?
      if (lobby.players.size >= lobby.maxPlayers) {
        throw new CommandError(
          t('buttons.join_party.lobby_full', {
            current: lobby.players.size,
            max: lobby.maxPlayers,
          })
        );
      }

      // Join lobby
      lobbyStore.addPlayer(lobbyId, userId);

      // Build updated embed
      const embed = new EmbedBuilder()
        .setTitle(lobby.name)
        .addFields([
          {
            name: t('buttons.join_party.list_players_title', {
              current: lobby.players.size,
              max: lobby.maxPlayers,
            }),
            value: Array.from(lobby.players)
              .map((id) => `<@${id}>`)
              .join('\n'),
            inline: false,
          },
        ])
        .setColor(0x00ae86);

      // Update message
      await interaction.message.edit({ embeds: [embed] });

      // Send ephemeral confirmation
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: t('buttons.join_party.success'),
        });
      } else {
        await interaction.reply({
          content: t('buttons.join_party.success'),
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
          error instanceof CommandError ? error.message : t('buttons.join_party.error_generic')
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
