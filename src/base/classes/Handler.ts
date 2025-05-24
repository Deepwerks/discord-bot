import IHandler from '../interfaces/IHandler';
import path from 'path';
import { glob } from 'glob';
import CustomClient from './CustomClient';
import Event from './Event';
import Command from './Command';
import SubCommand from './SubCommand';
import Modal from './CustomModal';
import { logger } from '../..';
import ButtonAction from './ButtonAction';
import SelectMenu from './SelectMenu';

export default class Handler implements IHandler {
  client: CustomClient;

  constructor(client: CustomClient) {
    this.client = client;
  }

  async LoadEvents() {
    const files = (await glob('build/events/**/*.js')).map((filePath: string) =>
      path.resolve(filePath)
    );

    files.map(async (file: string) => {
      const event: Event = new (await import(file)).default(this.client);

      if (!event.name)
        return (
          delete require.cache[require.resolve(file)] &&
          logger.info(`${file.split('/').pop()} does not have a name.`)
        );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const execute = (...args: any) => event.Execute(...args);

      //@ts-expect-error DISCORD-JS-TYPE
      if (event.once) this.client.once(event.name, execute);
      //@ts-expect-error DISCORD-JS-TYPE
      else this.client.on(event.name, execute);

      return delete require.cache[require.resolve(file)];
    });
  }

  async LoadCommands() {
    const files = (await glob('build/commands/**/*.js')).map((filePath: string) =>
      path.resolve(filePath)
    );

    files.map(async (file: string) => {
      const command: Command | SubCommand = new (await import(file)).default(this.client);

      if (!command.name)
        return (
          delete require.cache[require.resolve(file)] &&
          logger.info(`${file.split('/').pop()} does not have a name.`)
        );

      if (file.split('/').pop()?.split('.')[2]) {
        return this.client.subCommands.set(command.name, command);
      }

      this.client.commands.set(command.name, command as Command);

      return delete require.cache[require.resolve(file)];
    });
  }

  async LoadButtonActions() {
    const files = (await glob('build/buttonActions/**/*.js')).map((filePath: string) =>
      path.resolve(filePath)
    );

    files.map(async (file: string) => {
      const buttonAction: ButtonAction = new (await import(file)).default(this.client);

      if (!buttonAction.customId)
        return (
          delete require.cache[require.resolve(file)] &&
          logger.info(`${file.split('/').pop()} does not have an id.`)
        );

      this.client.buttons.set(buttonAction.customId, buttonAction as ButtonAction);

      return delete require.cache[require.resolve(file)];
    });
  }

  async LoadModals() {
    const files = (await glob('build/modals/**/*.js')).map((filePath: string) =>
      path.resolve(filePath)
    );

    files.map(async (file: string) => {
      const ModalClass = (await import(file)).default;
      const modal: Modal = new ModalClass(this.client);

      if (!modal.customId || typeof modal.Execute !== 'function') {
        logger.warn(`${file.split('/').pop()} is missing customId or Execute.`);
        return delete require.cache[require.resolve(file)];
      }

      this.client.modals.set(modal.customId, modal);
      return delete require.cache[require.resolve(file)];
    });
  }

  async LoadSelectMenus() {
    const files = (await glob('build/selectMenus/**/*.js')).map((filePath: string) =>
      path.resolve(filePath)
    );

    files.map(async (file: string) => {
      const SelectMenuClass = (await import(file)).default;
      const selectMenu: SelectMenu = new SelectMenuClass(this.client);

      if (!selectMenu.customId || typeof selectMenu.Execute !== 'function') {
        logger.warn(`${file.split('/').pop()} is missing customId or Execute.`);
        return delete require.cache[require.resolve(file)];
      }

      this.client.selectMenus.set(selectMenu.customId, selectMenu);
      return delete require.cache[require.resolve(file)];
    });
  }
}
