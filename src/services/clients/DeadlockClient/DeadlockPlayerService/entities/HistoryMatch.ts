import dayjs from "dayjs";

export default class HistoryMatch {
  account_id: number;
  match_id: number;
  hero_id: number;
  hero_level: number;
  start_time: number;
  start_date: dayjs.Dayjs;
  game_mode: number;
  match_mode: number;
  player_team: number;
  player_kills: number;
  player_deaths: number;
  player_assists: number;
  denies: number;
  net_worth: number;
  last_hits: number;
  team_abandoned: number | null;
  abandoned_time_s: number | null;
  match_duration_s: number;
  match_result: number;
  objectives_mask_team0: number;
  objectives_mask_team1: number;

  constructor(raw: any) {
    this.account_id = raw.account_id;
    this.match_id = raw.match_id;
    this.hero_id = Number(raw.hero_id);
    this.hero_level = raw.hero_level;
    this.start_time = raw.start_time;
    this.start_date = dayjs.unix(this.start_time);
    this.game_mode = raw.game_mode;
    this.match_mode = raw.match_mode;
    this.player_team = raw.player_team;
    this.player_kills = raw.player_kills;
    this.player_deaths = raw.player_deaths;
    this.player_assists = raw.player_assists;
    this.denies = raw.denies;
    this.net_worth = raw.net_worth;
    this.last_hits = raw.last_hits;
    this.team_abandoned = raw.team_abandoned;
    this.abandoned_time_s = raw.abandoned_time_s;
    this.match_duration_s = raw.match_duration_s;
    this.match_result = raw.match_result;
    this.objectives_mask_team0 = raw.objectives_mask_team0;
    this.objectives_mask_team1 = raw.objectives_mask_team1;
  }
}
