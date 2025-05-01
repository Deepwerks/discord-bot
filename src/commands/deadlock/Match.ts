import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import { generateMatchImage } from "../../services/utils/generateMatchImage";
import { logger, useDeadlockClient, useStatlockerClient } from "../..";
import StoredPlayer from "../../base/schemas/StoredPlayerSchema";
import CommandError from "../../base/errors/CommandError";
import { resolveToSteamID64 } from "../../services/utils/resolveToSteamID64";

export default class Match extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "match",
      description: "Get Deadlock match details by match or player ID",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 8,
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

      let deadlockMatch = await useDeadlockClient.MatchService.GetMatch(
        _matchId
      );

      const allPlayers = [
        ...deadlockMatch.team_0_players,
        ...deadlockMatch.team_1_players,
      ];

      const results = await useStatlockerClient.ProfileService.GetProfilesCache(
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

      const showPlayersButton = new ButtonBuilder()
        .setLabel("Show Players")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("show_players:" + match.match_id)
        .setEmoji("👥");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        showPlayersButton,
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
