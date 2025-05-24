import { Collection } from 'discord.js';
import IConfig from './IConfig';
import Command from '../classes/Command';
import SubCommand from '../classes/SubCommand';
import IModalHandler from './IModalHandler';
import ButtonAction from '../classes/ButtonAction';
import SelectMenu from '../classes/SelectMenu';

export default interface ICustomClient {
  config: IConfig;
  commands: Collection<string, Command>;
  subCommands: Collection<string, SubCommand>;
  buttons: Collection<string, ButtonAction>;
  modals: Collection<string, IModalHandler>;
  selectMenus: Collection<string, SelectMenu>;
  cooldowns: Collection<string, Collection<string, number>>;
  developmentMode: boolean;

  Init(): void;
  LoadHandlers(): void;
  LoadCache(): Promise<void>;
}
