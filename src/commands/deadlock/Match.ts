import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { logger } from '../..';
import CommandError from '../../base/errors/CommandError';
import { handleMatchRequest } from '../../services/common/handleMatchRequest';

export default class Match extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'match',
      description: 'Get Deadlock match details by match or player ID',
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 8,
      dev: false,
      options: [
        {
          name: 'id',
          description: 'Match ID (default) or Steam ID — use "me" for your latest match',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: 'type',
          description: "Specify if it's a match or player ID",
          required: false,
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: 'Match ID',
              value: 'match_id',
            },
            {
              name: 'Player ID',
              value: 'player_id',
            },
          ],
        },
        {
          name: 'use_generic_names',
          description: 'Use generic names instead of player info (anonymized output)',
          required: false,
          type: ApplicationCommandOptionType.Boolean,
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
    const id = interaction.options.getString('id', true);
    const type: 'player_id' | 'match_id' =
      id.toLowerCase() === 'me'
        ? 'player_id'
        : interaction.options.getString('type')
          ? (interaction.options.getString('type') as 'player_id' | 'match_id')
          : 'match_id';
    const useGenericNames = interaction.options.getBoolean('use_generic_names', false) ?? false;
    const ephemeral = interaction.options.getBoolean('private', false);
    const startTime = performance.now();

    await interaction.deferReply({ flags: ephemeral ? ['Ephemeral'] : [] });

    try {
      const { matchData, imageBuffer, _steamAuthNeeded } = await handleMatchRequest({
        id,
        type,
        userId: interaction.user.id,
        t,
        useGenericNames,
      });
      const match = matchData.match;

      const linkButton = new ButtonBuilder()
        .setLabel(t('commands.match.view_on_statlocker'))
        .setStyle(ButtonStyle.Link)
        .setURL(`https://statlocker.gg/match/${match.matchId}`)
        .setEmoji('1367520315244023868');

      const showPlayersButton = new ButtonBuilder()
        .setLabel(t('commands.match.show_players'))
        .setStyle(ButtonStyle.Primary)
        .setCustomId('show_players:' + match.matchId)
        .setEmoji('👥');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        showPlayersButton,
        linkButton
      );

      const attachment = new AttachmentBuilder(imageBuffer, {
        name: 'match.png',
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Blue')
            .setTimestamp()
            .setFooter({
              text: t('commands.match.generated_in', { duration }),
            }),
        ],
        files: [attachment],
        components: [row],
      });

      if (_steamAuthNeeded) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(t('commands.match.steam_auth_required_title'))
          .setDescription(t('commands.match.steam_auth_required_description'));

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
