import { ButtonInteraction, EmbedBuilder } from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger } from "..";
import { lobbyStore } from "../services/stores/LobbyStore";

export default class JoinPartyButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: "join_party",
      description: "Join a party/lobby",
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    try {
      const parts = interaction.customId.split(":");
      if (parts.length < 4) {
        await interaction.reply({
          content: "Invalid button ID format.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const [_, creatorId, maxPlayersRaw, lobbyId] = parts;
      const lobby = lobbyStore.getLobby(lobbyId);

      if (!lobby) {
        await interaction.reply({
          content: "❌ Lobby not found.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const userId = interaction.user.id;

      // Already in lobby?
      if (lobby.players.has(userId)) {
        await interaction.reply({
          content: "You are already in this party!",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Lobby full?
      if (lobby.players.size >= lobby.maxPlayers) {
        await interaction.reply({
          content: `This lobby is full (${lobby.players.size}/${lobby.maxPlayers} players)`,
          flags: ["Ephemeral"],
        });
        return;
      }

      // Join lobby
      lobbyStore.addPlayer(lobbyId, userId);

      // Build updated embed
      const embed = new EmbedBuilder()
        .setTitle(lobby.name)
        .addFields([
          {
            name: `Players (${lobby.players.size}/${lobby.maxPlayers})`,
            value: Array.from(lobby.players)
              .map((id) => `<@${id}>`)
              .join("\n"),
            inline: false,
          },
        ])
        .setColor(0x00ae86);

      // Update message
      await interaction.message.edit({ embeds: [embed] });

      // Send ephemeral confirmation
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: "You've joined the party!" });
      } else {
        await interaction.reply({
          content: "You've joined the party!",
          flags: ["Ephemeral"],
        });
      }
    } catch (error) {
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: "❌ Failed to join the party.",
        });
      } else {
        await interaction.reply({
          content: "❌ Failed to join the party. Please try again later.",
          flags: ["Ephemeral"],
        });
      }
    }
  }
}
