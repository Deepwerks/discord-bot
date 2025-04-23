import { statlockerProfileCache } from "../../../cache";
import logger from "../../../logger";
import BaseClient from "../../BaseClient";
import IStatlockerProfile from "./interfaces/IStatlockerProfile";

export interface IStatlockerProfileService {
  FetchProfile(account_id: string): Promise<IStatlockerProfile>;
  FetchProfiles(account_ids: string[]): Promise<IStatlockerProfile[]>;
  GetProfileCache(account_id: string): Promise<IStatlockerProfile>;
  GetProfilesCache(account_ids: string[]): Promise<IStatlockerProfile[]>;
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

  async FetchProfiles(account_ids: string[]): Promise<IStatlockerProfile[]> {
    logger.info(
      `[API CALL] Fetching ${account_ids.length} statlocker profiles...`
    );

    try {
      const response = await this.client.request<IStatlockerProfile[]>(
        "POST",
        `/api/profile/batch-profiles`,
        account_ids.map((id) => Number(id))
      );

      return response;
    } catch (error) {
      logger.error(error);

      return account_ids.map(
        (id) =>
          ({
            accountId: Number(id),
            avatarUrl: "",
            name: "Unknown",
            performanceRankMessage: null,
          } as IStatlockerProfile)
      );
    }
  }

  async GetProfileCache(account_id: string): Promise<IStatlockerProfile> {
    let cached = statlockerProfileCache.get(account_id);

    if (!cached) {
      cached = await this.FetchProfile(account_id);
      statlockerProfileCache.set(account_id, cached);
    }

    return cached;
  }

  async GetProfilesCache(account_ids: string[]): Promise<IStatlockerProfile[]> {
    const cachedProfiles: Record<string, IStatlockerProfile> = {};
    const idsToFetch: string[] = [];

    for (const id of account_ids) {
      const cached = statlockerProfileCache.get(id);
      if (cached) {
        cachedProfiles[id] = cached;
      } else {
        idsToFetch.push(id);
      }
    }

    const fetchedProfiles = await this.FetchProfiles(idsToFetch);

    for (const profile of fetchedProfiles) {
      statlockerProfileCache.set(String(profile.accountId), profile);
      cachedProfiles[profile.accountId] = profile;
    }

    return account_ids.map((id) => {
      const profile = cachedProfiles[id];
      if (!profile) throw new Error(`Steam profile not found for ID: ${id}`);
      return profile;
    });
  }
}
