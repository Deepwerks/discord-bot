import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import StatlockerProfileService from './services/StatlockerProfileService';

export default class StatlockerClient extends BaseClient {
  ProfileService: StatlockerProfileService;
  constructor(options: IBaseApiOptions) {
    super(options);

    this.ProfileService = new StatlockerProfileService(this);
  }
}
