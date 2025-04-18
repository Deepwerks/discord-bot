import DeadlockMatchPlayer from "./DeadlockMatchPlayer";

export default class DeadlockMatch {
  match_id: number;
  start_time: Date;

  duration_s: number;
  match_outcome: number;
  winning_team: number;

  team_0_players: DeadlockMatchPlayer[];
  team_1_players: DeadlockMatchPlayer[];

  average_badge_team0: number;
  average_badge_team1: number;

  constructor(match_info: any) {
    this.match_id = match_info.match_id;
    this.start_time = new Date(match_info.start_time);
    this.duration_s = match_info.duration_s;
    this.match_outcome = match_info.match_outcome;
    this.winning_team = match_info.winning_team;
    this.team_0_players = match_info.players
      .filter((player: any) => player.team === 0)
      .sort((a: any, b: any) => a.player_slot - b.player_slot)
      .map((p: any) => new DeadlockMatchPlayer(p));
    this.team_1_players = match_info.players
      .filter((player: any) => player.team === 1)
      .sort((a: any, b: any) => a.player_slot - b.player_slot)
      .map((p: any) => new DeadlockMatchPlayer(p));
    this.average_badge_team0 = match_info.average_badge_team0;
    this.average_badge_team1 = match_info.average_badge_team1;
  }
}
