import { logger } from "../../../..";
import BaseClient from "../../BaseClient";
import DeadlockPatch, { IDeadlockPatch } from "./entities/DeadlockPatch";

export default class DeadlockPatchService {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  async GetPatches(): Promise<IDeadlockPatch[]> {
    logger.info("[API CALL] Fetching deadlock patches...");

    const response = await this.client.request<IDeadlockPatch[]>(
      "GET",
      `/v1/patches`
    );

    return response.map((r) => new DeadlockPatch(r));
  }
}
