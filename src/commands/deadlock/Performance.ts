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
import { logger, useDeadlockClient, useStatlockerClient } from '../..';
import StoredPlayer from '../../base/schemas/StoredPlayerSchema';

import PerformanceTagService, {
  IPerformanceTag,
} from '../../services/calculators/PerformanceTagService';

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
          description: 'Player\'s name or SteamID | Use "me" to get your match history!',
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
    const player = interaction.options.getString('player');
    const ephemeral = interaction.options.getBoolean('private', false);
    const matchHistoryLimit = 100;
    let steamAuthNeeded: boolean = false;

    await interaction.deferReply({ flags: ephemeral ? ['Ephemeral'] : [] });

    try {
      let steamId = player;

      if (player === 'me') {
        const storedPlayer = await StoredPlayer.findOne({
          discordId: interaction.user.id,
        });
        if (!storedPlayer) throw new CommandError(t('errors.steam_not_yet_stored'));
        steamAuthNeeded =
          storedPlayer.authenticated === undefined || storedPlayer.authenticated === false;

        steamId = storedPlayer.steamId;
      }

      const steamProfile = await useStatlockerClient.ProfileService.GetProfileCache(steamId!);
      if (!steamProfile) throw new CommandError(t('errors.steam_profile_not_found'));

      const matches = await useDeadlockClient.PlayerService.GetMatchHistory(
        String(steamProfile.accountId),
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
        (matches.filter((m) => m.match_result === m.player_team).length / matches.length) * 100;
      const avg = (key: keyof (typeof matches)[0]) => safeAvg(matches.map((m) => m[key] as number));

      const avgDeaths = avg('player_deaths');
      const avgKills = avg('player_kills');
      const avgAssists = avg('player_assists');

      const heroCounts = new Map<number, number>();
      matches.forEach((m) => heroCounts.set(m.hero_id, (heroCounts.get(m.hero_id) || 0) + 1));

      const avgDurationMin = avg('match_duration_s') / 60;

      let bestMatchIndex = 0;
      let worstMatchIndex = 0;
      let bestKda = -Infinity;
      let worstKda = Infinity;

      matches.forEach((match, i) => {
        const kda = match.player_kills + match.player_assists - match.player_deaths;
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
      const durationSec = (avg('match_duration_s') % 60).toFixed(0);

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
            value: `${Math.round(avg('net_worth'))}`,
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
            value: `${bestMatch.player_kills} / ${bestMatch.player_deaths} / ${
              bestMatch.player_assists
            }\nMatch ID: ${bestMatch.match_id}\n${
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
            value: `${worstMatch.player_kills} / ${
              worstMatch.player_deaths
            } / ${worstMatch.player_assists}\nMatch ID: ${worstMatch.match_id}\n${
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
