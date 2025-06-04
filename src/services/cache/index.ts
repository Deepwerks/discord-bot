import { LRUCache } from 'lru-cache';
import { Collection } from 'discord.js';

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
    return this.cache.get(key) ?? null;
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
