import { ChatInputCommandInteraction } from "discord.js";
import ISubCommand from "../interfaces/ISubCommand";
import CustomClient from "./CustomClient";
import ISubCommandOptions from "../interfaces/ISubCommandOptions";
import { TFunction } from "i18next";

export default abstract class SubCommand implements ISubCommand {
  client: CustomClient;
  name: string;

  constructor(client: CustomClient, options: ISubCommandOptions) {
    this.client = client;
    this.name = options.name;
  }

  abstract Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ): Promise<void>;
}
