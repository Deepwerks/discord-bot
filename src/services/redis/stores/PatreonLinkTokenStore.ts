import { RedisClientType } from 'redis';
import { redisClient } from '..';

type PatreonLinkStateData = {
  discordUserId: string;
  guildId: string;
};

class PatreonLinkTokenStore {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  private getKey(state: string) {
    return `patreon-link:${state}`;
  }

  async storeState(state: string, discordUserId: string, guildId: string, ttlSeconds: number) {
    const data: PatreonLinkStateData = { discordUserId, guildId };

    if (ttlSeconds <= 0) return;

    await this.client.set(this.getKey(state), JSON.stringify(data), {
      EX: ttlSeconds,
    });
  }

  async consumeState(state: string): Promise<PatreonLinkStateData | null> {
    const key = this.getKey(state);
    const data = await this.client.get(key);
    if (!data) return null;

    await this.client.del(key);

    return JSON.parse(data) as PatreonLinkStateData;
  }
}

export const patreonLinkTokenStore = new PatreonLinkTokenStore(redisClient);
