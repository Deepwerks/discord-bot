import { Events, ModalSubmitInteraction } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import IModalHandler from "../../base/interfaces/IModalHandler";

export default class ModalHandler extends Event implements IModalHandler {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "Modal handler event",
      once: false,
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return;

    // Handle the modal submission here
    const modalId = interaction.customId;

    // Example: Retrieve the corresponding handler based on the modalId
    const modalHandler = this.client.modals.get(modalId);
    if (!modalHandler) {
      console.error(`No modal handler found for ID: ${modalId}`);
      return;
    }

    try {
      await modalHandler.Execute(interaction);
    } catch (error) {
      console.error(`Error executing modal handler for ID: ${modalId}`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "An error occurred while processing the modal.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "An error occurred while processing the modal.",
          ephemeral: true,
        });
      }
    }
  }
}
