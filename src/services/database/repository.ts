import { Op } from 'sequelize';
import { StoredPlayers } from './orm/init';

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
