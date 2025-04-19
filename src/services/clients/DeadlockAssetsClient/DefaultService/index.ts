import BaseClient from "../../BaseClient";
import DeadlockRank from "./entities/DeadlockRank";

export interface IDefaultAssetsService {
  GetRanks(): Promise<DeadlockRank[]>;
  setRanks(): void;
}

export default class DefaultAssetsService implements IDefaultAssetsService {
  private client: BaseClient;
  public ranks: DeadlockRank[];

  constructor(client: BaseClient) {
    this.client = client;
    this.ranks = [];
  }

  async setRanks() {
    this.ranks = await this.GetRanks();
  }

  GetRankImage(number: number) {
    const rank = Math.floor(number / 10);
    const subrank = number % 10;

    const tierData = this.ranks.find((item) => item.tier === rank);
    if (!tierData) return null;

    const images = tierData.images;

    if (subrank === 0) {
      return images.large;
    }

    const key = `large_subrank${subrank}`;
    return (images as Record<string, string>)[key] || null;
  }

  async GetRanks() {
    const response = await this.client.request<DeadlockRank[]>(
      "GET",
      `/v2/ranks`
    );

    return response;
  }
}
