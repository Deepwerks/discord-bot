import { logger } from "../../../..";
import BaseClient from "../../BaseClient";
import DeadlockLeaderboardEntry from "./entities/DeadlockLeaderboardEntry";

export default class DeadlockLeaderboardService {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  async GetLeaderboard(
    accounts_ids?: number[]
  ): Promise<DeadlockLeaderboardEntry[]> {
    logger.info("[API CALL] Fetching leaderboard...");

    const response = await this.client.request<{
      entries: DeadlockLeaderboardEntry[];
    }>("GET", "/v1/leaderboard/", undefined, {
      region: "Europe",
      accounts_ids,
    });

    return response.entries;
  }
}
