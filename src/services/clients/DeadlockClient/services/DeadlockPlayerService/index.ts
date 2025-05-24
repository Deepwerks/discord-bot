import { logger } from '../../../../..';
import CustomCache from '../../../../cache';
import { hasMiscProperty } from '../../../../utils/guards';
import BaseClient from '../../../base/classes/BaseClient';
import BaseClientService from '../../../base/classes/BaseClientService';
import { VariableRequestParams, VariableResponse } from './entities/CommandResponse';
import DeadlockMatchHistoryRecord from './entities/DeadlockMatchHistoryRecord';
import DeadlockMMRHistoryRecord from './entities/DeadlockMMRHistoryRecord';
import DeadlockPlayerHeroStats from './entities/DeadlockPlayerHeroStats';
import DeadlockMatchHistorySchema from './validators/DeadlockMatchHistory.validator';
import DeadlockMMRHistorySchema from './validators/DeadlockMMRHistory.validator';
import DeadlockPlayerHeroesStatsSchema from './validators/DeadlockPlayerHeroesStats.validator';

export default class DeadlockPlayerService extends BaseClientService {
  private matchHistoryCache: CustomCache<DeadlockMatchHistoryRecord[]>;
  private mmrHistoryCache: CustomCache<DeadlockMMRHistoryRecord[]>;

  constructor(client: BaseClient) {
    super(client);

    this.matchHistoryCache = new CustomCache<DeadlockMatchHistoryRecord[]>(60);
    this.mmrHistoryCache = new CustomCache<DeadlockMMRHistoryRecord[]>(60);
  }

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

  private async fetchMatchHistory(
    account_id: number,
    limit: number
  ): Promise<DeadlockMatchHistoryRecord[]> {
    try {
      logger.info('[API CALL] Fetching player match history...');

      const response = await this.client.request('GET', `/v1/players/${account_id}/match-history`, {
        schema: DeadlockMatchHistorySchema,
      });

      const history = response.slice(0, limit).map((r) => new DeadlockMatchHistoryRecord(r));
      this.matchHistoryCache.set(account_id, history);

      return history;
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

  async GetMatchHistory(
    account_id: number,
    limit: number = 15
  ): Promise<DeadlockMatchHistoryRecord[]> {
    const cached = this.matchHistoryCache.get(account_id);

    if (cached) return cached;

    const fetchedHistory = await this.fetchMatchHistory(account_id, limit);
    return fetchedHistory;
  }

  private async fetchMMRHistory(
    account_id: number,
    limit: number
  ): Promise<DeadlockMMRHistoryRecord[]> {
    try {
      logger.info('[API CALL] Fetching player mmr history...');

      const response = await this.client.request('GET', `/v1/players/${account_id}/mmr-history`, {
        schema: DeadlockMMRHistorySchema,
      });

      const mmrHistory = response
        .reverse()
        .slice(0, limit)
        .map((h) => new DeadlockMMRHistoryRecord(h));
      this.mmrHistoryCache.set(account_id, mmrHistory);

      return mmrHistory;
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

  async GetMMRHistory(account_id: number, limit: number = 15): Promise<DeadlockMMRHistoryRecord[]> {
    const cached = this.mmrHistoryCache.get(account_id);

    if (cached) return cached;

    const fetchedHistory = await this.fetchMMRHistory(account_id, limit);
    return fetchedHistory;
  }

  async GetMMRRecord(
    account_id: number,
    match_id: number
  ): Promise<DeadlockMMRHistoryRecord | null> {
    let mmrHistory = this.mmrHistoryCache.get(account_id);

    if (!mmrHistory) {
      mmrHistory = await this.fetchMMRHistory(account_id, 15);
    }

    const record = mmrHistory.find((r) => r.matchId === match_id);
    return record || null;
  }

  async GetMatchHistoryRecord(
    account_id: number,
    match_id: number
  ): Promise<DeadlockMatchHistoryRecord | null> {
    let matchHistory = this.matchHistoryCache.get(account_id);

    if (!matchHistory) {
      matchHistory = await this.fetchMatchHistory(account_id, 15);
    }

    const record = matchHistory.find((r) => r.matchId === match_id);
    return record || null;
  }

  async FetchStats(
    account_id: number,
    hero_name: string,
    variables: string[]
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
