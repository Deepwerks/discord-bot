import { deadlockAssetsDefaultCache } from "../../../cache";
import logger from "../../../logger";
import BaseClient from "../../BaseClient";
import DeadlockRank from "./entities/DeadlockRank";

export interface IDefaultAssetsService {
  GetRanks(): Promise<DeadlockRank[]>;
}

export default class DefaultAssetsService implements IDefaultAssetsService {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  async GetRankImage(number: number) {
    const rank = Math.floor(number / 10);
    const subrank = number % 10;

    const tierData = (await this.GetRanksCached()).find(
      (item) => item.tier === rank
    );
    if (!tierData) return null;

    const images = tierData.images;

    if (subrank === 0) {
      return images.large;
    }

    const key = `large_subrank${subrank}`;
    return (images as Record<string, string>)[key] || null;
  }

  async GetRanks() {
    logger.info("[API CALL] Fetching a deadlock ranks...");
    const response = await this.client.request<DeadlockRank[]>(
      "GET",
      `/v2/ranks`
    );

    return response;
  }

  async GetRanksCached() {
    const cached = deadlockAssetsDefaultCache.get("ranks");

    if (cached) return cached;

    const response = await this.GetRanks();

    deadlockAssetsDefaultCache.set("ranks", response);
    return response;
  }
}
