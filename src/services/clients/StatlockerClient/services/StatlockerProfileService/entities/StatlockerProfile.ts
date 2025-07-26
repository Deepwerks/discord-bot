import { useAssetsClient } from '../../../../../..';
import { StatlockerProfileDTO } from '../validator/StatlockerProfile.validator';

export default class StatlockerProfile {
  constructor(private data: StatlockerProfileDTO) {}

  get accountId(): number {
    return this.data.accountId;
  }

  get name(): string {
    return this.data.name;
  }

  get avatarUrl(): string {
    return this.data.avatarUrl;
  }

  get performanceRankMessage(): string | null {
    return this.data.performanceRankMessage;
  }

  get lastUpdated(): Date | null {
    return this.data.lastUpdated ? new Date(this.data.lastUpdated) : null;
  }

  get ppScore(): number | null {
    return this.data.ppScore;
  }

  get estimatedRankNumber(): number | null {
    return this.data.estimatedRankNumber;
  }

  async getEstimatedRankName() {
    if (this.estimatedRankNumber) {
      const rank = Math.floor(this.estimatedRankNumber / 10);
      const subrank = this.estimatedRankNumber % 10;

      return await useAssetsClient.DefaultService.GetRankName(rank, subrank);
    }
    return null;
  }

  async getEstimatedRankImage() {
    if (this.estimatedRankNumber) {
      const rank = Math.floor(this.estimatedRankNumber / 10);
      const subrank = this.estimatedRankNumber % 10;

      return await useAssetsClient.DefaultService.GetRankImage(rank, subrank);
    }
    return null;
  }
}
