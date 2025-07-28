import {
  ActionRow,
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonComponent,
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  ComponentType,
  EmbedBuilder,
  ForumChannel,
  ForumLayoutType,
  MessageActionRowComponent,
  OverwriteType,
  PermissionFlagsBits,
  SortOrderType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
  User,
} from 'discord.js';
import DiscordTransaction from '../../../../../base/classes/DiscordTransaction';
import { MatchReviewRequests, StoredPlayers } from '../../../../database/orm/init';
import DeadlockMatch from '../../../../clients/DeadlockClient/services/DeadlockMatchService/entities/DeadlockMatch';
import { useAssetsClient, useDeadlockClient, useStatlockerClient } from '../../../../..';
import { generateMatchImage } from '../../../../utils/generateMatchImage';
import getHistoryTable from '../../../../utils/getHistoryTable';
import { getGuildConfig } from '../../../../database/repository';
import i18next from '../../../../i18n';
import { Transaction } from 'sequelize';
import getPlayerStatsEmbed from '../../../../utils/getPlayerStatsEmbed';
import CustomClient from '../../../../../base/classes/CustomClient';

export type AMRMChannelType = 'CategoryChannel' | 'ForumChannel' | 'DashboardChannel';

export default class DiscordService {
  private client: CustomClient;

  private categoryChannel: CategoryChannel | null = null;
  private dashboardChannel: TextChannel | null = null;
  private forumChannel: ForumChannel | null = null;

  constructor(discordClient: CustomClient) {
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
            PermissionFlagsBits.SendMessagesInThreads,
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
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
      ],
      defaultSortOrder: SortOrderType.CreationDate,
      defaultForumLayout: ForumLayoutType.ListView,
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
          `You'll answer a few quick questions about your match, and others can leave helpful feedback.\n\n`
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
      .setCustomId('amrm_open_draft_modal')
      .setLabel('Open Draft')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📝');

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(draftButton);

    await this.dashboardChannel.send({
      embeds: [dashboardEmbed],
      components: [actionRow],
    });
  }

  async createDraftChannel(user: User, channelName: string, transaction?: DiscordTransaction) {
    if (!this.categoryChannel) throw new Error('Category channel not found');
    const guild = this.categoryChannel.guild;
    const botUserId = guild.client.user!.id;

    const channel = await this.categoryChannel.children.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          type: OverwriteType.Role,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: botUserId,
          type: OverwriteType.Member,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: user,
          type: OverwriteType.Member,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        },
      ],
    });
    if (transaction) transaction.addCreatedChannel(channel.id);

    return channel;
  }

  async sendDraftEmbed(
    channel: TextChannel,
    matchReviewRequest: MatchReviewRequests,
    match: DeadlockMatch,
    matchPlayerIndex: number,
    transaction: Transaction
  ) {
    const matchPlayer = match.players[matchPlayerIndex];

    const heroPlayed = await useAssetsClient.HeroService.GetHero(matchPlayer.hero_id);

    const draftEmbed = new EmbedBuilder()
      .setTitle('📝 Draft Match Review')
      .setDescription(
        `You're almost ready to publish your match review request.\n\n` +
          `Please double-check the details below and click **Publish** when you're done.`
      )
      .setColor(0xf1c40f)
      .addFields(
        { name: 'Match ID', value: String(match.matchId), inline: true },
        { name: 'Played hero', value: heroPlayed ? heroPlayed.name : 'Unknown', inline: true },
        {
          name: 'Your Notes',
          value:
            matchReviewRequest.description && matchReviewRequest.description.trim().length > 0
              ? matchReviewRequest.description
              : '*No description provided.*',
        }
      )
      .setFooter({ text: 'Click Publish to make this request public in the review forum.' });

    const publishButton = new ButtonBuilder()
      .setCustomId('amrm_publish_request')
      .setLabel('📢 Publish Request')
      .setStyle(ButtonStyle.Success);

    const deleteButton = new ButtonBuilder()
      .setCustomId('amrm_delete_request')
      .setLabel('🗑️ Delete Request')
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
      publishButton,
      deleteButton,
    ]);

    const matchData = {
      match: match,
      useGenericNames: false,
      highlightedPlayerId: matchPlayer.account_id,
    };

    const imageBuffer = await generateMatchImage(matchData);

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: 'match.png',
    });

    const message = await channel.send({
      embeds: [draftEmbed],
      components: [actionRow],
      files: [attachment],
    });

    await matchReviewRequest.update(
      {
        draftMessageId: message.id,
      },
      { transaction }
    );
  }

  async editDraftEmbed(matchReviewRequest: MatchReviewRequests) {
    const channel = this.client.channels.cache.get(matchReviewRequest.channelId);
    if (channel && channel.isTextBased() && matchReviewRequest.draftMessageId) {
      const message = await channel.messages.fetch(matchReviewRequest.draftMessageId);

      const rows = message.components as ActionRow<MessageActionRowComponent>[];

      const updatedComponents = rows.map((row) =>
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          row.components.map((component) => {
            if (
              component.type === ComponentType.Button &&
              component.customId === 'amrm_publish_request'
            ) {
              return ButtonBuilder.from(component as ButtonComponent).setDisabled(true);
            }
            return ButtonBuilder.from(component as ButtonComponent);
          })
        )
      );

      await message.edit({
        components: updatedComponents,
      });
    }
  }

  async deleteThread(threadId: string | null) {
    if (!threadId) return;

    const thread = await this.client.channels.fetch(threadId);
    if (thread?.isThread() && thread.ownerId === this.client.user!.id) {
      await thread.delete();
    }
  }

  async postMatchReviewRequest(matchReviewRequest: MatchReviewRequests) {
    const guildConfig = await getGuildConfig(matchReviewRequest.guildId);
    const t = i18next.getFixedT(guildConfig?.preferedLanguage ?? 'en');

    const match = await useDeadlockClient.MatchService.GetMatch(Number(matchReviewRequest.matchId));
    if (!match) throw new Error('Match not found');

    const storedPlayer = await StoredPlayers.findOne({
      where: { discordId: matchReviewRequest.userId },
    });
    if (!storedPlayer) throw new Error('Player not found');

    const matchPlayer = match.players.find((p) => p.account_id === Number(storedPlayer.steamId));
    if (!matchPlayer) throw new Error('Player not found in the match');

    const statlockerProfile = await useStatlockerClient.ProfileService.GetProfile(
      matchPlayer.account_id
    );
    const estimatedRank = statlockerProfile ? await statlockerProfile.getEstimatedRankName() : null;

    const heroPlayed = (await useAssetsClient.HeroService.GetHero(matchPlayer.hero_id))!;

    const matchData = {
      match: match,
      useGenericNames: false,
      highlightedPlayerId: matchPlayer.account_id,
    };

    const imageBuffer = await generateMatchImage(matchData);

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: 'match.png',
    });

    const title = `${statlockerProfile?.name} (${estimatedRank ?? 'Unrated'}) - ${heroPlayed.name} [${match.matchId}]`;

    const embed = new EmbedBuilder()
      .setTitle(`Match Review Request`)
      .setDescription(
        `**Player:** ${statlockerProfile ? statlockerProfile.name : `<@${storedPlayer.discordId}>`}\n` +
          `**Match ID:** \`${match.matchId}\`\n` +
          `**Hero:** ${heroPlayed.name}\n` +
          `**Estimated Rank:** ${estimatedRank ?? 'N/A'}`
      )
      .setImage('attachment://match.png')
      .setColor(0x2f3136)
      .setTimestamp();

    const selector = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('amrm_review_selector')
        .setPlaceholder('Select a category to review')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('Overall').setValue('overall'),
          new StringSelectMenuOptionBuilder().setLabel('Positioning').setValue('positioning'),
          new StringSelectMenuOptionBuilder().setLabel('Macro').setValue('macro'),
          new StringSelectMenuOptionBuilder().setLabel('Mechanics').setValue('mechanics')
        )
    );

    const { response: historyTable } = await getHistoryTable(
      storedPlayer.steamId,
      storedPlayer.discordId,
      t
    );
    const { embed: playerHeroStats } = await getPlayerStatsEmbed(
      storedPlayer.steamId,
      storedPlayer.discordId,
      heroPlayed.name,
      this.client
    );

    const thread = await (this.forumChannel as ForumChannel).threads.create({
      name: title,
      message: {
        content: matchReviewRequest.description ?? '',
        embeds: [embed],
        components: [selector],
        files: [attachment],
      },
      reason: 'Match review requested',
    });

    await thread.send({
      content: historyTable,
      embeds: [playerHeroStats],
    });

    return thread;
  }
}
