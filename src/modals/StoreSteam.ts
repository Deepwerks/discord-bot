import { ModalSubmitInteraction } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import Modal from "../base/classes/CustomModal";
import logger from "../services/logger";

export default class StoreSteam extends Modal {
  constructor(client: CustomClient) {
    super(client, {
      customId: "submitSteamId",
      description: "Handles Steam ID submissions",
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    const steamId = interaction.fields.getTextInputValue("steam_id_input");

    const isValid = /^\d{17}$/.test(steamId);
    if (!isValid) {
      return interaction.reply({
        content:
          "❌ Invalid Steam ID format. Please enter a 17-digit Steam64 ID.",
        flags: ["Ephemeral"],
      });
    }

    logger.info(`Received Steam ID: ${steamId} from ${interaction.user.tag}`);

    return interaction.reply({
      content: `✅ Steam ID saved: \`${steamId}\``,
      flags: ["Ephemeral"],
    });
  }
}
