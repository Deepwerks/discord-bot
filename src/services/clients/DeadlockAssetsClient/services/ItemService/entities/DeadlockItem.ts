import { DeadlockItemDTO } from '../validators/DeadlockItem.validator';

export default class DeadlockItem {
  constructor(private data: DeadlockItemDTO) {}

  get id(): number {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get image(): string | null | undefined {
    return this.data.image;
  }
}
