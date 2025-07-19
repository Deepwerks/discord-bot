import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { GuildSubscriptions } from '../../services/database/orm/init';

export default class DeactivateSubscription extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'deactivate-subscription',
      description: 'Deactivates registered subscription',
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
      ],
      dev: false,
      limitedServers: ['1363157938558210079', '1116312943584354374', `1369999947050778665`],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, _t: TFunction<'translation', undefined>) {
    const guildId = interaction.options.getString('guild-id', true);

    const guildSubscription = await GuildSubscriptions.findOne({
      where: { guildId: guildId },
    });
    if (!guildSubscription) {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Subscription Does Not Exists')
        .setDescription(
          `There is no registered or active subscription for the guild with ID \`${guildId}\`.`
        )
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
      isActive: false,
    });

    const embed = new EmbedBuilder()
      .setTitle('ℹ️ Subscription Deactivated!')
      .setDescription(`A subscription has been deactivated for **${guild.name}**.`)
      .setColor('Grey')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
