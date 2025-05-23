import { logger } from '../../../../..';
import BaseClient from '../../../base/classes/BaseClient';
import BaseClientService from '../../../base/classes/BaseClientService';
import DeadlockPatch from './entities/DeadlockPatch';
import DeadlockPatchesSchema from './validators/DeadlockPatches.validator';

export default class DeadlockPatchService extends BaseClientService {
  constructor(client: BaseClient) {
    super(client);
  }

  async GetPatches(): Promise<DeadlockPatch[]> {
    logger.info('[API CALL] Fetching deadlock patches...');

    const response = await this.client.request('GET', `/v1/patches`, {
      schema: DeadlockPatchesSchema,
    });

    return response.map((r) => new DeadlockPatch(r));
  }
}
