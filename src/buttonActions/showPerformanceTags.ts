import { ButtonInteraction, EmbedBuilder } from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger } from "..";
import PerformanceTagService from "../services/calculators/PerformanceTagService";

export default class ShowPerformanceTagsButtonAction extends ButtonAction {
  tags = PerformanceTagService.getAllTagDescriptions();
  constructor(client: CustomClient) {
    super(client, {
      customId: "show_performance_tags",
      description: "Show performance tags",
      cooldown: 6,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    try {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Grey")
            .setTitle("Performance Tags")
            .setDescription(
              this.tags
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
    } catch (err) {
      logger.error(err);
      await interaction.reply({
        content: "❌ Failed to list tags.",
        flags: ["Ephemeral"],
      });
    }
  }
}
