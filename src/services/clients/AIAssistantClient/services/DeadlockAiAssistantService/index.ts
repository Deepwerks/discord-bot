import BaseClientService from '../../../base/classes/BaseClientService';
import { logger } from '../../../../..';
import { EventSource } from 'eventsource';
import { AttachmentBuilder } from 'discord.js';

interface Content {
  type: 'text';
  text: string;
}

interface ActionStep {
  role: 'assistant' | 'tool-call' | 'tool-response';
  content: Content[];
}

interface ActionEvent {
  type: 'action';
  data: ActionStep[];
}

interface FinalAnswerEvent {
  type: 'final_answer';
  data: string;
}

interface FormattedResponseEvent {
  type: 'formatted_response';
  data: string;
}

export type AgentStep = ActionEvent | FinalAnswerEvent | FormattedResponseEvent;

export interface AIAssistantResponse {
  answer?: string;
  formattedAnswer?: string;
  memoryId?: string;
  error?: string;
  thinkingMessages?: string[];
  plotAttachments?: AttachmentBuilder[];
}

export default class DeadlockAIAssistantService extends BaseClientService {
  async queryAiAssistant(
    prompt: string,
    onUpdate: (response: AIAssistantResponse) => void,
    steamId: string | null,
    previousMemoryId?: string
  ): Promise<void> {
    try {
      logger.info('[API CALL] Querying AI Assistant...');

      let memoryId: string;
      let answer: string;
      let formattedAnswer: string;
      const thinkingMessages: string[] = [];

      const url = new URL('https://ai-assistant.deadlock-api.com/invoke');
      url.searchParams.set('prompt', prompt);
      url.searchParams.set('api_key', this.client.config.ai_assistant_api_key);
      if (steamId) url.searchParams.set('steam_id', steamId);
      if (previousMemoryId) url.searchParams.set('memory_id', previousMemoryId);

      const es = new EventSource(url);
      es.addEventListener('memoryId', (event) => {
        memoryId = event.data;
        onUpdate({ memoryId, answer, formattedAnswer, thinkingMessages });
        es.close();
      });
      es.addEventListener('agentStep', (event) => {
        const data: AgentStep = JSON.parse(event.data);
        switch (data.type) {
          case 'action': {
            const actions = data.data
              .filter((step) => step.role === 'assistant')
              .flatMap((step) => step.content)
              .map((c) => c.text);
            thinkingMessages.push(...actions);
            const plots = (data as ActionEvent & { plots?: (string | null)[] }).plots || [];
            const plotAttachments = plots
              .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
              .map((base64, index) => {
                const buffer = Buffer.from(base64, 'base64');
                return new AttachmentBuilder(buffer, { name: `plot${index + 1}.png` });
              });
            onUpdate({ memoryId, answer, formattedAnswer, thinkingMessages, plotAttachments });
            break;
          }
          case 'final_answer': {
            answer = data.data;
            onUpdate({ memoryId, answer, formattedAnswer, thinkingMessages });
            break;
          }
          case 'formatted_response': {
            formattedAnswer = data.data;
            onUpdate({ memoryId, answer, formattedAnswer, thinkingMessages });
            break;
          }
        }
      });
      es.addEventListener('error', (event) => {
        logger.error('Failed to query AI Assistant', {
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          code: event.code,
          error: event.message,
        });
        onUpdate({ error: event.message });
        es.close();
      });
    } catch (error) {
      logger.error('Failed to query AI Assistant', {
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
