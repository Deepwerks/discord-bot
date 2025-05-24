import { DeadlockHeroDTO } from '../validators/DeadlockHero.validator';
import { DeadlockHeroDescriptionDTO } from '../validators/DeadlockHeroDescription.validator';
import { DeadlockHeroImagesDTO } from '../validators/DeadlockHeroImages.validator';

export default class DeadlockHero {
  constructor(private data: DeadlockHeroDTO) {}

  get id(): number {
    return this.data.id;
  }

  get className(): string {
    return this.data.class_name;
  }

  get name(): string {
    return this.data.name;
  }

  get images(): DeadlockHeroImagesDTO {
    return this.data.images;
  }

  get description(): DeadlockHeroDescriptionDTO {
    return this.data.description;
  }

  get disabled(): boolean {
    return this.data.disabled;
  }

  get inDevelopment(): boolean {
    return this.data.in_development;
  }

  get limitedTesting(): boolean {
    return this.data.limited_testing;
  }
}
