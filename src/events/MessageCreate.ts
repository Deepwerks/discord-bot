import { Events, Message } from 'discord.js';
import CustomClient from '../base/classes/CustomClient';
import Event from '../base/classes/Event';
import { logger, useAIAssistantClient } from '..';
import { AIAssistantResponse } from '../services/clients/AIAssistantClient/services/DeadlockAiAssistantService';
import { isAbleToUseChatbot } from '../services/database/repository';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(duration);
dayjs.extend(relativeTime);

export default class MessageCreate extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.MessageCreate,
      once: false,
      description: 'Message Event',
    });
  }

  async Execute(message: Message) {
    if (message.author.bot) return;
    if (!message.mentions.has(this.client.user!)) return;

    const [isAbleToUse, error] = await isAbleToUseChatbot(message.guildId!);

    if (!isAbleToUse && error) {
      if (error === 'NoSubscription') {
        await message.reply({
          content: `❌ Chatbot integration is not active in this server.`,
        });
      } else if (error === 'LimitReached') {
        const now = dayjs();
        const nextReset = now.endOf('day').add(1, 'second');
        const discordRelative = `<t:${nextReset.unix()}:R>`;

        await message.reply({
          content: `❌ This server has reached its daily limit. You can chat with me again ${discordRelative}.`,
        });
      }
      return;
    }

    logger.debug('Bot mentioned in message', {
      guildId: message.guildId,
      channelId: message.channelId,
      messageId: message.id,
      authorId: message.author.id,
      content: message.content,
    });

    const question = message.content.replace(`<@${this.client.user?.id}>`, '').trim();

    const replyMessage = await message.reply('Thinking');

    let nextUpdate = '';
    let lastUpdateTime = 0;
    let updateTimer: NodeJS.Timeout | null = null;

    function onUpdate({
      answer,
      thinkingMessages,
      memoryId,
      error,
      formattedAnswer,
    }: AIAssistantResponse) {
      logger.debug('AI Assistant Response', { answer, thinkingMessages });

      const response = [];

      response.push(`**Question:** ${question}`);

      // Truncate formattedAnswer if needed
      let finalFormattedAnswer = formattedAnswer;
      if (formattedAnswer) {
        const baseLength =
          response.join('\n').length + `**Answer:**\n`.length + `\n_AI can make mistakes._`.length;
        const remainingLength = 2000 - baseLength;
        if (formattedAnswer.length > remainingLength) {
          finalFormattedAnswer = formattedAnswer.slice(0, remainingLength - 3) + '...';
        }
        response.push(`**Answer:**\n${finalFormattedAnswer}`);
      } else if (answer) {
        response.push(`**Answer:** ${answer}`);
      }

      if (!formattedAnswer && thinkingMessages) {
        const lastThoughts = [];
        let thinkLength = 0;
        for (let i = thinkingMessages.length - 1; i >= 0; i--) {
          thinkLength += thinkingMessages[i].length;
          if (thinkLength > 600) break; // Do not exceed 600 characters
          lastThoughts.unshift(thinkingMessages[i]);
        }
        const thoughts = lastThoughts.join('\n');
        if (thoughts) response.push(`Thinking:\n\`\`\`\n${thoughts}\n\`\`\``);
      }

      if (memoryId) response.push(`Memory ID: ||${memoryId}|| (reply to this message to continue)`);

      if (error) {
        logger.error(error);
        response.push(
          `🤖 Uhh… I spaced out for a second there. Could you rephrase that or try again?\n\`\`\`\n${error}\n\`\`\``
        );
      }

      // If we have a final Answer also add a disclaimer
      if (answer || formattedAnswer) response.push(`_AI can make mistakes._`);

      nextUpdate = response.join('\n').slice(0, 2000);

      if (!updateTimer) {
        const delay = Math.max(0, 1000 - (Date.now() - lastUpdateTime));
        updateTimer = setTimeout(() => {
          replyMessage.edit(nextUpdate);
          updateTimer = null;
          lastUpdateTime = Date.now();
        }, delay);
      }
    }

    let previousMemoryId;
    if (message.reference) {
      const referencedMessage = await message.fetchReference();
      const memoryIdMatch = referencedMessage.content.match(/Memory ID: \|\|(.*)\|\|/);
      if (memoryIdMatch) previousMemoryId = memoryIdMatch[1];
    }
    try {
      await useAIAssistantClient.AiAssistantService.queryAiAssistant(
        question,
        onUpdate,
        previousMemoryId
      );
    } catch (error) {
      logger.error('Failed to query AI Assistant', {
        prompt: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}
