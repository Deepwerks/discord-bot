import { EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import Modal from "../base/classes/CustomModal";
import { logger } from "..";
import CommandError from "../base/errors/CommandError";
import { t } from "i18next";

export default class Feedback extends Modal {
  constructor(client: CustomClient) {
    super(client, {
      customId: "feedback",
      description: "Handles feedback submissions",
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    const input = interaction.fields.getTextInputValue("feedback_input");

    try {
      const feedbackChannel = await this.client.channels.fetch(
        this.client.developmentMode
          ? "1368201170933252208"
          : "1368196774749278340"
      );

      if (
        !feedbackChannel ||
        !feedbackChannel.isTextBased() ||
        !feedbackChannel.isSendable()
      ) {
        throw new CommandError("❌ Feedback channel not found.");
      }

      await feedbackChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setDescription(`**Feedback**\n\n${input}`)
            .setTimestamp(),
        ],
      });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              "Thank you for your feedback! We appreciate it! 🤗"
            ),
        ],
        flags: ["Ephemeral"],
      });
    } catch (error) {
      logger.error(error);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(t("errors.generic_error")),
        ],
        flags: ["Ephemeral"],
      });
    }
  }
}
