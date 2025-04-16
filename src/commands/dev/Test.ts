import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command.";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";

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

  Execute(interaction: ChatInputCommandInteraction): void {
    interaction.reply({
      content: "Test command has been ran!",
      flags: ["Ephemeral"],
    });
  }
}
