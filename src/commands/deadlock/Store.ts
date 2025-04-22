import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
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
      options: [
        {
          name: "steam",
          description: "Your Steam name or ID (SteamID preferred)",
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
        throw new CommandError(t("errors.field_empty", { field: "Player" }));
      }

      let steamId: string | undefined;
      let steamIdType: "steamID3" | "steamID" | "steamID64" | null;

      if (isValidSteamId(player)) steamId = player;
      else {
        let _steamId = await useSteamClient.ProfileService.GetIdFromUsername(
          player
        );

        if (!_steamId || !isValidSteamId(_steamId))
          throw new CommandError(t("errors.steam_player_not_found"));

        steamId = _steamId;
      }

      steamIdType = getSteamIdType(steamId);
      if (!steamIdType) {
        throw new CommandError(t("errors.get_steam_id_type_failed"));
      }

      const steamProfile = await useSteamClient.ProfileService.FetchProfile({
        value: steamId,
        type: steamIdType,
      });

      if (!steamProfile) {
        throw new CommandError(t("errors.steam_profile_not_found"));
      }

      steamProfileCache.set(
        steamProfile.steamid,
        steamProfile as ICachedSteamProfile
      );

      await StoredPlayer.findOneAndUpdate(
        { discordId: interaction.user.id },
        {
          steamId: steamProfile.steamid,
          steamIdType: steamIdType,
        },
        { upsert: true }
      );

      await interaction.reply({
        embeds: [
          new EmbedBuilder().setColor("Green").setDescription(
            t("commands.store.success", {
              name: steamProfile.personaname,
              id: steamProfile.steamid,
            })
          ),
        ],
        flags: ["Ephemeral"],
      });
    } catch (error) {
      logger.error(error);

      if (error instanceof CommandError) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder().setColor("Red").setDescription(error.message),
          ],
          flags: ["Ephemeral"],
        });
      } else {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(t("errors.generic_error")),
          ],
          flags: ["Ephemeral"],
        });
      }
    }
  }
}
