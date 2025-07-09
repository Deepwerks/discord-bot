import {
  ApplicationCommandOptionType,
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
import { useDeadlockClient } from '../..';
import DeadlockPlayerHeroStats from '../../services/clients/DeadlockClient/services/DeadlockPlayerService/entities/DeadlockPlayerHeroStats';
import getProfile from '../../services/database/repository';

const calculateKDA = (m: DeadlockPlayerHeroStats) => (m.kills + m.assists) / Math.max(1, m.deaths);
const calculateWinRate = (m: DeadlockPlayerHeroStats) =>
  (m.wins / Math.max(1, m.matchesPlayed)) * 100;

export default class Top extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'top',
      description: 'Retrieves a list of hero stats for the specified player',
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 6,
      dev: false,
      options: [
        {
          name: 'player',
          description: 'Player\'s name or SteamID | Use "me" to get your statistics!',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: 'sort_by',
          description: 'Sort by this stat',
          required: false,
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: 'KDA',
              value: 'kda',
            },
            {
              name: 'Win Rate',
              value: 'winrate',
            },
            {
              name: 'Matches Played',
              value: 'matches',
            },
            {
              name: 'Denies per match',
              value: 'denies_per_match',
            },
            {
              name: 'Souls per min',
              value: 'networth_per_min',
            },
          ],
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
    let sortBy = interaction.options.getString('sort_by', false);
    const ephemeral = interaction.options.getBoolean('private', false);

    if (!sortBy) sortBy = 'kda';
    await interaction.deferReply({ flags: ephemeral ? ['Ephemeral'] : [] });

    const { steamProfile, steamAuthNeeded } = await getProfile(player, interaction.user.id, t);

    const stats = await useDeadlockClient.PlayerService.FetchHeroStats(steamProfile.accountId);

    if (!stats || !Array.isArray(stats) || stats.length === 0) {
      throw new CommandError(t('errors.no_stats_found'));
    }

    const sortedStats = stats.sort((a, b) => {
      if (sortBy === 'kda') {
        return calculateKDA(b) - calculateKDA(a);
      } else if (sortBy === 'winrate') {
        return calculateWinRate(b) - calculateWinRate(a);
      } else if (sortBy === 'matches') {
        return b.matchesPlayed - a.matchesPlayed;
      } else if (sortBy === 'denies_per_match') {
        return b.deniesPerMatch - a.deniesPerMatch;
      } else if (sortBy === 'networth_per_min') {
        return b.networthPerMin - a.networthPerMin;
      }
      return 0;
    });

    const embeds = await createHeroStatsEmbeds(
      sortedStats,
      steamProfile.name,
      String(steamProfile.accountId),
      sortBy
    );

    await interaction.editReply({
      embeds,
    });

    if (steamAuthNeeded) {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(t('commands.top.steam_auth_required_title'))
        .setDescription(t('commands.top.steam_auth_required_description'));

      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    }
  }
}

async function createHeroStatsEmbeds(
  stats: DeadlockPlayerHeroStats[],
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
      embed.setTitle(`Hero Stats for **${escapeMarkdown(playerName)}** sorted by **${sort_by}**`);
    }
    if (i + chunkSize >= stats.length) {
      embed.setTimestamp();
      embed.setFooter({
        text: `Player ID: ${playerId}`,
      });
    }

    let description = '```';
    description += `#   Hero             KDA    Win%   Match  Deny   Souls/M\n`;
    description += `--------------------------------------------------------\n`;

    for (let j = 0; j < chunk.length; j++) {
      const index = i + j + 1;
      const stat = chunk[j];

      const hero = await stat.getHero();

      const name = (hero ? hero.name : 'Unknown').padEnd(17);
      const kda = calculateKDA(stat).toFixed(2).padEnd(7);
      const winrate = `${calculateWinRate(stat).toFixed(0)}%`.padEnd(7);
      const matches = stat.matchesPlayed.toString().padEnd(7);
      const denies = stat.deniesPerMatch.toFixed(2).padEnd(7);
      const networth = stat.networthPerMin.toFixed(1).padEnd(8);

      description += `${(index + '.').padEnd(
        4
      )}${name}${kda}${winrate}${matches}${denies}${networth}\n`;
    }

    description += '```';

    embed.setDescription(description);
    embeds.push(embed);
  }

  return embeds;
}
