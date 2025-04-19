import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command.";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import logger from "../../services/logger";
import {
  generateMatchImage,
  IGenerateMatchImageOptions,
} from "../../services/utils/generateMatchImage";
import ISteamPlayer from "../../services/clients/SteamClient/SteamProfileService/interfaces/ISteamPlayer";
import { useDeadlockClient, useSteamClient } from "../..";
import { isMatchId } from "../../services/utils/isMatchId";
import StoredPlayer from "../../base/schemas/StoredPlayer";
import CommandError from "../../base/errors/CommandError";

export default class Match extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "match",
      description: "Get match details",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 6,
      dev: false,
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
      const sent = await interaction.deferReply();

      let _matchId = matchid;

      if (!isMatchId(matchid)) {
        if (matchid === "me") {
          const storedPlayer = await StoredPlayer.findOne({
            discordId: interaction.user.id,
          });

          if (!storedPlayer) {
            throw new CommandError(t("errors.steam_not_yet_stored"));
          }

          const lastHistoryMatch =
            await useDeadlockClient.PlayerService.GetMatchHistory(
              storedPlayer.steamId,
              1
            );

          if (lastHistoryMatch.length === 0) {
            throw new CommandError("Player does not have a single match");
          }

          _matchId = String(lastHistoryMatch[0].match_id);
        } else {
          let playername = matchid as string;

          const id = await useSteamClient.ProfileService.GetIdFromUsername(
            playername
          );

          if (!id) {
            throw new CommandError(t("errors.steam_player_not_found"));
          }

          const lastHistoryMatch =
            await useDeadlockClient.PlayerService.GetMatchHistory(id, 1);

          if (lastHistoryMatch.length === 0) {
            throw new CommandError("Player does not have a single match");
          }

          _matchId = String(lastHistoryMatch[0].match_id);
        }
      }

      const match = await useDeadlockClient.MatchService.GetMatch(_matchId!);

      const allPlayers = [...match.team_0_players, ...match.team_1_players];
      const steamIDInputs = allPlayers.map((player) => ({
        type: "steamID3" as const,
        value: String(player.account_id),
      }));

      const steamPlayers = await useSteamClient.ProfileService.GetPlayers(
        steamIDInputs
      );

      const steamPlayerMap = new Map<string, ISteamPlayer>();
      for (const steamPlayer of steamPlayers) {
        steamPlayerMap.set(steamPlayer.steamid, steamPlayer);
      }

      const team0WithSteamData = match.team_0_players.map((player) => ({
        deadlock_player: player,
        steam_player: steamPlayerMap.get(
          useSteamClient.ProfileService.convertToSteamId64({
            type: "steamID3",
            value: String(player.account_id),
          })!
        )!,
      }));

      const team1WithSteamData = match.team_1_players.map((player) => ({
        deadlock_player: player,
        steam_player: steamPlayerMap.get(
          useSteamClient.ProfileService.convertToSteamId64({
            type: "steamID3",
            value: String(player.account_id),
          })!
        )!,
      }));

      const data: IGenerateMatchImageOptions = {
        match: {
          id: match.match_id,
          duration: match.duration_s,
          average_badge_team0: match.average_badge_team0,
          average_badge_team1: match.average_badge_team1,
          winning_team: match.winning_team,
          team0WithSteamData,
          team1WithSteamData,
        },
      };

      const imageBuffer = await generateMatchImage(data);
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "match.png",
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTimestamp()
            .setFooter({
              text: `Generated in ${
                Date.now() - sent.interaction.createdTimestamp
              }ms`,
            }),
        ],
        files: [attachment],
      });
    } catch (err) {
      logger.error("Match command failed", err);

      if (err instanceof CommandError) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor("Red").setDescription(err.message),
          ],
        });
        return;
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(t("commands.match.fetch_failed")),
        ],
      });
    }
  }
}
