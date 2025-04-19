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
    const response = await this.client.request<any>(
      "GET",
      `/v2/heroes/${heroId}`
    );

    return new DeadlockHero(response);
  }
}
