import { logger } from "../../../..";
import BaseClient from "../../BaseClient";
import {
  VariableRequestParams,
  VariableResponse,
} from "./entities/CommandResponse";
import HeroStats from "./entities/HeroStats";
import HistoryMatch from "./entities/HistoryMatch";
import MMRHistoryRecord from "./entities/MMRHistory";

export interface IDeadlockPlayerService {
  GetMatchHistory(account_id: string, limit: number): Promise<HistoryMatch[]>;
}

export default class DeadlockPlayerService implements IDeadlockPlayerService {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  GetHeroStats = async (account_id: string, hero_id?: number) => {
    const response = await this.client.request<HeroStats[]>(
      "GET",
      `/v1/players/${account_id}/hero-stats`
    );

    const heroStats = response.map((s) => new HeroStats(s));

    return hero_id
      ? heroStats.find((stats) => stats.hero_id === hero_id)
      : heroStats;
  };

  GetMatchHistory = async (
    account_id: string,
    limit: number = 50
  ): Promise<HistoryMatch[]> => {
    const response = await this.client.request<HistoryMatch[]>(
      "GET",
      `/v1/players/${account_id}/match-history`
    );

    return response.map((m) => new HistoryMatch(m)).slice(0, limit);
  };

  GetStats = async (
    account_id: string,
    hero_name: string,
    variables: string[]
  ): Promise<VariableResponse> => {
    logger.info("Fetching Deadlock Stats for a player...");
    const params: VariableRequestParams = {
      account_id,
      variables,
    };

    if (variables.some((variable) => variable.includes("hero_")) && hero_name) {
      params.hero_name = hero_name;
    }

    const response = await this.client.request<VariableResponse>(
      "GET",
      "/v1/commands/variables/resolve",
      undefined,
      {
        account_id,
        variables: variables.join(","),
        hero_name: params.hero_name,
      }
    );

    return response;
  };

  GetMMRHistory = async (
    account_id: string,
    limit: number = 50
  ): Promise<MMRHistoryRecord[]> => {
    const response = await this.client.request<MMRHistoryRecord[]>(
      "GET",
      `/v1/players/${account_id}/mmr-history`
    );

    return response
      .map((h) => new MMRHistoryRecord(h))
      .reverse()
      .slice(0, limit);
  };
}
