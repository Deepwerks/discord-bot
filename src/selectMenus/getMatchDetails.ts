import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import SelectMenu from "../base/classes/SelectMenu";
import CustomClient from "../base/classes/CustomClient";
import CommandError from "../base/errors/CommandError";
import { logger } from "..";
import { TFunction } from "i18next";
import { handleMatchRequest } from "../services/common/handleMatchRequest";

export default class GetMatchDetails extends SelectMenu {
  constructor(client: CustomClient) {
    super(client, {
      customId: "get_match_details",
      description: "Get match details",
      cooldown: 30,
    });
  }

  async Execute(
    interaction: StringSelectMenuInteraction,
    t: TFunction<"translation", undefined>
  ) {
    try {
      const matchId = interaction.values[0];

      await interaction.deferReply({ ephemeral: true });

      const { match, imageBuffer } = await handleMatchRequest({
        id: matchId,
        type: "match_id",
        userId: interaction.user.id,
        t,
      });

      const linkButton = new ButtonBuilder()
        .setLabel("View on Statlocker")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://statlocker.gg/match/${match.match_id}`)
        .setEmoji("1367520315244023868");

      const showPlayersButton = new ButtonBuilder()
        .setLabel("Show Players")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("show_players:" + match.match_id)
        .setEmoji("👥");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        showPlayersButton,
        linkButton
      );

      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "match.png",
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTimestamp()
            .setFooter({ text: `Match ID: ${match.match_id}` }),
        ],
        files: [attachment],
        components: [row],
      });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          error instanceof CommandError
            ? error.message
            : t("errors.generic_error")
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
