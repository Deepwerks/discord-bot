import { DeadlockCustomMatchDTO } from '../validators/DeadlockCustomMatch.validator';

export default class DeadlockCustomMatch {
  constructor(private data: DeadlockCustomMatchDTO) {}

  get partyId(): number {
    return this.data.party_id;
  }

  get party_code(): string {
    return this.data.party_code;
  }
}
