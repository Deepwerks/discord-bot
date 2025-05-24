import { DeadlockPatchDTO } from '../validators/DeadlockPatch.validator';

export default class DeadlockPatch {
  constructor(private data: DeadlockPatchDTO) {}

  get title(): string {
    return this.data.title;
  }

  get pubDate(): string {
    return this.data.pub_date;
  }

  get link(): string {
    return this.data.link;
  }

  get guid() {
    return this.data.guid;
  }

  get author(): string {
    return this.data.author;
  }

  get contentEncoded(): string {
    return this.data.content_encoded;
  }
}
