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

  constructor(raw: any) {
    this.account_id = raw.account_id;
    this.player_slot = raw.player_slot;
    this.team = raw.team;
    this.hero_id = raw.hero_id;
    this.party = raw.party;

    this.kills = raw.kills;
    this.deaths = raw.deaths;
    this.assists = raw.assists;
    this.net_worth = raw.net_worth;
    this.last_hits = raw.last_hits;
    this.denies = raw.denies;
    this.ability_points = raw.ability_points;

    this.assigned_lane = raw.assigned_lane;
  }
}
