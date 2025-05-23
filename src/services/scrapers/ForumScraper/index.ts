import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import PatchnoteSchema, { IPatchnote, PatchNote } from '../../../base/schemas/PatchnoteSchema';
import { logger } from '../../..';
import { IDeadlockPatch } from '../../clients/DeadlockClient/DeadlockPathService/entities/DeadlockPatch';

export default class ForumScraper {
  private axiosInstance: AxiosInstance;
  private cheerioInstance: typeof cheerio;

  constructor(axiosInstance: AxiosInstance = axios, cheerioInstance: typeof cheerio = cheerio) {
    this.axiosInstance = axiosInstance;
    this.cheerioInstance = cheerioInstance;
  }

  public async scrapeMany(patches: IDeadlockPatch[]) {
    const results = await Promise.allSettled(patches.map((patch) => this.scrape(patch)));

    results.forEach((result, index) => {
      const patch = patches[index];
      if (result.status === 'fulfilled') {
        logger.info(`Successfully scraped patch: ${patch.title}`);
      } else {
        logger.error(`Failed to scrape patch: ${patch.title}`, result.reason);
      }
    });
  }

  public async scrape(patch: IDeadlockPatch) {
    const { title, pub_date, link, guid, author } = patch;

    try {
      const { data: html } = await this.axiosInstance.get(link);
      const $ = this.cheerioInstance.load(html);

      const changesRaw = $('div[class="bbWrapper"]').text();
      const changes = this.parsePatchNotes(changesRaw);

      await this.savePatchnote({
        guid: guid.text,
        title,
        author,
        date: new Date(pub_date),
        url: link,
        changes,
      });
    } catch (error) {
      logger.error(`Failed to scrape patch from link: ${link}`, error);
    }
  }

  private async savePatchnote(data: IPatchnote) {
    try {
      await PatchnoteSchema.create(data);
    } catch (error) {
      logger.error('Failed to save scraped patchnote', error);
    }
  }

  private parsePatchNotes(input: string): PatchNote[] {
    const lines = input.split('\n');
    const result: PatchNote[] = [];
    let currentCategory = '';
    let currentEntry: PatchNote | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      const categoryMatch = trimmed.match(/^\[ (.+?) \]$/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1];
        currentEntry = { category: currentCategory, changes: {} };
        result.push(currentEntry);
        continue;
      }

      if (trimmed.startsWith('-')) {
        const content = trimmed.slice(1).trim();

        // Initialize Uncategorized entry if needed
        if (!currentEntry) {
          currentCategory = 'Uncategorized';
          currentEntry = { category: currentCategory, changes: {} };
          result.push(currentEntry);
        }

        if (['Heroes', 'Items'].includes(currentCategory)) {
          const heroOrItemMatch = content.match(/^([A-Za-z &']+): (.+)$/);
          if (heroOrItemMatch) {
            const name = heroOrItemMatch[1].trim();
            const change = heroOrItemMatch[2].trim();

            if (!currentEntry.changes[name]) {
              currentEntry.changes[name] = [];
            }
            currentEntry.changes[name].push(change);
          } else {
            if (!currentEntry.changes['Misc']) {
              currentEntry.changes['Misc'] = [];
            }
            currentEntry.changes['Misc'].push(content);
          }
        } else {
          if (!currentEntry.changes['General']) {
            currentEntry.changes['General'] = [];
          }
          currentEntry.changes['General'].push(content);
        }
      }
    }

    return result;
  }
}
