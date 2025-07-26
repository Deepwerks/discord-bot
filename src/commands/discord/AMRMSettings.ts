import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import ConfigService from '../../services/amrm/managers/guildAMRMManager/services/configService';
import DiscordService from '../../services/amrm/managers/guildAMRMManager/services/discordService';
import GuildAMRMManager from '../../services/amrm/managers/guildAMRMManager';

export default class AMRMSettings extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'amrm-settings',
      description: 'Admin command – Set up and manage the AMRM system in your server.',
      category: Category.Discord,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 3,
      options: [
        {
          name: 'enabled',
          description:
            'Enable or disable the AMRM module. Disabling it will automatically remove all created channels.',
          required: true,
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: ['Ephemeral'] });

    const enabled = interaction.options.getBoolean('enabled', true);

    const configService = new ConfigService(interaction.guildId!);
    const discordService = new DiscordService(this.client);

    const manager = new GuildAMRMManager(discordService, configService);

    if (enabled) {
      await manager.handleEnableAMRM();
    } else await manager.handleDisableAMRM();

    await interaction.editReply({
      content: `Advanced Match Review Module: ${enabled ? 'enabled' : 'disabled'}`,
    });
  }
}
