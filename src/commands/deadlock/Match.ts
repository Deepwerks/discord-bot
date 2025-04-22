import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
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
import { useDeadlockClient, useSteamClient } from "../..";
import StoredPlayer from "../../base/schemas/StoredPlayer";
import CommandError from "../../base/errors/CommandError";
import { resolveToSteamID64 } from "../../services/utils/resolveToSteamID64";
import { ICachedSteamProfile } from "../../base/interfaces/ICachedSteamProfile";

export default class Match extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "match",
      description: "Get Deadlock match details by match or player ID",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 0,
      dev: true,
      options: [
        {
          name: "id",
          description:
            'Match ID (default) or Steam ID — use "me" for your latest match',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "type",
          description: "Specify if it's a match or player ID",
          required: false,
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "Match ID",
              value: "match_id",
            },
            {
              name: "Player ID",
              value: "player_id",
            },
          ],
        },
      ],
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    const id = interaction.options.getString("id")!;
    const type =
      id === "me"
        ? "player_id"
        : interaction.options.getString("type") ?? "match_id";

    const startTime = performance.now();

    await interaction.deferReply();

    try {
      let _matchId: string = id;

      if (type === "player_id") {
        let steamID64 = id;
        if (id === "me") {
          const storedPlayer = await StoredPlayer.findOne({
            discordId: interaction.user.id,
          });

          if (!storedPlayer)
            throw new CommandError(t("errors.steam_not_yet_stored"));

          steamID64 = storedPlayer.steamId;
        } else {
          steamID64 = await resolveToSteamID64(id);
        }

        const lastMatchOfPlayer =
          await useDeadlockClient.PlayerService.GetMatchHistory(steamID64, 1);

        if (!lastMatchOfPlayer.length)
          throw new CommandError("Player do not have a match history.");

        _matchId = String(lastMatchOfPlayer[0].match_id);
      }

      const match = await useDeadlockClient.MatchService.GetMatch(_matchId!);

      const allPlayers = [...match.team_0_players, ...match.team_1_players];

      const steamPlayers =
        await useSteamClient.ProfileService.GetProfilesCached(
          allPlayers.map((p) => String(p.account_id))
        );

      const steamPlayerMap = new Map<string, ICachedSteamProfile>();
      for (const steamPlayer of steamPlayers) {
        steamPlayerMap.set(steamPlayer!.steamid, steamPlayer!);
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

      const linkButton = new ButtonBuilder()
        .setLabel("📈 View on Statlocker")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://statlocker.gg/match/${match.match_id}`);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        linkButton
      );

      const imageBuffer = await generateMatchImage(data);
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
      logger.error("Match command failed", err);

      if (err instanceof CommandError) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor("Red").setDescription(err.message),
          ],
        });
      } else {
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
}
