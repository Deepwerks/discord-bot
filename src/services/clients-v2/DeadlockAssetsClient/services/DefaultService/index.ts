import { logger } from '../../../../..';
import CustomCache from '../../../../cache';
import { hasMiscProperty } from '../../../../utils/guards';
import BaseClient from '../../../base/classes/BaseClient';
import BaseClientService from '../../../base/classes/BaseClientService';
import DeadlockRank from './entities/DeadlockRank';
import DeadlockRanksSchema from './validators/DeadlockRanks.validator';

export default class DeadlockDefaultService extends BaseClientService {
  private ranksCache: CustomCache<DeadlockRank>;
  constructor(client: BaseClient) {
    super(client);

    this.ranksCache = new CustomCache<DeadlockRank>(0);
  }

  private async fetchRanks(): Promise<DeadlockRank[]> {
    try {
      logger.info('[API CALL] Fetching deadlock ranks...');

      const response = await this.client.request('GET', `/v2/ranks`, {
        schema: DeadlockRanksSchema,
      });

      const ranks = response.map((rank) => {
        const _rank = new DeadlockRank(rank);

        this.ranksCache.set(_rank.tier, _rank);
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
    const cached = this.ranksCache.getAll().map((rank) => rank);

    if (cached) {
      return cached;
    }

    const fetchedRanks = await this.fetchRanks();
    return fetchedRanks;
  }

  async GetRank(number: number): Promise<DeadlockRank | null> {
    let rank = this.ranksCache.get(number);

    if (!rank) {
      await this.fetchRanks();
      rank = this.ranksCache.get(number);
    }

    return rank;
  }

  async GetRankName(number: number | undefined): Promise<string> {
    if (number === undefined) return 'Unknown';

    const rank = Math.floor(number / 10);
    const subrank = number % 10;

    const tierData = await this.GetRank(rank);
    if (!tierData) return 'Unknown';

    return `${tierData.name}${subrank > 0 ? ` ${subrank}` : ''}`;
  }

  async GetRankImage(number: number | undefined) {
    let unknownImage = (await this.GetRank(0))?.images.large;

    if (!unknownImage) {
      unknownImage =
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank0/badge_lg.png';
    }

    if (number === undefined) return unknownImage;

    const rank = Math.floor(number / 10);
    const subrank = number % 10;

    const tierData = await this.GetRank(rank);
    if (!tierData) return unknownImage;

    const images = tierData.images;

    if (subrank === 0) {
      return images.large;
    }

    const key = `large_subrank${subrank}`;
    return (images as Record<string, string>)[key] || unknownImage;
  }
}
