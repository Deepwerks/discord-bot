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
import { isValidSteamId } from "../../services/utils/isValidSteamId";
import CommandError from "../../base/errors/CommandError";
import { useAssetsClient, useDeadlockClient, useSteamClient } from "../..";
import { getSteamIdType } from "../../services/utils/getSteamIdType";
import { getFormattedMatchTime } from "../../services/utils/getFormattedMatchTime";
import pLimit from "p-limit";
import logger from "../../services/logger";
import StoredPlayer from "../../base/schemas/StoredPlayer";

export default class History extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "history",
      description: "Get player's match history",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: false,
      cooldown: 6,
      dev: true,
      options: [
        {
          name: "player",
          description: "Player's name or SteamID",
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
    const player = interaction.options.getString("player");

    try {
      if (!player || player.length === 0) {
        throw new CommandError(t("errors.field_empty", { field: "Player" }));
      }

      let steamId: string | undefined;
      let steamIdType: "steamID3" | "steamID" | "steamID64" | null;

      let _steamId: string | null;
      if (player === "me") {
        const storedPlayer = await StoredPlayer.findOne({
          discordId: interaction.user.id,
        });

        if (!storedPlayer) {
          throw new CommandError(t("errors.steam_not_yet_stored"));
        }

        _steamId = storedPlayer.steamId;
        steamIdType = storedPlayer.steamIdType;

        steamId = _steamId;
      } else {
        if (isValidSteamId(player)) steamId = player;
        else {
          _steamId = await useSteamClient.ProfileService.GetIdFromUsername(
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
      }

      const steamProfile = await useSteamClient.ProfileService.GetPlayer({
        value: steamId!,
        type: steamIdType,
      });

      const matches = await useDeadlockClient.PlayerService.GetMatchHistory(
        steamId!,
        15
      );

      const limit = pLimit(10);

      const matchesString: string[] = await Promise.all(
        matches.map((match) =>
          limit(async () => {
            const heroName = (
              await useAssetsClient.HeroService.GetHero(match.hero_id)
            ).name;
            const champion = heroName.padEnd(15);
            const time = getFormattedMatchTime(match.match_duration_s).padEnd(
              9
            );
            const mode = "Ranked".padEnd(9);
            const matchId = match.match_id.toString().padEnd(13);
            const kdaValue = (
              (match.player_kills + match.player_assists) /
              Math.max(1, match.player_deaths)
            ).toFixed(2);
            const kda = kdaValue.padEnd(6);
            const detailed =
              `(${match.player_kills}/${match.player_deaths}/${match.player_assists})`.padEnd(
                15
              );

            const line = `${champion}${time}${mode}${matchId}${kda}${detailed}`;

            const prefix = match.match_result === match.player_team ? "+" : "-";
            return `${prefix}${line}`;
          })
        )
      );

      const header =
        "Champion        ".padEnd(15) +
        "Time     ".padEnd(9) +
        "Mode     ".padEnd(9) +
        "Match ID     ".padEnd(13) +
        "KDA   ".padEnd(6) +
        "Detailed      ".padEnd(15);

      const response = `\`\`\`diff
${steamProfile.personaname}'s last ${matches.length} matches:

${header}
${matchesString.join("\n")}
      \`\`\``;

      await interaction.reply({ content: response });
    } catch (error) {
      logger.error(error);

      if (error instanceof CommandError) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder().setColor("Red").setDescription(error.message),
          ],
          flags: ["Ephemeral"],
        });

        return;
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(t("commands.match.fetch_failed")),
        ],
        flags: ["Ephemeral"],
      });
    }
  }
}
