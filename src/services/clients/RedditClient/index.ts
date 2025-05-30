import { EmbedBuilder } from 'discord.js';
import { logger } from '../../..';
import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import CommandError from '../../../base/errors/CommandError';
import { RedditTokenResponse, RedditApiResponse } from './interfaces';

export default class RedditClient extends BaseClient {
  private token: string | undefined;
  private tokenExpiry: number | undefined;
  private userAgent: string;

  constructor(options: IBaseApiOptions) {
    super(options);
    this.userAgent = `discord:${this.config.discord_client_id}:v${this.config.bot_version} (by /u/Mexter-)`;
  }

  async Init() {
    logger.info('Connecting to Reddit...');

    const token = await this.getRedditAccessToken();
    this.token = token;
  }

  async GetDeadlockMemeEmbed(): Promise<EmbedBuilder | null> {
    try {
      await this.ensureValidToken();
      const token = this.token;

      if (!token) {
        throw new CommandError(`Failed to send request to Reddit.`);
      }

      const res = await fetch('https://oauth.reddit.com/r/DeadlockTheGame/top?limit=25&t=week', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': this.userAgent,
        },
      });

      if (!res.ok) {
        throw new CommandError(`Reddit API returned status ${res.status}`);
      }

      const data: RedditApiResponse = await res.json();

      if (!data?.data?.children) {
        throw new CommandError('Unexpected response format from Reddit API');
      }

      const posts = data.data.children.filter(
        (post) =>
          !post.data.over_18 &&
          post.data.post_hint === 'image' &&
          post.data.link_flair_text?.toLowerCase() === 'meme'
      );

      if (posts.length === 0) return null;

      const random = posts[Math.floor(Math.random() * posts.length)];
      const post = random.data;

      return new EmbedBuilder()
        .setTitle(post.title)
        .setImage(post.url)
        .setURL(`https://reddit.com${post.permalink}`)
        .setFooter({ text: `Posted by u/${post.author}` })
        .setColor(0xff4500);
    } catch (error) {
      logger.error(error);
      throw new CommandError('Failed to fetch memes from Reddit.');
    }
  }

  private async getRedditAccessToken(): Promise<string> {
    const clientId = this.config.reddit_client_id;
    const clientSecret = this.config.reddit_client_secret;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.userAgent,
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      throw new Error(`Failed to get Reddit access token: ${res.status}`);
    }

    const data: RedditTokenResponse = await res.json();

    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return data.access_token;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.token || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      logger.info('Refreshing Reddit access token...');
      this.token = await this.getRedditAccessToken();
    }
  }
}
