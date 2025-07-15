import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { Guilds } from '../../services/database/orm/init';
import { createControlPanel } from '../../services/utils/AMRM/createControlPanel';

export default class AMRMSettings extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'amrm-settings',
      description: 'Brings up control panel for the Advanced Match Review Module',
      category: Category.Discord,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 3,
      options: [],
      dev: false,
    });
  }

  async Execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    let guildConfig = await Guilds.findByPk(interaction.guild!.id);

    if (!guildConfig) {
      const owner = await interaction.guild!.fetchOwner();
      guildConfig = await Guilds.create({
        uildId: interaction.guild!.id,
        ownerDiscordId: owner.user.id,
      });
    }

    const AMRMSettings = guildConfig.amrmSettings;

    const { controlPanel, row } = createControlPanel({
      amrmSettings: AMRMSettings,
      interactionGuildId: interaction.guild!.id,
      operatorDiscordId: interaction.user.id,
    });

    await interaction.editReply({ embeds: [controlPanel], components: [row] });
  }
}
