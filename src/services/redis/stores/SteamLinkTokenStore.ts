import { RedisClientType } from 'redis';
import { redisClient } from '..';

type TokenData = {
  discordId: string;
  expiresAt: number;
};

class TokenStore {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  private getKey(token: string) {
    return `token:${token}`;
  }

  async storeToken(token: string, discordId: string, expiresAt: number) {
    const data: TokenData = { discordId, expiresAt };
    const ttlSeconds = Math.floor((expiresAt - Date.now()) / 1000);

    if (ttlSeconds <= 0) return; // Don't store already-expired tokens

    await this.client.set(this.getKey(token), JSON.stringify(data), {
      EX: ttlSeconds,
    });
  }

  async consumeToken(token: string): Promise<string | null> {
    const key = this.getKey(token);
    const data = await this.client.get(key);
    if (!data) return null;

    const parsed: TokenData = JSON.parse(data);

    if (Date.now() > parsed.expiresAt) {
      await this.client.del(key);
      return null;
    }

    await this.client.del(key);
    return parsed.discordId;
  }
}

export const tokenStore = new TokenStore(redisClient);
