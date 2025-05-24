import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';

export class DeadlockAssetsClient extends BaseClient {
  constructor(options: IBaseApiOptions) {
    super(options);

    this.client.defaults.headers.common['X-Api-Key'] = options.apiKey;
  }
}
