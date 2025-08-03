import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import DeadlockMatchService from './services/DeadlockMatchService';
import DeadlockPatchService from './services/DeadlockPatchService';
import DeadlockPlayerService from './services/DeadlockPlayerService';
import SQLService from './services/SQLService';

export default class DeadlockClient extends BaseClient {
  MatchService: DeadlockMatchService;
  PatchService: DeadlockPatchService;
  PlayerService: DeadlockPlayerService;
  SQLService: SQLService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.client.defaults.headers.common['X-Api-Key'] = options.config.deadlock_api_key;

    this.MatchService = new DeadlockMatchService(this);
    this.PatchService = new DeadlockPatchService(this);
    this.PlayerService = new DeadlockPlayerService(this);
    this.SQLService = new SQLService(this);
  }
}
