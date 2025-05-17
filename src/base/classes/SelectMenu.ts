import {
  AutocompleteInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import CustomClient from "./CustomClient";
import { TFunction } from "i18next";
import ISelectMenu from "../interfaces/ISelectMenu";
import ISelectMenuOptions from "../interfaces/ISelectMenuOptions";

export default class SelectMenu implements ISelectMenu {
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

  async Execute(
    interaction: StringSelectMenuInteraction,
    t: TFunction<"translation", undefined>
  ) {}
  AutoComplete(interaction: AutocompleteInteraction): void {}
}
