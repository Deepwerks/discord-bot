/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ApplicationCommandOptionData,
} from 'discord.js';
import Category from '../enums/Category';
import ICommand from '../interfaces/ICommand';
import CustomClient from './CustomClient';
import ICommandOptions from '../interfaces/ICommandOptions';
import { TFunction } from 'i18next';

export default abstract class Command implements ICommand {
  client: CustomClient;
  name: string;
  description: string;
  category: Category;
  options: ApplicationCommandOptionData[];
  default_member_permissions: bigint;
  dm_permission: boolean;
  cooldown: number;
  dev: boolean;
  limitedServers?: string[];

  constructor(client: CustomClient, options: ICommandOptions) {
    this.client = client;
    this.name = options.name;
    this.description = options.description;
    this.category = options.category;
    this.options = options.options;
    this.default_member_permissions = options.default_member_permissions;
    this.dm_permission = options.dm_permission;
    this.cooldown = options.cooldown;
    this.dev = options.dev;
    this.limitedServers = options.limitedServers;
  }

  abstract Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<'translation', undefined>
  ): Promise<void>;

  AutoComplete(interaction: AutocompleteInteraction): void {
    /* default no-op – can be overridden */
  }
}
