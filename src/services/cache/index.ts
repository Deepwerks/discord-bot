import { LRUCache } from "lru-cache";
import { ICachedSteamProfile } from "../../base/interfaces/ICachedSteamProfile";
import ICachedDeadlockHero from "../../base/interfaces/ICachedDeadlockHero";
import DeadlockRank from "../clients/DeadlockAssetsClient/DefaultService/entities/DeadlockRank";
import IStatlockerProfile from "../clients/StatlockerClient/StatlockerProfileService/interfaces/IStatlockerProfile";
import { Collection } from "discord.js";

export default class CustomCache<T extends {}> {
  private cache: LRUCache<string | number, T>;

  constructor(ttlSeconds: number = 60) {
    this.cache = new LRUCache<string | number, T>({
      max: 1000, // adjust based on expected size
      ttl: ttlSeconds * 1000, // lru-cache expects milliseconds
    });
  }

  set(key: string | number, value: T, ttl?: number): void {
    this.cache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
  }

  get(key: string | number | null): T | null {
    if (!key) return null;
    return this.cache.get(key) ?? null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  show(): void {
    console.log("Cache tartalma: ", [...this.cache.keys()]);
  }

  getAll(): Collection<string, T> {
    const allRecords: Collection<string, T> = new Collection();

    for (const [key, value] of this.cache.entries()) {
      if (typeof key === "string") {
        allRecords.set(key, value);
      } else {
        allRecords.set(String(key), value);
      }
    }

    return allRecords;
  }
}

export const steamProfileCache = new CustomCache<ICachedSteamProfile>(60 * 30);
export const statlockerProfileCache = new CustomCache<IStatlockerProfile>(
  60 * 30
);
export const deadlockAssetsHeroCache = new CustomCache<ICachedDeadlockHero>(0);
export const deadlockAssetsDefaultCache = new CustomCache<DeadlockRank[]>(0);
