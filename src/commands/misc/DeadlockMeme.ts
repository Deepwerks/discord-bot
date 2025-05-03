import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import ChangelogSchema from "../../base/schemas/ChangelogSchema";
import { logger } from "../..";
import { TFunction } from "i18next";
import CommandError from "../../base/errors/CommandError";

export default class DeadlockMeme extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "deadlockmeme",
      description: "Get a deadlock meme from /r/deadlockthegame",
      category: Category.Misc,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [],
      dev: false,
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    await interaction.deferReply();

    try {
      const memeUrl = await getDeadlockMemeEmbed();

      if (memeUrl) {
        await interaction.editReply({ embeds: [memeUrl] });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("No memes found in the last week"),
          ],
        });
      }
    } catch (error) {
      logger.error(error);

      if (error instanceof CommandError) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor("Red").setDescription(error.message),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(t("errors.generic_error")),
          ],
        });
      }
    }
  }
}

async function getDeadlockMemeEmbed(): Promise<EmbedBuilder | null> {
  try {
    const res = await fetch(
      "https://www.reddit.com/r/DeadlockTheGame/top.json?limit=25&t=week",
      {
        headers: {
          "User-Agent": "linux:deadlockassistant:1.6.0 (by /u/Mexter-)",
        },
      }
    );

    if (!res.ok) {
      throw new CommandError(`Reddit API returned status ${res.status}`);
    }

    const data = await res.json();

    if (!data?.data?.children) {
      throw new CommandError("Unexpected response format from Reddit API");
    }

    const posts = data.data.children.filter(
      (post: any) =>
        !post.data.over_18 &&
        post.data.post_hint === "image" &&
        post.data.link_flair_text?.toLowerCase() === "meme"
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
    throw new CommandError("Failed to fetch memes from Reddit.");
  }
}
