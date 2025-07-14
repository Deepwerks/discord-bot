import { RedisClientType, SetOptions } from 'redis';
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
  ratings: number[];
};

class MatchFeedbackStore {
  private client;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  async get(sessionId: string): Promise<MatchFeedbackState | undefined> {
    const data = await this.client.get(this.getKey(sessionId));
    if (!data) return undefined;
    return JSON.parse(data);
  }

  async store(sessionId: string, state: MatchFeedbackState, ttlSeconds?: number) {
    const data = JSON.stringify(state);
    const options: SetOptions | undefined = ttlSeconds
      ? { expiration: { type: 'EX', value: ttlSeconds } }
      : undefined;
    await this.client.set(this.getKey(sessionId), data, options);
  }

  async delete(sessionId: string) {
    await this.client.del(this.getKey(sessionId));
  }

  private getKey(sessionId: string) {
    return `matchFeedback:${sessionId}`;
  }

  async addRating(sessionId: string, rating: number): Promise<void> {
    const session = await this.get(sessionId);
    if (!session) return;

    session.ratings.push(rating);
    await this.store(sessionId, session);
  }
}

export const matchFeedbackStore = new MatchFeedbackStore(redisClient);
