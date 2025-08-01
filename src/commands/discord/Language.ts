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
import { Guilds } from '../../services/database/orm/init';
import { guildConfigCache } from '../../services/cache/GuildConfigCache';

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

  async Execute(interaction: ChatInputCommandInteraction, _t: TFunction<'translation', undefined>) {
    const selectedLanguage = interaction.options.getString('select');

    if (!supportedLanguages.map((lang) => lang.code).includes(selectedLanguage!)) {
      throw new CommandError(`Language \`${selectedLanguage}\` is not supported!`);
    }

    const newT = i18next.getFixedT(selectedLanguage!);

    let storedGuild = await Guilds.findOne({
      where: { guildId: interaction.guildId },
    });

    if (storedGuild) {
      storedGuild = await storedGuild.update({
        preferedLanguage: selectedLanguage,
      });
    } else {
      storedGuild = await Guilds.create({
        guildId: interaction.guildId,
        ownerDiscordId: interaction.guild?.ownerId,
        preferedLanguage: selectedLanguage,
      });
    }

    guildConfigCache.set(interaction.guildId!, storedGuild);

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
  }
}
