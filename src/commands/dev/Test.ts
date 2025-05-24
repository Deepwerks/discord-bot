/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { logger } from '../..';
import { getBotVersion } from '../../services/utils/getBotVersion';

export default class Test extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'test',
      description: 'my test command',
      category: Category.Utilities,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    try {
      await interaction.deferReply();

      const botVersion = getBotVersion();

      await interaction.editReply({
        content: botVersion,
      });
    } catch (error) {
      logger.error(error);

      await interaction.editReply({
        content: 'Failed',
      });
    }
  }
}
