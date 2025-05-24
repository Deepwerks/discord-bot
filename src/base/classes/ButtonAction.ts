import { AutocompleteInteraction, ButtonInteraction } from 'discord.js';
import CustomClient from './CustomClient';
import { TFunction } from 'i18next';
import IButtonAction from '../interfaces/IButtonAction';
import IButtonActionOptions from '../interfaces/IButtonActionOptions';

export default abstract class ButtonAction implements IButtonAction {
  client: CustomClient;
  customId: string;
  description: string;
  cooldown: number;

  constructor(client: CustomClient, options: IButtonActionOptions) {
    this.client = client;
    this.customId = options.customId;
    this.description = options.description;
    this.cooldown = options.cooldown;
  }

  abstract Execute(
    interaction: ButtonInteraction,
    t: TFunction<'translation', undefined>
  ): Promise<void>;

  AutoComplete(_interaction: AutocompleteInteraction): void {
    /* default no-op – can be overridden */
  }
}
