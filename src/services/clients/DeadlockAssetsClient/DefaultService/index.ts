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

  async GetRanks() {
    const response = await this.client.request<DeadlockRank[]>(
      "GET",
      `/v2/ranks`
    );

    return response;
  }
}
