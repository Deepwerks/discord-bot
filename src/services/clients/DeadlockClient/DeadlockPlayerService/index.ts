import BaseClient from "../../BaseClient";
import HeroStats from "./entities/HeroStats";
import HistoryMatch from "./entities/HistoryMatch";

export interface IDeadlockPlayerService {
  GetHeroStats(
    account_id: string,
    hero_id: number
  ): Promise<HeroStats | undefined>;
  GetMatchHistory(account_id: string, limit: number): Promise<HistoryMatch[]>;
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

  GetMatchHistory = async (
    account_id: string,
    limit: number = 50
  ): Promise<HistoryMatch[]> => {
    const response = await this.client.request<HistoryMatch[]>(
      "GET",
      `/v1/players/${account_id}/match-history`
    );

    return response.slice(0, limit);
  };
}
