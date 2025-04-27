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
import { useDeadlockClient, useStatlockerClient } from "../..";
import logger from "../../services/logger";
import StoredPlayer from "../../base/schemas/StoredPlayerSchema";
import { findHeroByName } from "../../services/utils/findHeroByName";

export default class Stats extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "stats",
      description: "Get player's overall statistics",
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
          name: "hero_name",
          description: "If given, returns the player's stats on the given hero",
          required: false,
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

    const HeroSpecificStats: Record<string, string[]> = {
      "Grey Talon": ["max_guided_owl_stacks", "max_spirit_snare_stacks"],
      Bebop: ["max_bomb_stacks"],
      "Mo & Krill": ["max_bonus_health_per_kill"],
    };

    try {
      await interaction.deferReply();
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
      const heroName = interaction.options.getString("hero_name", false);

      const hero = findHeroByName(heroName ?? "");

      if (heroName && !hero) {
        throw new CommandError(`Hero not found: ${heroName}`);
      }

      const globalStats = [
        "total_kd",
        "total_matches",
        "total_wins",
        "total_losses",
      ];

      const additionalStats = [
        "total_winrate",
        "hours_played",
        "most_played_hero",
      ];

      const heroStats = heroName
        ? [
            "hero_kd",
            "hero_matches",
            "hero_wins",
            "hero_losses",
            "hero_winrate",
            "hero_hours_played",
          ]
        : [];

      const heroSpecificStats = heroName
        ? HeroSpecificStats[hero!.name] || []
        : [];

      const stats = await useDeadlockClient.PlayerService.GetStats(
        accountId.toString(),
        hero?.name || "",
        [...globalStats, ...additionalStats, ...heroStats, ...heroSpecificStats]
      );

      const globalStatBlock = formatStatsBlock(stats, globalStats);
      const additionalStatBlock = formatStatsBlock(stats, additionalStats);
      const heroStatBlock =
        heroStats.length > 0 ? formatStatsBlock(stats, heroStats) : "";
      const heroSpecificStatBlock = formatStatsBlock(stats, heroSpecificStats);

      const description = `
        ${
          !heroName
            ? `\`\`\`Predicted Rank: ${steamProfile.performanceRankMessage}\`\`\` \nGlobal Stats ${globalStatBlock}  \nAdditional Stats ${additionalStatBlock}`
            : `Stats on ${hero?.name} ${heroStatBlock} ${
                heroSpecificStats.length
                  ? `\nHero Specific Stats ${heroSpecificStatBlock}`
                  : ``
              } \nGlobal Stats ${globalStatBlock}`
        }
      `;

      const embed = new EmbedBuilder()
        .setColor(heroName ? 0x00ae86 : 0x7289da)
        .setThumbnail(
          heroName ? hero!.images.minimap_image : steamProfile.avatarUrl
        )
        .setTitle(`${steamProfile.name}'s stats`)
        .setURL(`https://statlocker.gg/profile/${steamProfile.accountId}`)
        .setDescription(description)
        .setTimestamp()
        .setFooter({
          text: "DeadlockAssistant",
          iconURL: this.client.user!.displayAvatarURL(),
        });

      await interaction.editReply({ embeds: [embed] });
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

function formatStatsBlock(
  stats: Record<string, any>,
  fields: string[]
): string {
  return (
    "```\n" +
    fields
      .map((field) => `${formatFieldName(field)}: ${stats[field] ?? "N/A"}`)
      .join("\n") +
    "\n```"
  );
}

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, " ") // replace underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
}
