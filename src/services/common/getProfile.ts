import CommandError from '../../base/errors/CommandError';
import { TFunction } from 'i18next';
import { useStatlockerClient } from '../..';
import { StoredPlayers } from '../database/orm/init';

export default async function getProfile(
  player: string,
  discordUserId: string,
  t: TFunction<'translation', undefined>
) {
  let _steamId = player;
  let steamAuthNeeded: boolean = false;

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

  const steamProfile = await useStatlockerClient.ProfileService.GetProfile(Number(_steamId));

  if (!steamProfile) {
    throw new CommandError(t('errors.steam_profile_not_found'));
  }

  return { steamProfile, steamAuthNeeded };
}
