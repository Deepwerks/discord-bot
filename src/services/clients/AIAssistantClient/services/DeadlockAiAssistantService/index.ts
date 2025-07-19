import BaseClientService from '../../../base/classes/BaseClientService';
import { logger } from '../../../../..';
import { EventSource } from 'eventsource';

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

export type AgentStep = ActionEvent | FinalAnswerEvent;

export interface AIAssistantResponse {
  answer?: string;
  memoryId?: string;
  thinkingMessages: string[];
}

export default class DeadlockAIAssistantService extends BaseClientService {
  async queryAiAssistant(
    prompt: string,
    onUpdate: (response: AIAssistantResponse) => void,
    previousMemoryId?: string
  ): Promise<void> {
    try {
      logger.info('[API CALL] Querying AI Assistant...');

      let memoryId: string;
      let answer: string;
      const thinkingMessages: string[] = [];

      const url = new URL('https://ai-assistant.deadlock-api.com/invoke');
      url.searchParams.set('prompt', prompt);
      url.searchParams.set('api_key', this.client.config.ai_assistant_api_key);
      if (previousMemoryId) url.searchParams.set('memory_id', previousMemoryId);

      const es = new EventSource(url);
      es.addEventListener('memoryId', (event) => {
        memoryId = event.data;
        onUpdate({ memoryId, answer, thinkingMessages });
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
            onUpdate({ memoryId, answer, thinkingMessages });
            break;
          }
          case 'final_answer': {
            answer = data.data;
            onUpdate({ memoryId, answer, thinkingMessages });
            break;
          }
        }
      });
      es.addEventListener('error', (event) => {
        logger.error('Failed to query AI Assistant', {
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          error: event.message,
        });
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
