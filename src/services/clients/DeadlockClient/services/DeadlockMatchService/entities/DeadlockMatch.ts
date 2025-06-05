import dayjs, { Dayjs } from 'dayjs';
import { DeadlockMatchDTO } from '../validators/DeadlockMatch.validator';
import { useAssetsClient, useStatlockerClient } from '../../../../../..';
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

  get players() {
    return this.data.match_info.players;
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

  get averageBadgeTeam0(): number | null {
    return this.data.match_info.average_badge_team0;
  }

  get averageBadgeTeam1(): number | null {
    return this.data.match_info.average_badge_team1;
  }

  async loadPlayerProfiles(): Promise<void> {
    await useStatlockerClient.ProfileService.GetProfiles([
      ...this.data.match_info.players.map((p) => p.account_id),
    ]);
  }

  async getAverageBadgeTeam0Url(): Promise<string | null> {
    if (!this.averageBadgeTeam0) return null;

    const rank = Math.floor(this.averageBadgeTeam0 / 10);
    const subrank = this.averageBadgeTeam0 % 10;

    return await useAssetsClient.DefaultService.GetRankImage(rank, subrank);
  }

  async getAverageBadgeTeam1Url(): Promise<string | null> {
    if (!this.averageBadgeTeam1) return null;

    const rank = Math.floor(this.averageBadgeTeam1 / 10);
    const subrank = this.averageBadgeTeam1 % 10;

    return await useAssetsClient.DefaultService.GetRankImage(rank, subrank);
  }
}
