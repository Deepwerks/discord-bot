import { EmbedBuilder, Events, Guild } from 'discord.js';
import CustomClient from '../../base/classes/CustomClient';
import Event from '../../base/classes/Event';
import { logger } from '../..';
import { Guilds } from '../../services/database/orm/init';

export default class GuildCreate extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildCreate,
      description: 'Guild join event',
      once: false,
    });
  }

  async Execute(guild: Guild) {
    try {
      const owner = await guild.fetchOwner();

      logger.info(`${this.client.user?.tag} has been added to a new Guild!`, {
        guildId: guild.id,
        guildName: guild.name,
        guildOwnerId: guild.ownerId,
      });

      const storedGuild = await Guilds.findOne({
        where: {
          guildId: guild.id,
        },
        paranoid: false,
      });

      if (!storedGuild) {
        await Guilds.create({
          guildId: guild.id,
          ownerDiscordId: owner.user.id,
        });
      } else if (storedGuild.isSoftDeleted()) {
        await storedGuild.restore();
      }

      const author = await this.client.users.fetch(this.client.config.developer_user_ids[0]);

      const welcomeEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`${this.client.user?.displayName} has been added to Your server`)
        .setDescription(
          `Hi there! 👋\nThanks for adding **${this.client.user?.displayName}** to your server! We’re excited to be part of your community!\n\n` +
            `If you’re planning to actively use the bot, we **strongly recommend** joining our [Support Server](https://discord.gg/C968DEVs6j) to stay informed about **updates, planned features**, and any **potential downtime**.\n\n` +
            `We’re here to help if you run into issues or have suggestions. Thanks again — see you in the Cursed Apple!`
        )
        .setAuthor({
          name: author.displayName,
          iconURL: author.displayAvatarURL(),
        });

      const aiEmbed = new EmbedBuilder()
        .setColor('Blurple')
        .setTitle('🧠 Try Our New AI Chatbot Feature!')
        .setDescription(
          `You can now enable our AI chatbot feature on your server to offer helpful and interactive conversations.\n\n` +
            `To enable it:\n` +
            `• Join our [Support Server](https://discord.gg/C968DEVs6j)\n` +
            `• Open a dev ticket in \`#contact-dev\`\n` +
            `• Provide your **Server ID**\n\n` +
            `We’ll start you with **50 requests/day**, and can increase that if needed.\n\n` +
            `Once enabled, just mention **DeadlockAssistant** in your server to start a conversation!`
        );

      await owner
        .send({
          embeds: [welcomeEmbed, aiEmbed],
        })
        .catch((err) => logger.warn(err));
    } catch (error) {
      logger.error('Error: ', error);
    }
  }
}
