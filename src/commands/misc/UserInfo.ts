import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { logger, useStatlockerClient } from '../..';
import { TFunction } from 'i18next';
import CommandError from '../../base/errors/CommandError';
import StatlockerProfile from '../../services/clients/StatlockerClient/services/StatlockerProfileService/entities/StatlockerProfile';
import { StoredPlayers } from '../../services/database/orm/init';

export default class UserInfo extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'userinfo',
      description: 'Get discord user info',
      category: Category.Misc,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      options: [
        {
          name: 'user',
          description: 'Select a user to get info about',
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const user = interaction.options.getUser('user', true);
    await interaction.deferReply();

    try {
      const discordId = user.id;

      const storedUser = await StoredPlayers.findOne({ where: { discordId } });
      let statlockerProfile: StatlockerProfile | null = null;

      if (storedUser) {
        statlockerProfile = await useStatlockerClient.ProfileService.GetProfile(
          Number(storedUser.steamId)
        );
      }

      const descriptionText = [
        `### 👤 Discord Info`,
        `**Username**: ${user.username}`,
        `**User Id**: \`${user.id}\``,
        `**Account Created**: <t:${Math.floor(user.createdTimestamp / 1000)}:F>`,

        storedUser
          ? [
              `\n### 🎮 Linked Steam Account`,
              `**Steam Id** (use this in commands): \`${storedUser.steamId}\``,
              `**Authenticated**: ${storedUser.authenticated ? '✅ Yes' : '❌ No'}`,
              `**Authentication Count**: ${storedUser.authCount ?? 0}`,
            ]
              .filter(Boolean)
              .join('\n')
          : '\n⚠️ No linked Steam account found. \nIf this is your account, use the /store command to link your Steam for easier access to features and commands!',
      ].join('\n');

      // Build the embed
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'User Information', iconURL: this.client.user?.displayAvatarURL() })
        .setDescription(descriptionText)
        .setThumbnail(user.displayAvatarURL())
        .setColor('Random')
        .setTimestamp();

      if (statlockerProfile?.name) {
        embed
          .setTitle(statlockerProfile.name)
          .setURL(`https://statlocker.gg/profile/${storedUser?.steamId}`);
      } else {
        embed.setTitle(user.displayName);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.name,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(error instanceof CommandError ? error.message : t('errors.generic_error'));

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
