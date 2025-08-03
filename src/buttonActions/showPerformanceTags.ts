import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import PerformanceTagService from '../services/calculators/PerformanceTagService';
import { TFunction } from 'i18next';
import { deadlockAvgStatsStore } from '../services/redis/stores/DeadlockAvgStatsStore';

export default class ShowPerformanceTagsButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'show_performance_tags',
      description: 'Show performance tags',
      cooldown: 6,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    const averages = await deadlockAvgStatsStore.get();
    const tags = PerformanceTagService.getAllTagDescriptions(averages);

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
  }
}
