import { ModalSubmitInteraction } from 'discord.js';
import CustomClient from './CustomClient';

export default abstract class Modal {
  client: CustomClient;
  customId: string;
  description?: string;

  constructor(client: CustomClient, options: { customId: string; description?: string }) {
    this.client = client;
    this.customId = options.customId;
    this.description = options.description;
  }

  abstract Execute(interaction: ModalSubmitInteraction): Promise<any>;
}
