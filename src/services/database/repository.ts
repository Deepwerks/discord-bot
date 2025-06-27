import StoredPlayerSchema from '../../base/schemas/StoredPlayerSchema';

export const getStoredPlayersByDiscordIds = async (ids: string[]) => {
  const players = await StoredPlayerSchema.find({
    discordId: { $in: ids },
  }).lean();
  return players;
};
