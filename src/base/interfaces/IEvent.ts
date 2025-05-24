import { Events } from 'discord.js';
import CustomClient from '../classes/CustomClient';

export default interface IEvent {
  client: CustomClient;
  name: Events;
  description: string;
  once: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Execute(...args: any): void;
}
