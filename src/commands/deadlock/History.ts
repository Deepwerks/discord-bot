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
import CommandError from "../../base/errors/CommandError";
import { useAssetsClient, useDeadlockClient, useSteamClient } from "../..";
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
      dm_permission: true,
      cooldown: 3,
      dev: true,
      options: [
        {
          name: "player",
          description:
            'Player\'s name or SteamID | Use "me" to get your match history!',
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
    const startTime = performance.now();

    try {
      let _steamId = player;

      if (player === "me") {
        const storedPlayer = await StoredPlayer.findOne({
          discordId: interaction.user.id,
        });

        if (!storedPlayer)
          throw new CommandError(t("errors.steam_not_yet_stored"));

        _steamId = storedPlayer.steamId;
      }

      const steamProfile = await useSteamClient.ProfileService.GetProfileCached(
        _steamId
      );

      if (!steamProfile) {
        throw new CommandError(t("errors.steam_profile_not_found"));
      }

      const matches = await useDeadlockClient.PlayerService.GetMatchHistory(
        steamProfile.steamid,
        15
      );

      const limit = pLimit(10);

      const matchesString: string[] = await Promise.all(
        matches.map((match) =>
          limit(async () => {
            const heroName = (await useAssetsClient.HeroService.GetHeroCached(
              match.hero_id
            ))!.name;
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

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      await interaction.reply({
        content: response,
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTimestamp()
            .setFooter({ text: `Generated in: ${duration} ms` }),
        ],
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
              .setDescription(t("commands.match.fetch_failed")),
          ],
          flags: ["Ephemeral"],
        });
      }
    }
  }
}
