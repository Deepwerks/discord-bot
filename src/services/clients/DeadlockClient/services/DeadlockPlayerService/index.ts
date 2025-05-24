import { logger } from '../../../../..';
import { hasMiscProperty } from '../../../../utils/guards';
import BaseClientService from '../../../base/classes/BaseClientService';
import { VariableRequestParams, VariableResponse } from './entities/CommandResponse';
import DeadlockMatchHistoryRecord from './entities/DeadlockMatchHistoryRecord';
import DeadlockMMRHistoryRecord from './entities/DeadlockMMRHistoryRecord';
import DeadlockPlayerHeroStats from './entities/DeadlockPlayerHeroStats';
import DeadlockMatchHistorySchema from './validators/DeadlockMatchHistory.validator';
import DeadlockMMRHistorySchema from './validators/DeadlockMMRHistory.validator';
import DeadlockPlayerHeroesStatsSchema from './validators/DeadlockPlayerHeroesStats.validator';

export default class DeadlockPlayerService extends BaseClientService {
  async FetchHeroStats(
    account_id: number,
    hero_id?: number
  ): Promise<DeadlockPlayerHeroStats | DeadlockPlayerHeroStats[] | null> {
    try {
      logger.info('[API CALL] Fetching player hero stats...');
      const response = await this.client.request('GET', `/v1/players/${account_id}/hero-stats`, {
        schema: DeadlockPlayerHeroesStatsSchema,
      });

      const heroesStats = response.map((s) => new DeadlockPlayerHeroStats(s));

      return hero_id ? heroesStats.find((s) => s.heroId === hero_id) || null : heroesStats;
    } catch (error) {
      logger.error('Failed to fetch player hero stats', {
        account_id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }

  async fetchMatchHistory(
    account_id: number,
    limit: number
  ): Promise<DeadlockMatchHistoryRecord[]> {
    try {
      logger.info('[API CALL] Fetching player match history...');

      const response = await this.client.request('GET', `/v1/players/${account_id}/match-history`, {
        schema: DeadlockMatchHistorySchema,
      });

      return response.slice(0, limit).map((r) => new DeadlockMatchHistoryRecord(r));
    } catch (error) {
      logger.error('Failed to fetch player match history', {
        account_id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return [];
    }
  }

  async fetchMMRHistory(account_id: number, limit: number): Promise<DeadlockMMRHistoryRecord[]> {
    try {
      logger.info('[API CALL] Fetching player mmr history...');

      const response = await this.client.request('GET', `/v1/players/${account_id}/mmr-history`, {
        schema: DeadlockMMRHistorySchema,
      });

      return response
        .reverse()
        .slice(0, limit)
        .map((h) => new DeadlockMMRHistoryRecord(h));
    } catch (error) {
      logger.error('Failed to fetch player mmr history', {
        account_id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return [];
    }
  }

  async FetchStats(
    account_id: number,
    variables: string[],
    hero_name?: string
  ): Promise<VariableResponse | null> {
    try {
      logger.info('[API CALL] Fetching player stats...');

      const params: VariableRequestParams = {
        account_id: String(account_id),
        variables,
      };

      if (variables.some((variable) => variable.includes('hero_')) && hero_name) {
        params.hero_name = hero_name;
      }

      const response = await this.client.request<VariableResponse>(
        'GET',
        '/v1/commands/variables/resolve',
        {
          params: {
            account_id,
            variables: variables.join(','),
            hero_name: params.hero_name,
          },
        }
      );

      return response;
    } catch (error) {
      logger.error('Failed to fetch player stats', {
        account_id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }
}
