import { EmbedBuilder, ModalSubmitInteraction, ThreadChannel, TextChannel } from 'discord.js';
import CustomClient from '../base/classes/CustomClient';
import Modal from '../base/classes/CustomModal';
import CommandError from '../base/errors/CommandError';
import { t } from 'i18next';
import { matchFeedbackStore } from '../services/redis/stores/MatchFeedbackStore';
import { logger } from '..';

export default class MatchFeedback extends Modal {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'match_feedback',
      description: 'Handles match feedback submissions',
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    // Extract session ID from custom ID
    const [action, sessionId] = interaction.customId.split(':');

    if (action !== 'match_feedback') {
      throw new CommandError(t('modals.match_feedback.error_invalid_session'));
    }

    if (!sessionId) {
      throw new CommandError(t('modals.match_feedback.error_invalid_session'));
    }

    // Get session data
    const session = await matchFeedbackStore.get(sessionId);
    if (!session) {
      throw new CommandError(t('modals.match_feedback.error_session_not_found'));
    }

    const feedbackMessage = interaction.fields.getTextInputValue('feedback_message');
    const submitterRank = interaction.fields.getTextInputValue('submitter_rank') || null;
    const ratingValue = interaction.fields.getTextInputValue('feedback_rating');

    // Validate rating
    const rating = parseInt(ratingValue);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new CommandError(t('buttons.post_feedback.error_invalid_rating'));
    }

    // Get the private thread
    const thread = (await this.client.channels.fetch(session.threadId)) as ThreadChannel;
    if (!thread || !thread.isThread()) {
      throw new CommandError(t('modals.match_feedback.error_thread_not_found'));
    }

    // Create feedback embed
    const feedbackEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setAuthor({
        name: interaction.user.displayName,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription(feedbackMessage)
      .setTimestamp()
      .setFooter({
        text: t('modals.match_feedback.feedback_footer', { title: session.title }),
      });

    // Add rank field if provided
    if (submitterRank) {
      feedbackEmbed.addFields({
        name: t('modals.match_feedback.feedback_rank_field'),
        value: submitterRank,
        inline: true,
      });
    }

    // Add rating field
    const stars = ':star:'.repeat(rating);
    feedbackEmbed.addFields({
      name: t('modals.match_feedback.feedback_rating_field'),
      value: t('modals.match_feedback.rating_stars', { stars, rating }),
      inline: true,
    });

    // Store the rating
    await matchFeedbackStore.addRating(sessionId, rating);

    // Post feedback to private thread
    await thread.send({
      embeds: [feedbackEmbed],
    });

    // Update public message with new average rating
    try {
      const channel = (await this.client.channels.fetch(session.channelId)) as TextChannel;
      if (channel && channel.isTextBased()) {
        const publicMessage = await channel.messages.fetch(session.messageId);
        if (publicMessage && publicMessage.embeds.length > 0) {
          const embed = EmbedBuilder.from(publicMessage.embeds[0]);

          const updatedSession = await matchFeedbackStore.get(sessionId);

          const ratings = updatedSession?.ratings ?? [];
          const ratingAvg = ratings.length
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;
          const ratingCount = ratings.length;

          // Remove existing rating field if present
          const existingFields =
            embed.data.fields?.filter(
              (field) => field.name !== t('commands.match_feedback.embed_rating_field')
            ) || [];

          // Add updated rating field
          embed.setFields(...existingFields, {
            name: t('commands.match_feedback.embed_rating_field'),
            value: t('commands.match_feedback.embed_rating_value', {
              stars: ':star:'.repeat(Math.round(ratingAvg)),
              average: ratingAvg.toFixed(1),
              count: ratingCount,
            }),
            inline: true,
          });

          await publicMessage.edit({ embeds: [embed] });
        }
      }
    } catch (error) {
      logger.warn('Failed to update public message with rating', {
        sessionId,
        messageId: session.messageId,
        channelId: session.channelId,
        error: error instanceof Error ? error.message : error,
      });
    }

    // Confirm to the user
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setDescription(t('modals.match_feedback.success_message')),
      ],
      flags: ['Ephemeral'],
    });
  }
}
