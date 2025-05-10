import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalSubmitInteraction,
} from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import Modal from "../base/classes/CustomModal";
import { logger } from "..";
import CommandError from "../base/errors/CommandError";

export default class CreateLobby extends Modal {
  constructor(client: CustomClient) {
    super(client, {
      customId: "createLobby",
      description: "Handles lobby creation settings",
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    try {
      const maxPlayers =
        interaction.fields.getTextInputValue("max_players_input");
      const maxPlayersNum = parseInt(maxPlayers);
      if (isNaN(maxPlayersNum) || maxPlayersNum < 0) {
        throw new CommandError("Max players must be a positive number");
      }

      const players = [`<@${interaction.user.id}>`];

      // Create embed with lobby settings
      const embed = new EmbedBuilder()
        .setColor(0x00bcd4)
        .setTitle("🎮 New Lobby Created")
        .setDescription(
          "A new lobby has been created with the following settings:"
        )
        .addFields(
          { name: "Max Players", value: String(maxPlayers), inline: true },
          {
            name: "Created By",
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          {
            name: `Players (1/${maxPlayers})`,
            value: players.join("\n"),
            inline: false,
          }
        )
        .setFooter({ text: "Join the lobby by clicking the button below" })
        .setTimestamp();
      const experimentalWarningEmbed = new EmbedBuilder()
        .setColor("Yellow")
        .setDescription(
          "⚠️ This feature is currently in early development and may change or break unexpectedly. \nWe’d love your input — please share any thoughts or issues using the /feedback command!"
        );

      // Create join button
      const joinButton = new ButtonBuilder()
        .setCustomId(`join_party:${interaction.user.id}:${maxPlayers}`)
        .setLabel("Join Party")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("👥");

      // Create start match button (only the party initiator can use it)
      const startMatchButton = new ButtonBuilder()
        .setCustomId(`start_match:${interaction.user.id}:${maxPlayers}`)
        .setLabel("Start Match")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🎮");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        joinButton,
        startMatchButton
      );

      await interaction.reply({
        embeds: [embed, experimentalWarningEmbed],
        components: [row],
      });
    } catch (error: any) {
      logger.error(error);
      await interaction.reply({
        content: `❌ Error creating lobby: ${error.message || "Unknown error"}`,
        flags: ["Ephemeral"],
      });
    }
  }
}
