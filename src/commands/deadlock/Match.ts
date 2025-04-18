import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command.";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import logger from "../../services/logger";

export default class Match extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "match",
      description: "Get match details",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: false,
      cooldown: 6,
      dev: true,
      options: [
        {
          name: "matchid",
          description: "Match ID",
          required: true,
          type: ApplicationCommandOptionType.String,
        },
      ],
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    const matchid = interaction.options.getString("matchid");

    try {
      const match = await this.client.DeadlockClient.MatchService.GetMatch(
        matchid!
      );

      let matchResponse: string = `MatchID: ${match.match_id}\n Duration: ${match.duration_s}\n Team A: `;
      matchResponse += match.team_0_players.map((p) => p.account_id).join(", ");

      matchResponse += "\n Team B: ";
      matchResponse += match.team_1_players.map((p) => p.account_id).join(", ");

      return interaction.reply({
        content: matchResponse,
      });
    } catch (error) {
      logger.error(error);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(t("commands.match.fail")),
        ],
        flags: ["Ephemeral"],
      });
    }
  }
}
