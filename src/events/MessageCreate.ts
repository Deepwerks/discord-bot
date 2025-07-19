import { Events, Message } from 'discord.js';
import CustomClient from '../base/classes/CustomClient';
import Event from '../base/classes/Event';
import { logger, useAIAssistantClient } from '..';
import { AIAssistantResponse } from '../services/clients/AIAssistantClient/services/DeadlockAiAssistantService';
import { isAbleToUseChatbot } from '../services/database/repository';

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

    const isAbleToUse = await isAbleToUseChatbot(message.guildId!);
    if (!isAbleToUse) return;

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

    function onUpdate({ answer, thinkingMessages, memoryId }: AIAssistantResponse) {
      logger.debug('AI Assistant Response', { answer, thinkingMessages });

      const response = [];

      response.push(`**Question:** ${question}`);

      if (answer) response.push(`**Answer:** ${answer}`);

      const lastThoughts = [];
      let thinkLength = 0;
      for (let i = thinkingMessages.length - 1; i >= 0; i--) {
        thinkLength += thinkingMessages[i].length;
        if (thinkLength > 1000) break; // Do not exceed 1000 characters
        lastThoughts.unshift(thinkingMessages[i]);
      }
      const thoughts = lastThoughts.join('\n');
      if (thoughts) response.push(`Thinking:\n\`\`\`\n${thoughts}\n\`\`\``);

      if (memoryId) response.push(`Memory ID: ||${memoryId}||`);

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
    await useAIAssistantClient.AiAssistantService.queryAiAssistant(
      question,
      onUpdate,
      previousMemoryId
    );
  }
}
