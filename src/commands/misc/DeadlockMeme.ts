import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { logger, useRedditClient } from "../..";
import { TFunction } from "i18next";
import CommandError from "../../base/errors/CommandError";

export default class DeadlockMeme extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "deadlockmeme",
      description: "Get a deadlock meme from /r/deadlockthegame",
      category: Category.Misc,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 6,
      options: [],
      dev: false,
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    await interaction.deferReply();

    try {
      const memeUrl = await useRedditClient.GetDeadlockMemeEmbed();

      if (!memeUrl) {
        throw new CommandError("Failed to find deadlock meme");
      }

      await interaction.editReply({ embeds: [memeUrl] });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.name,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          error instanceof CommandError
            ? error.message
            : t("errors.generic_error")
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
