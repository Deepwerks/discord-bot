import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import { generateSteamLinkToken } from "../../services/utils/SteamLinkToken";
export default class Store extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "store",
      description:
        "Store your Steam ID to enable the 'me' shortcut in certain commands!",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 30,
      dev: false,
      options: [],
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    const token = generateSteamLinkToken(interaction.user.id);
    const url = `${
      this.client.config.deadlock_assistant_url
    }/auth/steam?token=${encodeURIComponent(token)}`;

    const linkButton = new ButtonBuilder()
      .setLabel("Link my steam account")
      .setStyle(ButtonStyle.Link)
      .setURL(url);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

    const embed = new EmbedBuilder()
      .setColor(0x1b2838)
      .setTitle("🔗 Steam Account Authentication")
      .setDescription(
        "To enable the `me` shortcut in certain commands, we require you to authenticate your Steam account.\n\n" +
          "We only retain your **SteamID64**, which is used solely for account association within our system. No additional data is accessed or stored, and the authentication process does not grant us any control over your Steam account.\n\n" +
          "For more information, please review our [Privacy Policy](https://docs.google.com/document/d/1AwofbGUpWC0pmRcok1N99hja5_-lzzKOVWf0cmO1kb0/edit?usp=sharing)."
      );

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
      components: [row],
    });
  }
}
