import BaseClient, { IBaseApiOptions } from "../BaseClient";
import DeadlockLeaderboardService from "./DeadlockLeaderboardService";
import DeadlockMatchService from "./DeadlockMatchService";
import DeadlockPatchService from "./DeadlockPathService";
import DeadlockPlayerService from "./DeadlockPlayerService";

export interface IDeadlockClient {
  MatchService: DeadlockMatchService;
  PlayerService: DeadlockPlayerService;
  PatchService: DeadlockPatchService;
  LeaderboardService: DeadlockLeaderboardService;
}

export class DeadlockClient extends BaseClient implements IDeadlockClient {
  MatchService: DeadlockMatchService;
  PlayerService: DeadlockPlayerService;
  PatchService: DeadlockPatchService;
  LeaderboardService: DeadlockLeaderboardService;

  constructor(options: IBaseApiOptions) {
    super(options);
    this.client.defaults.headers.common["X-Api-Key"] = options.apiKey;

    this.MatchService = new DeadlockMatchService(this);
    this.PlayerService = new DeadlockPlayerService(this);
    this.PatchService = new DeadlockPatchService(this);
    this.LeaderboardService = new DeadlockLeaderboardService(this);
  }
}
