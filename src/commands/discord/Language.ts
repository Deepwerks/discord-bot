import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { supportedLanguages } from '../../services/i18n';
import CommandError from '../../base/errors/CommandError';
import { TFunction } from 'i18next';
import i18next from '../../services/i18n';
import { logger } from '../..';
import { Guilds } from '../../services/database/orm/init';

export default class Language extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'language',
      description: "Change the bot's language",
      category: Category.Discord,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 60,
      dev: false,
      options: [
        {
          name: 'select',
          description: 'Choose the language',
          required: true,
          type: ApplicationCommandOptionType.String,
          choices: supportedLanguages.map((lang) => ({
            name: lang.nameNative,
            value: lang.code,
          })),
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const selectedLanguage = interaction.options.getString('select');

    try {
      if (!supportedLanguages.map((lang) => lang.code).includes(selectedLanguage!)) {
        throw new CommandError(`Language \`${selectedLanguage}\` is not supported!`);
      }

      const newT = i18next.getFixedT(selectedLanguage!);

      const storedGuild = await Guilds.findOne({
        where: { guildId: interaction.guildId },
      });

      if (storedGuild) {
        await storedGuild.update({
          preferedLanguage: selectedLanguage,
        });
      } else {
        await Guilds.create({
          guildId: interaction.guildId,
          ownerDiscordId: interaction.guild?.ownerId,
          preferedLanguage: selectedLanguage,
        });
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder().setColor('Green').setDescription(
            newT('commands.language.set_success', {
              selectedLanguage,
            })
          ),
        ],
        flags: ['Ephemeral'],
      });
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
        await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
      }
    }
  }
}
