import { ChatInputCommandInteraction } from 'discord.js';
import CustomClient from '../classes/CustomClient';
import { TFunction } from 'i18next';

export default interface ISubCommand {
  client: CustomClient;
  name: string;

  Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<'translation', undefined>
  ): Promise<void>;
}
