import { logger } from '../../../../..';
import { hasMiscProperty } from '../../../../utils/guards';
import BaseClient from '../../../base/classes/BaseClient';
import BaseClientService from '../../../base/classes/BaseClientService';
import DeadlockPatch from './entities/DeadlockPatch';
import DeadlockPatchesSchema from './validators/DeadlockPatches.validator';

export default class DeadlockPatchService extends BaseClientService {
  constructor(client: BaseClient) {
    super(client);
  }

  async FetchPatches(limit?: number): Promise<DeadlockPatch[]> {
    try {
      logger.info('[API CALL] Fetching deadlock patches...');

      const response = await this.client.request('GET', `/v1/patches`, {
        schema: DeadlockPatchesSchema,
      });

      if (!limit) {
        return response.map((r) => new DeadlockPatch(r));
      }

      return response.slice(0, limit).map((r) => new DeadlockPatch(r));
    } catch (error) {
      logger.error('Failed to fetch patches', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return [];
    }
  }
}
