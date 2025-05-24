import { TFunction } from 'i18next';
import { useDeadlockClient } from '../..';
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
  let _matchId = Number(id);

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

    const history = await useDeadlockClient.PlayerService.GetMatchHistory(Number(steamID64), 1);
    if (!history.length) throw new CommandError('Player do not have a match history.');

    _matchId = history[0].matchId;
  }

  const deadlockMatch = await useDeadlockClient.MatchService.GetMatch(_matchId);

  if (!deadlockMatch) {
    throw new CommandError('Match not found');
  }

  const matchData = {
    match: deadlockMatch,
  };

  const imageBuffer = await generateMatchImage(matchData);

  return { matchData, imageBuffer, steamAuthNeeded };
}
