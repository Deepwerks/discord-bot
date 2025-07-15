import { ButtonInteraction, ChannelType, PermissionsBitField, GuildChannel } from 'discord.js';
import CommandError from '../../../base/errors/CommandError';
import { logger } from '../../..';

export const initAMRM = async (interaction: ButtonInteraction) => {
  const [_action, _guildId, enabled] = interaction.customId.split(':');
  const guild = interaction.guild!;
  const me = guild.members.me;

  if (!me) throw new Error('Bot member not found in guild');

  const requiredPermissions = [
    PermissionsBitField.Flags.ManageChannels,
    PermissionsBitField.Flags.ViewChannel,
  ];

  const hasAllPerms = requiredPermissions.every((perm) => me.permissions.has(perm));

  if (!hasAllPerms) {
    throw new CommandError('Missing required permissions to create channels');
  }

  if (!guild.features.includes('COMMUNITY')) {
    throw new CommandError('Guild does not support forum channels (COMMUNITY not enabled)');
  }

  if (enabled !== 'true') {
    throw new CommandError("Can't create AMRM channels, since it is disabled in this server.");
  }

  const createdChannels: GuildChannel[] = [];

  try {
    // category
    const category = await guild.channels.create({
      name: 'Review System (AMRM)',
      type: ChannelType.GuildCategory,
    });
    createdChannels.push(category);

    // forum
    const forum = await guild.channels.create({
      name: 'match-reviews',
      type: ChannelType.GuildForum,
      parent: category.id,
      topic: 'All match reviews go here.',
      reason: 'Initial setup for review system',
      availableTags: [
        { name: 'Need Review', moderated: true },
        { name: 'Reviewed', moderated: true },
      ],
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.CreatePublicThreads,
            PermissionsBitField.Flags.CreatePrivateThreads,
            PermissionsBitField.Flags.SendMessagesInThreads,
          ],
        },
        {
          id: me.id,
          allow: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.CreatePublicThreads,
            PermissionsBitField.Flags.CreatePrivateThreads,
            PermissionsBitField.Flags.SendMessagesInThreads,
          ],
        },
      ],
    });
    createdChannels.push(forum);

    // dashboard
    const dashboard = await guild.channels.create({
      name: 'Dashboard',
      type: ChannelType.GuildText,
      parent: category.id,
      topic: 'Request a match review here using the buttons.',
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.SendMessages],
        },
        {
          id: me.id,
          allow: [PermissionsBitField.Flags.SendMessages],
        },
      ],
      reason: 'User interface for review requests',
    });
    createdChannels.push(dashboard);

    return {
      category,
      forum,
      dashboard,
    };
  } catch (error) {
    for (const ch of createdChannels.reverse()) {
      try {
        await ch.delete('Rolling back AMRM setup due to failure');
      } catch (e) {
        logger.warn(`Failed to delete channel ${ch.id}:`, e);
      }
    }
    throw error;
  }
};
