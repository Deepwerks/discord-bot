import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { isAbleToUseChatbot } from '../../services/database/repository';
import CommandError from '../../base/errors/CommandError';

export default class Test extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'test',
      description: 'my test command',
      category: Category.Utilities,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 0,
      options: [],
      dev: true,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, _t: TFunction<'translation', undefined>) {
    const isAbleToRunCommand = await isAbleToUseChatbot(interaction.guildId!);

    if (!isAbleToRunCommand) {
      throw new CommandError('Limit reached');
    }

    await interaction.reply({
      content: 'Run',
    });
  }
}
