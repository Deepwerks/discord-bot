import dayjs, { Dayjs } from 'dayjs';
import { DeadlockMatchDTO } from '../validators/DeadlockMatch.validator';

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

  get team0Players() {
    return this.data.match_info.players
      .filter((p) => p.team === 0)
      .sort((a, b) => a.player_slot - b.player_slot);
  }

  get team1Players() {
    return this.data.match_info.players
      .filter((p) => p.team === 1)
      .sort((a, b) => a.player_slot - b.player_slot);
  }
}
