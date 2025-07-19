import { Events, Message } from 'discord.js';
import CustomClient from '../base/classes/CustomClient';
import Event from '../base/classes/Event';
import { logger, useAIAssistantClient } from '..';
import { AIAssistantResponse } from '../services/clients/AIAssistantClient/services/DeadlockAiAssistantService';

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

    function onUpdate({ answer, thinkingMessages, memoryId, error }: AIAssistantResponse) {
      logger.debug('AI Assistant Response', { answer, thinkingMessages });

      const response = [];

      response.push(`**Question:** ${question}`);

      if (answer) response.push(`**Answer:** ${answer}`);

      if (thinkingMessages) {
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

      if (memoryId) response.push(`Memory ID: ||${memoryId}||`);

      if (error) response.push(`Error: ${error}`);

      nextUpdate = response.join('\n');

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
