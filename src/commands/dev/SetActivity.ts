import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { botActivityStore } from '../../services/redis/stores/BotActivityStore';

export default class SetActivity extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'setactivity',
      description: "Changes the bot's activity status.",
      category: Category.Developer,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 1,
      dev: true,
      options: [
        {
          name: 'type',
          description: 'Type of activity',
          required: true,
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: 'Playing', value: 'Playing' },
            { name: 'Watching', value: 'Watching' },
            { name: 'Listening', value: 'Listening' },
            { name: 'Competing', value: 'Competing' },
            { name: 'Streaming', value: 'Streaming' },
          ],
        },
        {
          name: 'message',
          description: 'The activity message',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: 'status',
          description: 'Bot status',
          required: false,
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: 'Online', value: 'online' },
            { name: 'Idle', value: 'idle' },
            { name: 'Do Not Disturb', value: 'dnd' },
            { name: 'Invisible', value: 'invisible' },
          ],
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, _t: TFunction<'translation', undefined>) {
    const type = interaction.options.getString('type', true) as keyof typeof activityTypes;
    const message = interaction.options.getString('message', true);
    const status = interaction.options.getString('status') || 'online';

    const activityTypes = {
      Playing: 0,
      Streaming: 1,
      Listening: 2,
      Watching: 3,
      Competing: 5,
    };

    await interaction.client.user.setPresence({
      activities: [
        {
          name: message,
          type: activityTypes[type],
        },
      ],
      status: status as 'online' | 'idle' | 'dnd' | 'invisible',
    });

    await botActivityStore.set({
      message,
      status,
      type,
    });

    await interaction.reply({
      content: `✅ Activity set to **${type} ${message}** and status set to **${status}**`,
      flags: ['Ephemeral'],
    });
  }
}
