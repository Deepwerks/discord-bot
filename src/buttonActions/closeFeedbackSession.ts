import { ButtonInteraction, ThreadChannel, TextChannel } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { logger } from '..';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';
import { matchFeedbackStore } from '../services/stores/MatchFeedbackStore';

export default class CloseFeedbackSession extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'close_feedback_session',
      description: 'Closes feedback session and cleans up associated messages',
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    try {
      // Extract session ID from custom ID
      const [action, sessionId] = interaction.customId.split(':');

      if (action !== 'close_feedback_session') {
        throw new CommandError(t('buttons.close_feedback_session.error_invalid_session'));
      }

      if (!sessionId) {
        throw new CommandError(t('buttons.close_feedback_session.error_invalid_session'));
      }

      // Get session data
      const session = matchFeedbackStore.getSession(sessionId);
      if (!session) {
        throw new CommandError(t('buttons.close_feedback_session.error_session_not_found'));
      }

      // Check if the user is the creator of the session
      if (interaction.user.id !== session.creatorId) {
        throw new CommandError(t('buttons.close_feedback_session.error_not_creator'));
      }

      // Send confirmation message before deletion
      await interaction.reply({
        content: t('buttons.close_feedback_session.closing_message'),
        flags: ['Ephemeral'],
      });

      let publicMessageDeleteError = false;

      // Try to delete the public message
      try {
        const channel = (await this.client.channels.fetch(session.channelId)) as TextChannel;
        if (channel && channel.isTextBased()) {
          const publicMessage = await channel.messages.fetch(session.messageId);
          if (publicMessage) {
            await publicMessage.delete();
          }
        }
      } catch (error) {
        logger.warn('Failed to delete public message during feedback session cleanup', {
          sessionId,
          messageId: session.messageId,
          channelId: session.channelId,
          error: error instanceof Error ? error.message : error,
        });
        publicMessageDeleteError = true;
      }

      // Remove session from store
      matchFeedbackStore.removeSession(sessionId);

      // Get the current thread and delete it
      const thread = interaction.channel as ThreadChannel;
      if (thread && thread.isThread()) {
        // If there was an error deleting the public message, inform the user
        if (publicMessageDeleteError) {
          await thread.send({
            content: t('buttons.close_feedback_session.error_delete_public_message'),
          });

          // Wait a moment before deleting the thread
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        await thread.delete('Feedback session deleted by creator');
      }
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorMessage =
        error instanceof CommandError
          ? error.message
          : t('buttons.close_feedback_session.error_generic');

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, flags: ['Ephemeral'] });
      }
    }
  }
}
