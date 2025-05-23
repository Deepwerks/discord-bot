import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import DeadlockMatchService from './services/DeadlockMatchService';
import DeadlockPatchService from './services/DeadlockPatchService';

export class DeadlockClient extends BaseClient {
  MatchService: DeadlockMatchService;
  PatchService: DeadlockPatchService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.client.defaults.headers.common['X-Api-Key'] = options.apiKey;

    this.MatchService = new DeadlockMatchService(this);
    this.PatchService = new DeadlockPatchService(this);
  }
}
