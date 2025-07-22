import { RedisClientType } from 'redis';

export interface SpamProtectorOptions {
  cooldownMs?: number;
  spamLimit?: number;
  spamWindowMs?: number;
  timeoutDurationMs?: number;
  namespace?: string;
}

export default class SpamProtector {
  private redis: RedisClientType;
  private cooldownMs: number;
  private spamLimit: number;
  private spamWindowMs: number;
  private timeoutDurationMs: number;
  private ns: string;

  constructor(redisClient: RedisClientType, options: SpamProtectorOptions = {}) {
    this.redis = redisClient;
    this.cooldownMs = options.cooldownMs ?? 5000;
    this.spamLimit = options.spamLimit ?? 5;
    this.spamWindowMs = options.spamWindowMs ?? 15000;
    this.timeoutDurationMs = options.timeoutDurationMs ?? 60 * 60 * 1000;
    this.ns = options.namespace ?? 'chatbot';
  }

  private key(...parts: string[]) {
    return [this.ns, ...parts].join(':');
  }

  async isUserTimedOut(userId: string): Promise<boolean> {
    const key = this.key('timeout', userId);
    return (await this.redis.exists(key)) === 1;
  }

  async getTimeoutRemaining(userId: string): Promise<number> {
    const key = this.key('timeout', userId);
    const ttl = await this.redis.pTTL(key); // returns in ms
    return ttl > 0 ? ttl : 0;
  }

  async registerMessage(userId: string): Promise<'ok' | 'cooldown' | 'timeout'> {
    const now = Date.now();
    const cooldownKey = this.key('cooldown', userId);
    const spamKey = this.key('spam', userId);
    const timeoutKey = this.key('timeout', userId);

    // Check if already timed out
    const isTimedOut = await this.redis.exists(timeoutKey);
    if (isTimedOut) return 'timeout';

    // Always track message timestamps
    await this.redis.lPush(spamKey, now.toString());
    await this.redis.lTrim(spamKey, 0, this.spamLimit); // trim list length
    await this.redis.expire(spamKey, Math.ceil(this.spamWindowMs / 1000));

    // Filter recent timestamps
    const timestamps = await this.redis.lRange(spamKey, 0, -1);
    const filtered = timestamps.filter((ts) => now - parseInt(ts) <= this.spamWindowMs);

    if (filtered.length >= this.spamLimit) {
      await this.redis.set(timeoutKey, '1', {
        PX: this.timeoutDurationMs,
      });
      await this.redis.del(spamKey);
      return 'timeout';
    }

    // Cooldown logic
    const cooldownResult = await this.redis.set(cooldownKey, '1', {
      PX: this.cooldownMs,
      NX: true,
    });

    return cooldownResult === null ? 'cooldown' : 'ok';
  }
}
