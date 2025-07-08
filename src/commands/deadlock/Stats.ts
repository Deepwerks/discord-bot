import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
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
import { logger, useAssetsClient, useDeadlockClient } from '../..';
import { findHeroByName } from '../../services/utils/findHeroByName';
import getProfile from '../../services/common/getProfile';

export default class Stats extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'stats',
      description: "Get player's overall statistics",
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 6,
      dev: false,
      options: [
        {
          name: 'player',
          description: 'Player\'s SteamID | Use "me" to get your statistics!',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: 'hero_name',
          description: "If given, returns the player's stats on the given hero",
          required: false,
          type: ApplicationCommandOptionType.String,
          autocomplete: true,
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

    const HeroSpecificStats: Record<string, string[]> = {
      'Grey Talon': ['max_guided_owl_stacks', 'max_spirit_snare_stacks'],
      Bebop: ['max_bomb_stacks'],
      'Mo & Krill': ['max_bonus_health_per_kill'],
    };

    try {
      await interaction.deferReply({ flags: ephemeral ? ['Ephemeral'] : [] });
      const { steamProfile, steamAuthNeeded } = await getProfile(player, interaction.user.id, t);

      if (!steamProfile) {
        throw new CommandError(t('errors.steam_profile_not_found'));
      }

      const accountId = steamProfile.accountId;
      const heroName = interaction.options.getString('hero_name', false);

      const hero = findHeroByName(heroName ?? '');

      if (heroName && !hero) {
        throw new CommandError(`Hero not found: ${heroName}`);
      }

      const globalStats = ['total_kd', 'total_matches', 'total_wins', 'total_losses'];

      const additionalStats = ['total_winrate', 'hours_played', 'most_played_hero'];

      const heroStats = heroName
        ? [
            'hero_kd',
            'hero_matches',
            'hero_wins',
            'hero_losses',
            'hero_winrate',
            'hero_hours_played',
          ]
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
          iconURL: this.client.user!.displayAvatarURL(),
        });

      await interaction.editReply({ embeds: [embed] });

      if (steamAuthNeeded) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(t('commands.stats.steam_auth_required_title'))
          .setDescription(t('commands.stats.steam_auth_required_description'));

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

  async AutoComplete(interaction: AutocompleteInteraction) {
    // Check if the focused option is the hero_name option
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name !== 'hero_name') return;
    const focusedValue = focusedOption.value.toLowerCase();

    // Get all hero names from the cache
    const heroNames = useAssetsClient.HeroService.GetHeroes().map((h) => h.name);

    // Filter the hero names based on the focused value
    const suggestions = heroNames
      .filter((h) => h.toLowerCase().includes(focusedValue))
      .sort((a, b) => {
        const aIndex = a.toLowerCase().indexOf(focusedValue);
        const bIndex = b.toLowerCase().indexOf(focusedValue);
        return aIndex - bIndex;
      })
      .map((h) => ({ name: h, value: h }))
      .slice(0, 25);

    await interaction.respond(suggestions);
  }
}

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
