import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import SteamProfileService from './services/SteamProfileService';

export default class SteamClient extends BaseClient {
  ProfileService: SteamProfileService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.ProfileService = new SteamProfileService(this);
  }
}
