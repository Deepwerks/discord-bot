import {
  AutocompleteInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import CustomClient from "./CustomClient";
import { TFunction } from "i18next";
import ISelectMenu from "../interfaces/ISelectMenu";
import ISelectMenuOptions from "../interfaces/ISelectMenuOptions";

export default abstract class SelectMenu implements ISelectMenu {
  client: CustomClient;
  customId: string;
  description: string;
  cooldown: number;

  constructor(client: CustomClient, options: ISelectMenuOptions) {
    this.client = client;
    this.customId = options.customId;
    this.description = options.description;
    this.cooldown = options.cooldown;
  }

  abstract Execute(
    interaction: StringSelectMenuInteraction,
    t: TFunction<"translation", undefined>
  ): Promise<void>;

  AutoComplete(_interaction: AutocompleteInteraction): Promise<void> | void {
    /* default no-op – can be overridden */
  }
}
