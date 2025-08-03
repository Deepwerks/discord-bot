import { RedisClientType } from 'redis';
import { redisClient } from '..';
import { AverageMatchStats } from '../../clients/DeadlockClient/services/SQLService/entities/AverageMatchStats';

class DeadlockAvgStatsStore {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  private getKey() {
    return `deadlockAvgStats`;
  }

  async get(): Promise<AverageMatchStats | undefined> {
    const data = await this.client.get(this.getKey());
    if (!data) return undefined;
    return JSON.parse(data);
  }

  async set(data: AverageMatchStats): Promise<void> {
    await this.client.set(this.getKey(), JSON.stringify(data));
  }
}

export const deadlockAvgStatsStore = new DeadlockAvgStatsStore(redisClient);
