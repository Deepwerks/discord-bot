import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  PermissionsBitField,
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
import StoredPlayer from "../../base/schemas/StoredPlayer";

export default class Store extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "store",
      description: "Store your SteamID",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: false,
      cooldown: 1,
      dev: true,
      options: [
        {
          name: "steam",
          description: "Your name SteamID (steamID prefered)",
          required: true,
          type: ApplicationCommandOptionType.String,
        },
      ],
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    const player = interaction.options.getString("steam");

    try {
      if (!player || player.length === 0) {
        throw new CommandError("Player must not be empty");
      }

      let steamId: string | undefined;
      let steamIdType: "steamID3" | "steamID" | "steamID64" | null;

      if (isValidSteamId(player)) steamId = player;
      else {
        let _steamId = await useSteamClient.ProfileService.GetIdFromUsername(
          player
        );

        if (!_steamId || !isValidSteamId(_steamId))
          throw new CommandError(
            "Player not found. Try using SteamID instead!"
          );

        steamId = _steamId;
      }

      steamIdType = getSteamIdType(steamId);
      if (!steamIdType) {
        throw new CommandError("Could not detemine steam id type");
      }

      const steamProfile = await useSteamClient.ProfileService.GetPlayer({
        value: steamId,
        type: steamIdType,
      });

      if (!steamProfile) {
        throw new CommandError("Could not find steam idprofile");
      }

      await StoredPlayer.findOneAndUpdate(
        { discordId: interaction.user.id },
        {
          steamId: steamProfile.steamid,
          steamIdType: steamIdType,
        },
        { upsert: true }
      );

      await interaction.reply({
        content: `You have successfuly set your steam accout to: ${steamProfile.personaname} (${steamProfile.steamid})`,
        flags: ["Ephemeral"],
      });
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: "Something went wrong",
      });
    }
  }
}
