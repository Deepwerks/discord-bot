import { EmbedBuilder, Events, Guild } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import GuildConfig from "../../base/schemas/GuildConfig";

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
    } catch (error) {
      console.error(error);
    }

    const owner = await guild.fetchOwner();
    owner
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription("Hey! Thanks for adding to your server! 😁"),
        ],
      })
      .catch((err) => console.warn(err));
  }
}
