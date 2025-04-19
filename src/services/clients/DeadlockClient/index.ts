import BaseClient, { IBaseApiOptions } from "../BaseClient";
import DeadlockMatchService from "./DeadlockMatchService";
import DeadlockPlayerService from "./DeadlockPlayerService";

export interface IDeadlockClient {
  MatchService: DeadlockMatchService;
  PlayerService: DeadlockPlayerService;
}

export class DeadlockClient extends BaseClient implements IDeadlockClient {
  MatchService: DeadlockMatchService;
  PlayerService: DeadlockPlayerService;

  constructor(options: IBaseApiOptions) {
    super(options);
    this.MatchService = new DeadlockMatchService(this);
    this.PlayerService = new DeadlockPlayerService(this);
  }
}
