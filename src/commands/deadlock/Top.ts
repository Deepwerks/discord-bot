import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { t, TFunction } from "i18next";
import CommandError from "../../base/errors/CommandError";
import {
  logger,
  useAssetsClient,
  useDeadlockClient,
  useStatlockerClient,
} from "../..";
import StoredPlayer from "../../base/schemas/StoredPlayerSchema";
import HeroStats from "../../services/clients/DeadlockClient/DeadlockPlayerService/entities/HeroStats";

const calculateKDA = (m: HeroStats) =>
  (m.kills + m.assists) / Math.max(1, m.deaths);
const calculateWinRate = (m: HeroStats) =>
  (m.wins / Math.max(1, m.matches_played)) * 100;

export default class Top extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "top",
      description: "Retrieves a list of hero stats for the specified player",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 6,
      dev: false,
      options: [
        {
          name: "player",
          description:
            'Player\'s name or SteamID | Use "me" to get your statistics!',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "sort_by",
          description: "Sort by this stat",
          required: false,
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "KDA",
              value: "kda",
            },
            {
              name: "Win Rate",
              value: "winrate",
            },
            {
              name: "Matches Played",
              value: "matches",
            },
            {
              name: "Denies per match",
              value: "denies_per_match",
            },
            {
              name: "Souls per min",
              value: "networth_per_min",
            },
          ],
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
    const player = interaction.options.getString("player", true);
    let sortBy = interaction.options.getString("sort_by", false);
    const ephemeral = interaction.options.getBoolean("private", false);

    if (!sortBy) sortBy = "kda";

    try {
      await interaction.deferReply({ flags: ephemeral ? ["Ephemeral"] : [] });
      let _steamId = player;

      if (player === "me") {
        const storedPlayer = await StoredPlayer.findOne({
          discordId: interaction.user.id,
        });

        if (!storedPlayer)
          throw new CommandError(t("errors.steam_not_yet_stored"));

        _steamId = storedPlayer.steamId;
      }

      const steamProfile =
        await useStatlockerClient.ProfileService.GetProfileCache(_steamId!);

      if (!steamProfile) {
        throw new CommandError(t("errors.steam_profile_not_found"));
      }

      const accountId = steamProfile.accountId;

      const stats = await useDeadlockClient.PlayerService.GetHeroStats(
        String(accountId)
      );

      if (!stats || !Array.isArray(stats) || stats.length === 0) {
        throw new CommandError(t("errors.no_stats_found"));
      }

      const sortedStats = stats.sort((a, b) => {
        if (sortBy === "kda") {
          return calculateKDA(b) - calculateKDA(a);
        } else if (sortBy === "winrate") {
          return calculateWinRate(b) - calculateWinRate(a);
        } else if (sortBy === "matches") {
          return b.matches_played - a.matches_played;
        } else if (sortBy === "denies_per_match") {
          return b.denies_per_match - a.denies_per_match;
        } else if (sortBy === "networth_per_min") {
          return b.networth_per_min - a.networth_per_min;
        }
        return 0;
      });

      const embeds = await createHeroStatsEmbeds(
        sortedStats,
        steamProfile.name,
        String(steamProfile.accountId),
        sortBy
      );

      interaction.editReply({
        embeds,
      });
    } catch (error) {
      logger.error(error);

      if (error instanceof CommandError) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor("Red").setDescription(error.message),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(t("errors.generic_error")),
          ],
        });
      }
    }
  }
}

async function createHeroStatsEmbeds(
  stats: HeroStats[],
  playerName: string,
  playerId: string,
  sort_by: string
) {
  const embeds: EmbedBuilder[] = [];
  const chunkSize = 10;

  for (let i = 0; i < stats.length; i += chunkSize) {
    const chunk = stats.slice(i, i + chunkSize);
    const embed = new EmbedBuilder().setColor(0x3498db);

    if (i === 0) {
      embed.setTitle(
        `Hero Stats for **${playerName}** sorted by **${sort_by}**`
      );
    }
    if (i + chunkSize >= stats.length) {
      embed.setTimestamp();
      embed.setFooter({
        text: `Player ID: ${playerId}`,
      });
    }

    let description = "```";
    description += `#   Hero             KDA    Win%   Match  Deny   Souls/M\n`;
    description += `--------------------------------------------------------\n`;

    for (let j = 0; j < chunk.length; j++) {
      const index = i + j + 1;
      const stat = chunk[j];

      const name = (
        await useAssetsClient.HeroService.GetHeroCached(stat.hero_id)
      )?.name.padEnd(17);
      const kda = calculateKDA(stat).toFixed(2).padEnd(7);
      const winrate = `${calculateWinRate(stat).toFixed(0)}%`.padEnd(7);
      const matches = stat.matches_played.toString().padEnd(7);
      const denies = stat.denies_per_match.toFixed(2).padEnd(7);
      const networth = stat.networth_per_min.toFixed(1).padEnd(8);

      description += `${(index + ".").padEnd(
        4
      )}${name}${kda}${winrate}${matches}${denies}${networth}\n`;
    }

    description += "```";

    embed.setDescription(description);
    embeds.push(embed);
  }

  return embeds;
}
