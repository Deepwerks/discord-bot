/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '../../../../..';
import BaseClientService from '../../../base/classes/BaseClientService';
import { AverageMatchStats } from './entities/AverageMatchStats';
import { ITableSchema } from './entities/ITableSchema';

export default class SQLService extends BaseClientService {
  async Query<T = any>(query: string): Promise<T[]> {
    logger.info('[API CALL] Running SQL query...');

    const response = await this.client.request<T[]>('GET', `/v1/sql`, {
      params: {
        query,
      },
    });

    return response;
  }

  async GetTables() {
    const response = await this.client.request<string[]>('GET', `/v1/sql/tables`);
    return response;
  }

  async GetTableSchema(tableName: string) {
    const response = await this.client.request<ITableSchema[]>(
      'GET',
      `/v1/sql/tables/${tableName}/schema`
    );
    return response;
  }

  async GetAverageMatchStats(startDate: Date, endDate: Date): Promise<AverageMatchStats> {
    const formatDate = (date: Date): string => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
      );
    };

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    const playerStatsQuery = `
    SELECT
      avg(mp.kills) AS avg_kills,
      avg(mp.deaths) AS avg_deaths,
      avg(mp.assists) AS avg_assists,
      avg(mp.net_worth) AS avg_net_worth,
      avg(mp.last_hits) AS avg_last_hits
    FROM match_player AS mp
    INNER JOIN match_info AS mi ON mp.match_id = mi.match_id
    WHERE mi.start_time BETWEEN '${startStr}' AND '${endStr}'
  `;

    const durationQuery = `
    SELECT
      avg(duration_s) AS avg_match_duration_s
    FROM match_info
    WHERE start_time BETWEEN '${startStr}' AND '${endStr}'
  `;

    const [playerStatsRaw, durationStatsRaw] = await Promise.all([
      this.Query<{
        avg_kills: number;
        avg_deaths: number;
        avg_assists: number;
        avg_net_worth: number;
        avg_last_hits: number;
      }>(playerStatsQuery),
      this.Query<{ avg_match_duration_s: number }>(durationQuery),
    ]);

    const playerStats = playerStatsRaw[0];
    const durationStats = durationStatsRaw[0];

    const result: AverageMatchStats = {
      avg_kills: playerStats?.avg_kills,
      avg_deaths: playerStats?.avg_deaths,
      avg_assists: playerStats?.avg_assists,
      avg_net_worth: playerStats?.avg_net_worth,
      avg_last_hits: playerStats?.avg_last_hits,
      avg_match_duration_s: durationStats?.avg_match_duration_s,
    };

    for (const [key, value] of Object.entries(result)) {
      if (value == null || isNaN(value as number)) {
        throw new Error(`Failed to fetch valid value for "${key}"`);
      }
    }

    return result;
  }
}
