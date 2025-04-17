import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command.";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { getGuildLang } from "../../services/utils/getGuildLang";
import i18next, { TFunction } from "i18next";

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
    interaction.reply({
      content: t("commands.test.ran"),
      flags: ["Ephemeral"],
    });
  }
}
