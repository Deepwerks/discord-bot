import { ButtonInteraction } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { TFunction } from 'i18next';
import { Guilds } from '../services/database/orm/init';
export default class CloseThreadButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'no_more_dm',
      description: 'No more DMs from the bot',
      cooldown: 1,
    });
  }

  async Execute(interaction: ButtonInteraction, _t: TFunction<'translation', undefined>) {
    const [_action, guildId] = interaction.customId.split(':');

    const guild = await Guilds.findOne({ where: { guildId: guildId } });
    if (guild) {
      await guild.update({
        sendDMs: false,
      });
    }

    await interaction.deferUpdate();
    await interaction.message.react('✅');
  }
}
