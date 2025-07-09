/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { useAssetsClient, useDeadlockClient } from '../..';
import CommandError from '../../base/errors/CommandError';

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
    await interaction.deferReply();

    const match = await useDeadlockClient.MatchService.GetMatch(36017246);
    if (!match) throw new CommandError('No match found');

    const player = match.players.find((player) => player.account_id === 250901865);
    if (!player) throw new CommandError('Player not found in match');

    const items = await Promise.all(
      player.items.map(async (item) => {
        const asset = await useAssetsClient.ItemService.GetItem(item.item_id);
        return asset;
      })
    );

    const response = items.map((item) => `${item?.name}`).join('\n');

    await interaction.editReply({
      content: response,
    });
  }
}
