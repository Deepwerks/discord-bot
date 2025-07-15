import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { IAMRMSettings } from '../../database/orm/models/Guilds.model';

export const createControlPanel = (options: {
  amrmSettings: IAMRMSettings | null;
  interactionGuildId: string;
  operatorDiscordId: string;
}) => {
  const { amrmSettings, interactionGuildId, operatorDiscordId } = options;
  const isEnabled = amrmSettings ? amrmSettings.enabled : false;

  const controlPanel = new EmbedBuilder()
    .setColor(isEnabled ? 0x2ecc71 : 0xe74c3c)
    .setTitle('Advanced Match Review Module - Control Panel')
    .setDescription('Configure the Advanced Match Review Module (AMRM) for this server.')
    .addFields({
      name: 'Module Status',
      value: isEnabled ? '🟢 Enabled' : '🔴 Disabled',
      inline: true,
    });

  const toggleModuleButton = new ButtonBuilder()
    .setCustomId(`toggle_amrm:${interactionGuildId}:${!isEnabled}:${operatorDiscordId}`)
    .setLabel(isEnabled ? '❌ Disable Module' : '✅ Enable Module')
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(toggleModuleButton);

  return {
    controlPanel,
    row,
  };
};
