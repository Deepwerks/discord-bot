import { Collection, EmbedBuilder, Events, Interaction } from 'discord.js';
import CustomClient from '../../base/classes/CustomClient';
import Event from '../../base/classes/Event';
import Command from '../../base/classes/Command';
import i18next from '../../services/i18n';
import { logger } from '../..';
import logInteraction from '../../services/logger/logInteraction';
import CommandError from '../../base/errors/CommandError';
import { commandExecutions } from '../../services/metrics';
import { InteractionType } from '../../services/database/orm/models/UserInteractions.model';
import { getGuildConfig } from '../../services/database/repository';

export default class CommandHandler extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: 'Command handler event',
      once: false,
    });
  }

  async Execute(interaction: Interaction) {
    // Check if the interaction is a command or autocomplete
    if (interaction.isChatInputCommand()) {
      const guildConfig = await getGuildConfig(interaction.guildId);
      const t = i18next.getFixedT(guildConfig?.preferedLanguage ?? 'en');

      const command: Command = this.client.commands.get(interaction.commandName)!;

      if (!command) {
        await interaction.reply({
          content: t('warnings.no_command'),
          flags: ['Ephemeral'],
        });
        this.client.commands.delete(interaction.commandName);
        return;
      }

      if (command.dev && !this.client.config.developer_user_ids.includes(interaction.user.id)) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor('Red').setDescription(t('warnings.no_permission'))],
          flags: ['Ephemeral'],
        });
      }

      const { cooldowns } = this.client;
      if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());

      const now = Date.now();
      const timestamps = cooldowns.get(command.name)!;
      const cooldownAmount = (command.cooldown || 3) * 1000;

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

      const subCommandGroup = interaction.options.getSubcommandGroup(false);
      const subCommand = `${interaction.commandName}${
        subCommandGroup ? `${subCommandGroup}` : ''
      }.${interaction.options.getSubcommand(false) || ''}`;

      logger.info(`[COMMAND] ${interaction.user.tag} used /${command.name}`);

      commandExecutions.inc({
        command: command.name,
      });

      logInteraction({
        id: interaction.id,
        guildId: interaction.inGuild() ? interaction.guildId : null,
        name: command.name,
        type: InteractionType.Command,
        userId: interaction.user.id,
        options: interaction.options.data,
      });

      try {
        const subCommandHandler = this.client.subCommands.get(subCommand);

        if (subCommandHandler) {
          return await subCommandHandler.Execute(interaction, t);
        } else {
          return await command.Execute(interaction, t);
        }
      } catch (error) {
        logger.error({
          error,
          interaction: interaction.id,
        });

        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setDescription(
            error instanceof CommandError ? error.message : t('errors.generic_error')
          );

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
        }
      }
    }

    // Check if it's an Autocomplete interaction
    else if (interaction.isAutocomplete()) {
      const command = this.client.commands.get(interaction.commandName);
      if (!command || !command.AutoComplete) return;

      try {
        await command.AutoComplete(interaction);
      } catch (error) {
        logger.error(error);
      }
    }
  }
}
