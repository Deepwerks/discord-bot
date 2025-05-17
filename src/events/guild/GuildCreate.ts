import { EmbedBuilder, Events, Guild } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import GuildConfig from "../../base/schemas/GuildConfigSchema";
import { logger } from "../..";

export default class GuildCreate extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildCreate,
      description: "Guild join event",
      once: false,
    });
  }

  async Execute(guild: Guild) {
    try {
      if (!(await GuildConfig.exists({ guildId: guild.id }))) {
        await GuildConfig.create({ guildId: guild.id });
      }

      const owner = await guild.fetchOwner();
      const mexter = await this.client.users.fetch("282548643142172672");

      await owner
        .send({
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setTitle(
                `${this.client.user?.displayName} has been added to Your server`
              )
              .setDescription(
                `Hi there! 👋\nThanks for adding **${this.client.user?.displayName}** to your server! We are excited to be part of your community!\n\nIf you’re planning to actively use the bot, we **strongly recommend** joining our [Support Server](https://discord.gg/C968DEVs6j) to stay informed about **updates, planned features**, and any **potential downtime**.\n\nWe're here to help if you run into issues or have suggestions. Thanks again, see you in the Cursed Apple!`
              )
              .setAuthor({
                name: mexter.displayName,
                iconURL: mexter.displayAvatarURL(),
              }),
          ],
        })
        .catch((err) => logger.warn(err));

      logger.info(`${this.client.user?.tag} has been added to a new Guild!`, {
        guildId: guild.id,
        guildName: guild.name,
        guildOwnerId: guild.ownerId,
      });
    } catch (error) {
      logger.error(error);
    }
  }
}
