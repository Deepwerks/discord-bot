import { statlockerProfileCache } from "../../../cache";
import logger from "../../../logger";
import BaseClient from "../../BaseClient";
import IStatlockerProfile from "./interfaces/IStatlockerProfile";

export interface IStatlockerProfileService {
  FetchProfile(account_id: string): Promise<IStatlockerProfile>;
  GetProfileCache(account_id: string): Promise<IStatlockerProfile>;
}

export default class StatlockerProfileService
  implements IStatlockerProfileService
{
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  async FetchProfile(account_id: string): Promise<IStatlockerProfile> {
    logger.info("[API CALL] Fetching a statlocker profile...");

    const response = await this.client.request<IStatlockerProfile>(
      "GET",
      `/api/open/profile/${account_id}`
    );

    return response;
  }

  async GetProfileCache(account_id: string): Promise<IStatlockerProfile> {
    let cached = statlockerProfileCache.get(account_id);

    if (!cached) {
      cached = await this.FetchProfile(account_id);
      statlockerProfileCache.set(account_id, cached);
    }

    return cached;
  }
}
