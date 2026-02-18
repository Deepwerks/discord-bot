import BaseClientService from '../../../base/classes/BaseClientService';
import { logger } from '../../../../..';
import { SSEEvent } from '../../types/SSEEvents';

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export default class ChatService extends BaseClientService {
  async *chat(
    request: ChatRequest,
    patreonToken: string
  ): AsyncGenerator<SSEEvent, void, undefined> {
    const url = `${this.client.config.ai_assistant_api_url}/chat`;

    logger.info('[API CALL] Querying AI Assistant (new API)...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Patreon-Token': patreonToken,
      },
      body: JSON.stringify({
        message: request.message,
        conversation_id: request.conversation_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error('AI Assistant API returned error', {
        status: response.status,
        error: errorText,
      });
      yield {
        type: 'error',
        message: `HTTP ${response.status}: ${errorText}`,
        code: `HTTP_${response.status}`,
      };
      return;
    }

    if (!response.body) {
      yield {
        type: 'error',
        message: 'No response body received',
        code: 'NO_BODY',
      };
      return;
    }

    yield* this.parseSSEStream(response.body);
  }

  private async *parseSSEStream(
    body: ReadableStream<Uint8Array>
  ): AsyncGenerator<SSEEvent, void, undefined> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let eventType: string | null = null;
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData += line.slice(6);
          } else if (line === '' && eventType && eventData) {
            const event = this.parseEvent(eventType, eventData);
            if (event) yield event;
            eventType = null;
            eventData = '';
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        // Edge case: final chunk without trailing newline
      }
    } catch (error) {
      logger.error('Error reading SSE stream', {
        error: error instanceof Error ? error.message : error,
      });
      yield {
        type: 'error',
        message: error instanceof Error ? error.message : 'Stream read error',
        code: 'STREAM_ERROR',
      };
    } finally {
      reader.releaseLock();
    }
  }

  private parseEvent(eventType: string, data: string): SSEEvent | null {
    try {
      const parsed = JSON.parse(data);

      switch (eventType) {
        case 'start':
          return { type: 'start', conversation_id: parsed.conversation_id };
        case 'delta':
          return { type: 'delta', content: parsed.content };
        case 'end':
          return { type: 'end' };
        case 'tool_start':
          return { type: 'tool_start', tool: parsed.tool };
        case 'tool_end':
          return { type: 'tool_end', tool: parsed.tool };
        case 'error':
          return { type: 'error', message: parsed.message, code: parsed.code };
        default:
          logger.warn('Unknown SSE event type', { eventType, data });
          return null;
      }
    } catch (error) {
      logger.error('Failed to parse SSE event data', { eventType, data, error });
      return null;
    }
  }
}
