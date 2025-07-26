import { z } from 'zod';
import { logger } from '../../../../..';
import CustomCache from '../../../../cache';
import { hasMiscProperty } from '../../../../utils/guards';
import BaseClient from '../../../base/classes/BaseClient';
import BaseClientService from '../../../base/classes/BaseClientService';
import StatlockerProfile from './entities/StatlockerProfile';
import StatlockerProfileSchema from './validator/StatlockerProfile.validator';

export default class StatlockerProfileService extends BaseClientService {
  private cache: CustomCache<StatlockerProfile>;

  constructor(client: BaseClient) {
    super(client);

    this.cache = new CustomCache<StatlockerProfile>('StatlockerProfileCache', 60 * 10);
  }

  private async fetchProfile(account_id: number): Promise<StatlockerProfile | null> {
    try {
      logger.info('[API CALL] Fetching a statlocker profile...');

      const response = await this.client.request('GET', `/api/open/profile/${account_id}`, {
        schema: StatlockerProfileSchema,
      });

      const profile = new StatlockerProfile(response);

      this.cache.set(String(profile.accountId), profile);
      return profile;
    } catch (error) {
      logger.error('Failed to fetch statlocker profile', {
        account_id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }

  private async fetchProfiles(account_ids: number[]): Promise<StatlockerProfile[]> {
    try {
      logger.info(`[API CALL] Fetching ${account_ids.length} statlocker profiles...`);

      const response = await this.client.request('POST', `/api/profile/batch-profiles`, {
        schema: z.array(StatlockerProfileSchema),
        data: account_ids,
      });

      const profiles = response.map((profile) => {
        const _profile = new StatlockerProfile(profile);

        this.cache.set(String(_profile.accountId), _profile);
        return _profile;
      });

      return profiles;
    } catch (error) {
      logger.error('Failed to fetch statlocker profiles', {
        account_ids,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return account_ids.map(
        (id) =>
          new StatlockerProfile({
            accountId: id,
            avatarUrl:
              'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg',
            name: 'Unknown',
            performanceRankMessage: null,
            lastUpdated: null,
            ppScore: null,
            estimatedRankNumber: 0,
          })
      );
    }
  }

  async GetProfile(account_id: number): Promise<StatlockerProfile | null> {
    const cached = this.cache.get(String(account_id));

    if (cached) return cached;

    const fetchedProfile = await this.fetchProfile(account_id);
    return fetchedProfile;
  }

  async GetProfiles(account_ids: number[]): Promise<StatlockerProfile[]> {
    const cachedProfiles: Record<string, StatlockerProfile> = {};
    const idsToFetch: number[] = [];

    for (const id of account_ids) {
      const cached = this.cache.get(String(id));
      if (cached) {
        cachedProfiles[id] = cached;
      } else {
        idsToFetch.push(id);
      }
    }

    if (idsToFetch.length !== 0) {
      const fetchedProfiles = await this.fetchProfiles(idsToFetch);

      for (const profile of fetchedProfiles) {
        cachedProfiles[profile.accountId] = profile;
      }
    }

    return account_ids.map((id) => {
      const profile = cachedProfiles[id];
      return profile;
    });
  }

  async SearchProfile(username: string) {
    try {
      logger.info(`[API CALL] Searching for statlocker profiles...`);

      const response = await this.client.request(
        'GET',
        `/api/profile/search-profiles/${username}`,
        {
          schema: z.array(StatlockerProfileSchema),
        }
      );

      const profiles = response.map((profile) => {
        const _profile = new StatlockerProfile(profile);

        this.cache.set(String(_profile.accountId), _profile);
        return _profile;
      });

      return profiles;
    } catch (error) {
      logger.error('Failed to fetch statlocker profile', {
        username,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }
}
