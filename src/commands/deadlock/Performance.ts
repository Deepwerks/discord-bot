import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  escapeMarkdown,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import CommandError from '../../base/errors/CommandError';
import { logger, useDeadlockClient } from '../..';

import PerformanceTagService, {
  IPerformanceTag,
} from '../../services/calculators/PerformanceTagService';
import getProfile from '../../services/database/repository';

const safeAvg = (arr: number[]) =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
const formatTags = (tags: IPerformanceTag[]) =>
  tags.map((tag) => '`' + tag.name.replace(' ', '\u00A0') + '`').join('    ');

export default class Performance extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'performance',
      description: "Get player's recent match performance",
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 8,
      dev: false,
      options: [
        {
          name: 'player',
          description: 'Player\'s SteamID | Use "me" to get your match history!',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: 'private',
          description: 'Only show result to you',
          required: false,
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const player = interaction.options.getString('player', true);
    const ephemeral = interaction.options.getBoolean('private', false);
    const matchHistoryLimit = 100;

    await interaction.deferReply({ flags: ephemeral ? ['Ephemeral'] : [] });

    try {
      const { steamProfile, steamAuthNeeded } = await getProfile(player, interaction.user.id, t);

      const matches = await useDeadlockClient.PlayerService.fetchMatchHistory(
        steamProfile.accountId,
        matchHistoryLimit
      );
      if (matches.length === 0) {
        throw new CommandError(
          t('commands.performance.no_matches_found', {
            id: steamProfile.accountId,
          })
        );
      }

      const performanceService = new PerformanceTagService(matches);
      const tags = performanceService.getMatchingTags();

      const winRate =
        (matches.filter((m) => m.matchResult === m.playerTeam).length / matches.length) * 100;
      const avg = (key: keyof (typeof matches)[0]) => safeAvg(matches.map((m) => m[key] as number));

      const avgDeaths = avg('playerDeaths');
      const avgKills = avg('playerKills');
      const avgAssists = avg('playerAssists');

      const heroCounts = new Map<number, number>();
      matches.forEach((m) => heroCounts.set(m.heroId, (heroCounts.get(m.heroId) || 0) + 1));

      const avgDurationMin = avg('matchDurationS') / 60;

      let bestMatchIndex = 0;
      let worstMatchIndex = 0;
      let bestKda = -Infinity;
      let worstKda = Infinity;

      matches.forEach((match, i) => {
        const kda = match.playerKills + match.playerAssists - match.playerDeaths;
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
      const durationSec = (avg('matchDurationS') % 60).toFixed(0);

      const embed = new EmbedBuilder()
        .setColor('#2f3136')
        .setTitle(t('commands.performance.title'))
        .setDescription(
          t('commands.performance.description', {
            name: escapeMarkdown(steamProfile.name || 'Player'),
            id: steamProfile.accountId,
            count: matches.length,
          })
        )
        .setThumbnail(steamProfile.avatarUrl)
        .addFields(
          {
            name: t('commands.performance.tags_label'),
            value: formatTags(tags),
            inline: false,
          },
          { name: '\u200b', value: '\u200b', inline: false },
          {
            name: t('commands.performance.win_rate'),
            value: `${winRate.toFixed(1)}%`,
            inline: true,
          },
          {
            name: t('commands.performance.avg_kda'),
            value: `${avgKills.toFixed(1)} / ${avgDeaths.toFixed(1)} / ${avgAssists.toFixed(1)}`,
            inline: true,
          },
          { name: '\u200b', value: '\u200b', inline: false },
          {
            name: t('commands.performance.avg_net_worth'),
            value: `${Math.round(avg('netWorth'))}`,
            inline: true,
          },
          {
            name: t('commands.performance.avg_match_duration'),
            value: `${durationMin}m ${durationSec}s`,
            inline: true,
          },
          { name: '\u200b', value: '\u200b', inline: false },
          {
            name: t('commands.performance.best_kda'),
            value: `${bestMatch.playerKills} / ${bestMatch.playerDeaths} / ${
              bestMatch.playerAssists
            }\nMatch ID: ${bestMatch.matchId}\n${
              bestMatchIndex === 0
                ? t('commands.performance.latest_match')
                : t('commands.performance.matches_ago', {
                    count: bestMatchIndex + 1,
                  })
            }`,
            inline: true,
          },
          {
            name: t('commands.performance.worst_kda'),
            value: `${worstMatch.playerKills} / ${
              worstMatch.playerDeaths
            } / ${worstMatch.playerAssists}\nMatch ID: ${worstMatch.matchId}\n${
              worstMatchIndex === 0
                ? t('commands.performance.latest_match')
                : t('commands.performance.matches_ago', {
                    count: worstMatchIndex + 1,
                  })
            }`,
            inline: true,
          }
        )
        .setFooter({ text: `Player ID: ${steamProfile.accountId}` })
        .setTimestamp();

      const showTagsButton = new ButtonBuilder()
        .setLabel(t('commands.performance.show_tag_descriptions'))
        .setStyle(ButtonStyle.Primary)
        .setCustomId('show_performance_tags')
        .setEmoji('🏷️');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(showTagsButton);

      await interaction.editReply({ embeds: [embed], components: [row] });

      if (steamAuthNeeded) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(t('commands.performance.steam_auth_required_title'))
          .setDescription(t('commands.performance.steam_auth_required_description'));

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
        .setColor('Red')
        .setDescription(error instanceof CommandError ? error.message : t('errors.generic_error'));

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
