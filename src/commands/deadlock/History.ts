import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import CommandError from "../../base/errors/CommandError";
import {
  logger,
  useAssetsClient,
  useDeadlockClient,
  useStatlockerClient,
} from "../..";
import { getFormattedMatchTime } from "../../services/utils/getFormattedMatchTime";
import pLimit from "p-limit";
import StoredPlayer from "../../base/schemas/StoredPlayerSchema";

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
      dev: false,
      options: [
        {
          name: "player",
          description:
            'Player\'s name or SteamID | Use "me" to get your match history!',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "private",
          description: "Only show result to you",
          required: false,
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    const player = interaction.options.getString("player");
    const ephemeral = interaction.options.getBoolean("private", false);

    let steamAuthNeeded: boolean = false;

    try {
      let _steamId = player;

      if (player === "me") {
        const storedPlayer = await StoredPlayer.findOne({
          discordId: interaction.user.id,
        });

        if (!storedPlayer)
          throw new CommandError(t("errors.steam_not_yet_stored"));
        steamAuthNeeded =
          storedPlayer.authenticated === undefined ||
          storedPlayer.authenticated === false;

        _steamId = storedPlayer.steamId;
      }

      const steamProfile =
        await useStatlockerClient.ProfileService.GetProfileCache(_steamId!);

      if (!steamProfile) {
        throw new CommandError(t("errors.steam_profile_not_found"));
      }

      const matches = await useDeadlockClient.PlayerService.GetMatchHistory(
        String(steamProfile.accountId),
        15
      );
      const mmrMatches = await useDeadlockClient.PlayerService.GetMMRHistory(
        String(steamProfile.accountId),
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
            const rank = (
              await useAssetsClient.DefaultService.GetRankName(
                mmrMatches.find((m) => m.match_id === match.match_id)?.rank
              )
            ).padEnd(15);
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

            const line = `${champion}${time}${rank}${matchId}${kda}${detailed}`;

            const prefix = match.match_result === match.player_team ? "+" : "-";
            return `${prefix}${line}`;
          })
        )
      );

      const header =
        "Character       ".padEnd(15) +
        "Time     ".padEnd(9) +
        "Rank       ".padEnd(15) +
        "Match ID     ".padEnd(13) +
        "KDA   ".padEnd(6) +
        "Detailed      ".padEnd(15);

      const response = `\`\`\`diff
${steamProfile.name}'s last ${matches.length} matches:

${header}
${matchesString.join("\n")}
      \`\`\``;

      await interaction.reply({
        content: response,
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTimestamp()
            .setFooter({ text: `PlayerID: ${steamProfile.accountId}` }),
        ],
        flags: ephemeral ? ["Ephemeral"] : [],
      });

      if (steamAuthNeeded) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle("⚠️ Steam Authentication Required")
          .setDescription(
            "Your Steam account is linked but not authenticated due to being connected using an outdated method.\n\n" +
              "This method will soon be deprecated. To ensure continued access to the `me` shortcut and related features, " +
              "please re-link your account using the `/store` command.\n\n" +
              "Thank you for your understanding!"
          );

        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
      }
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.name,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          error instanceof CommandError
            ? error.message
            : t("errors.generic_error")
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
