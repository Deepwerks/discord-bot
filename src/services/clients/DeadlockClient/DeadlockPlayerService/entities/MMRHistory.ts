/* eslint-disable @typescript-eslint/no-explicit-any */
export default class MMRHistoryRecord {
  match_id: number;
  player_score: number;
  rank: number;
  division: number;
  division_tier: number;

  constructor(raw: any) {
    this.match_id = raw.match_id;
    this.player_score = raw.player_score;
    this.rank = raw.rank;
    this.division = raw.division;
    this.division_tier = raw.division_tier;
  }
}
