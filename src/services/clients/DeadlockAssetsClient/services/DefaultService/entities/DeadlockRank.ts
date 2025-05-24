import { DeadlockRankDTO } from '../validators/DeadlockRank.validator';
import { DeadlockRankImagesDTO } from '../validators/DeadlockRankImages.validator';

export default class DeadlockRank {
  constructor(private data: DeadlockRankDTO) {}

  get tier(): number {
    return this.data.tier;
  }

  get name(): string {
    return this.data.name;
  }

  get images(): DeadlockRankImagesDTO {
    return this.data.images;
  }

  get color(): string {
    return this.data.color;
  }
}
