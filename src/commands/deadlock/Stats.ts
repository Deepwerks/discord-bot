import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { useAssetsClient } from '../..';
import getPlayerStatsEmbed from '../../services/utils/getPlayerStatsEmbed';

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
          description: 'Player\'s name or SteamID | Use "me" to get your statistics!',
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
    const heroName = interaction.options.getString('hero_name', false);

    await interaction.deferReply({ flags: ephemeral ? ['Ephemeral'] : [] });

    const { embed, steamAuthNeeded } = await getPlayerStatsEmbed(
      player,
      interaction.user.id,
      heroName,
      this.client
    );

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
