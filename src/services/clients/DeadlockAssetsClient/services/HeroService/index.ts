import { logger } from '../../../../..';
import CustomCache from '../../../../cache';
import { hasMiscProperty } from '../../../../utils/guards';
import BaseClientService from '../../../base/classes/BaseClientService';
import DeadlockHero from './entities/DeadlockHero';
import DeadlockHeroSchema from './validators/DeadlockHero.validator';
import DeadlockHeroesSchema from './validators/DeadlockHeroes.validator';

export default class DeadlockHeroService extends BaseClientService {
  private cache = new CustomCache<DeadlockHero>(0);

  private async fetchHero(heroId: number): Promise<DeadlockHero | null> {
    try {
      logger.info('[API CALL] Fetching a deadlock hero...');

      const response = await this.client.request('GET', `/v2/heroes/${heroId}`, {
        schema: DeadlockHeroSchema,
      });

      if (response.limited_testing || response.in_development || response.disabled) return null;

      const hero = new DeadlockHero(response);

      this.cache.set(String(hero.id), hero);
      return hero;
    } catch (error) {
      logger.error('Failed to fetch deadlock hero', {
        heroId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }

  async GetHero(heroId: number): Promise<DeadlockHero | null> {
    const cached = this.cache.get(String(heroId));

    if (cached) return cached;

    const hero = await this.fetchHero(heroId);
    return hero;
  }

  async LoadAllHeroesToCache(): Promise<void> {
    try {
      logger.info('[API CALL] Fetching all deadlock heroes...');

      const response = await this.client.request('GET', '/v2/heroes', {
        schema: DeadlockHeroesSchema,
      });
      const accessableHeroes = response
        .filter((hero) => !hero.disabled && !hero.in_development && !hero.limited_testing)
        .map((hero) => new DeadlockHero(hero));

      for (const hero of accessableHeroes) {
        this.cache.set(String(hero.id), hero);
      }
    } catch (error) {
      logger.error('Failed to fetch all deadlock heroes', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });
    }
  }

  GetHeroes(): DeadlockHero[] {
    return this.cache.getAll().map((h) => h);
  }
}
