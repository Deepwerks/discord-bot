import { useDeadlockClient } from '../../../../../..';
import { DeadlockMatchIdDTO } from '../validators/DeadlockMatchId.validator';
import DeadlockMatch from './DeadlockMatch';

export default class DeadlockMatchId {
  constructor(private data: DeadlockMatchIdDTO) {}

  get matchId(): number {
    return this.data.match_id;
  }

  async getMatch(): Promise<DeadlockMatch | null> {
    return await useDeadlockClient.MatchService.GetMatch(this.matchId);
  }
}
