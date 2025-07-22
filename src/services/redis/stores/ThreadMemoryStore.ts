import { LRUCache } from 'lru-cache';
import { logger } from '../../..';

class ThreadMemoryStore {
  private cache: LRUCache<string, string>;

  constructor(ttlSeconds = 3600, maxSize = 1000) {
    this.cache = new LRUCache({
      max: maxSize,
      ttl: ttlSeconds * 1000,
    });
  }

  setMemory(messageId: string, memoryId: string) {
    logger.debug('Setting thread cache: ' + `chatbot:thread:${messageId}`);
    this.cache.set(`chatbot:thread:${messageId}`, memoryId);
  }

  getMemory(messageId: string): string | undefined {
    logger.debug('Getting thread cache: ' + `chatbot:thread:${messageId}`);
    return this.cache.get(`chatbot:thread:${messageId}`);
  }

  refreshTTL(messageId: string) {
    logger.debug('Refreshing thread cache: ' + `chatbot:thread:${messageId}`);
    const key = `chatbot:thread:${messageId}`;
    const value = this.cache.get(key);
    if (value) {
      this.cache.set(key, value);
    }
  }
}

export const threadMemoryStore = new ThreadMemoryStore();
