import { Op } from 'sequelize';
import { Guilds, StoredPlayers } from './orm/init';
import { guildConfigCache } from '../cache/GuildConfigCache';

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

  if (cached) return cached;

  const guildConfig = await Guilds.findOne({
    where: {
      guildId,
    },
  });

  if (guildConfig) guildConfigCache.set(guildId, guildConfig);

  return guildConfig;
};
