import BaseClient, { IBaseApiOptions } from "../BaseClient";
import SteamProfileService from "./SteamProfileService";

export interface ISteamClient {
  ProfileService: SteamProfileService;
}

export default class SteamClient extends BaseClient implements ISteamClient {
  ProfileService: SteamProfileService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.ProfileService = new SteamProfileService(this);
  }
}
