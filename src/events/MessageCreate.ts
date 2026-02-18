import { Events, Message } from 'discord.js';
import CustomClient from '../base/classes/CustomClient';
import Event from '../base/classes/Event';
import { logger, useAIAssistantClient } from '..';
import { deactivatePatreonLink, getGuildPatreonAccess } from '../services/database/repository';
import SpamProtector from '../services/redis/stores/SpamProtector';
import { redisClient } from '../services/redis';
import { threadMemoryStore } from '../services/redis/stores/ThreadMemoryStore';

const onMessageSpamProtector = new SpamProtector(redisClient, {
  cooldownMs: 5000,
  spamLimit: 5,
  spamWindowMs: 15000,
  timeoutDurationMs: 3600000,
  namespace: 'message-created',
});

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
    if (message.mentions.everyone) return;

    const result = await onMessageSpamProtector.registerMessage(message.author.id);

    if (result === 'timeout') {
      const ms = await onMessageSpamProtector.getTimeoutRemaining(message.author.id);
      const expiryUnix = Math.floor((Date.now() + ms) / 1000);
      await message.reply(
        `🚫 You're restricted from using the chatbot. Try again <t:${expiryUnix}:R>`
      );
      return;
    }

    if (result === 'cooldown') {
      await message.react('⏱️');
      return;
    }

    const patronAccess = await getGuildPatreonAccess(message.guildId!);

    if (!patronAccess) {
      await message.reply({
        content:
          'AI chatbot is not active in this server. A Patreon supporter can enable it with /link-patreon.',
      });
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

    const replyMessage = await message.reply({
      content: '_Thinking..._',
      allowedMentions: { parse: [] },
    });

    // Retrieve conversation_id from referenced message for continuation
    let previousConversationId: string | undefined;
    if (message.reference) {
      const referencedMessage = await message.fetchReference();
      previousConversationId = threadMemoryStore.getMemory(referencedMessage.id) ?? undefined;

      if (previousConversationId) {
        threadMemoryStore.refreshTTL(message.reference.messageId!);
      }
    }

    try {
      let currentToken = patronAccess.patreonSessionToken;
      let authFailed = false;

      const streamResponse = async (token: string) => {
        let content = '';
        let activeTool: string | null = null;
        let conversationId: string | undefined;
        let hasError = false;
        let lastUpdateTime = 0;
        let updateTimer: NodeJS.Timeout | null = null;
        let pendingEdit = false;
        let isAuthError = false;

        const scheduleEdit = () => {
          if (updateTimer) {
            pendingEdit = true;
            return;
          }

          const delay = Math.max(0, 1000 - (Date.now() - lastUpdateTime));
          updateTimer = setTimeout(async () => {
            updateTimer = null;
            lastUpdateTime = Date.now();

            const parts: string[] = [];
            if (content) {
              parts.push(content);
            }
            if (activeTool) {
              parts.push(`\n_Using ${activeTool}..._`);
            }
            if (!content && !activeTool && !hasError) {
              parts.push('_Thinking..._');
            }

            const displayContent = parts.join('').slice(0, 2000) || '_Thinking..._';

            try {
              await replyMessage.edit({
                content: displayContent,
                allowedMentions: {
                  repliedUser: content.length > 0,
                  parse: [],
                },
              });
            } catch (editError) {
              logger.error('Failed to edit reply message', {
                error: editError instanceof Error ? editError.message : editError,
              });
            }

            if (pendingEdit) {
              pendingEdit = false;
              scheduleEdit();
            }
          }, delay);
        };

        const AUTH_ERROR_CODES = ['HTTP_401', 'AUTH_FAILED', 'TOKEN_REFRESH_FAILED'];

        const stream = useAIAssistantClient.ChatService.chat(
          {
            message: question,
            conversation_id: previousConversationId,
          },
          token
        );

        for await (const event of stream) {
          switch (event.type) {
            case 'start':
              conversationId = event.conversation_id;
              break;

            case 'delta':
              content += event.content;
              scheduleEdit();
              break;

            case 'tool_start':
              activeTool = event.tool;
              scheduleEdit();
              break;

            case 'tool_end':
              activeTool = null;
              scheduleEdit();
              break;

            case 'error':
              hasError = true;
              logger.error('AI Assistant SSE error', {
                code: event.code,
                message: event.message,
              });

              if (AUTH_ERROR_CODES.includes(event.code)) {
                isAuthError = true;
                break;
              }

              if (event.code === 'HTTP_429') {
                content = 'Rate limit reached. Please try again in a moment.';
              } else {
                content = `Error [${event.code}]: ${event.message}`;
              }
              scheduleEdit();
              break;

            case 'end':
              break;
          }
        }

        // Clean up timer
        if (updateTimer) {
          clearTimeout(updateTimer);
          updateTimer = null;
        }

        return { content, conversationId, hasError, isAuthError };
      };

      let result = await streamResponse(currentToken);

      // Handle auth failure: deactivate token and retry with next best patron
      if (result.isAuthError) {
        logger.info('Patreon session auth failed, deactivating token and checking for alternatives', {
          guildId: message.guildId,
        });

        await deactivatePatreonLink(currentToken);

        const nextPatronAccess = await getGuildPatreonAccess(message.guildId!);

        if (nextPatronAccess) {
          logger.info('Found alternative patron link, retrying request', {
            guildId: message.guildId,
            tier: nextPatronAccess.tier,
          });

          // Reset the reply message for retry
          await replyMessage.edit({
            content: '_Thinking..._',
            allowedMentions: { parse: [] },
          });

          result = await streamResponse(nextPatronAccess.patreonSessionToken);
          authFailed = result.isAuthError;
        } else {
          authFailed = true;
        }
      }

      if (authFailed) {
        await replyMessage.edit({
          content: 'The Patreon session has expired. Please run /link-patreon to re-link.',
          allowedMentions: { parse: [] },
        });
        return;
      }

      // Store conversation_id for thread continuation
      if (result.conversationId) {
        threadMemoryStore.setMemory(replyMessage.id, result.conversationId);
      }

      // Final edit with complete content
      const finalParts: string[] = [];
      if (result.content) {
        finalParts.push(result.content);
      }
      if (!result.content && !result.hasError) {
        finalParts.push('No response received from AI assistant.');
      }
      if (result.content && !result.hasError) {
        finalParts.push('\n_AI can make mistakes._');
      }

      const finalContent = finalParts.join('').slice(0, 2000);

      await replyMessage.edit({
        content: finalContent,
        allowedMentions: {
          repliedUser: result.content.length > 0,
          parse: [],
        },
      });
    } catch (error) {
      logger.error('Failed to query AI Assistant', {
        prompt: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      try {
        await replyMessage.edit({
          content: 'Sorry, something went wrong while processing your request. Please try again.',
          allowedMentions: { parse: [] },
        });
      } catch {
        // If we can't even edit the error message, just log it
      }
    }
  }
}
