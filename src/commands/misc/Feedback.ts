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

export default class Feedback extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'feedback',
      description: 'Send an anonymous feedback to the devs',
      category: Category.Misc,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 2,
      dev: false,
      options: [],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const modal = new ModalBuilder()
      .setCustomId('feedback')
      .setTitle('Submit Your Feedback (Anonymous)');

    const steamIdInput = new TextInputBuilder()
      .setCustomId('feedback_input')
      .setLabel('Please enter your feedback here')
      .setPlaceholder('e.g., I love this bot!')
      .setMinLength(10)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(steamIdInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  }
}
