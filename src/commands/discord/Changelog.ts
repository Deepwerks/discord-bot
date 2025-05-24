import { ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import ChangelogSchema from '../../base/schemas/ChangelogSchema';
import { logger } from '../..';
import { TFunction } from 'i18next';
import CommandError from '../../base/errors/CommandError';

export default class Changelog extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'changelog',
      description: 'Change log of the bot',
      category: Category.Utilities,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 30,
      options: [],
      dev: true,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    await interaction.deferReply();

    try {
      const latest = await ChangelogSchema.findOne().sort({ date: -1 }).lean();

      if (!latest) {
        throw new CommandError('❌ No changelog entries found.');
      }

      let message = `# **Changelog ${latest.version}${latest.name ? ` - ${latest.name}` : ''}**\n`;
      message += latest.description ? `\n${latest.description}\n` : '';
      message += `\n\`\`\`${new Date(latest.date).toLocaleDateString()}\`\`\`\n\n`;

      for (const record of latest.records) {
        message += `## **${record.name}**\n`;

        if (record.description) {
          message += `*${record.description}*`;
        }

        const pushSection = (title: string, items: string[]) => {
          if (items?.length) {
            message += `\n - **${title}:**\n${items.map((i) => `  - ${i}`).join('\n')}`;
          }
        };

        pushSection('Changes', record.changes);
        pushSection('Fixes', record.fixes);
        pushSection('Features', record.features);
        pushSection('Improvements', record.improvements);
        pushSection('Notes', record.notes);

        message += `\n\n`;
      }

      if (message.length > 2000) {
        message = message.slice(0, 1990) + '\n...(truncated)';
      }

      await interaction.editReply({ content: message });
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
