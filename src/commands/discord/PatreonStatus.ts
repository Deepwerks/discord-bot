import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { PatreonLinks } from '../../services/database/orm/init';

export default class PatreonStatus extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'patreon-status',
      description: 'Check the Patreon status and AI chatbot access for this server',
      category: Category.Utilities,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: false,
      cooldown: 5,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const guildId = interaction.guildId!;

    const activeLinks = await PatreonLinks.findAll({
      where: {
        guildId,
        isActive: true,
      },
      order: [['tier', 'DESC']],
    });

    if (activeLinks.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle(t('commands.patreon_status.no_link_title'))
        .setColor(Colors.Red)
        .setDescription(t('commands.patreon_status.no_link_description'));

      await interaction.reply({
        embeds: [embed],
        flags: ['Ephemeral'],
      });
      return;
    }

    const bestLink = activeLinks[0];
    const linkedUsers = activeLinks
      .map((link) => `<@${link.discordUserId}>`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(t('commands.patreon_status.title'))
      .setColor(Colors.Green)
      .addFields(
        {
          name: t('commands.patreon_status.field_status'),
          value: t('commands.patreon_status.status_active'),
          inline: true,
        },
        {
          name: t('commands.patreon_status.field_tier'),
          value: bestLink.tierName || `Tier ${bestLink.tier}`,
          inline: true,
        },
        {
          name: t('commands.patreon_status.field_rate_limit'),
          value: bestLink.rateLimit != null ? `${bestLink.rateLimit} requests` : 'N/A',
          inline: true,
        },
        {
          name: t('commands.patreon_status.field_linked_users'),
          value: linkedUsers,
        }
      );

    await interaction.reply({
      embeds: [embed],
      flags: ['Ephemeral'],
    });
  }
}
