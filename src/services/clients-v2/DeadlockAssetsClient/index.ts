import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import DeadlockDefaultService from './services/DefaultService';
import DeadlockHeroService from './services/HeroService';

export default class DeadlockAssetsClient extends BaseClient {
  DefaultService: DeadlockDefaultService;
  HeroService: DeadlockHeroService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.client.defaults.headers.common['X-Api-Key'] = options.config.deadlock_api_key;

    this.DefaultService = new DeadlockDefaultService(this);
    this.HeroService = new DeadlockHeroService(this);
  }
}
