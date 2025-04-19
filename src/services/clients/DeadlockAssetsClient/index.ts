import BaseClient, { IBaseApiOptions } from "../BaseClient";
import DefaultAssetsService from "./DefaultService";
import DeadlockHeroService from "./HeroService";

export interface IDeadlockAssetsClient {
  HeroService: DeadlockHeroService;
  DefaultService: DefaultAssetsService;
}

export class DeadlockAssetsClient
  extends BaseClient
  implements IDeadlockAssetsClient
{
  HeroService: DeadlockHeroService;
  DefaultService: DefaultAssetsService;

  constructor(options: IBaseApiOptions) {
    super(options);
    this.HeroService = new DeadlockHeroService(this);
    this.DefaultService = new DefaultAssetsService(this);
  }
}
