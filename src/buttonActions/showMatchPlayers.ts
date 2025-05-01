import { ButtonInteraction } from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger, useAssetsClient, useDeadlockClient } from "..";

export default class ShowMatchPlayersButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: "show_players",
      description: "Show the players in the match.",
      cooldown: 6,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    const [action, matchId] = interaction.customId.split(":");

    try {
      const deadlockMatch = await useDeadlockClient.MatchService.GetMatch(
        matchId
      );

      const allPlayers = [
        ...deadlockMatch.team_0_players,
        ...deadlockMatch.team_1_players,
      ];

      const playerPromises = allPlayers.map(async (player) => {
        const hero = await useAssetsClient.HeroService.GetHeroCached(
          player.hero_id
        );

        return `${hero?.name}: ${player.account_id}`;
      });

      const playerIds = (await Promise.all(playerPromises)).join("\n");

      await interaction.reply({
        content: `**Player IDs for match \`${matchId}\`:**\n\`\`\`${playerIds}\`\`\``,
        flags: ["Ephemeral"],
      });
    } catch (err) {
      logger.error("Failed to fetch players for button interaction:", err);
      await interaction.reply({
        content: "❌ Failed to fetch player IDs for this match.",
        flags: ["Ephemeral"],
      });
    }
  }
}
