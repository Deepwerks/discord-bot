import { RedisClientType } from 'redis';
import { redisClient } from '..';

type MatchFeedbackState = {
  matchId: number;
  title: string;
  rank?: string;
  videoUrl?: string;
  creatorId: string;
  threadId: string;
  channelId: string;
  messageId: string;
};

class MatchFeedbackStore {
  private client;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  private getKey(sessionId: string) {
    return `matchFeedback:${sessionId}`;
  }

  async createSession(sessionId: string, state: MatchFeedbackState) {
    const data = JSON.stringify(state);
    await this.client.set(this.getKey(sessionId), data);
  }

  async getSession(sessionId: string): Promise<MatchFeedbackState | undefined> {
    const data = await this.client.get(this.getKey(sessionId));
    if (!data) return undefined;
    return JSON.parse(data);
  }

  async removeSession(sessionId: string) {
    await this.client.del(this.getKey(sessionId));
  }

  // Optionally, set TTL (Time to Live) in seconds
  async createSessionWithTTL(sessionId: string, state: MatchFeedbackState, ttlSeconds: number) {
    const data = JSON.stringify(state);
    await this.client.set(this.getKey(sessionId), data, {
      EX: ttlSeconds,
    });
  }
}

export const matchFeedbackStore = new MatchFeedbackStore(redisClient);
