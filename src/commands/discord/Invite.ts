import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';

export default class Invite extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'invite',
      description: "Retrieves the bot's invite link",
      category: Category.Utilities,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction) {
    const inviteLink = this.client.GetInviteLink();

    await interaction.reply({
      content: `Here is the invite link for the bot: [Invite Link](${inviteLink})`,
    });
  }
}
