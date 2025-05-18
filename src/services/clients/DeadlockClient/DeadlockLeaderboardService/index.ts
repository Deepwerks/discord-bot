import { logger } from "../../../..";
import { DeadlockRegion } from "../../../../base/types/DeadlockRegions";
import BaseClient from "../../BaseClient";
import DeadlockLeaderboardEntry from "./entities/DeadlockLeaderboardEntry";

export default class DeadlockLeaderboardService {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  async GetLeaderboard(
    region: DeadlockRegion
  ): Promise<DeadlockLeaderboardEntry[]> {
    logger.info("[API CALL] Fetching leaderboard...");

    const response = await this.client.request<{
      entries: DeadlockLeaderboardEntry[];
    }>("GET", `/v1/leaderboard/${region}`);

    return response.entries;
  }
}
