import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { logger } from '..';
import PerformanceTagService from '../services/calculators/PerformanceTagService';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';

export default class ShowPerformanceTagsButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'show_performance_tags',
      description: 'Show performance tags',
      cooldown: 6,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    try {
      const tags = PerformanceTagService.getAllTagDescriptions();

      const formattedTags = tags
        .map((tag) => `\`${tag.name}\`\n${tag.description}\n${tag.criteria}`)
        .join('\n\n');

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Grey')
            .setTitle(t('buttons.show_performance_tags.title'))
            .setDescription(`${formattedTags}\n\n${t('buttons.show_performance_tags.disclaimer')}`),
        ],
        flags: ['Ephemeral'],
      });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(
          error instanceof CommandError
            ? error.message
            : t('buttons.show_performance_tags.error_generic')
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
