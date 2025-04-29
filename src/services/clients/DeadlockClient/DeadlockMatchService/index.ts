import { logger } from "../../../..";
import BaseClient from "../../BaseClient";
import DeadlockMatch from "./entities/DeadlockMatch";

export interface IDeadlockMatchService {
  GetMatch(matchId: string): Promise<DeadlockMatch>;
}

export default class DeadlockMatchService implements IDeadlockMatchService {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  async GetMatch(matchId: string): Promise<DeadlockMatch> {
    logger.info("[API CALL] Fetching a deadlock match...");
    const response = await this.client.request<any>(
      "GET",
      `/v1/matches/${matchId}/metadata`
    );

    return new DeadlockMatch(response.match_info);
  }
}
