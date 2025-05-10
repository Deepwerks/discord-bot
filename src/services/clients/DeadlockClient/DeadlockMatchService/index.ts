import { logger } from "../../../..";
import BaseClient from "../../BaseClient";
import DeadlockMatch from "./entities/DeadlockMatch";
import { DeadlockCustomMatch } from "./entities/DeadlockCustomMatch";

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

  async GetMatchIdFromPartyId(partyId: string): Promise<string> {
    logger.info("[API CALL] Fetching a deadlock match id from party id...");
    return await this.client.request<{match_id: string}>(
      "GET",
      `/v1/matches/custom/${partyId}/match-id`
    ).then((m) => m.match_id);
  }

  async CreateCustomMatch(): Promise<DeadlockCustomMatch> {
    logger.info("[API CALL] Creating a custom deadlock match...");
    return await this.client.request<DeadlockCustomMatch>(
      "POST",
      `/v1/matches/custom/create`
    );
  }
}
