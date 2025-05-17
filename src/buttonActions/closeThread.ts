import { ButtonInteraction, EmbedBuilder, ThreadChannel } from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger } from "..";
import { lobbyStore } from "../services/stores/LobbyStore";
import CommandError from "../base/errors/CommandError";
export default class CloseThreadButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: "close_thread",
      description: "Close private lobby thread",
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    try {
      const [action, threadId, creatorId] = interaction.customId.split(":");

      if (interaction.user.id !== creatorId) {
        throw new CommandError(
          "Only the party initiator can close this thread!"
        );
      }

      const channel = await this.client.channels.fetch(threadId);

      if (channel?.isThread()) {
        const thread = channel as ThreadChannel;

        await thread.send({ content: "Archiving thread..." });

        lobbyStore.removeLobby(creatorId);

        await thread.setArchived(true, "Closed by the private lobby creator.");
        return;
      } else {
        await interaction.reply({
          content: "Failed to archive thread.",
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
            : "Failed to close thread."
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
