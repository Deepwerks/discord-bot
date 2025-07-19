import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  time,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { GuildSubscriptions } from '../../services/database/orm/init';
import dayjs from 'dayjs';

export default class RenewSubscription extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'renew-subscription',
      description: 'Renew registered subscription',
      category: Category.Developer,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 3,
      options: [
        {
          name: 'guild-id',
          description: 'Guild ID',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: 'manager',
          description: 'Guild manager',
          required: false,
          type: ApplicationCommandOptionType.User,
        },
        {
          name: 'daily-limit',
          description: 'Daily limit',
          required: false,
          type: ApplicationCommandOptionType.Integer,
          choices: [
            {
              name: '1000 req/day',
              value: 1000,
            },
            {
              name: '3000 req/day',
              value: 3000,
            },
          ],
        },
      ],
      dev: false,
      limitedServers: ['1363157938558210079', '1116312943584354374', '1369999947050778665'],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, _t: TFunction<'translation', undefined>) {
    const guildId = interaction.options.getString('guild-id', true);
    const manager = interaction.options.getUser('manager');
    const dailyLimit = interaction.options.getInteger('daily-limit');

    const guildSubscription = await GuildSubscriptions.findOne({
      where: { guildId: guildId },
      paranoid: true,
    });
    if (!guildSubscription) {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Subscription Does Not Exists')
        .setDescription(`There is no subscription registered for the guild with ID \`${guildId}\`.`)
        .setColor('Yellow')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const guild = await this.client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Guild Not Found')
        .setDescription(
          `Could not retrieve the guild with ID \`${guildId}\`. This may happen if the guild does not exist or the bot has not been added to it. Please ensure the bot is invited to the server. You can get an invite link by using the **/invite** command.`
        )
        .setColor('Red')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    await guildSubscription.update({
      isActive: true,
      dailyLimit: dailyLimit ?? guildSubscription.dailyLimit,
      userId: manager?.id ?? guildSubscription.userId,
    });

    const renewalDate = dayjs(guildSubscription.updatedAt).add(1, 'month');
    const embed = new EmbedBuilder()
      .setTitle('✅ Subscription Renewal Successful!')
      .setDescription(`A subscription has been updated for **${guild.name}**.`)
      .addFields(
        { name: 'Guild', value: `\`${guild.name}\``, inline: true },
        { name: 'Manager', value: `<@${guildSubscription.userId}>`, inline: true },
        { name: '\u200B', value: '\u200B', inline: false },
        {
          name: 'Daily Chatbot Limit',
          value: `\`${guildSubscription.dailyLimit}\` requests/day`,
          inline: true,
        },
        {
          name: 'Renewal Date',
          value: `${time(renewalDate.toDate(), 'F')} (auto-renews)`,
          inline: true,
        },
        {
          name: 'Important Notes',
          value: [
            '• ⚠️ **Do not leave this support server** while your subscription is active.',
            '• Renewal will be processed automatically.',
            '• If something goes wrong, please contact the developers in this channel.',
          ].join('\n'),
        }
      )
      .setColor('Green')
      .setTimestamp();

    const thankYouEmbed = new EmbedBuilder().setColor('DarkVividPink').addFields({
      name: '💖 Thank You!',
      value: `We sincerely appreciate your support — it helps us keep the project going! Enjoy using our bot! 🚀`,
    });

    await interaction.reply({ embeds: [embed, thankYouEmbed] });
  }
}
