import { TFunction } from 'i18next';
import { useDeadlockClient } from '../..';
import CommandError from '../../base/errors/CommandError';
import { generateMatchImage, IGenerateMatchImageOptions } from '../utils/generateMatchImage';
import getProfile from './getProfile';

export async function handleMatchRequest({
  id,
  type,
  userId,
  t,
}: {
  id: string;
  type: 'player_id' | 'match_id';
  userId: string;
  t: TFunction<'translation', undefined>;
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
  };

  const imageBuffer = await generateMatchImage(matchData);

  return { matchData, imageBuffer, _steamAuthNeeded };
}
