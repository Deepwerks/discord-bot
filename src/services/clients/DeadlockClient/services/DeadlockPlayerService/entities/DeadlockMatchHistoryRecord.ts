import dayjs, { Dayjs } from 'dayjs';
import { DeadlockMatchHistoryRecordDTO } from '../validators/DeadlockMatchHistoryRecord.validator';
import { useAssetsClient, useDeadlockClient } from '../../../../../..';
import DeadlockMMRHistoryRecord from './DeadlockMMRHistoryRecord';
import DeadlockHero from '../../../../DeadlockAssetsClient/services/HeroService/entities/DeadlockHero';

export default class DeadlockMatchHistoryRecord {
  private mmrRecordCache?: DeadlockMMRHistoryRecord | null;
  private heroCache?: DeadlockHero | null;

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

  get teamAbandoned(): boolean | null {
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

  async getMMRRecord(): Promise<DeadlockMMRHistoryRecord | null> {
    if (this.mmrRecordCache === undefined) {
      this.mmrRecordCache = await useDeadlockClient.PlayerService.GetMMRRecord(
        this.accountId,
        this.matchId
      );
    }
    return this.mmrRecordCache;
  }

  async getHero(): Promise<DeadlockHero | null> {
    if (this.heroCache === undefined) {
      this.heroCache = await useAssetsClient.HeroService.GetHero(this.heroId);
    }
    return this.heroCache;
  }
}
