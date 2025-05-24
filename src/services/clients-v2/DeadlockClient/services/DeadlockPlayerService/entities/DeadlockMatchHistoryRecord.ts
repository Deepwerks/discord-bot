import dayjs, { Dayjs } from 'dayjs';
import { DeadlockMatchHistoryRecordDTO } from '../validators/DeadlockMatchHistoryRecord.validator';

export default class DeadlockMatchHistoryRecord {
  constructor(private data: DeadlockMatchHistoryRecordDTO) {}

  get accountId(): number {
    return this.data.account_id;
  }

  get matchId(): number {
    return this.data.match_id;
  }

  get heroId(): number {
    return this.data.hero_id;
  }

  get heroLevel(): number {
    return this.data.hero_level;
  }

  get startTime(): number {
    return this.data.start_time;
  }

  get startDate(): Dayjs {
    return dayjs.unix(this.data.start_time);
  }

  get gameMode(): number {
    return this.data.game_mode;
  }

  get matchMode(): number {
    return this.data.match_mode;
  }

  get playerTeam(): number {
    return this.data.player_team;
  }

  get playerKills(): number {
    return this.data.player_kills;
  }

  get playerDeaths(): number {
    return this.data.player_deaths;
  }

  get playerAssists(): number {
    return this.data.player_assists;
  }

  get denies(): number {
    return this.data.denies;
  }

  get netWorth(): number {
    return this.data.net_worth;
  }

  get lastHits(): number {
    return this.data.last_hits;
  }

  get teamAbandoned(): number | null {
    return this.data.team_abandoned;
  }

  get abandonedTimeS(): number | null {
    return this.data.abandoned_time_s;
  }

  get matchDurationS(): number {
    return this.data.match_duration_s;
  }

  get matchResult(): number {
    return this.data.match_result;
  }

  get objectivesMaskTeam0(): number {
    return this.data.objectives_mask_team0;
  }

  get objectivesMaskTeam1(): number {
    return this.data.objectives_mask_team1;
  }

  async getMMRRecord() {
    //todo: call deadlock client to get mmr history record
  }
}
