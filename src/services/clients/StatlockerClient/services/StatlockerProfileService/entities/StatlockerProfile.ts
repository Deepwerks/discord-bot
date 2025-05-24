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
}
