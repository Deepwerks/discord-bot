export const steam64ToSteamID3 = (steam64: string): string => {
  const steamIdNum = BigInt(steam64);
  const steamID3 = steamIdNum - BigInt("76561197960265728");
  return steamID3.toString();
};
