import dayjs, { Dayjs } from 'dayjs';
import { DeadlockMatchDTO } from '../validators/DeadlockMatch.validator';
import { useAssetsClient } from '../../../../../..';
import DeadlockMatchPlayer from './DeadlockMatchPlayer';

export default class DeadlockMatch {
  constructor(private data: DeadlockMatchDTO) {}

  get matchId(): number {
    return this.data.match_info.match_id;
  }

  get startTime(): number {
    return this.data.match_info.start_time;
  }

  get startDate(): Dayjs {
    return dayjs.unix(this.data.match_info.start_time);
  }

  get durationS(): number {
    return this.data.match_info.duration_s;
  }

  get matchOutcome(): number {
    return this.data.match_info.match_outcome;
  }

  get winningTeam(): number {
    return this.data.match_info.winning_team;
  }

  get team0Players() {
    return this.data.match_info.players
      .filter((p) => p.team === 0)
      .sort((a, b) => a.player_slot - b.player_slot)
      .map((p) => new DeadlockMatchPlayer(p));
  }

  get team1Players() {
    return this.data.match_info.players
      .filter((p) => p.team === 1)
      .sort((a, b) => a.player_slot - b.player_slot)
      .map((p) => new DeadlockMatchPlayer(p));
  }

  get averageBadgeTeam0(): number {
    return this.data.match_info.average_badge_team0;
  }

  get averageBadgeTeam1(): number {
    return this.data.match_info.average_badge_team1;
  }

  async getaverageBadgeTeam0Url(): Promise<string> {
    const rank = Math.floor(this.averageBadgeTeam0 / 10);
    const subrank = this.averageBadgeTeam0 % 10;

    return await useAssetsClient.DefaultService.GetRankImage(rank, subrank);
  }

  async getaverageBadgeTeam1Url(): Promise<string> {
    const rank = Math.floor(this.averageBadgeTeam1 / 10);
    const subrank = this.averageBadgeTeam1 % 10;

    return await useAssetsClient.DefaultService.GetRankImage(rank, subrank);
  }
}
