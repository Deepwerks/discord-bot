import { Collection, EmbedBuilder, Events, StringSelectMenuInteraction } from 'discord.js';
import CustomClient from '../../base/classes/CustomClient';
import Event from '../../base/classes/Event';
import i18next from '../../services/i18n';
import logInteraction from '../../services/logger/logInteraction';
import CommandError from '../../base/errors/CommandError';
import { InteractionType } from '../../services/database/orm/models/FailedUserInteractions.model';
import { getGuildConfig } from '../../services/database/repository';
import logFailedInteraction from '../../services/logger/logFailedInteractions';

export default class SelectMenuHandler extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: 'SelectMenu handler event',
      once: false,
    });
  }

  async Execute(interaction: StringSelectMenuInteraction) {
    if (!interaction.isStringSelectMenu()) return;

    const [action] = interaction.customId.split(':');

    const guildConfig = await getGuildConfig(interaction.guildId);
    const t = i18next.getFixedT(guildConfig?.preferedLanguage ?? 'en');

    try {
      const selectMenuHandler = this.client.selectMenus.get(action);

      if (!selectMenuHandler) {
        this.client.selectMenus.delete(action);
        throw new CommandError('No button found');
      }

      const { cooldowns } = this.client;
      if (!cooldowns.has(selectMenuHandler.customId))
        cooldowns.set(selectMenuHandler.customId, new Collection());

      const now = Date.now();
      const timestamps = cooldowns.get(selectMenuHandler.customId)!;
      const cooldownAmount = (selectMenuHandler.cooldown || 1) * 1000;

      if (
        timestamps.has(interaction.user.id) &&
        now < (timestamps.get(interaction.user.id) || 0) + cooldownAmount
      )
        return interaction.reply({
          embeds: [
            new EmbedBuilder().setColor('Red').setDescription(
              t('warnings.cooldown', {
                time: (
                  ((timestamps.get(interaction.user.id) || 0) + cooldownAmount - now) /
                  1000
                ).toFixed(1),
              })
            ),
          ],
          flags: ['Ephemeral'],
        });

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      logInteraction({
        id: interaction.id,
        guildId: interaction.inGuild() ? interaction.guildId : null,
        name: action,
        type: InteractionType.SelectMenu,
        userId: interaction.user.id,
        options: null,
      });

      await selectMenuHandler.Execute(interaction, t);
    } catch (error) {
      logFailedInteraction({
        id: interaction.id,
        guildId: interaction.inGuild() ? interaction.guildId : null,
        name: action,
        type: InteractionType.SelectMenu,
        userId: interaction.user.id,
        options: null,
        error: {
          name: error instanceof CommandError ? error.name : 'Unknown',
          message: error instanceof CommandError ? error.message : error,
          stack: error instanceof CommandError ? error.stack : undefined,
        },
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
