import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import Command from "../../base/classes/Command.";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
export default class Store extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "store",
      description:
        "Store your Steam ID to enable the 'me' shortcut in certain commands!",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 30,
      dev: true,
      options: [],
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    const modal = new ModalBuilder()
      .setCustomId("submitSteamId")
      .setTitle("Submit Your Steam Profile");

    const steamIdInput = new TextInputBuilder()
      .setCustomId("steam_id_input")
      .setLabel("Enter your Steam profile URL")
      .setPlaceholder("e.g., https://steamcommunity.com/profiles/...")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      steamIdInput
    );
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  }
}
