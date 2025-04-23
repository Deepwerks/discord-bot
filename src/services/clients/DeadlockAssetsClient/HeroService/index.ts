import ICachedDeadlockHero from "../../../../base/interfaces/ICachedDeadlockHero";
import { deadlockAssetsHeroCache } from "../../../cache";
import logger from "../../../logger";
import BaseClient from "../../BaseClient";
import DeadlockHero from "./entities/DeadlockHero";

export interface IDeadlockHeroService {
  GetHero(heroId: number): void;
}

export default class DeadlockHeroService implements IDeadlockHeroService {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  async GetHero(heroId: number) {
    logger.info("[API CALL] Fetching a deadlock hero...");
    const response = await this.client.request<any>(
      "GET",
      `/v2/heroes/${heroId}`
    );

    return new DeadlockHero(response);
  }

  async GetHeroCached(heroId: number): Promise<ICachedDeadlockHero | null> {
    const cached = deadlockAssetsHeroCache.get(heroId);

    if (cached) return cached;

    const hero = await this.GetHero(heroId);
    if (!hero) return null;

    deadlockAssetsHeroCache.set(heroId, hero as ICachedDeadlockHero);
    return hero as ICachedDeadlockHero;
  }
}
