import BaseClient from '../../../base/classes/BaseClient';
import { logger } from '../../../../..';
import DeadlockMatch from './entities/DeadlockMatch';
import DeadlockMatchSchema from './validators/DeadlockMatch.validator';
import BaseClientService from '../../../base/classes/BaseClientService';
import CustomCache from '../../../../cache';
import { hasMiscProperty } from '../../../../utils/guards';

export default class DeadlockMatchService extends BaseClientService {
  private cache: CustomCache<DeadlockMatch>;

  constructor(client: BaseClient) {
    super(client);

    this.cache = new CustomCache<DeadlockMatch>(60);
  }

  async GetMatch(matchId: number): Promise<DeadlockMatch | null> {
    const cached = this.cache.get(matchId);

    if (cached) {
      return cached;
    }

    const fetchedMatch = await this.fetchMatch(matchId);
    return fetchedMatch;
  }

  private async fetchMatch(matchId: number): Promise<DeadlockMatch | null> {
    try {
      logger.info('[API CALL] Fetching a deadlock match...');

      const response = await this.client.request('GET', `/v1/matches/${matchId}/metadata`, {
        schema: DeadlockMatchSchema,
      });

      const fetchedMatch = new DeadlockMatch(response);
      this.cache.set(matchId, fetchedMatch);

      return fetchedMatch;
    } catch (error) {
      logger.error({
        message: 'Failed to fetch deadlock match',
        matchId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }

  async GetMatchIdFromPartyId() {}

  async CreateCustomMatch() {}
}
