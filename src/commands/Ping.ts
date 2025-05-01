import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import Command from "../base/classes/Command";
import CustomClient from "../base/classes/CustomClient";
import Category from "../base/enums/Category";

export default class Ping extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "ping",
      description: "Pong! 🏓",
      category: Category.Utilities,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction) {
    const startTime = performance.now();

    await interaction.reply({
      content: "Pinging...",
      withResponse: true,
    });

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    await interaction.editReply(
      `Pong! 🏓 \n \`Latency: ${duration}ms\` \n \`API Latency: ${Math.round(
        this.client.ws.ping
      )}ms\``
    );
  }
}
