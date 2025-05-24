import { DeadlockPlayerHeroStatsDTO } from '../validators/DeadlockPlayerHeroStats.validator';

export default class DeadlockPlayerHeroStats {
  constructor(private data: DeadlockPlayerHeroStatsDTO) {}

  get heroId(): number {
    return this.data.hero_id;
  }

  get matchesPlayed(): number {
    return this.data.matches_played;
  }

  get wins(): number {
    return this.data.wins;
  }

  get endingLevel(): number {
    return this.data.ending_level;
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

  get deniesPerMatch(): number {
    return this.data.denies_per_match;
  }

  get killsPerMin(): number {
    return this.data.kills_per_min;
  }

  get deathsPerMin(): number {
    return this.data.deaths_per_min;
  }

  get assistsPerMin(): number {
    return this.data.assists_per_min;
  }

  get deniesPerMin(): number {
    return this.data.denies_per_min;
  }

  get networthPerMin(): number {
    return this.data.networth_per_min;
  }

  get lastHitsPerMin(): number {
    return this.data.last_hits_per_min;
  }

  get damageMitigatedPerMin(): number {
    return this.data.damage_mitigated_per_min;
  }

  get damageTakenPerMin(): number {
    return this.data.damage_taken_per_min;
  }

  get creepsPerMin(): number {
    return this.data.creeps_per_min;
  }

  get objDamagePerMin(): number {
    return this.data.obj_damage_per_min;
  }

  get accuracy(): number {
    return this.data.accuracy;
  }

  get crit_shot_rate(): number {
    return this.data.crit_shot_rate;
  }

  get matches(): number[] {
    return this.data.matches;
  }

  async getHero() {
    //todo: call assets client to get hero
  }
}
