import { AutocompleteInteraction, ButtonInteraction } from "discord.js";
import CustomClient from "../classes/CustomClient";
import { TFunction } from "i18next";

export default interface IButtonAction {
  client: CustomClient;
  customId: string;
  description: string;
  cooldown: number;

  Execute(
    interaction: ButtonInteraction,
    t: TFunction<"translation", undefined>
  ): Promise<void>;
  AutoComplete(interaction: AutocompleteInteraction): void;
}
