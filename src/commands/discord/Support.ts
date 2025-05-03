import {
  ChatInputCommandInteraction,
  OAuth2Scopes,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";

export default class Support extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "support",
      description: "Retrieves the bot's support server invite link",
      category: Category.Utilities,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction) {
    const inviteLink = "https://discord.gg/C968DEVs6j";

    await interaction.reply({
      content: `Here is the invite link for the bot's support server: [Invite Link](${inviteLink})`,
    });
  }
}
