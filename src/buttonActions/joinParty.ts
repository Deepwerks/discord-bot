import { ButtonInteraction, EmbedBuilder } from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger } from "..";
import { lobbyStore } from "../services/stores/LobbyStore";
import CommandError from "../base/errors/CommandError";

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
        throw new CommandError("Unexpected error: Invalid button ID format.");
      }

      const [_, creatorId, maxPlayersRaw, lobbyId] = parts;
      const lobby = lobbyStore.getLobby(lobbyId);

      if (!lobby) {
        throw new CommandError("❌ Lobby not found.");
      }

      const userId = interaction.user.id;

      // Already in lobby?
      if (lobby.players.has(userId)) {
        throw new CommandError("You are already in this party!");
      }

      // Lobby full?
      if (lobby.players.size >= lobby.maxPlayers) {
        throw new CommandError(
          `This lobby is full (${lobby.players.size}/${lobby.maxPlayers} players)`
        );
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
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          error instanceof CommandError
            ? error.message
            : "❌ Failed to join the party. Please try again later!"
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
