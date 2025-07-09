import { ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionReplyOptions } from 'discord.js';
import { PaginationContext, paginationStore } from '../stores/PaginationStore';

export function createPaginationSession(
  sessionId: string,
  context: PaginationContext
): InteractionReplyOptions {
  paginationStore.set(sessionId, context);

  const embed = context.generateEmbed(context.data[0], 0, context.data.length);

  const startButton = new ButtonBuilder()
    .setCustomId(`pagination:start:${sessionId}`)
    .setLabel('⏮️')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true);

  const backButton = new ButtonBuilder()
    .setCustomId(`pagination:back:${sessionId}`)
    .setLabel('◀ Back')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true);

  const nextButton = new ButtonBuilder()
    .setCustomId(`pagination:next:${sessionId}`)
    .setLabel('Next ▶')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(context.data.length <= 1);

  const endButton = new ButtonBuilder()
    .setCustomId(`pagination:end:${sessionId}`)
    .setLabel('⏭️')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(context.data.length <= 1);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    startButton,
    backButton,
    nextButton,
    endButton
  );

  // Auto-clean after 5 minutes
  setTimeout(() => paginationStore.delete(sessionId), 5 * 60 * 1000);

  return {
    embeds: [embed],
    components: [row],
  };
}
