import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  escapeMarkdown,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import CommandError from '../../base/errors/CommandError';
import { logger, useAssetsClient, useDeadlockClient } from '../..';
import { getFormattedMatchTime } from '../../services/utils/getFormattedMatchTime';
import pLimit from 'p-limit';
import getProfile from '../../services/common/getProfile';

export default class History extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'history',
      description: "Get player's match history",
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
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
    const player = interaction.options.getString('player', true);
    const ephemeral = interaction.options.getBoolean('private', false);

    try {
      const { steamProfile, steamAuthNeeded } = await getProfile(player, interaction.user.id, t);

      const matchHistory = await useDeadlockClient.PlayerService.fetchMatchHistory(
        steamProfile.accountId,
        15
      );
      const mmrHistory = await useDeadlockClient.PlayerService.fetchMMRHistory(
        steamProfile.accountId,
        15
      );

      const limit = pLimit(10);

      const matchesString: string[] = await Promise.all(
        matchHistory.map((match) =>
          limit(async () => {
            const hero = await match.getHero();
            const heroName = hero ? hero.name : 'Unknown';

            const mmrRecord = mmrHistory.find((record) => record.matchId === match.matchId);

            const champion = heroName.slice(0, 14).padEnd(15);
            const time = getFormattedMatchTime(match.matchDurationS).padEnd(9);

            const rank = (
              await useAssetsClient.DefaultService.GetRankName(
                mmrRecord?.division,
                mmrRecord?.divisionTier
              )
            )
              ?.slice(0, 12)
              .padEnd(13);
            const kda =
              `(${match.playerKills}/${match.playerDeaths}/${match.playerAssists})`.padEnd(13);
            const matchId = match.matchId.toString().padEnd(13);
            const date = match.startDate.format('D MMM YYYY').padEnd(12);

            const line = `${champion}${time}${rank}${kda}${matchId}${date}`;

            const prefix = match.matchResult === match.playerTeam ? '+' : '-';
            return `${prefix}${line}`;
          })
        )
      );

      const header =
        'Character'.padEnd(16) +
        'Time'.padEnd(9) +
        'Rank'.padEnd(13) +
        'KDA'.padEnd(13) +
        'Match ID'.padEnd(13) +
        'Date'.padEnd(12);

      const response = `\`\`\`diff
${escapeMarkdown(steamProfile.name)}'s (${steamProfile.accountId}) last ${matchHistory.length} matches:

${header}
${matchesString.join('\n')}
      \`\`\``;

      const linkButton = new ButtonBuilder()
        .setLabel(t('commands.history.view_on_statlocker'))
        .setStyle(ButtonStyle.Link)
        .setURL(`https://statlocker.gg/profile/${steamProfile.accountId}`)
        .setEmoji('1367520315244023868');

      const selectMatchButton = new StringSelectMenuBuilder()
        .setCustomId(`get_match_details`)
        .setPlaceholder(t('commands.history.match_details_placeholder'))
        .addOptions(
          await Promise.all(
            matchHistory.map(async (match) => {
              const win = match.matchResult === match.playerTeam ? 'Win' : 'Loss';
              const hero = await match.getHero();

              return new StringSelectMenuOptionBuilder()
                .setLabel(`${hero?.name} — ${win}`)
                .setDescription(
                  `${String(match.matchId)} (${match.startDate.format('D MMMM, YYYY')})`
                )
                .setValue(String(match.matchId));
            })
          )
        );

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);
      const interactiveRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        selectMatchButton
      );

      await interaction.reply({
        content: response,
        components: [buttonRow, interactiveRow],
        flags: ephemeral ? ['Ephemeral'] : [],
      });

      if (steamAuthNeeded) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(t('commands.history.steam_auth_required_title'))
          .setDescription(t('commands.history.steam_auth_required_description'));

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
