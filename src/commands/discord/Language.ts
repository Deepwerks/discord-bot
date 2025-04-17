import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  ColorResolvable,
  Colors,
  EmbedBuilder,
  Events,
  Guild,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command.";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { supportedLanguages } from "../../services/i18n";
import CommandError from "../../base/errors/CommandError";
import GuildConfig from "../../base/schemas/GuildConfig";
import logger from "../../services/logger";
import { setCachedLang } from "../../services/cache/langCache";

export default class Language extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "language",
      description: "Change the language",
      category: Category.Discord,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 60,
      dev: true,
      options: [
        {
          name: "select",
          description: "Select the language",
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

  async Execute(interaction: ChatInputCommandInteraction) {
    const selectedLanguage = interaction.options.getString("select");

    if (
      !supportedLanguages.map((lang) => lang.code).includes(selectedLanguage!)
    ) {
      throw new CommandError(
        `Language \`${selectedLanguage}\` is not supported!`
      );
    }

    let statusColor: ColorResolvable = Colors.Green;
    let statusMessage = `✅ You have successfully set this server's language to ${selectedLanguage}`;

    await GuildConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      { lang: selectedLanguage },
      { upsert: true }
    )
      .then(() => {
        setCachedLang(interaction.guildId!, selectedLanguage!);
      })
      .catch((err) => {
        logger.error(err);

        statusColor = Colors.Red;
        statusMessage = `❌ Failed to set this server's supported language.`;
      });

    interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(statusColor).setDescription(statusMessage),
      ],
      flags: ["Ephemeral"],
    });
  }
}
