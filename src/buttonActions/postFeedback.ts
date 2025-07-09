import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';
import { matchFeedbackStore } from '../services/stores/MatchFeedbackStore';

export default class PostFeedback extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'post_feedback',
      description: 'Opens feedback modal for match video',
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    // Extract session ID from custom ID
    const [action, sessionId] = interaction.customId.split(':');

    if (action !== 'post_feedback') {
      throw new CommandError(t('buttons.post_feedback.error_invalid_session'));
    }

    if (!sessionId) {
      throw new CommandError(t('buttons.post_feedback.error_invalid_session'));
    }

    // Get session data
    const session = matchFeedbackStore.getSession(sessionId);
    if (!session) {
      throw new CommandError(t('buttons.post_feedback.error_session_not_found'));
    }

    // Create modal
    const modal = new ModalBuilder()
      .setCustomId(`match_feedback:${sessionId}`)
      .setTitle(t('buttons.post_feedback.modal_title', { title: session.title }));

    const feedbackInput = new TextInputBuilder()
      .setCustomId('feedback_message')
      .setLabel(t('buttons.post_feedback.modal_label'))
      .setPlaceholder(t('buttons.post_feedback.modal_placeholder'))
      .setMinLength(10)
      .setMaxLength(2000)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const rankInput = new TextInputBuilder()
      .setCustomId('submitter_rank')
      .setLabel(t('buttons.post_feedback.modal_rank_label'))
      .setPlaceholder(t('buttons.post_feedback.modal_rank_placeholder'))
      .setMaxLength(50)
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const feedbackRow = new ActionRowBuilder<TextInputBuilder>().addComponents(feedbackInput);
    const rankRow = new ActionRowBuilder<TextInputBuilder>().addComponents(rankInput);

    modal.addComponents(feedbackRow, rankRow);

    await interaction.showModal(modal);
  }
}
