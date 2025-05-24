import { DeadlockMatchIdDTO } from '../validators/DeadlockMatchId.validator';

export default class DeadlockMatchId {
  constructor(private data: DeadlockMatchIdDTO) {}

  get matchId(): number {
    return this.data.match_id;
  }

  async getMatch() {
    //todo: call deadlock client to get match
  }
}
