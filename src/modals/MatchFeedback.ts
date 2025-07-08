import { EmbedBuilder, ModalSubmitInteraction, ThreadChannel } from 'discord.js';
import CustomClient from '../base/classes/CustomClient';
import Modal from '../base/classes/CustomModal';
import { logger } from '..';
import CommandError from '../base/errors/CommandError';
import { matchFeedbackStore } from '../services/stores/MatchFeedbackStore';
import { t } from 'i18next';

export default class MatchFeedback extends Modal {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'match_feedback',
      description: 'Handles match feedback submissions',
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    try {
      // Extract session ID from custom ID
      const [action, sessionId] = interaction.customId.split(':');

      if (action !== 'match_feedback') {
        throw new CommandError(t('modals.match_feedback.error_invalid_session'));
      }

      if (!sessionId) {
        throw new CommandError(t('modals.match_feedback.error_invalid_session'));
      }

      // Get session data
      const session = matchFeedbackStore.getSession(sessionId);
      if (!session) {
        throw new CommandError(t('modals.match_feedback.error_session_not_found'));
      }

      const feedbackMessage = interaction.fields.getTextInputValue('feedback_message');
      const submitterRank = interaction.fields.getTextInputValue('submitter_rank') || null;

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

      // Post feedback to private thread
      await thread.send({
        embeds: [feedbackEmbed],
      });

      // Confirm to the user
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setDescription(t('modals.match_feedback.success_message')),
        ],
        ephemeral: true,
      });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorMessage =
        error instanceof CommandError ? error.message : t('modals.match_feedback.error_generic');
      const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(errorMessage);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
