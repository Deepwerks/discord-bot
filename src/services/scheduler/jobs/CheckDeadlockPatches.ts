import { logger, useDeadlockClient } from '../../..';
import PatchnoteSchema from '../../../base/schemas/PatchnoteSchema';
import ForumScraper from '../../scrapers/ForumScraper';

export default async () => {
  try {
    const scraper = new ForumScraper();

    const patches = await useDeadlockClient.PatchService.FetchPatches();
    const lastStoredPatch = await PatchnoteSchema.findOne({}, {}, { sort: { date: -1 } });

    if (!lastStoredPatch) {
      await scraper.scrapeMany(patches);
      logger.info(`Inserted ${patches.length} patches as the first batch.`);
      return;
    }

    const newPatches = patches.filter((patch) => {
      return new Date(patch.pubDate) > lastStoredPatch.date;
    });

    if (newPatches.length > 0) {
      await scraper.scrapeMany(newPatches);
      logger.info(`Inserted ${newPatches.length} new patches.`);
    } else {
      logger.info('No new patches to store.');
    }
  } catch (error) {
    logger.error('Error fetching or storing patches:', error);
  }
};
