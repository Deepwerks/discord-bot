import {
  ActionRowBuilder,
  ButtonInteraction,
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { logger, useDeadlockClient } from '../../../..';
import DiscordTransaction from '../../../../base/classes/DiscordTransaction';
import {
  MatchReviewRequests,
  MatchReviews,
  sequelize,
  StoredPlayers,
} from '../../../database/orm/init';
import ConfigService from './services/configService';
import DiscordService from './services/discordService';
import { useMatchReviewRequestStore } from '../../stores/MatchReviewRequestStore';
import { MatchReviewType } from '../../../database/orm/models/MatchReviews.model';

export default class GuildAMRMManager {
  private discordService: DiscordService;
  private configService: ConfigService;

  constructor(discordService: DiscordService, configService: ConfigService) {
    this.discordService = discordService;
    this.configService = configService;
  }

  async handleEnableAMRM() {
    logger.info(`Enabling AMRM in server: ${this.configService.guildId}`);

    const transaction = await sequelize.transaction();
    const discordTx = new DiscordTransaction(this.discordService);

    try {
      await this.configService.enableAMRM(transaction);

      const config = (await this.configService.getConfig(transaction))!;

      const categoryId = this.discordService.isChannelExists(config.categoryId, 'CategoryChannel')
        ? config.categoryId!
        : await this.discordService.createCategoryChannel(this.configService.guildId, discordTx);
      const forumId = this.discordService.isChannelExists(config.forumId, 'ForumChannel')
        ? config.forumId!
        : await this.discordService.createForumChannel(discordTx);
      const dashboardId = this.discordService.isChannelExists(
        config.dashboardId,
        'DashboardChannel'
      )
        ? config.dashboardId!
        : await this.discordService.createDashboardChannel(discordTx);

      await this.discordService.sendDashboard();
      await this.configService.saveChannels(categoryId, forumId, dashboardId, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      await discordTx.rollback();
      logger.error(`AMRM enable failed: ${error}`);
    }
  }
  async handleDisableAMRM() {
    logger.info(`Disabling AMRM in server: ${this.configService.guildId}`);
    const transaction = await sequelize.transaction();

    try {
      await this.configService.disableAMRM(transaction);

      const config = await this.configService.getConfig();
      if (!config) return;

      await Promise.all([
        this.discordService.deleteChannel(config.dashboardId),
        this.discordService.deleteChannel(config.forumId),
        this.discordService.deleteChannel(config.categoryId),
      ]);

      await this.configService.deleteChannels(transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      logger.error(`AMRM disable failed: ${error}`);
    }
  }

  async handleButtonEvent(interaction: ButtonInteraction) {
    const [action, ..._params] = interaction.customId.split(':');

    switch (action) {
      case 'amrm_open_draft_modal': {
        const modal = new ModalBuilder()
          .setCustomId('amrm_open_draft')
          .setTitle('Create Your Match Review Request Draft');

        const matchIdInput = new TextInputBuilder()
          .setCustomId('match_id')
          .setLabel('Match ID')
          .setPlaceholder(`37972812`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const descriptionInput = new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Description')
          .setPlaceholder(
            'What feedback do you want? Mention goals, key actions, decisions, or issues to focus on.'
          )
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(matchIdInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
        );

        await interaction.showModal(modal);
        break;
      }
      case 'amrm_delete_request': {
        await interaction.deferUpdate();

        const transaction = await sequelize.transaction();
        const discordTx = new DiscordTransaction(this.discordService);
        try {
          const channel = interaction.channel;
          const matchReviewRequest = await MatchReviewRequests.findOne({
            where: { channelId: channel!.id },
            transaction,
          });

          if (!matchReviewRequest) throw new Error('Match review request not found');

          if (matchReviewRequest.userId !== interaction.user.id)
            throw new Error('You cant delete this request');

          await this.discordService.deleteThread(matchReviewRequest.postMessageId);
          await this.discordService.deleteChannel(matchReviewRequest.channelId);

          await matchReviewRequest.destroy({ transaction });

          await transaction.commit();
        } catch (error) {
          logger.error(`Create AMRM draft failed: ${error}`);

          await transaction.rollback();
          await discordTx.rollback();
        }
        break;
      }
      case 'amrm_publish_request': {
        const transaction = await sequelize.transaction();
        const discordTx = new DiscordTransaction(this.discordService);
        await interaction.deferReply({ flags: ['Ephemeral'] });

        try {
          const channel = interaction.channel;
          const matchReviewRequest = await MatchReviewRequests.findOne({
            where: { channelId: channel!.id },
            transaction,
          });

          if (!matchReviewRequest) throw new Error('Match review request not found');

          if (matchReviewRequest.userId !== interaction.user.id)
            throw new Error('You cant publish this request');

          const config = await this.configService.getConfig();
          if (!config) throw new Error('Server config not found');

          const isFormChannelExists = this.discordService.isChannelExists(
            config.forumId,
            'ForumChannel'
          );
          if (!isFormChannelExists) throw new Error('Forum channel not found');

          const thread = await this.discordService.postMatchReviewRequest(matchReviewRequest);

          await matchReviewRequest.update(
            {
              postMessageId: thread.id,
            },
            { transaction }
          );

          await transaction.commit();
          await interaction.editReply({ content: `Match Review Request created: ${thread.url}` });
        } catch (error) {
          logger.error(`Create AMRM draft failed: ${error}`);

          await transaction.rollback();
          await discordTx.rollback();
        }
        break;
      }

      default:
        break;
    }
  }

  async handleModalEvent(interaction: ModalSubmitInteraction) {
    const [action] = interaction.customId.split(':');

    switch (action) {
      case 'amrm_open_draft': {
        const transaction = await sequelize.transaction();
        const discordTx = new DiscordTransaction(this.discordService);

        await interaction.deferReply({ flags: ['Ephemeral'] });
        try {
          const matchId = interaction.fields.getTextInputValue('match_id');
          const description = interaction.fields.getTextInputValue('description');

          const config = await this.configService.getConfig(transaction);
          if (!config) throw new Error('Server config not found');

          const isCategoryChannelExists = this.discordService.isChannelExists(
            config.categoryId,
            'CategoryChannel'
          );
          if (!isCategoryChannelExists) throw new Error('Category channel not found');

          const player = await StoredPlayers.findOne({
            where: { discordId: interaction.user.id },
            transaction,
          });
          if (!player) {
            await interaction.reply({
              content: `⚠️ You need to **link your Steam account** before using this feature.\nUse the /store command to connect your account.`,
              flags: ['Ephemeral'],
            });
            await transaction.rollback();
            return;
          }

          const match = await useDeadlockClient.MatchService.GetMatch(Number(matchId));
          if (!match) throw new Error('Match not found');

          const matchPlayerIndex = match.players.findIndex(
            (p) => p.account_id === Number(player.steamId)
          );
          if (matchPlayerIndex === -1) {
            await interaction.reply({
              content: `⚠️ Your Steam account is linked, but you were **not a participant in this match**.\nPlease double-check the Match ID.`,
              flags: ['Ephemeral'],
            });
            await transaction.rollback();
            return;
          }

          const channelName = `draft-${matchId}`;
          const channel = await this.discordService.createDraftChannel(
            interaction.user,
            channelName,
            discordTx
          );

          const matchReviewRequest = await useMatchReviewRequestStore.create(
            {
              userId: interaction.user.id,
              guildId: interaction.guildId!,
              matchId: matchId,
              channelId: channel.id,
              description: description,
            },
            transaction
          );

          await this.discordService.sendDraftEmbed(
            channel,
            matchReviewRequest,
            match,
            matchPlayerIndex
          );

          await interaction.editReply({
            content: `We have created your draft room in ${channel.url}`,
          });
          await transaction.commit();
        } catch (error) {
          logger.error(`Create AMRM draft failed: ${error}`);

          await transaction.rollback();
          await discordTx.rollback();
        }
        break;
      }
      case 'amrm_review_match': {
        const [_action, reviewRequestId, chosenTopic] = interaction.customId.split(':');

        const transaction = await sequelize.transaction();

        await interaction.deferReply({ flags: ['Ephemeral'] });
        try {
          const ratingRaw = interaction.fields.getTextInputValue('rating');
          const rating = Number(ratingRaw);
          const description = interaction.fields.getTextInputValue('description');

          if (isNaN(rating) || rating <= 0 || rating > 5) throw new Error('Invalid rating');

          const reviewRequest = await MatchReviewRequests.findByPk(reviewRequestId, {
            transaction,
          });
          if (!reviewRequest) throw new Error('Match review request not found');

          await MatchReviews.create(
            {
              requestId: reviewRequest.id,
              userId: interaction.user.id,
              type: chosenTopic,
              rating: rating,
              description: description,
            },
            { transaction }
          );

          const userChannel = interaction.guild?.channels.cache.get(reviewRequest.channelId);
          if (!userChannel) throw new Error('User channel not found');

          const embed = new EmbedBuilder()
            .setTitle('📝 New Match Review Submitted')
            .setDescription(
              `Your request received a new review!\n\n` +
                `**Topic:** ${chosenTopic}\n` +
                `**Rating:** ${rating}/5\n` +
                `**Feedback:**\n${description}`
            )
            .setColor(0x00b0f4)
            .setTimestamp()
            .setFooter({
              text: `Reviewed by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            });

          await (userChannel as TextChannel).send({
            content: `<@${reviewRequest.userId}>`,
            embeds: [embed],
          });
          await interaction.editReply({
            content: 'Review sent!',
          });
          await transaction.commit();
        } catch (error) {
          logger.error(`Match review failed: ${error}`);
          await transaction.rollback();
        }
        break;
      }

      default:
        break;
    }
  }

  async handleSelectMenuEvent(interaction: StringSelectMenuInteraction) {
    const [action] = interaction.customId.split(':');

    switch (action) {
      case 'amrm_review_selector': {
        const chosenTopic = interaction.values[0] as MatchReviewType;
        const reviewRequest = await MatchReviewRequests.findOne({
          where: {
            guildId: interaction.guildId!,
            postMessageId: interaction.message.channelId,
          },
        });

        if (!reviewRequest) throw new Error('Review request not found');

        const review = await MatchReviews.findOne({
          where: {
            requestId: reviewRequest.id,
            type: chosenTopic,
            userId: interaction.user.id,
          },
        });

        if (review) throw new Error('You have already reviewed this category!');

        const modal = new ModalBuilder()
          .setCustomId(`amrm_review_match:${reviewRequest.id}:${chosenTopic}`)
          .setTitle(`Match Review: ${chosenTopic}`);

        const ratingInput = new TextInputBuilder()
          .setCustomId('rating')
          .setLabel('Rating (1-5)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const descriptionInput = new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Why did you give this rating?')
          .setPlaceholder(
            'Write a short explanation for your rating (e.g. strengths, weaknesses, or improvement tips)'
          )
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(ratingInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
        );

        await interaction.showModal(modal);

        break;
      }

      default:
        break;
    }
  }
}
