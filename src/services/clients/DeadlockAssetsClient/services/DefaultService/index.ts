import { logger } from '../../../../..';
import CustomCache from '../../../../cache';
import { hasMiscProperty } from '../../../../utils/guards';
import BaseClientService from '../../../base/classes/BaseClientService';
import DeadlockRank from './entities/DeadlockRank';
import DeadlockRanksSchema from './validators/DeadlockRanks.validator';

export default class DeadlockDefaultService extends BaseClientService {
  private cache = new CustomCache<DeadlockRank>(0);

  private async fetchRanks(): Promise<DeadlockRank[]> {
    try {
      logger.info('[API CALL] Fetching deadlock ranks...');

      const response = await this.client.request('GET', `/v2/ranks`, {
        schema: DeadlockRanksSchema,
      });

      const ranks = response.map((rank) => {
        const _rank = new DeadlockRank(rank);

        this.cache.set(_rank.tier, _rank);
        return _rank;
      });

      return ranks;
    } catch (error) {
      logger.error('Failed to fetch deadlock ranks', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return [];
    }
  }

  async GetRanks(): Promise<DeadlockRank[]> {
    const cached = this.cache.getAll().map((rank) => rank);

    if (cached.length > 0) {
      return cached;
    }

    const fetchedRanks = await this.fetchRanks();
    return fetchedRanks;
  }

  async GetRank(tier: number): Promise<DeadlockRank | null> {
    let rank = this.cache.get(tier);

    if (!rank) {
      await this.fetchRanks();
      rank = this.cache.get(tier);
    }

    return rank;
  }

  async GetRankName(rank: number, subrank: number): Promise<string> {
    const tierData = await this.GetRank(rank);
    if (!tierData) return 'Unknown';

    return `${tierData.name}${subrank > 0 ? ` ${subrank}` : ''}`;
  }

  async GetRankImage(rank: number, subrank: number) {
    let unknownImage = (await this.GetRank(0))?.images.large;

    if (!unknownImage) {
      unknownImage =
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank0/badge_lg.png';
    }

    const tierData = await this.GetRank(rank);
    if (!tierData) return unknownImage;

    const images = tierData.images;

    if (subrank === 0) {
      return images.large;
    }

    const key = `large_subrank${subrank}`;
    return (images as Record<string, string>)[key] || unknownImage;
  }

  async LoadAllRanksToCache(): Promise<void> {
    try {
      logger.info('[API CALL] Fetching all deadlock ranks...');

      const response = await this.client.request('GET', `/v2/ranks`, {
        schema: DeadlockRanksSchema,
      });

      response.map((rank) => {
        const _rank = new DeadlockRank(rank);
        this.cache.set(_rank.tier, _rank);
      });
    } catch (error) {
      logger.error('Failed to fetch all deadlock ranks', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });
    }
  }
}
