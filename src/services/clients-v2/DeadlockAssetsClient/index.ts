import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import DeadlockDefaultService from './services/DefaultService';
import DeadlockHeroService from './services/HeroService';

export class DeadlockAssetsClient extends BaseClient {
  DefaultService: DeadlockDefaultService;
  HeroService: DeadlockHeroService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.client.defaults.headers.common['X-Api-Key'] = options.apiKey;

    this.DefaultService = new DeadlockDefaultService(this);
    this.HeroService = new DeadlockHeroService(this);
  }
}
