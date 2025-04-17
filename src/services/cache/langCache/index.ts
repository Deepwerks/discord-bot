import logger from "../../logger";
import NodeCache from "node-cache";

const langCache = new NodeCache({ stdTTL: 3600 });

export function getCachedLang(guildId: string): string | undefined {
  logger.debug("Reading from cache...");
  return langCache.get(guildId);
}

export function setCachedLang(guildId: string, lang: string): void {
  logger.debug("Setting cache...");
  langCache.set(guildId, lang);
}

export function deleteCachedLang(guildId: string): void {
  logger.debug("Removing cache...");
  langCache.del(guildId);
}
