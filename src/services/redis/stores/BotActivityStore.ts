import { RedisClientType } from 'redis';
import { redisClient } from '..';
import IBotActivity from '../../../base/interfaces/IBotActivity';

class BotActivityStore {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  private getKey() {
    return `guildConfig`;
  }

  async get(): Promise<IBotActivity | undefined> {
    const data = await this.client.get(this.getKey());
    if (!data) return undefined;
    return JSON.parse(data);
  }

  async set(data: IBotActivity): Promise<void> {
    await this.client.set(this.getKey(), JSON.stringify(data));
  }
}

export const botActivityStore = new BotActivityStore(redisClient);
