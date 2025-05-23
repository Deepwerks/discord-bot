/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IDeadlockPatch {
  title: string;
  pub_date: string;
  link: string;
  guid: {
    is_perma_link: boolean;
    text: string;
  };
  author: string;
  content_encoded: string;
}

export default class DeadlockPatch implements IDeadlockPatch {
  title: string;
  pub_date: string;
  link: string;
  guid: { is_perma_link: boolean; text: string };
  author: string;
  content_encoded: string;

  constructor(raw: any) {
    this.title = raw.title;
    this.pub_date = raw.pub_date;
    this.link = raw.link;
    this.guid = raw.guid;
    this.author = raw.author;
    this.content_encoded = raw.content_encoded;
  }
}
