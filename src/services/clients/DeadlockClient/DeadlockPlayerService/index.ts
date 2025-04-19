import BaseClient from "../../BaseClient";
import HeroStats from "./entities/HeroStats";

export interface IDeadlockPlayerService {
  GetHeroStats(
    account_id: string,
    hero_id: number
  ): Promise<HeroStats | undefined>;
}

export default class DeadlockPlayerService implements IDeadlockPlayerService {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  GetHeroStats = async (account_id: string, hero_id: number) => {
    const response = await this.client.request<HeroStats[]>(
      "GET",
      `/v1/players/${account_id}/hero-stats`
    );

    return response.find((stats) => stats.hero_id === hero_id);
  };
}
