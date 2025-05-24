import BaseClient from '../../../base/classes/BaseClient';
import { logger } from '../../../../..';
import DeadlockMatch from './entities/DeadlockMatch';
import DeadlockMatchSchema from './validators/DeadlockMatch.validator';
import BaseClientService from '../../../base/classes/BaseClientService';
import CustomCache from '../../../../cache';
import { hasMiscProperty } from '../../../../utils/guards';
import DeadlockCustomMatchSchema from './validators/DeadlockCustomMatch.validator';
import DeadlockCustomMatch from './entities/DeadlockCustomMatch';
import DeadlockMatchIdSchema from './validators/DeadlockMatchId.validator';
import DeadlockMatchId from './entities/DeadlockMatchId';

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
      logger.error('Failed to fetch deadlock match', {
        matchId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }

  async FetchMatchIdFromPartyId(partyId: string): Promise<DeadlockMatchId | null> {
    try {
      logger.info('[API CALL] Fetching a deadlock match id from party id...');

      const result = await this.client.request('GET', `/v1/matches/custom/${partyId}/match-id`, {
        schema: DeadlockMatchIdSchema,
      });

      return new DeadlockMatchId(result);
    } catch (error) {
      logger.error('Failed to get matchID from partyId', {
        partyId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }

  async CreateCustomMatch(): Promise<DeadlockCustomMatch | null> {
    try {
      logger.info('[API CALL] Creating a custom deadlock match...');

      const result = await this.client.request('POST', `/v1/matches/custom/create`, {
        schema: DeadlockCustomMatchSchema,
      });

      return new DeadlockCustomMatch(result);
    } catch (error) {
      logger.error('Failed to create a Deadlock lobby', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }
}
