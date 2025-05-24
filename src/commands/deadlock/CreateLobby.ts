import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';

export default class CreateLobby extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'create-lobby',
      description: 'Create a new lobby with custom settings (!!!EXPERIMENTAL!!!)',
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: false,
      cooldown: 10,
      dev: false,
      limitedServers: ['1116312943584354374', '1369999947050778665', '1347992407291068497'],
      options: [],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const modal = new ModalBuilder().setCustomId('createLobby').setTitle('Lobby Settings');

    const maxPlayersInput = new TextInputBuilder()
      .setCustomId('max_players_input')
      .setLabel(t('commands.create_lobby.max_players'))
      .setPlaceholder(t('commands.create_lobby.placeholder'))
      .setStyle(TextInputStyle.Short)
      .setValue('12')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(maxPlayersInput));

    await interaction.showModal(modal);
  }
}
