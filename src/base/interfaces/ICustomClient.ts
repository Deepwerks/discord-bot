import { Collection } from "discord.js";
import IConfig from "./IConfig";
import Command from "../classes/Command.";
import SubCommand from "../classes/SubCommand";
import IModalHandler from "./IModalHandler";

export default interface ICustomClient {
  config: IConfig;
  commands: Collection<string, Command>;
  subCommands: Collection<string, SubCommand>;
  modals: Collection<string, IModalHandler>;
  cooldowns: Collection<string, Collection<string, number>>;
  developmentMode: boolean;

  Init(): void;
  LoadHandlers(): void;
}
