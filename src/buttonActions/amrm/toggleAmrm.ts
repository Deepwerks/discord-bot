import { ButtonInteraction } from 'discord.js';
import { TFunction } from 'i18next';
import ButtonAction from '../../base/classes/ButtonAction';
import CustomClient from '../../base/classes/CustomClient';
import { createControlPanel } from '../../services/utils/AMRM/createControlPanel';
import { Guilds } from '../../services/database/orm/init';
import { IAMRMSettings } from '../../services/database/orm/models/Guilds.model';
import { initAMRM } from '../../services/utils/AMRM/initAMRM';
import { logger } from '../..';

const activeAMRMSetups = new Set<string>();

export default class ToggleAMRM extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'toggle_amrm',
      description: 'Toggles AMRM module',
      cooldown: 0,
    });
  }

  async Execute(interaction: ButtonInteraction, _t: TFunction<'translation', undefined>) {
    await interaction.deferUpdate();
    const [_action, guildId, enabled, operatorDiscordId] = interaction.customId.split(':');

    if (operatorDiscordId !== interaction.user.id) {
      await interaction.followUp({
        content: '❌ Only the current operator can edit these settings.',
        ephemeral: true,
      });
      return;
    }

    if (activeAMRMSetups.has(guildId)) {
      await interaction.followUp({
        content: '⚙️ AMRM setup is already in progress. Please wait.',
        ephemeral: true,
      });
      return;
    }
    activeAMRMSetups.add(guildId);

    try {
      const guildConfig = await Guilds.findByPk(guildId);
      if (!guildConfig) {
        await interaction.followUp({
          content: '⚙️ Failed to get the guild',
          ephemeral: true,
        });
        return;
      }

      const current = guildConfig.get('amrmSettings') as IAMRMSettings | null;
      let channels = null;

      if (enabled === 'true') {
        const { category, dashboard, forum } = await initAMRM(interaction);
        channels = {
          categoryId: category.id,
          dashboardId: dashboard.id,
          forumId: forum.id,
        };
      } else {
        if (current?.channels) {
          const { categoryId, dashboardId, forumId } = current.channels;

          const deleteIfExists = async (id: string | undefined) => {
            if (!id) return;
            try {
              const channel = await interaction.guild!.channels.fetch(id);
              if (channel) await channel.delete('AMRM disabled – cleaning up channels');
            } catch (err) {
              logger.warn(`Failed to delete channel with ID ${id}:`, err);
            }
          };

          await Promise.all([
            deleteIfExists(forumId),
            deleteIfExists(dashboardId),
            deleteIfExists(categoryId),
          ]);
        }
      }

      const updatedConfig: IAMRMSettings = {
        ...(current ?? {}),
        enabled: enabled === 'true',
        channels,
      };

      await guildConfig.update({ amrmSettings: updatedConfig });

      const { controlPanel, row } = createControlPanel({
        amrmSettings: updatedConfig,
        interactionGuildId: interaction.guild!.id,
        operatorDiscordId,
      });

      await interaction.editReply({
        embeds: [controlPanel],
        components: [row],
      });
    } catch (err) {
      logger.error(err);
      await interaction.followUp({
        content: '❌ An error occured during channel creation.',
        ephemeral: true,
      });
    } finally {
      activeAMRMSetups.delete(guildId);
    }
  }
}
