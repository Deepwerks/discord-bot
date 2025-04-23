import NodeCache from "node-cache";
import { ICachedSteamProfile } from "../../base/interfaces/ICachedSteamProfile";
import ICachedDeadlockHero from "../../base/interfaces/ICachedDeadlockHero";
import DeadlockRank from "../clients/DeadlockAssetsClient/DefaultService/entities/DeadlockRank";
import IStatlockerProfile from "../clients/StatlockerClient/StatlockerProfileService/interfaces/IStatlockerProfile";

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

  get(key: string | null): T | null {
    if (!key) return null;
    const cached = this.cache.get(key);

    if (cached) return cached as T;
    return null;
  }

  delete(key: string): void {
    this.cache.del(key);
  }

  clear(): void {
    this.cache.flushAll();
  }

  show(): void {
    console.log("Cache tartalma: ", this.cache.keys());
  }
}

export const steamProfileCache = new CustomCache<ICachedSteamProfile>(6 * 3600);
export const statlockerProfileCache = new CustomCache<IStatlockerProfile>(
  6 * 3600
);
export const deadlockAssetsHeroCache = new CustomCache<ICachedDeadlockHero>(0);
export const deadlockAssetsDefaultCache = new CustomCache<DeadlockRank[]>(0);
