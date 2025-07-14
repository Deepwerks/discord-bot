import { SteamProfileDTO } from '../validators/SteamProfile.validator';

export default class SteamProfile {
  constructor(private data: SteamProfileDTO) {}

  get accountId(): number {
    return this.data.account_id;
  }

  get avatar(): string {
    return this.data.avatar;
  }

  get countryCode(): string | null {
    return this.data.countrycode;
  }

  get lastUpdated(): string {
    return this.data.last_updated;
  }

  get personaName(): string {
    return this.data.personaname;
  }

  get profileUrl(): string {
    return this.data.profileurl;
  }

  get realName(): string | null {
    return this.data.realname;
  }
}
