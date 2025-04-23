import { ModalSubmitInteraction } from "discord.js";

export default interface ModalHandler {
  Execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}
