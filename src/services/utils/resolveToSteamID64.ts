import { useSteamClient } from '../..';

const steamIdCache = new Map<string, string>();

export async function resolveToSteamID64(input: string): Promise<string> {
  // Check cache first
  if (steamIdCache.has(input)) {
    return steamIdCache.get(input)!;
  }

  let steamID64: string;

  // SteamID64 check
  if (/^\d{17}$/.test(input)) {
    steamID64 = input;
  }

  // SteamID32
  else if (/^STEAM_/.test(input)) {
    const parts = input.split(':');
    const Y = parseInt(parts[1], 10);
    const Z = parseInt(parts[2], 10);
    steamID64 = (BigInt(Z) * BigInt(2) + BigInt(Y) + BigInt('76561197960265728')).toString();
  }

  // SteamID3
  else if (/^\[U:1:\d+\]$/.test(input)) {
    const accountId = parseInt(input.match(/\d+/)![0], 10);
    steamID64 = (BigInt(accountId) + BigInt('76561197960265728')).toString();
  }

  // Numeric input (e.g., SteamID32)
  else if (/^\d+$/.test(input)) {
    const accountId = parseInt(input, 10);
    steamID64 = (BigInt(accountId) + BigInt('76561197960265728')).toString();
  }

  // Vanity URL
  else {
    const response = await useSteamClient.ProfileService.GetIdFromUsername(input);

    if (!response) {
      throw new Error('Nem sikerült feloldani a felhasználónevet.');
    }

    steamID64 = response;
  }

  // Store in cache
  steamIdCache.set(input, steamID64);

  return steamID64;
}
