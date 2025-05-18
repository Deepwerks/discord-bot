export default class DeadlockLeaderboardEntry {
  account_name: string;
  rank: number;
  top_hero_ids: string[];
  badge_level: number;
  ranked_rank: number;
  ranked_subrank: number;

  constructor(raw: any) {
    this.account_name = raw.account_name;
    this.rank = raw.rank;
    this.top_hero_ids = raw.top_hero_ids;
    this.badge_level = raw.badge_level;
    this.ranked_rank = raw.ranked_rank;
    this.ranked_subrank = raw.ranked_subrank;
  }
}
