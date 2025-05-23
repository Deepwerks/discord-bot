import { TFunction } from 'i18next';
import { useDeadlockClient, useStatlockerClient } from '../..';
import StoredPlayer from '../../base/schemas/StoredPlayerSchema';
import CommandError from '../../base/errors/CommandError';
import { resolveToSteamID64 } from '../../services/utils/resolveToSteamID64';
import { generateMatchImage, IGenerateMatchImageOptions } from '../utils/generateMatchImage';

export async function handleMatchRequest({
  id,
  type,
  userId,
  t,
}: {
  id: string;
  type?: string | null;
  userId: string;
  t: TFunction<'translation', undefined>;
}): Promise<{
  matchData: IGenerateMatchImageOptions;
  imageBuffer: Buffer;
  steamAuthNeeded: boolean;
}> {
  let steamAuthNeeded = false;
  let _matchId = id;

  const finalType = id === 'me' ? 'player_id' : ((type as 'match_id' | 'player_id') ?? 'match_id');

  if (finalType === 'player_id') {
    let steamID64 = id;

    if (id === 'me') {
      const storedPlayer = await StoredPlayer.findOne({ discordId: userId });
      if (!storedPlayer) throw new CommandError(t('errors.steam_not_yet_stored'));

      steamAuthNeeded =
        storedPlayer.authenticated === undefined || storedPlayer.authenticated === false;
      steamID64 = storedPlayer.steamId;
    } else {
      steamID64 = await resolveToSteamID64(id);
    }

    const history = await useDeadlockClient.PlayerService.GetMatchHistory(steamID64, 1);
    if (!history.length) throw new CommandError('Player do not have a match history.');

    _matchId = String(history[0].match_id);
  }

  const deadlockMatch = await useDeadlockClient.MatchService.GetMatch(_matchId);
  const allPlayers = [...deadlockMatch.team_0_players, ...deadlockMatch.team_1_players];

  const results = await useStatlockerClient.ProfileService.GetProfilesCache(
    allPlayers.map((p) => String(p.account_id))
  );

  const statlockerProfileMap = new Map<number, string>();
  for (const profile of results) {
    statlockerProfileMap.set(profile.accountId, profile.name);
  }

  const matchData = {
    match: {
      match_id: deadlockMatch.match_id,
      duration_s: deadlockMatch.duration_s,
      start_date: deadlockMatch.start_date.format('D MMMM, YYYY'),
      average_badge_team0: deadlockMatch.average_badge_team0,
      average_badge_team1: deadlockMatch.average_badge_team1,
      start_time: deadlockMatch.start_time,
      match_outcome: deadlockMatch.match_outcome,
      winning_team: deadlockMatch.winning_team,
      team_0_players: deadlockMatch.team_0_players.map((p) => ({
        ...p,
        name: statlockerProfileMap.get(p.account_id) ?? 'Unknown',
      })),
      team_1_players: deadlockMatch.team_1_players.map((p) => ({
        ...p,
        name: statlockerProfileMap.get(p.account_id) ?? 'Unknown',
      })),
    },
  };

  const imageBuffer = await generateMatchImage(matchData);

  return { matchData, imageBuffer, steamAuthNeeded };
}
