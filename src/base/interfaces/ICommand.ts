import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import CustomClient from "../classes/CustomClient";
import Category from "../enums/Category";
import { TFunction } from "i18next";

export default interface ICommand {
  client: CustomClient;
  name: string;
  description: string;
  category: Category;
  options: object;
  default_member_permissions: bigint;
  dm_permission: boolean;
  cooldown: number;
  dev: boolean;

  Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ): void;
  AutoComplete(interaction: AutocompleteInteraction): void;
}
