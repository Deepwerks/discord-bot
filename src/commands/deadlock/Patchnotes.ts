import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import CommandError from '../../base/errors/CommandError';
import { logger, useDeadlockClient } from '../..';
import PatchnoteSchema from '../../base/schemas/PatchnoteSchema';
import ForumScraper from '../../services/scrapers/ForumScraper';

export default class Patchnotes extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'patchnotes',
      description: 'Retrieves the latest Deadlock patch',
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      dev: false,
      options: [],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, _t: TFunction<'translation', undefined>) {
    await interaction.deferReply();

    const patches = await useDeadlockClient.PatchService.FetchPatches();
    let lastStoredPatch = await PatchnoteSchema.findOne({}, {}, { sort: { date: -1 } }).lean();

    if (!lastStoredPatch) {
      const scraper = new ForumScraper();
      await scraper.scrapeMany(patches);

      logger.info(`Inserted ${patches.length} patches as the first batch.`);

      lastStoredPatch = await PatchnoteSchema.findOne({}, {}, { sort: { date: -1 } }).lean();
    }

    const newPatches = patches.filter((patch) => {
      return new Date(patch.pubDate) > lastStoredPatch!.date;
    });

    if (newPatches.length > 0) {
      const scraper = new ForumScraper();

      await scraper.scrapeMany(newPatches);
      logger.info(`Inserted ${newPatches.length} new patches.`);

      lastStoredPatch = await PatchnoteSchema.findOne({}, {}, { sort: { date: -1 } }).lean();

      if (!lastStoredPatch) {
        throw new CommandError('No patch found');
      }
    }

    const linkButton = new ButtonBuilder()
      .setLabel('Read More')
      .setStyle(ButtonStyle.Link)
      .setURL(lastStoredPatch!.url)
      .setEmoji('📰');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#00BFFF')
          .setTitle(`🛠️ Patch Notes - ${lastStoredPatch!.title}`)
          .setDescription(
            `
                ${lastStoredPatch!.changes
                  .map((change) => {
                    return `\`${change.category.padEnd(20)} ${countLeafProps(change.changes)}x\``;
                  })
                  .join('\n')}
                `
          )
          .setFooter({
            text: `Posted: ${lastStoredPatch!.date.toLocaleDateString()}`,
          }),
      ],
      components: [row],
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countLeafProps(obj: any): number {
  if (typeof obj !== 'object' || obj === null) return 0;

  let count = 0;

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      count += countLeafProps(value);
    } else {
      count += 1;
    }
  }

  return count;
}
