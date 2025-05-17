import {
  AutocompleteInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import CustomClient from "../classes/CustomClient";
import { TFunction } from "i18next";

export default interface ISelectMenu {
  client: CustomClient;
  customId: string;
  description: string;
  cooldown: number;

  Execute(
    interaction: StringSelectMenuInteraction,
    t: TFunction<"translation", undefined>
  ): Promise<void>;
  AutoComplete(interaction: AutocompleteInteraction): void;
}
