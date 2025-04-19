import NodeCache from "node-cache";
import logger from "../../logger";

const heroCache = new NodeCache({ stdTTL: 0 });

export interface ICachedHero {
  name: string;
  imageUrl: string;
}

export function getCachedHero(heroId: number): ICachedHero | undefined {
  logger.debug("Reading from cache...");
  return heroCache.get(heroId);
}

export function setCachedHero(heroId: number, hero: ICachedHero): void {
  logger.debug("Setting cache...");
  heroCache.set(heroId, hero);
}

export function deleteCachedHero(heroId: number): void {
  logger.debug("Removing cache...");
  heroCache.del(heroId);
}
