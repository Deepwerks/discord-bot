import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger, useDeadlockClient, useStatlockerClient } from "..";
import { generateMatchImage } from "../services/utils/generateMatchImage";
import i18next from "../services/i18n";
import GuildConfig from "../base/schemas/GuildConfigSchema";
import { lobbyStore } from "../services/stores/LobbyStore";

export default class FinishMatchButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: "finish_match",
      description: "Finish a match and automatically show match details",
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    try {
      await interaction.deferReply();
      const [_, creatorId] = interaction.customId.split(":");

      const guildLang = await GuildConfig.findOne({
        guildId: interaction.guildId!,
      });
      const t = i18next.getFixedT(guildLang?.lang!);

      const startTime = performance.now();

      try {
        // Get match data from Deadlock API
        const partyId = lobbyStore.getPartyId(creatorId);
        console.log(partyId);
        if (!partyId) {
          throw new Error("Failed to find party ID in message content");
        }

        const matchId =
          await useDeadlockClient.MatchService.GetMatchIdFromPartyId(partyId);
        let deadlockMatch = await useDeadlockClient.MatchService.GetMatch(
          matchId
        );

        const allPlayers = [
          ...deadlockMatch.team_0_players,
          ...deadlockMatch.team_1_players,
        ];

        const results =
          await useStatlockerClient.ProfileService.GetProfilesCache(
            allPlayers.map((p) => String(p.account_id))
          );

        const statlockerProfileMap = new Map<number, string>();
        for (const profile of results) {
          statlockerProfileMap.set(profile.accountId, profile.name);
        }

        const match = {
          match_id: deadlockMatch.match_id,
          duration_s: deadlockMatch.duration_s,
          start_date: deadlockMatch.start_date.format("D MMMM, YYYY"),
          average_badge_team0: deadlockMatch.average_badge_team0,
          average_badge_team1: deadlockMatch.average_badge_team1,
          start_time: deadlockMatch.start_time,
          match_outcome: deadlockMatch.match_outcome,
          winning_team: deadlockMatch.winning_team,
          team_0_players: deadlockMatch.team_0_players.map((p) => ({
            ...p,
            name: statlockerProfileMap.get(p.account_id)!,
          })),
          team_1_players: deadlockMatch.team_1_players.map((p) => ({
            ...p,
            name: statlockerProfileMap.get(p.account_id)!,
          })),
        };

        const linkButton = new ButtonBuilder()
          .setLabel("View on Statlocker")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://statlocker.gg/match/${match.match_id}`)
          .setEmoji("1367520315244023868");

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          linkButton
        );

        const imageBuffer = await generateMatchImage({ match });
        const attachment = new AttachmentBuilder(imageBuffer, {
          name: "match.png",
        });

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Blue")
              .setTimestamp()
              .setFooter({
                text: `Generated in ${duration}ms`,
              }),
          ],
          files: [attachment],
          components: [row],
        });
      } catch (err) {
        logger.error("Match data fetch failed", err);

        await interaction.editReply({
          content: "❌ Failed to fetch match data. Please try again later.",
        });
      }
    } catch (error) {
      logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({
          content:
            "❌ Failed to process the finish match action. Please try again later.",
        });
      } else {
        await interaction.editReply({
          content:
            "❌ Failed to process the finish match action. Please try again later.",
        });
      }
    }
  }
}
