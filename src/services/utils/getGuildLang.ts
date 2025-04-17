import GuildConfig from "../../base/schemas/GuildConfig";
import { getCachedLang, setCachedLang } from "../cache/langCache";
import logger from "../logger";

export async function getGuildLang(guildId?: string): Promise<string> {
  if (!guildId) return "en";

  const cached = getCachedLang(guildId);
  if (cached) return cached;

  const settings = await GuildConfig.findOne({ guildId }).lean();
  const lang = settings?.lang || "en";

  setCachedLang(guildId, lang);
  return lang;
}
