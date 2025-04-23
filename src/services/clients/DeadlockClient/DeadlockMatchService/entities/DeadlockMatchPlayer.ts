export default class DeadlockMatchPlayer {
  account_id: number;

  player_slot: number;
  team: number;
  hero_id: number;
  party: number;

  kills: number;
  deaths: number;
  assists: number;
  net_worth: number;
  last_hits: number;
  denies: number;
  ability_points: number;

  assigned_lane: number;

  damage_dealt: number;
  obj_damage: number;
  healing: number;
  damage_taken: number;

  constructor(raw: any) {
    this.account_id = raw.account_id;
    this.player_slot = raw.player_slot;
    this.team = raw.team;
    this.hero_id = Number(raw.hero_id);
    this.party = raw.party;

    this.kills = raw.kills;
    this.deaths = raw.deaths;
    this.assists = raw.assists;
    this.net_worth = raw.net_worth;
    this.last_hits = raw.last_hits;
    this.denies = raw.denies;
    this.ability_points = raw.ability_points;

    this.assigned_lane = raw.assigned_lane;

    this.damage_dealt = raw.stats.at(-1).player_damage;
    this.obj_damage = raw.stats.at(-1).boss_damage;
    this.healing = raw.stats.at(-1).player_healing;
    this.damage_taken = raw.stats.at(-1).player_damage_taken;
  }
}
