import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  escapeMarkdown,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import CommandError from "../../base/errors/CommandError";
import {
  logger,
  useAssetsClient,
  useDeadlockClient,
  useStatlockerClient,
} from "../..";
import { getFormattedMatchTime } from "../../services/utils/getFormattedMatchTime";
import pLimit from "p-limit";
import StoredPlayer from "../../base/schemas/StoredPlayerSchema";

export default class History extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "history",
      description: "Get player's match history",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      dev: false,
      options: [
        {
          name: "player",
          description:
            'Player\'s name or SteamID | Use "me" to get your match history!',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "private",
          description: "Only show result to you",
          required: false,
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    const player = interaction.options.getString("player");
    const ephemeral = interaction.options.getBoolean("private", false);

    let steamAuthNeeded: boolean = false;

    try {
      let _steamId = player;

      if (player === "me") {
        const storedPlayer = await StoredPlayer.findOne({
          discordId: interaction.user.id,
        });

        if (!storedPlayer)
          throw new CommandError(t("errors.steam_not_yet_stored"));
        steamAuthNeeded =
          storedPlayer.authenticated === undefined ||
          storedPlayer.authenticated === false;

        _steamId = storedPlayer.steamId;
      }

      const steamProfile =
        await useStatlockerClient.ProfileService.GetProfileCache(_steamId!);

      if (!steamProfile) {
        throw new CommandError(t("errors.steam_profile_not_found"));
      }

      const matches = await useDeadlockClient.PlayerService.GetMatchHistory(
        String(steamProfile.accountId),
        15
      );
      const mmrMatches = await useDeadlockClient.PlayerService.GetMMRHistory(
        String(steamProfile.accountId),
        15
      );

      const limit = pLimit(10);
      const uniqueHeroIds = [...new Set(matches.map((m) => m.hero_id))];

      const heroEntries = await Promise.all(
        uniqueHeroIds.map(async (id) => {
          const hero = await useAssetsClient.HeroService.GetHeroCached(id);
          return [id, hero?.name ?? "Unknown"];
        })
      );
      const heroMap = Object.fromEntries(heroEntries);

      const matchesString: string[] = await Promise.all(
        matches.map((match) =>
          limit(async () => {
            const heroName = heroMap[match.hero_id];

            const champion = heroName.slice(0, 14).padEnd(15);
            const time = getFormattedMatchTime(match.match_duration_s).padEnd(
              9
            );
            const mmr = mmrMatches.find(
              (m) => m.match_id === match.match_id
            )?.rank;
            const rank = (await useAssetsClient.DefaultService.GetRankName(mmr))
              ?.slice(0, 12)
              .padEnd(13);
            const kda =
              `(${match.player_kills}/${match.player_deaths}/${match.player_assists})`.padEnd(
                13
              );
            const matchId = match.match_id.toString().padEnd(13);
            const date = match.start_date.format("D MMM YYYY").padEnd(12);

            const line = `${champion}${time}${rank}${kda}${matchId}${date}`;

            const prefix = match.match_result === match.player_team ? "+" : "-";
            return `${prefix}${line}`;
          })
        )
      );

      const header =
        "Character".padEnd(16) +
        "Time".padEnd(9) +
        "Rank".padEnd(13) +
        "KDA".padEnd(13) +
        "Match ID".padEnd(13) +
        "Date".padEnd(12);

      const response = `\`\`\`diff
${escapeMarkdown(steamProfile.name)}'s (${steamProfile.accountId}) last ${
        matches.length
      } matches:

${header}
${matchesString.join("\n")}
      \`\`\``;

      const linkButton = new ButtonBuilder()
        .setLabel(t("commands.history.view_on_statlocker"))
        .setStyle(ButtonStyle.Link)
        .setURL(`https://statlocker.gg/profile/${steamProfile.accountId}`)
        .setEmoji("1367520315244023868");

      const selectMatchButton = new StringSelectMenuBuilder()
        .setCustomId(`get_match_details`)
        .setPlaceholder(t("commands.history.match_details_placeholder"))
        .addOptions(
          matches.map((match) => {
            const heroName = heroMap[match.hero_id];
            const win =
              match.match_result === match.player_team ? "Win" : "Loss";

            return new StringSelectMenuOptionBuilder()
              .setLabel(`${heroName} — ${win}`)
              .setDescription(
                `${String(match.match_id)} (${match.start_date.format(
                  "D MMMM, YYYY"
                )})`
              )
              .setValue(String(match.match_id));
          })
        );

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        linkButton
      );
      const interactiveRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          selectMatchButton
        );

      await interaction.reply({
        content: response,
        components: [buttonRow, interactiveRow],
        flags: ephemeral ? ["Ephemeral"] : [],
      });

      if (steamAuthNeeded) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(t("commands.history.steam_auth_required_title"))
          .setDescription(
            t("commands.history.steam_auth_required_description")
          );

        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
      }
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.name,
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
