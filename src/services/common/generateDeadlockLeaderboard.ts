import { Embed } from "discord.js";
import { DeadlockRegion } from "../../base/types/DeadlockRegions";
import { useAssetsClient, useDeadlockClient } from "../..";
import { drawLeaderboardImage } from "../utils/generateLeaderboardImage";

export async function generateDeadlockLeaderboard(
  region: DeadlockRegion,
  limit: number = 100
) {
  const leaderboard = await useDeadlockClient.LeaderboardService.GetLeaderboard(
    region
  );

  let slicedLeaderboard = leaderboard.slice(0, limit);
  const promises = Promise.all(
    slicedLeaderboard.map(async (entry) => ({
      account_name: entry.account_name,
      rank: entry.rank,
      badgeName: await useAssetsClient.DefaultService.GetRankName(
        entry.badge_level
      ),
    }))
  );

  const mappedLeaderboard = await promises;
  return drawLeaderboardImage(mappedLeaderboard);
}
