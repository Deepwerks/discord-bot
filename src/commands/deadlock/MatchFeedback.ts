import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  TextChannel,
  ThreadAutoArchiveDuration,
  ChannelType,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { logger, useDeadlockClient } from '../..';
import CommandError from '../../base/errors/CommandError';
import { generateMatchImage } from '../../services/utils/generateMatchImage';
import { matchFeedbackStore } from '../../services/stores/MatchFeedbackStore';

export default class MatchFeedback extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'match-feedback',
      description: 'Share a match video and collect feedback from the community',
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: false, // Must be used in a server for threads
      cooldown: 10,
      dev: false,
      options: [
        {
          name: 'video',
          description: 'Upload your match video file',
          required: true,
          type: ApplicationCommandOptionType.Attachment,
        },
        {
          name: 'match_id',
          description: 'The match ID for this video',
          required: true,
          type: ApplicationCommandOptionType.Integer,
        },
        {
          name: 'title',
          description: 'Title for your match video',
          required: true,
          type: ApplicationCommandOptionType.String,
          max_length: 100,
        },
        {
          name: 'rank',
          description: 'Your current rank (optional)',
          required: false,
          type: ApplicationCommandOptionType.String,
          max_length: 50,
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const videoAttachment = interaction.options.getAttachment('video', true);
    const matchId = interaction.options.getInteger('match_id', true);
    const title = interaction.options.getString('title', true);
    const rank = interaction.options.getString('rank', false);

    await interaction.deferReply();

    try {
      // Validate video file
      if (!videoAttachment.contentType?.startsWith('video/')) {
        throw new CommandError(t('commands.match_feedback.error_invalid_video'));
      }

      // Validate file size (Discord limit is 25MB for regular users, 100MB for Nitro)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (videoAttachment.size > maxSize) {
        throw new CommandError(t('commands.match_feedback.error_file_too_large'));
      }

      // Fetch match data
      const match = await useDeadlockClient.MatchService.GetMatch(matchId);
      if (!match) {
        throw new CommandError(t('commands.match_feedback.error_match_not_found'));
      }

      // Generate match image
      const imageBuffer = await generateMatchImage({
        match,
        useGenericNames: false,
      });

      // Create private thread first
      const channel = interaction.channel as TextChannel;
      const thread = await channel.threads.create({
        name: t('commands.match_feedback.thread_name', { title }),
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        type: ChannelType.PrivateThread,
        reason: t('commands.match_feedback.thread_reason'),
      });

      // Add the command initiator to the thread
      await thread.members.add(interaction.user.id);

      // Create "Post Feedback" button
      const sessionId = `${interaction.user.id}_${Date.now()}`;
      const feedbackButton = new ButtonBuilder()
        .setCustomId(`post_feedback:${sessionId}`)
        .setLabel(t('commands.match_feedback.button_post_feedback'))
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💬');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(feedbackButton);

      // Create match image attachment
      const matchImageAttachment = new AttachmentBuilder(imageBuffer, {
        name: 'match.png',
      });

      // Create embed for the public post
      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle(t('commands.match_feedback.embed_title', { title }))
        .setDescription(
          t('commands.match_feedback.embed_description', {
            matchId,
            rank,
          })
        )
        .setFooter({
          text: t('commands.match_feedback.embed_footer', {
            displayName: interaction.user.displayName,
          }),
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      // Post in public channel
      const publicMessage = await interaction.editReply({
        embeds: [embed],
        files: [videoAttachment, matchImageAttachment],
        components: [row],
      });

      // Store session data
      matchFeedbackStore.createSession(sessionId, {
        matchId,
        title,
        rank: rank || undefined,
        videoUrl: videoAttachment.url,
        creatorId: interaction.user.id,
        threadId: thread.id,
        channelId: channel.id,
        messageId: publicMessage.id,
      });

      // Send initial message to private thread
      await thread.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setTitle(t('commands.match_feedback.thread_initial_title'))
            .setDescription(
              t('commands.match_feedback.thread_initial_description', {
                title,
                matchId,
                videoUrl: videoAttachment.url,
              })
            )
            .setTimestamp(),
        ],
      });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.name,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(
          error instanceof CommandError ? error.message : t('commands.match_feedback.error_generic')
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
