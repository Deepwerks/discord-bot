import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  Client,
  EmbedBuilder,
  ForumChannel,
  ForumLayoutType,
  OverwriteType,
  PermissionFlagsBits,
  SortOrderType,
  TextChannel,
} from 'discord.js';
import DiscordTransaction from '../../../../../base/classes/DiscordTransaction';

export type AMRMChannelType = 'CategoryChannel' | 'ForumChannel' | 'DashboardChannel';

export default class DiscordService {
  private client: Client;

  private categoryChannel: CategoryChannel | null = null;
  private dashboardChannel: TextChannel | null = null;
  private forumChannel: ForumChannel | null = null;

  constructor(discordClient: Client) {
    this.client = discordClient;
  }

  isChannelExists(channelId: string | null, type: AMRMChannelType) {
    if (!channelId) return false;
    const channel = this.client.channels.cache.get(channelId);

    if (channel !== undefined && channel !== null) {
      if (type === 'CategoryChannel') this.categoryChannel = channel as CategoryChannel;
      else if (type === 'DashboardChannel') this.dashboardChannel = channel as TextChannel;
      else this.forumChannel = channel as ForumChannel;

      return true;
    }
    return false;
  }

  async createCategoryChannel(guildId: string, transaction?: DiscordTransaction) {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) throw new Error('No guild found');

    const categoryChannel = await guild.channels.create({
      name: 'Match Reviews',
      type: ChannelType.GuildCategory,
    });

    this.categoryChannel = categoryChannel;
    if (transaction) transaction.addCreatedChannel(categoryChannel.id);
    return categoryChannel.id;
  }
  async createForumChannel(transaction?: DiscordTransaction) {
    if (!this.categoryChannel) throw new Error('Category channel not found');
    const guild = this.categoryChannel.guild;
    const botUserId = guild.client.user!.id;

    const forumChannel = await this.categoryChannel.children.create({
      name: 'match-review',
      type: ChannelType.GuildForum,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          type: OverwriteType.Role,
          deny: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.CreatePublicThreads,
          ],
          allow: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: botUserId,
          type: OverwriteType.Member,
          allow: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.CreatePublicThreads,
          ],
        },
      ],
      defaultSortOrder: SortOrderType.CreationDate,
      defaultForumLayout: ForumLayoutType.GalleryView,
    });

    this.forumChannel = forumChannel;
    if (transaction) transaction.addCreatedChannel(forumChannel.id);
    return forumChannel.id;
  }
  async createDashboardChannel(transaction?: DiscordTransaction) {
    if (!this.categoryChannel) throw new Error('Category channel not found');
    const guild = this.categoryChannel.guild;
    const botUserId = guild.client.user!.id;

    const dashboardChannel = await this.categoryChannel.children.create({
      name: 'dashboard',
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          type: OverwriteType.Role,
          deny: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.CreatePublicThreads,
          ],
          allow: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: botUserId,
          type: OverwriteType.Member,
          allow: [PermissionFlagsBits.SendMessages],
        },
      ],
    });

    this.dashboardChannel = dashboardChannel;
    if (transaction) transaction.addCreatedChannel(dashboardChannel.id);
    return dashboardChannel.id;
  }

  async deleteChannel(channelId: string | null) {
    if (!channelId) return;

    const channel = this.client.channels.cache.get(channelId);
    if (channel) {
      await channel.delete();
    }
  }

  async sendDashboard() {
    if (!this.dashboardChannel) throw new Error('Dashboard channel not found');

    const dashboardEmbed = new EmbedBuilder()
      .setTitle('🎯 Request a Match Review')
      .setDescription(
        `Want feedback on your gameplay? Start a match review request in just a few clicks.\n\n` +
          `You'll answer a few quick questions about your match, and others can leave helpful feedback.\n\n` +
          `No typing needed — everything is guided.`
      )
      .setColor(0x5865f2)
      .addFields(
        {
          name: 'How to get started',
          value: 'Click the **Open Draft** button below to begin your request.',
        },
        {
          name: 'What happens next?',
          value: `Your request will be posted in the ${this.forumChannel!.url} channel for others to see and respond.`,
        }
      );

    const draftButton = new ButtonBuilder()
      .setCustomId('amrm_open_draft')
      .setLabel('Open Draft')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📝');

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(draftButton);

    await this.dashboardChannel.send({
      embeds: [dashboardEmbed],
      components: [actionRow],
    });
  }
}
