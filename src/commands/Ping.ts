import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from "discord.js";
import Command from "../base/classes/Command.";
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
    const sent = await interaction.reply({
      content: "Pinging...",
      withResponse: true,
    });

    interaction.editReply(
      `Pong! 🏓 \n \`Latency: ${
        Date.now() - sent.interaction.createdTimestamp
      }ms\` \n \`API Latency: ${Math.round(this.client.ws.ping)}ms\``
    );
  }
}
