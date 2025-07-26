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
import getHistoryTable from '../../services/utils/getHistoryTable';

export default class History extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'history',
      description: "Get player's match history",
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      dev: false,
      options: [
        {
          name: 'player',
          description: 'Player\'s name or SteamID | Use "me" to get your match history!',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: 'private',
          description: 'Only show result to you',
          required: false,
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const player = interaction.options.getString('player', true);
    const ephemeral = interaction.options.getBoolean('private', false);

    await interaction.deferReply({ flags: ephemeral ? ['Ephemeral'] : [] });

    const { response, buttonRow, interactiveRow, steamAuthNeeded } = await getHistoryTable(
      player,
      interaction.user.id,
      t
    );

    await interaction.editReply({
      content: response,
      components: [buttonRow, interactiveRow],
    });

    if (steamAuthNeeded) {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(t('commands.history.steam_auth_required_title'))
        .setDescription(t('commands.history.steam_auth_required_description'));

      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    }
  }
}
