import CommandError from '../../base/errors/CommandError';
import { TFunction } from 'i18next';
import { useStatlockerClient } from '../..';
import { StoredPlayers } from '../database/orm/init';
import SteamID from 'steamid';

function isValidSteamId(value: string): boolean {
  try {
    const sid = new SteamID(value);
    return sid.isValid();
  } catch {
    return false;
  }
}

export default async function getProfile(
  player: string,
  discordUserId: string,
  t: TFunction<'translation', undefined>
) {
  let _steamId = player;
  let steamAuthNeeded = false;

  if (player === 'me') {
    const storedPlayer = await StoredPlayers.findOne({
      where: {
        discordId: discordUserId,
      },
    });

    if (!storedPlayer) throw new CommandError(t('errors.steam_not_yet_stored'));
    steamAuthNeeded =
      storedPlayer.authenticated === undefined || storedPlayer.authenticated === false;

    _steamId = storedPlayer.steamId;
  }

  let steamProfile = null;

  if (isValidSteamId(_steamId)) {
    steamProfile = await useStatlockerClient.ProfileService.GetProfile(Number(_steamId));
  }

  if (!steamProfile) {
    const foundProfiles = await useStatlockerClient.ProfileService.SearchProfile(player);

    if (!foundProfiles || foundProfiles.length === 0) {
      throw new CommandError(t('errors.steam_profile_not_found'));
    }

    if (foundProfiles.length === 1) {
      return { steamProfile: foundProfiles[0], steamAuthNeeded };
    }

    const sortedProfiles = [...foundProfiles].sort((a, b) => {
      const aHasRank = a.performanceRankMessage ? 1 : 0;
      const bHasRank = b.performanceRankMessage ? 1 : 0;
      if (aHasRank !== bHasRank) return bHasRank - aHasRank;

      const aUpdated = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const bUpdated = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;

      if (aUpdated === bUpdated) {
        return a.name.localeCompare(b.name);
      }

      return bUpdated - aUpdated;
    });

    steamProfile = sortedProfiles[0];
  }

  return { steamProfile, steamAuthNeeded };
}
