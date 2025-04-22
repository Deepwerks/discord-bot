import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import Command from "../../base/classes/Command.";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import { isValidSteamId } from "../../services/utils/isValidSteamId";
import CommandError from "../../base/errors/CommandError";
import { useSteamClient } from "../..";
import { getSteamIdType } from "../../services/utils/getSteamIdType";
import logger from "../../services/logger";
import StoredPlayer from "../../base/schemas/StoredPlayerSchema";
import { steamProfileCache } from "../../services/cache";
import { ICachedSteamProfile } from "../../base/interfaces/ICachedSteamProfile";

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
      .setTitle("Submit Your Steam ID");

    const steamIdInput = new TextInputBuilder()
      .setCustomId("steam_id_input")
      .setLabel("Enter your Steam ID or Steam64 ID")
      .setPlaceholder("e.g., 76561198012345678")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      steamIdInput
    );
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  }
}
