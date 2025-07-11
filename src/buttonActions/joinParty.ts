import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';
import { lobbyStore } from '../services/redis/stores/LobbyStore';

export default class JoinPartyButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'join_party',
      description: 'Join a party/lobby',
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    const parts = interaction.customId.split(':');
    if (parts.length < 4) {
      throw new CommandError(t('buttons.join_party.invalid_id'));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, creatorId, maxPlayersRaw, lobbyId] = parts;
    const lobby = await lobbyStore.getLobby(lobbyId);

    if (!lobby) {
      throw new CommandError(t('buttons.join_party.lobby_not_found'));
    }

    const userId = interaction.user.id;

    // Already in lobby?
    if (lobby.players.includes(userId)) {
      throw new CommandError(t('buttons.join_party.already_joined'));
    }

    // Lobby full?
    if (lobby.players.length >= lobby.maxPlayers) {
      throw new CommandError(
        t('buttons.join_party.lobby_full', {
          current: lobby.players.length,
          max: lobby.maxPlayers,
        })
      );
    }

    if (await lobbyStore.isUserInAnyLobby(userId)) {
      throw new CommandError('You are already playing in a lobby!');
    }

    // Join lobby
    await lobbyStore.addPlayer(lobbyId, userId);
    lobby.players.push(userId);

    // Build updated embed
    const embed = new EmbedBuilder()
      .setColor(0x00bcd4)
      .setTitle('🎮 New Lobby Created')
      .setDescription('A new lobby has been created with the following settings:')
      .addFields(
        { name: 'Max Players', value: String(lobby.maxPlayers), inline: true },
        {
          name: 'Created By',
          value: `<@${creatorId}>`,
          inline: true,
        },
        {
          name: t('buttons.join_party.list_players_title', {
            current: lobby.players.length,
            max: lobby.maxPlayers,
          }),
          value: lobby.players.map((id) => `<@${id}>`).join(', '),
          inline: false,
        }
      )
      .setFooter({ text: 'Join the lobby by clicking the button below' })
      .setTimestamp();

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
  }
}
