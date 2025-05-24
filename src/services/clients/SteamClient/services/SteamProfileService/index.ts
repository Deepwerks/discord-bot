import { logger } from '../../../../..';
import { ICachedSteamProfile } from '../../../../../base/interfaces/ICachedSteamProfile';
import CustomCache from '../../../../cache';
import { getSteamIdType } from '../../../../utils/getSteamIdType';
import { isValidSteamId } from '../../../../utils/isValidSteamId';
import { resolveToSteamID64 } from '../../../../utils/resolveToSteamID64';
import BaseClient from '../../../base/classes/BaseClient';
import BaseClientService from '../../../base/classes/BaseClientService';
import { ISteamID, ISteamPlayer, ISteamPlayersResponse } from './interfaces';

export interface ISteamProfileService {
  GetProfileCached(
    account_id: string | null,
    isValidSteamID64: boolean | undefined
  ): Promise<ICachedSteamProfile | null>;
  GetProfilesCached(account_ids: string[]): Promise<ICachedSteamProfile[]>;
  GetIdFromUsername(username: string): Promise<string | null>;
}

export default class SteamProfileService extends BaseClientService {
  private readonly STEAM_ID64_BASE = BigInt('76561197960265728');
  private cache: CustomCache<ICachedSteamProfile>;

  constructor(client: BaseClient) {
    super(client);

    this.cache = new CustomCache<ICachedSteamProfile>(60 * 30);
  }

  async FetchProfile(steamID: ISteamID): Promise<ISteamPlayer> {
    logger.info('[API CALL] Fetching a steam profile...');

    const response = await this.client.request<ISteamPlayersResponse>(
      'GET',
      `/ISteamUser/GetPlayerSummaries/v0002/`,
      {
        params: {
          key: this.client.config.steam_api_key,
          steamids: this.convertToSteamId64(steamID),
        },
      }
    );

    const players = response.response.players;

    if (players.length === 0) {
      logger.warn('Player not found!');
      throw new Error('Player not found');
    }

    return players[0];
  }

  async FetchProfiles(steamIDs: ISteamID[]): Promise<ISteamPlayer[]> {
    if (!steamIDs.length) return [];

    logger.info(`[API CALL] Fetching ${steamIDs.length}x steam profiles...`);
    const players: ISteamPlayer[] = [];

    try {
      const response = await this.client.request<ISteamPlayersResponse>(
        'GET',
        `/ISteamUser/GetPlayerSummaries/v0002/`,
        {
          params: {
            key: this.client.config.steam_api_key,
            steamids: steamIDs.map((id) => id.value).join(','),
          },
        }
      );

      for (const player of response.response.players) players.push(player);

      return players;
    } catch (error) {
      logger.error(error);

      return steamIDs.map(
        (id) =>
          ({
            steamid: id.value,
            personaname: 'Unknown',
            profileurl: '',
            avatarmedium: '',
          }) as ISteamPlayer
      );
    }
  }

  async GetIdFromUsername(username: string): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.request<any>(
      'GET',
      `/ISteamUser/ResolveVanityURL/v1/?key=${this.client.config.steam_api_key}&vanityurl=${username}`
    );

    if (response.response.success !== 1) {
      return null;
    }

    return response.response.steamid;
  }

  // Cached
  async GetProfileCached(account_id: string | null, isValidSteamID64: boolean = false) {
    if (!account_id) return null;
    let steamID64: string = account_id;

    if (!isValidSteamID64) {
      let steamId: string | undefined;

      if (isValidSteamId(account_id)) steamId = account_id;
      else {
        const _steamId = await this.GetIdFromUsername(account_id);

        if (!_steamId || !isValidSteamId(_steamId)) return null;

        steamId = _steamId;
      }

      const steamIdType = getSteamIdType(steamId);

      if (!steamIdType) {
        logger.error('Could not determine steamID type');
        return null;
      }

      steamID64 = await resolveToSteamID64(steamId);
    }

    const cachedProfile = this.cache.get(steamID64);

    if (!cachedProfile) {
      const steamProfile = await this.FetchProfile({
        type: 'steamID64',
        value: steamID64,
      });

      this.cache.set(steamID64, steamProfile as ICachedSteamProfile);
      return steamProfile as ICachedSteamProfile;
    }

    return cachedProfile as ICachedSteamProfile;
  }

  // Cached
  async GetProfilesCached(account_ids: string[]) {
    account_ids = account_ids.map(
      (id) => this.convertToSteamId64({ type: 'steamID3', value: id })!
    );

    const cachedProfiles: Record<string, ICachedSteamProfile> = {};
    const idsToFetch: string[] = [];

    for (const id of account_ids) {
      const cached = this.cache.get(id);
      if (cached) {
        cachedProfiles[id] = cached;
      } else {
        idsToFetch.push(id);
      }
    }

    const fetchedProfiles = await this.FetchProfiles(
      idsToFetch.map((id) => ({ type: 'steamID64', value: id }))
    );

    for (const profile of fetchedProfiles) {
      this.cache.set(profile.steamid, profile);
      cachedProfiles[profile.steamid] = profile;
    }

    return account_ids.map((id) => {
      const profile = cachedProfiles[id];
      if (!profile) throw new Error(`Steam profile not found for ID: ${id}`);
      return profile;
    });
  }

  convertToSteamId64(steamID: ISteamID): string | null {
    try {
      switch (steamID.type) {
        case 'steamID':
        case 'steamID3':
          return (this.STEAM_ID64_BASE + BigInt(steamID.value)).toString();
        case 'steamID64':
          return steamID.value;
        default:
          return null;
      }
    } catch (e) {
      console.error('Conversion error:', e);
      return null;
    }
  }
}
