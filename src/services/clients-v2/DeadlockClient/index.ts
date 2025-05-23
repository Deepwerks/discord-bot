import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import DeadlockMatchService from './services/DeadlockMatchService';

export class DeadlockClient extends BaseClient {
  MatchService: DeadlockMatchService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.client.defaults.headers.common['X-Api-Key'] = options.apiKey;

    this.MatchService = new DeadlockMatchService(this);
  }
}
