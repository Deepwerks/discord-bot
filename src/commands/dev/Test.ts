/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { logger } from '../..';
import { DeadlockClient } from '../../services/clients-v2/DeadlockClient';

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

      const useDeadlockClientV2 = new DeadlockClient({
        config: this.client.config,
        apiKey: this.client.config.deadlock_api_key,
        baseURL: this.client.config.deadlock_api_url,
      });

      const match = await useDeadlockClientV2.MatchService.GetMatch('36017246');

      await interaction.editReply({
        content: match.startDate.format(),
      });
    } catch (error) {
      logger.error(error);

      await interaction.reply({
        content: 'Failed',
        flags: ['Ephemeral'],
      });
    }
  }
}
