/* eslint-disable @typescript-eslint/no-explicit-any */
export default class HeroStats {
  hero_id: number;
  matches_played: number;
  wins: number;
  ending_level: number;
  kills: number;
  deaths: number;
  assists: number;
  denies_per_match: number;
  kills_per_min: number;
  deaths_per_min: number;
  assists_per_min: number;
  denies_per_min: number;
  networth_per_min: number;
  last_hits_per_min: number;
  damage_mitigated_per_min: number;
  damage_taken_per_min: number;
  creeps_per_min: number;
  obj_damage_per_min: number;
  accuracy: number;
  crit_shot_rate: number;
  matches: number[];

  constructor(raw: any) {
    this.hero_id = raw.hero_id;
    this.matches_played = raw.matches_played;
    this.wins = raw.wins;
    this.ending_level = raw.ending_level;
    this.kills = raw.kills;
    this.deaths = raw.deaths;
    this.assists = raw.assists;
    this.denies_per_match = raw.denies_per_match;
    this.kills_per_min = raw.kills_per_min;
    this.deaths_per_min = raw.deaths_per_min;
    this.assists_per_min = raw.assists_per_min;
    this.denies_per_min = raw.denies_per_min;
    this.networth_per_min = raw.networth_per_min;
    this.last_hits_per_min = raw.last_hits_per_min;
    this.damage_mitigated_per_min = raw.damage_mitigated_per_min;
    this.damage_taken_per_min = raw.damage_taken_per_min;
    this.creeps_per_min = raw.creeps_per_min;
    this.obj_damage_per_min = raw.obj_damage_per_min;
    this.accuracy = raw.accuracy;
    this.crit_shot_rate = raw.crit_shot_rate;
    this.matches = raw.matches;
  }
}
