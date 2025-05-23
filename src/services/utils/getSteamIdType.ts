import { logger } from '../..';

export function getSteamIdType(steamId: string): 'steamID' | 'steamID3' | 'steamID64' | null {
  try {
    // SteamID (Legacy): STEAM_X:Y:Z
    const legacyRegex = /^STEAM_[0-5]:[01]:\d+$/;
    // Steam3: [U:1:XXXXXXX]
    const steam3Regex = /^\[U:1:\d+\]$/;
    // SteamID64: 17-digit number starting with 7656119
    const steamId64Regex = /^7656119\d{10}$/;
    // SteamID32: A number that is not SteamID64 (for simplicity we check it's numeric and < 17 digits)
    const numericRegex = /^\d+$/;

    if (legacyRegex.test(steamId)) {
      return 'steamID';
    } else if (steam3Regex.test(steamId)) {
      return 'steamID3';
    } else if (steamId64Regex.test(steamId)) {
      return 'steamID64';
    } else if (numericRegex.test(steamId)) {
      BigInt(steamId);
      return 'steamID3';
    } else return null;
  } catch (error) {
    logger.warn(error);
    return null;
  }
}
