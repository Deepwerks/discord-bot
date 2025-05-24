import { useAssetsClient, useStatlockerClient } from '../../../../../..';
import DeadlockHero from '../../../../DeadlockAssetsClient/services/HeroService/entities/DeadlockHero';
import StatlockerProfile from '../../../../StatlockerClient/services/StatlockerProfileService/entities/StatlockerProfile';
import { DeadlockMatchPlayerDTO } from '../validators/DeadlockMatchPlayer.validator';
import { DeadlockMatchPlayerStatDTO } from '../validators/DeadlockMatchPlayerStat.validator';

export default class DeadlockMatchPlayer {
  constructor(private data: DeadlockMatchPlayerDTO) {}

  get accountId(): number {
    return this.data.account_id;
  }

  get playerSlot(): number {
    return this.data.player_slot;
  }

  get team(): number {
    return this.data.team;
  }

  get heroId(): number {
    return this.data.hero_id;
  }

  get party(): number {
    return this.data.party;
  }

  get stats(): DeadlockMatchPlayerStatDTO[] {
    return this.data.stats;
  }

  get kills(): number {
    return this.data.kills;
  }

  get deaths(): number {
    return this.data.deaths;
  }

  get assists(): number {
    return this.data.assists;
  }

  get netWorth(): number {
    return this.data.net_worth;
  }

  get lastHits(): number {
    return this.data.last_hits;
  }

  get denies(): number {
    return this.data.denies;
  }

  get abilityPoints(): number {
    return this.data.ability_points;
  }

  get assignedLane(): number {
    return this.data.assigned_lane;
  }

  async getHero(): Promise<DeadlockHero | null> {
    return await useAssetsClient.HeroService.GetHero(this.heroId);
  }

  async getProfile(): Promise<StatlockerProfile> {
    return await useStatlockerClient.ProfileService.GetProfile(this.accountId);
  }
}
