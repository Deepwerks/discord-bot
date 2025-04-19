import { useSteamClient } from "../..";

export async function resolveToSteamID64(input: string) {
  // SteamID64 ellenőrzés
  if (/^\d{17}$/.test(input)) {
    return input;
  }

  // SteamID32 konvertálása
  if (/^STEAM_/.test(input)) {
    const parts = input.split(":");
    const Y = parseInt(parts[1], 10);
    const Z = parseInt(parts[2], 10);
    return (
      BigInt(Z) * BigInt(2) +
      BigInt(Y) +
      BigInt("76561197960265728")
    ).toString();
  }

  // SteamID3 konvertálása
  if (/^\[U:1:\d+\]$/.test(input)) {
    const accountId = parseInt(input.match(/\d+/)![0], 10);
    return (BigInt(accountId) + BigInt("76561197960265728")).toString();
  }

  // Számként értelmezhető bemenet (pl. SteamID32 szám)
  if (/^\d+$/.test(input)) {
    const accountId = parseInt(input, 10);
    return (BigInt(accountId) + BigInt("76561197960265728")).toString();
  }

  // Egyéni felhasználónév (vanity URL) feloldása
  const response = await useSteamClient.ProfileService.GetIdFromUsername(input);

  if (response) {
    return response;
  } else {
    throw new Error("Nem sikerült feloldani a felhasználónevet.");
  }
}
