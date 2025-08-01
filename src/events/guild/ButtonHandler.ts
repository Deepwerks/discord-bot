import { ButtonInteraction, Collection, EmbedBuilder, Events } from 'discord.js';
import CustomClient from '../../base/classes/CustomClient';
import Event from '../../base/classes/Event';
import i18next from '../../services/i18n';
import logInteraction from '../../services/logger/logInteraction';
import CommandError from '../../base/errors/CommandError';
import { InteractionType } from '../../services/database/orm/models/FailedUserInteractions.model';
import { getGuildConfig } from '../../services/database/repository';
import logFailedInteraction from '../../services/logger/logFailedInteractions';

export default class ButtonHandler extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: 'Button handler event',
      once: false,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;
    const [action, ...params] = interaction.customId.split(':');
    if (['ready_up', 'vote'].includes(action)) return;

    const guildConfig = await getGuildConfig(interaction.guildId);
    const t = i18next.getFixedT(guildConfig?.preferedLanguage ?? 'en');

    try {
      const buttonActionHandler = this.client.buttons.get(action);

      if (!buttonActionHandler) {
        await interaction.reply({
          content: t('warnings.no_button_action'),
          flags: ['Ephemeral'],
        });
        this.client.buttons.delete(action);
        return;
      }

      const { cooldowns } = this.client;
      if (!cooldowns.has(buttonActionHandler.customId))
        cooldowns.set(buttonActionHandler.customId, new Collection());

      const now = Date.now();
      const timestamps = cooldowns.get(buttonActionHandler.customId)!;
      const cooldownAmount = buttonActionHandler.cooldown * 1000;

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
        type: InteractionType.Button,
        userId: interaction.user.id,
        options: params,
      });

      await buttonActionHandler.Execute(interaction, t);
    } catch (error) {
      logFailedInteraction({
        id: interaction.id,
        guildId: interaction.inGuild() ? interaction.guildId : null,
        name: action,
        type: InteractionType.Button,
        userId: interaction.user.id,
        options: params,
        error: {
          name: error instanceof CommandError ? error.name : 'Unknown',
          message: error instanceof CommandError ? error.message : error,
          stack: error instanceof CommandError ? error.stack : undefined,
        },
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(error instanceof CommandError ? error.message : 'Button action failed');

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
      }
    }
  }
}
