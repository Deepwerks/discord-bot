import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Events,
  Guild,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command.";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";

export default class Emit extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "emit",
      description: "Emit an event",
      category: Category.Developer,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 1,
      dev: true,
      options: [
        {
          name: "event",
          description: "The event to emit",
          required: true,
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "GuildCreate",
              value: Events.GuildCreate,
            },
            {
              name: "GuildDelete",
              value: Events.GuildDelete,
            },
          ],
        },
      ],
    });
  }

  Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ): void {
    const event = interaction.options.getString("event");

    if (event == Events.GuildCreate || event == Events.GuildDelete) {
      this.client.emit(event, interaction.guild as Guild);
    }

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(t("commands.emit.success", { event })),
      ],
      flags: ["Ephemeral"],
    });
  }
}
