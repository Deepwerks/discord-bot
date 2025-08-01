import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import CustomClient from '../base/classes/CustomClient';
import Modal from '../base/classes/CustomModal';
import CommandError from '../base/errors/CommandError';
import { lobbyStore } from '../services/redis/stores/LobbyStore';

export default class CreateLobby extends Modal {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'createLobby',
      description: 'Handles lobby creation settings',
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    const lobbyName = interaction.fields.getTextInputValue('lobby_name_input');
    const maxPlayers = interaction.fields.getTextInputValue('max_players_input');
    const maxPlayersNum = parseInt(maxPlayers);
    if (isNaN(maxPlayersNum) || maxPlayersNum <= 0) {
      throw new CommandError('Max players must be a positive number');
    }

    const lobbyId = interaction.user.id;

    const embed = new EmbedBuilder()
      .setColor(0x00bcd4)
      .setTitle('🎮 New Lobby Created')
      .setDescription('A new lobby has been created with the following settings:')
      .addFields(
        { name: 'Max Players', value: String(maxPlayers), inline: true },
        {
          name: 'Created By',
          value: `<@${interaction.user.id}>`,
          inline: true,
        },
        {
          name: `Players (1/${maxPlayers})`,
          value: `<@${interaction.user.id}>`,
          inline: false,
        }
      )
      .setFooter({ text: 'Join the lobby by clicking the button below' })
      .setTimestamp();

    const experimentalWarningEmbed = new EmbedBuilder()
      .setColor('Yellow')
      .setDescription(
        '⚠️ This feature is in early development. Please share feedback using /feedback!'
      );

    const joinButton = new ButtonBuilder()
      .setCustomId(`join_party:${interaction.user.id}:${maxPlayersNum}:${lobbyId}`)
      .setLabel('Join Party')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('👥');

    const startMatchButton = new ButtonBuilder()
      .setCustomId(`start_match:${interaction.user.id}:${maxPlayersNum}`)
      .setLabel('Start Match')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🎮');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton, startMatchButton);

    const replyMessage = await interaction.reply({
      embeds: [embed, experimentalWarningEmbed],
      components: [row],
    });

    await lobbyStore.createLobby(lobbyId, {
      name: lobbyName,
      creatorId: interaction.user.id,
      maxPlayers: maxPlayersNum,
      players: [interaction.user.id],
      messageId: replyMessage.id,
    });
  }
}
