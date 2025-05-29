import { logger } from '../../../../..';
import CustomCache from '../../../../cache';
import { hasMiscProperty } from '../../../../utils/guards';
import BaseClientService from '../../../base/classes/BaseClientService';
import DeadlockItem from './entities/DeadlockItem';
import DeadlockItemSchema from './validators/DeadlockItem.validator';
import DeadlockItemsSchema from './validators/DeadlockItems.validator';

export default class DeadlockItemService extends BaseClientService {
  private cache = new CustomCache<DeadlockItem>(0);

  async LoadAllItemsToCache() {
    try {
      logger.info('[API CALL] Fetching deadlock items...');

      const response = await this.client.request('GET', `/v2/items/`, {
        schema: DeadlockItemsSchema,
      });

      const items = response.map((item) => new DeadlockItem(item));

      for (const item of items) {
        this.cache.set(String(item.id), item);
      }
    } catch (error) {
      logger.error('Failed to fetch deadlock items', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }

  private async fetchItem(id: number): Promise<DeadlockItem | null> {
    try {
      logger.info('[API CALL] Fetching a deadlock item...');

      const response = await this.client.request('GET', `/v2/items/`, {
        schema: DeadlockItemSchema,
      });

      const item = new DeadlockItem(response);

      this.cache.set(String(item.id), item);
      return item;
    } catch (error) {
      logger.error('Failed to fetch deadlock item', {
        itemId: id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        misc: hasMiscProperty(error) ? error.misc : undefined,
      });

      return null;
    }
  }

  async GetItem(id: number): Promise<DeadlockItem | null> {
    const cached = this.cache.get(String(id));

    if (cached !== null) return cached;

    const fetchedItem = await this.fetchItem(id);
    return fetchedItem;
  }
}
