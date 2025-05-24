import BaseClient from './BaseClient';

export default abstract class BaseClientService {
  protected client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }
}
