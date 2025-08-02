import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';

export default class Ai extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'ai',
      description: 'Gives you information about our AI feature and how to enable it on your server',
      category: Category.Utilities,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const embed = new EmbedBuilder()
      .setTitle(t('commands.ai.title'))
      .setColor(Colors.Blurple)
      .setDescription(t('commands.ai.description'))
      .setFooter({ text: t('commands.ai.footer') });

    const supportButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(t('commands.ai.button_support_server'))
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/C968DEVs6j')
    );

    await interaction.reply({
      embeds: [embed],
      components: [supportButton],
      flags: ['Ephemeral'],
    });
  }
}
