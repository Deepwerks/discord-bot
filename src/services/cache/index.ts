import { LRUCache } from 'lru-cache';
import { Collection } from 'discord.js';
import { cacheEntries, cacheHits, cacheMisses } from '../metrics';

export default class CustomCache<T extends object> {
  private cache: LRUCache<string, T>;
  private cacheName: string;

  constructor(cacheName: string, ttlSeconds: number = 60) {
    this.cacheName = cacheName;
    this.cache = new LRUCache<string, T>({
      max: 1000, // adjust based on expected size
      ttl: ttlSeconds * 1000, // lru-cache expects milliseconds
    });

    cacheEntries.set({ cache: this.cacheName }, this.cache.size);
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
    cacheEntries.set({ cache: this.cacheName }, this.cache.size);
  }

  get(key: string | null): T | null {
    if (!key) return null;

    const result = this.cache.get(key);
    if (result !== undefined) {
      cacheHits.inc({ cache: this.cacheName });
    } else {
      cacheMisses.inc({ cache: this.cacheName });
    }

    return result ?? null;
  }

  delete(key: string): void {
    this.cache.delete(key);
    cacheEntries.set({ cache: this.cacheName }, this.cache.size);
  }

  clear(): void {
    this.cache.clear();
    cacheEntries.set({ cache: this.cacheName }, 0);
  }

  getAll(): Collection<string, T> {
    const allRecords: Collection<string, T> = new Collection();
    for (const [key, value] of this.cache.entries()) {
      allRecords.set(String(key), value);
    }
    return allRecords;
  }
}
