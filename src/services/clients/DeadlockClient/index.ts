import BaseClient, { IBaseApiOptions } from "../BaseClient";
import DeadlockMatchService from "./DeadlockMatchService";

export interface IDeadlockClient {
  MatchService: DeadlockMatchService;
}

export class DeadlockClient extends BaseClient implements IDeadlockClient {
  MatchService: DeadlockMatchService;

  constructor(options: IBaseApiOptions) {
    super(options);
    this.MatchService = new DeadlockMatchService(this);
  }
}
