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

      if (memeUrl) {
        await interaction.editReply({ embeds: [memeUrl] });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("No memes found in the last week"),
          ],
        });
      }
    } catch (error) {
      logger.error(error);

      if (error instanceof CommandError) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor("Red").setDescription(error.message),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(t("errors.generic_error")),
          ],
        });
      }
    }
  }
}
