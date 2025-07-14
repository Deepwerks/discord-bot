import { Op } from 'sequelize';
import { Guilds, StoredPlayers } from './orm/init';
import { guildConfigCache } from '../cache/GuildConfigCache';
import CommandError from '../../base/errors/CommandError';
import { TFunction } from 'i18next';
import { logger, useStatlockerClient } from '../..';
import SteamID from 'steamid';
import { useDeadlockClient } from '../..';
import { generateMatchImage, IGenerateMatchImageOptions } from '../utils/generateMatchImage';

export const getStoredPlayersByDiscordIds = async (ids: string[]) => {
  const players = await StoredPlayers.findAll({
    where: {
      discordId: {
        [Op.in]: ids,
      },
    },
  });
  return players;
};

export const getGuildConfig = async (guildId: string | null) => {
  if (guildId === null) return null;
  const cached = guildConfigCache.get(guildId);

  if (cached) {
    logger.info('Reading GuildConfig from cache...');
    return cached;
  }

  logger.info('Fetching GuildConfig from database...');
  const guildConfig = await Guilds.findOne({
    where: {
      guildId,
    },
  });

  if (guildConfig) guildConfigCache.set(guildId, guildConfig);

  return guildConfig;
};

export const isValidSteamId = (value: string) => {
  try {
    const sid = new SteamID(value);
    return sid.isValid();
  } catch {
    return false;
  }
};

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

  if (!isNaN(+_steamId)) {
    steamProfile = await useStatlockerClient.ProfileService.GetProfile(+_steamId);
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

export async function handleMatchRequest({
  id,
  type,
  userId,
  t,
  useGenericNames = false,
}: {
  id: string;
  type: 'player_id' | 'match_id';
  userId: string;
  t: TFunction<'translation', undefined>;
  useGenericNames: boolean;
}): Promise<{
  matchData: IGenerateMatchImageOptions;
  imageBuffer: Buffer;
  _steamAuthNeeded: boolean;
}> {
  let _steamAuthNeeded = false;
  let _matchId: number;

  if (type === 'player_id') {
    const { steamProfile, steamAuthNeeded } = await getProfile(id, userId, t);
    _steamAuthNeeded = steamAuthNeeded;

    const matchHistory = await useDeadlockClient.PlayerService.fetchMatchHistory(
      steamProfile.accountId,
      1
    );
    _matchId = matchHistory[0].matchId;
  } else {
    _matchId = Number(id);
  }

  const deadlockMatch = await useDeadlockClient.MatchService.GetMatch(_matchId);

  if (!deadlockMatch) {
    throw new CommandError('Match not found');
  }

  const matchData = {
    match: deadlockMatch,
    useGenericNames,
  };

  const imageBuffer = await generateMatchImage(matchData);

  return { matchData, imageBuffer, _steamAuthNeeded };
}
