import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import ForumScraper from "../../services/scrapers/ForumScraper";

export default class Test extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "test",
      description: "my test command",
      category: Category.Utilities,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [],
      dev: true,
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    try {
      await interaction.reply({
        content: t("commands.test.ran"),
        flags: ["Ephemeral"],
      });
    } catch (error) {
      await interaction.reply({
        content: "Failed",
        flags: ["Ephemeral"],
      });
    }
  }
}
