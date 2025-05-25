import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { generateSteamLinkToken } from '../../services/utils/SteamLinkToken';
export default class Store extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'store',
      description: "Store your Steam ID to enable the 'me' shortcut in certain commands!",
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 60,
      dev: false,
      options: [],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const token = generateSteamLinkToken(interaction.user.id);
    const url = `${
      this.client.config.deadlock_assistant_url
    }/auth/steam?token=${encodeURIComponent(token)}`;

    const linkButton = new ButtonBuilder()
      .setLabel(t('commands.store.button'))
      .setStyle(ButtonStyle.Link)
      .setURL(url);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

    const embed = new EmbedBuilder()
      .setColor(0x1b2838)
      .setTitle(t('commands.store.title'))
      .setDescription(t('commands.store.description'));

    await interaction.reply({
      embeds: [embed],
      flags: ['Ephemeral'],
      components: [row],
    });
  }
}
