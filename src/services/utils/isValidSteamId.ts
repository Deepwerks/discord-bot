import { logger } from '../..';

export function isValidSteamId(id: string): boolean {
  try {
    const trimmedId = id.trim();

    const steamIDRegex = /^STEAM_[0-5]:[01]:\d+$/;
    const steamID3Regex = /^\[U:1:\d+\]$/;
    const steamID64Regex = /^7656119\d{10}$/;
    const numericRegex = /^\d+$/;

    if (steamIDRegex.test(trimmedId)) return true;
    if (steamID3Regex.test(trimmedId)) return true;
    if (steamID64Regex.test(trimmedId)) return true;

    if (numericRegex.test(trimmedId)) {
      BigInt(trimmedId);
      return true;
    }

    return false;
  } catch (error) {
    logger.warn(error);
    return false;
  }
}
