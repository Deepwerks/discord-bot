import { LRUCache } from 'lru-cache';
import { Collection } from 'discord.js';
import promClient from 'prom-client';

const cacheHitCounter = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Number of all cache hits',
  labelNames: ['cache_name'] as const,
});
const cacheMissCounter = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Number of all missed caches',
  labelNames: ['cache_name'] as const,
});

export default class CustomCache<T extends object> {
  private cache: LRUCache<string, T>;
  private cacheName: string;

  constructor(cacheName: string, ttlSeconds: number = 60) {
    this.cacheName = cacheName;
    this.cache = new LRUCache<string, T>({
      max: 1000, // adjust based on expected size
      ttl: ttlSeconds * 1000, // lru-cache expects milliseconds
    });
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
  }

  get(key: string | null): T | null {
    if (!key) return null;
    const value = this.cache.get(key) ?? null;

    if (value !== null) {
      cacheHitCounter.labels(this.cacheName).inc();
      return value;
    } else {
      cacheMissCounter.labels(this.cacheName).inc();
      return null;
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getAll(): Collection<string, T> {
    const allRecords: Collection<string, T> = new Collection();

    for (const [key, value] of this.cache.entries()) {
      if (typeof key === 'string') {
        allRecords.set(key, value);
      } else {
        allRecords.set(String(key), value);
      }
    }

    return allRecords;
  }
}
