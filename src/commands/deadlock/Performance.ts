import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import CommandError from "../../base/errors/CommandError";
import { logger, useDeadlockClient, useStatlockerClient } from "../..";
import StoredPlayer from "../../base/schemas/StoredPlayerSchema";

enum TagType {
  Positive = "positive",
  Negative = "negative",
  Neutral = "neutral",
}

type Tag = {
  label: string;
  type: TagType;
};

const THRESHOLDS = {
  kdaStdDev: 3.0,
  feederDeaths: 10,
  hardCarryKills: 10,
  hardCarryWinRate: 60,
  supportAssists: 15,
  supportKillsCap: 4,
  durableDeathsCap: 5,
  longMatchDurationMin: 40,
  shortMatchDurationMin: 25,
};

const calculateKDA = (m: any) =>
  (m.player_kills + m.player_assists) / Math.max(1, m.player_deaths);
const safeAvg = (arr: number[]) =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
const formatTags = (tags: Tag[]) =>
  tags.map((tag) => "`" + tag.label.replace(" ", "\u00A0") + "`").join("    ");

export default class Performance extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "performance",
      description: "Get player's recent match performance",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 8,
      dev: false,
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
    const matchHistoryLimit = 100;

    await interaction.deferReply();

    try {
      let steamId = player;

      if (player === "me") {
        const storedPlayer = await StoredPlayer.findOne({
          discordId: interaction.user.id,
        });
        if (!storedPlayer)
          throw new CommandError(t("errors.steam_not_yet_stored"));
        steamId = storedPlayer.steamId;
      }

      const steamProfile =
        await useStatlockerClient.ProfileService.GetProfileCache(steamId!);
      if (!steamProfile)
        throw new CommandError(t("errors.steam_profile_not_found"));

      const matches = await useDeadlockClient.PlayerService.GetMatchHistory(
        String(steamProfile.accountId),
        matchHistoryLimit
      );
      if (matches.length === 0) {
        await interaction.editReply(
          `❌ No matches found for player ID ${steamProfile.accountId}.`
        );
        return;
      }

      const kdas = matches.map(calculateKDA);
      const kdaAvg = safeAvg(kdas);
      const kdaStdDev = Math.sqrt(
        kdas.reduce((a, b) => a + Math.pow(b - kdaAvg, 2), 0) / kdas.length
      );

      const winRate =
        (matches.filter((m) => m.match_result === m.player_team).length /
          matches.length) *
        100;
      const avg = (key: keyof (typeof matches)[0]) =>
        safeAvg(matches.map((m) => m[key] as number));

      const avgDeaths = avg("player_deaths");
      const avgKills = avg("player_kills");
      const avgAssists = avg("player_assists");

      const heroCounts = new Map<number, number>();
      matches.forEach((m) =>
        heroCounts.set(m.hero_id, (heroCounts.get(m.hero_id) || 0) + 1)
      );

      const mostPlayed = [...heroCounts.entries()].sort((a, b) => b[1] - a[1]);
      const mostPlayedCount = mostPlayed[0][1];
      const flex = heroCounts.size >= 10;
      const oneTrick = mostPlayedCount / matches.length > 0.6;

      const recentResults = matches.slice(0, 5);
      const recentKdas = recentResults.map(calculateKDA);
      const recentWinCount = recentResults.filter(
        (m) => m.match_result === m.player_team
      ).length;
      const recentLossCount = recentResults.filter(
        (m) => m.match_result !== m.player_team
      ).length;
      const recentKdaAvg = safeAvg(recentKdas);

      const tags: Tag[] = [];
      if (flex && !oneTrick)
        tags.push({ label: "🎭 Flex", type: TagType.Positive });
      if (oneTrick && !flex)
        tags.push({ label: "🎯 One Trick Pony", type: TagType.Negative });
      if (oneTrick && flex)
        tags.push({ label: "🌀 Rerolling Identity", type: TagType.Negative });

      if (kdaStdDev > THRESHOLDS.kdaStdDev)
        tags.push({ label: "📉 Inconsistent", type: TagType.Negative });
      if (avgDeaths > THRESHOLDS.feederDeaths)
        tags.push({ label: "⚰️ Feeder", type: TagType.Negative });
      if (
        avgKills > THRESHOLDS.hardCarryKills &&
        winRate > THRESHOLDS.hardCarryWinRate
      )
        tags.push({ label: "🔥 Hard Carry", type: TagType.Positive });
      if (
        avgAssists > THRESHOLDS.supportAssists &&
        avgKills < THRESHOLDS.supportKillsCap
      )
        tags.push({ label: "🧱 Supportive", type: TagType.Neutral });
      if (avgDeaths < THRESHOLDS.durableDeathsCap)
        tags.push({ label: "🛡️ Durable", type: TagType.Positive });

      const avgDurationMin = avg("match_duration_s") / 60;
      if (avgDurationMin > THRESHOLDS.longMatchDurationMin)
        tags.push({ label: "⏳ Long Games", type: TagType.Neutral });
      if (avgDurationMin < THRESHOLDS.shortMatchDurationMin)
        tags.push({ label: "🏃 Speedrunner", type: TagType.Positive });

      if (recentWinCount >= 5)
        tags.push({ label: "🏅 On a Winstreak", type: TagType.Positive });
      if (recentLossCount >= 5)
        tags.push({ label: "😓 Red carpet", type: TagType.Negative });
      if (recentWinCount >= 3 && recentKdaAvg > 4)
        tags.push({ label: "☀️ Peaking", type: TagType.Positive });
      if (recentLossCount >= 3 && recentKdaAvg < 2)
        tags.push({ label: "🧊 Ice Cold", type: TagType.Negative });

      const isClimbing = recentKdas.every(
        (kda, i, arr) => i === 0 || kda >= arr[i - 1]
      );
      const isSlumping = recentKdas.every(
        (kda, i, arr) => i === 0 || kda <= arr[i - 1]
      );
      if (isClimbing && new Set(recentKdas).size > 1)
        tags.push({ label: "📈 Climbing", type: TagType.Positive });
      if (isSlumping && new Set(recentKdas).size > 1)
        tags.push({ label: "🌀 Slumping", type: TagType.Negative });

      if (tags.length === 0)
        tags.push({ label: "🎲 Wildcard", type: TagType.Neutral });

      let bestMatchIndex = 0;
      let worstMatchIndex = 0;
      let bestKda = -Infinity;
      let worstKda = Infinity;

      matches.forEach((match, i) => {
        const kda =
          match.player_kills + match.player_assists - match.player_deaths;
        if (kda > bestKda) {
          bestKda = kda;
          bestMatchIndex = i;
        }
        if (kda < worstKda) {
          worstKda = kda;
          worstMatchIndex = i;
        }
      });

      const bestMatch = matches[bestMatchIndex];
      const worstMatch = matches[worstMatchIndex];
      const durationMin = avgDurationMin.toFixed(0);
      const durationSec = (avg("match_duration_s") % 60).toFixed(0);

      const embed = new EmbedBuilder()
        .setColor("#2f3136")
        .setTitle(`📊 Player Performance Summary`)
        .setDescription(
          `Recent match performance for **${
            steamProfile.name || "Player"
          }** (last ${matches.length} matches)`
        )
        .setThumbnail(steamProfile.avatarUrl)
        .addFields(
          { name: "🏷️ Tags", value: formatTags(tags), inline: false },
          { name: "\u200b", value: "\u200b", inline: false },
          {
            name: "🏆 Win Rate",
            value: `${winRate.toFixed(1)}%`,
            inline: true,
          },
          {
            name: "⚔️ Avg K/D/A",
            value: `${avgKills.toFixed(1)} / ${avgDeaths.toFixed(
              1
            )} / ${avgAssists.toFixed(1)}`,
            inline: true,
          },
          { name: "\u200b", value: "\u200b", inline: false },
          {
            name: "💰 Avg Net Worth",
            value: `${Math.round(avg("net_worth"))}`,
            inline: true,
          },
          {
            name: "🕒 Avg Match Duration",
            value: `${durationMin}m ${durationSec}s`,
            inline: true,
          },
          { name: "\u200b", value: "\u200b", inline: false },
          {
            name: "🧟 Best KDA Match",
            value: `${bestMatch.player_kills} / ${bestMatch.player_deaths} / ${
              bestMatch.player_assists
            }\nMatch ID: ${bestMatch.match_id}\n${
              bestMatchIndex === 0
                ? "Latest Match"
                : `${bestMatchIndex + 1} matches ago`
            }`,
            inline: true,
          },
          {
            name: "💀 Worst KDA Match",
            value: `${worstMatch.player_kills} / ${
              worstMatch.player_deaths
            } / ${worstMatch.player_assists}\nMatch ID: ${
              worstMatch.match_id
            }\n${
              worstMatchIndex === 0
                ? "Latest Match"
                : `${worstMatchIndex + 1} matches ago`
            }`,
            inline: true,
          }
        )
        .setFooter({ text: `Player ID: ${steamProfile.accountId}` })
        .setTimestamp();

      const showTagsButton = new ButtonBuilder()
        .setLabel("Show Tag Descriptions")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("show_performance_tags")
        .setEmoji("🏷️");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        showTagsButton
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        command: "performance",
      });

      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          error instanceof CommandError
            ? error.message
            : t("commands.match.fetch_failed")
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
