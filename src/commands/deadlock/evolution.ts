import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
  InteractionReplyOptions,
  InteractionEditReplyOptions,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import CommandError from "../../base/errors/CommandError";
import { logger } from "../..";
import PatchnoteSchema, {
  IPatchnote,
} from "../../base/schemas/PatchnoteSchema";
import { createPaginationSession } from "../../services/utils/createPagination";

type PatchChange = {
  patchTitle: string;
  date: Date;
  url: string;
  category: string;
  matchedChanges: string[];
};

export default class Evolution extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "evolution",
      description:
        "Retrieves history of all changes made to a specific hero or item",
      category: Category.Deadlock,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      dev: false,
      options: [
        {
          name: "search",
          description:
            "Name of the hero, item, or keyword to find relevant balance changes for",
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
    const search = interaction.options.getString("search", true);
    await interaction.deferReply();

    try {
      const results = await findMentionsInPatchnotes(search);

      if (results.length === 0) {
        await interaction.editReply(`No changes found for '${search}'.`);
        return;
      }

      const sessionId = interaction.id;

      const context = {
        userId: interaction.user.id,
        data: results,
        page: 0,
        perPage: 1,
        generateEmbed: (entry: PatchChange, page: number, total: number) =>
          createEmbedPage(entry, page, total),
      };

      const paginatedResponse = createPaginationSession(sessionId, context);
      await interaction.editReply(
        paginatedResponse as InteractionEditReplyOptions
      );
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        command: "evolution",
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
        await interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] });
      }
    }
  }
}

function createEmbedPage(
  result: PatchChange,
  index: number,
  total: number
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(result.patchTitle)
    .setURL(result.url)
    .setDescription(`**Category:** ${result.category}`)
    .addFields({
      name: "Changes",
      value:
        result.matchedChanges
          .map((c) => `- ${c}`)
          .join("\n")
          .slice(0, 1024) || "*No details*",
    })
    .setFooter({ text: `Page ${index + 1} of ${total}` })
    .setTimestamp(result.date)
    .setColor(0x2ecc71);
}

async function findMentionsInPatchnotes(
  searchTerm: string
): Promise<PatchChange[]> {
  const patchnotes: IPatchnote[] = await PatchnoteSchema.find({})
    .sort({ date: -1 })
    .lean();

  const results: PatchChange[] = [];

  // Build a regex to match the search term as a full word (case-insensitive)
  const wordRegex = new RegExp(`\\b${escapeRegex(searchTerm)}\\b`, "i");

  for (const patch of patchnotes) {
    for (const section of patch.changes) {
      const matchedChanges: string[] = [];

      for (const [name, changes] of Object.entries(section.changes)) {
        const nameMatches = wordRegex.test(name);

        for (const change of changes) {
          if (nameMatches || wordRegex.test(change)) {
            matchedChanges.push(change);
          }
        }
      }

      if (matchedChanges.length > 0) {
        results.push({
          patchTitle: patch.title,
          date: patch.date,
          url: patch.url,
          category: section.category,
          matchedChanges,
        });
      }
    }
  }

  return results;
}

// Utility: Escapes special characters for regex input
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
