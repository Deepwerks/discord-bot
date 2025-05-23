import { useAssetsClient } from '../../../../../..';
import DeadlockRank from '../../../../DeadlockAssetsClient/services/DefaultService/entities/DeadlockRank';
import { DeadlockMMRHistoryRecordDTO } from '../validators/DeadlockMMRHistoryRecord.validator';

export default class DeadlockMMRHistoryRecord {
  constructor(private data: DeadlockMMRHistoryRecordDTO) {}

  get matchId(): number {
    return this.data.match_id;
  }

  get playerScore(): number {
    return this.data.player_score;
  }

  get rank(): number {
    return this.data.rank;
  }

  get division(): number {
    return this.data.division;
  }

  get divisionTier(): number {
    return this.data.division_tier;
  }

  async getRank(): Promise<DeadlockRank | null> {
    return await useAssetsClient.DefaultService.GetRank(this.division);
  }
}
