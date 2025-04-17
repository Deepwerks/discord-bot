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
import { TFunction } from "i18next";
import i18next from "../../services/i18n";

export default class Language extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "language",
      description: "Change the language",
      category: Category.Discord,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 60,
      dev: false,
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

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    const selectedLanguage = interaction.options.getString("select");

    if (
      !supportedLanguages.map((lang) => lang.code).includes(selectedLanguage!)
    ) {
      throw new CommandError(
        `Language \`${selectedLanguage}\` is not supported!`
      );
    }

    const newT = i18next.getFixedT(selectedLanguage!);

    let statusColor: ColorResolvable = Colors.Green;
    let statusMessage = newT("commands.language.set_success", {
      selectedLanguage,
    });

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
        statusMessage = t("commands.language.set_fail");
      });

    interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(statusColor).setDescription(statusMessage),
      ],
      flags: ["Ephemeral"],
    });
  }
}
