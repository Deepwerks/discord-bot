import NodeCache from "node-cache";
import { ICachedSteamProfile } from "../../base/interfaces/ICachedSteamProfile";

export default class CustomCache<T> {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 60) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
    });
  }

  set(key: string, value: T, ttl?: number): void {
    if (ttl) this.cache.set(key, value, ttl);
    else this.cache.set(key, value, ttl!);
  }

  async get(key: string): Promise<T | undefined> {
    return (await this.cache.get(key)) as T | undefined;
  }

  delete(key: string): void {
    this.cache.del(key);
  }

  clear(): void {
    this.cache.flushAll();
  }
}

export const steamProfileCache = new CustomCache<ICachedSteamProfile>(3600);
