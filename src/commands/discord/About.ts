import { ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { getBotVersion } from '../../services/utils/getBotVersion';

export default class About extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'about',
      description: 'About me',
      category: Category.Utilities,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction) {
    const aboutme = `\`\`\`
Hi there! 👋  
Deadlock Assistant is your handy companion for everything Deadlock-related.  
It fetches real-time match data, player stats, and full match history directly from the DeadlockAPI — so you're always in the loop!
\`\`\`\n\n`;

    const links = [
      {
        text: '➕ Invite me to your server!',
        link: 'https://discord.com/oauth2/authorize?client_id=1361785119374835984&permissions=1688852007816256&integration_type=0&scope=bot',
      },
      {
        text: '💬 Join our Support Server',
        link: 'https://discord.gg/C968DEVs6j',
      },
      {
        text: '🌍 Join us in making the bot multilingual',
        link: 'https://github.com/Deepwerks/discord-bot/discussions/48',
      },
    ];

    const author = await this.client.users.fetch('282548643142172672');

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Random')
          .setTitle('About Deadlock Assistant')
          .setDescription(aboutme + links.map((l) => `[${l.text}](${l.link})`).join('\n'))
          .setAuthor({
            name: author.username,
            iconURL: author.displayAvatarURL(),
          })
          .setFooter({ text: `DeadlockAssistant - v${getBotVersion()}` }),
      ],
    });
  }
}
