import { ButtonInteraction, EmbedBuilder } from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger } from "..";
import PerformanceTagService from "../services/calculators/PerformanceTagService";
import CommandError from "../base/errors/CommandError";

export default class ShowPerformanceTagsButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: "show_performance_tags",
      description: "Show performance tags",
      cooldown: 6,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    try {
      const tags = PerformanceTagService.getAllTagDescriptions();

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Grey")
            .setTitle("Performance Tags")
            .setDescription(
              tags
                .map(
                  (tag) =>
                    `\`${tag.name}\`\n ${tag.description}\n${tag.criteria}`
                )
                .join("\n\n") +
                "\n\n**⚠️ These performance tags are currently EXPERIMENTAL and may not accurately reflect your playstyle or skill. They are based on simplified logic and limited match data. Expect changes as we improve the system.**"
            ),
        ],
        flags: ["Ephemeral"],
      });
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
            : "❌ Failed to load tags."
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
