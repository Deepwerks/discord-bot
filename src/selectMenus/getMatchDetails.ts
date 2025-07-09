import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from 'discord.js';
import SelectMenu from '../base/classes/SelectMenu';
import CustomClient from '../base/classes/CustomClient';
import CommandError from '../base/errors/CommandError';
import { logger } from '..';
import { TFunction } from 'i18next';
import { handleMatchRequest } from '../services/database/repository';

export default class GetMatchDetails extends SelectMenu {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'get_match_details',
      description: 'Get match details',
      cooldown: 15,
    });
  }

  async Execute(interaction: StringSelectMenuInteraction, t: TFunction<'translation', undefined>) {
    try {
      const matchId = interaction.values[0];
      const startTime = performance.now();

      if (!interaction.values.length) {
        throw new CommandError('No value selected');
      }

      await interaction.deferReply({ flags: ['Ephemeral'] });

      const { matchData, imageBuffer } = await handleMatchRequest({
        id: matchId,
        type: 'match_id',
        userId: interaction.user.id,
        t,
        useGenericNames: false,
      });
      const match = matchData.match;

      const linkButton = new ButtonBuilder()
        .setLabel('View on Statlocker')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://statlocker.gg/match/${match.matchId}`)
        .setEmoji('1367520315244023868');

      const showPlayersButton = new ButtonBuilder()
        .setLabel('Show Players')
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
            .setFooter({ text: `Generated in ${duration}ms` }),
        ],
        files: [attachment],
        components: [row],
      });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(error instanceof CommandError ? error.message : t('errors.generic_error'));

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
      }
    }
  }
}
