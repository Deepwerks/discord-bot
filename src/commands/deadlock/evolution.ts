import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
  InteractionEditReplyOptions,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import PatchnoteSchema, { IPatchnote } from '../../base/schemas/PatchnoteSchema';
import { createPaginationSession } from '../../services/utils/createPagination';
import i18n from '../../services/i18n';

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
      name: 'evolution',
      description: 'Retrieves history of all changes made to a specific hero or item',
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 2,
      dev: false,
      options: [
        {
          name: 'search',
          description: 'Name of the hero, item, or keyword to find relevant balance changes for',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const search = interaction.options.getString('search', true);
    await interaction.deferReply();

    const results = await findMentionsInPatchnotes(search);

    if (results.length === 0) {
      await interaction.editReply(t('commands.evolution.no_results', { search }));
      return;
    }

    const sessionId = interaction.id;

    const context = {
      userId: interaction.user.id,
      data: results,
      page: 0,
      perPage: 1,
      generateEmbed: (entry: PatchChange, page: number, total: number) =>
        createEmbedPage(t, entry, page, total, search),
    };

    const paginatedResponse = createPaginationSession(sessionId, context);
    await interaction.editReply(paginatedResponse as InteractionEditReplyOptions);
  }
}

function createEmbedPage(
  t: ReturnType<typeof i18n.getFixedT>,
  result: PatchChange,
  index: number,
  total: number,
  search: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(t('commands.evolution.embed_title', { search }))
    .setDescription(`[${result.patchTitle}](${result.url})`)
    .addFields({
      name: 'Changes',
      value:
        result.matchedChanges
          .map((c) => `- ${c}`)
          .join('\n')
          .slice(0, 1024) || t('commands.evolution.no_details'),
    })
    .setFooter({
      text: t('commands.evolution.footer_page', { current: index + 1, total }),
    })
    .setTimestamp(result.date)
    .setColor(0x2ecc71);
}

async function findMentionsInPatchnotes(searchTerm: string): Promise<PatchChange[]> {
  const patchnotes: IPatchnote[] = await PatchnoteSchema.find({}).sort({ date: -1 }).lean();

  const results: PatchChange[] = [];

  // Build a regex to match the search term as a full word (case-insensitive)
  const wordRegex = new RegExp(`\\b${escapeRegex(searchTerm)}\\b`, 'i');

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
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
