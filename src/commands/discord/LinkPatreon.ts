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
import { patreonLinkTokenStore } from '../../services/redis/stores/PatreonLinkTokenStore';
import { PatreonLinks } from '../../services/database/orm/init';
import crypto from 'crypto';

export default class LinkPatreon extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'link-patreon',
      description: 'Link your Patreon account to enable AI chatbot for this server',
      category: Category.Utilities,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: false,
      cooldown: 10,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const guildId = interaction.guildId!;
    const discordUserId = interaction.user.id;

    const existingLink = await PatreonLinks.findOne({
      where: {
        discordUserId,
        guildId,
        isActive: true,
      },
    });

    if (existingLink) {
      const state = crypto.randomUUID();
      await patreonLinkTokenStore.storeState(state, discordUserId, guildId, 300);

      const oauthUrl = `${this.client.config.ai_assistant_api_url}/auth/patreon?redirect_uri=${encodeURIComponent(this.client.config.patreon_oauth_callback_url)}&state=${encodeURIComponent(state)}`;

      const embed = new EmbedBuilder()
        .setTitle(t('commands.link_patreon.already_linked_title'))
        .setColor(Colors.Green)
        .setDescription(
          t('commands.link_patreon.already_linked_description', {
            tierName: existingLink.tierName || 'Unknown',
            tier: existingLink.tier,
            rateLimit: existingLink.rateLimit ?? 'N/A',
          })
        );

      const relinkButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(t('commands.link_patreon.button_relink'))
          .setStyle(ButtonStyle.Link)
          .setURL(oauthUrl)
      );

      await interaction.reply({
        embeds: [embed],
        components: [relinkButton],
        flags: ['Ephemeral'],
      });
      return;
    }

    const state = crypto.randomUUID();
    await patreonLinkTokenStore.storeState(state, discordUserId, guildId, 300);

    const oauthUrl = `${this.client.config.ai_assistant_api_url}/auth/patreon?redirect_uri=${encodeURIComponent(this.client.config.patreon_oauth_callback_url)}&state=${encodeURIComponent(state)}`;

    const embed = new EmbedBuilder()
      .setTitle(t('commands.link_patreon.title'))
      .setColor(Colors.Blurple)
      .setDescription(t('commands.link_patreon.description'));

    const linkButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(t('commands.link_patreon.button_link'))
        .setStyle(ButtonStyle.Link)
        .setURL(oauthUrl)
    );

    await interaction.reply({
      embeds: [embed],
      components: [linkButton],
      flags: ['Ephemeral'],
    });
  }
}
