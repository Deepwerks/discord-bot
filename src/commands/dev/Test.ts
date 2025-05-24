/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { logger, useAssetsClient } from '../..';
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
      dev: true,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    try {
      await interaction.deferReply();

      const firstRank = useAssetsClient.DefaultService.cache.get('0');
      console.log(JSON.stringify(firstRank, null, 2));

      await interaction.editReply({
        content: 'awdd',
      });
    } catch (error) {
      logger.error(error);

      await interaction.editReply({
        content: 'Failed',
      });
    }
  }
}
