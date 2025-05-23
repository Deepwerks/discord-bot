import BaseClient from '../../../base/classes/BaseClient';
import { logger } from '../../../../..';
import DeadlockMatch from './entities/DeadlockMatch';
import DeadlockMatchSchema from './validators/DeadlockMatch.validator';
import BaseClientService from '../../../base/classes/BaseClientService';

export default class DeadlockMatchService extends BaseClientService {
  constructor(client: BaseClient) {
    super(client);
  }

  async GetMatch(matchId: string): Promise<DeadlockMatch> {
    logger.info('[API CALL] Fetching a deadlock match...');

    const response = await this.client.request('GET', `/v1/matches/${matchId}/metadata`, {
      schema: DeadlockMatchSchema,
    });

    return new DeadlockMatch(response);
  }

  async GetMatchIdFromPartyId() {}

  async CreateCustomMatch() {}
}
