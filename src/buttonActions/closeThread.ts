import { ButtonInteraction, ThreadChannel } from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger } from "..";
import { lobbyStore } from "../services/stores/LobbyStore";
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
        await interaction.reply({
          content: "Only the party initiator can close this thread!",
          flags: ["Ephemeral"],
        });

        return;
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
      logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ Failed to close thread. Please try again later.",
        });
      } else {
        await interaction.editReply({
          content:
            "❌ Failed to process the finish match action. Please try again later.",
        });
      }
    }
  }
}
