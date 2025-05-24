import { ChatInputCommandInteraction } from 'discord.js';
import StoredPlayer from '../../base/schemas/StoredPlayerSchema';
import CommandError from '../../base/errors/CommandError';
import { TFunction } from 'i18next';
import { useStatlockerClient } from '../..';

export default async function getProfile(
  player: string,
  interaction: ChatInputCommandInteraction,
  t: TFunction<'translation', undefined>
) {
  let _steamId = player;
  let steamAuthNeeded: boolean = false;

  if (player === 'me') {
    const storedPlayer = await StoredPlayer.findOne({
      discordId: interaction.user.id,
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
