import { EmbedBuilder, escapeMarkdown } from 'discord.js';
import { t } from 'i18next';
import { useDeadlockClient } from '../..';
import CommandError from '../../base/errors/CommandError';
import getProfile from '../database/repository';
import { findHeroByName } from './findHeroByName';
import CustomClient from '../../base/classes/CustomClient';

export default async (
  player: string,
  userId: string,
  heroName: string | null,
  client: CustomClient
) => {
  const HeroSpecificStats: Record<string, string[]> = {
    'Grey Talon': ['max_guided_owl_stacks', 'max_spirit_snare_stacks'],
    Bebop: ['max_bomb_stacks'],
    'Mo & Krill': ['max_bonus_health_per_kill'],
  };

  const { steamProfile, steamAuthNeeded } = await getProfile(player, userId, t);

  if (!steamProfile) {
    throw new CommandError(t('errors.steam_profile_not_found'));
  }

  const accountId = steamProfile.accountId;

  const hero = findHeroByName(heroName ?? '');

  if (heroName && !hero) {
    throw new CommandError(`Hero not found: ${heroName}`);
  }

  const globalStats = ['total_kd', 'total_matches', 'total_wins', 'total_losses'];

  const additionalStats = ['total_winrate', 'hours_played', 'most_played_hero'];

  const heroStats = heroName
    ? ['hero_kd', 'hero_matches', 'hero_wins', 'hero_losses', 'hero_winrate', 'hero_hours_played']
    : [];

  const heroSpecificStats = heroName ? HeroSpecificStats[hero!.name] || [] : [];

  const stats = await useDeadlockClient.PlayerService.FetchStats(
    accountId,
    [...globalStats, ...additionalStats, ...heroStats, ...heroSpecificStats],
    hero?.name
  );

  if (!stats) {
    throw new CommandError('Failed to get player stats');
  }

  const globalStatBlock = formatStatsBlock(stats, globalStats);
  const additionalStatBlock = formatStatsBlock(stats, additionalStats);
  const heroStatBlock = heroStats.length > 0 ? formatStatsBlock(stats, heroStats) : '';
  const heroSpecificStatBlock = formatStatsBlock(stats, heroSpecificStats);

  const description = `
        ${
          !heroName
            ? `\`\`\`Predicted Rank: ${steamProfile.performanceRankMessage}\`\`\` \nGlobal Stats ${globalStatBlock}  \nAdditional Stats ${additionalStatBlock}`
            : `Stats on ${hero?.name} ${heroStatBlock} ${
                heroSpecificStats.length ? `\nHero Specific Stats ${heroSpecificStatBlock}` : ``
              } \nGlobal Stats ${globalStatBlock}`
        }
      `;

  const embed = new EmbedBuilder()
    .setColor(heroName ? 0x00ae86 : 0x7289da)
    .setThumbnail(
      heroName ? (hero!.images.minimap_image ?? steamProfile.avatarUrl) : steamProfile.avatarUrl
    )
    .setTitle(`${escapeMarkdown(steamProfile.name)}'s stats`)
    .setURL(`https://statlocker.gg/profile/${steamProfile.accountId}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({
      text: `PlayerID: ${steamProfile.accountId}`,
      iconURL: client.user!.displayAvatarURL(),
    });

  return {
    embed,
    steamAuthNeeded,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatStatsBlock(stats: Record<string, any>, fields: string[]): string {
  return (
    '```\n' +
    fields.map((field) => `${formatFieldName(field)}: ${stats[field] ?? 'N/A'}`).join('\n') +
    '\n```'
  );
}

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ') // replace underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
}
