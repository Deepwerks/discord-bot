import BaseClient, { IBaseApiOptions } from '../BaseClient';
import StatlockerProfileService from './StatlockerProfileService';

export interface IStatlockerClient {
  ProfileService: StatlockerProfileService;
}

export default class StatlockerClient extends BaseClient implements IStatlockerClient {
  ProfileService: StatlockerProfileService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.ProfileService = new StatlockerProfileService(this);
  }
}
