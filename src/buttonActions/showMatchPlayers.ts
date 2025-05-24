import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { logger, useAssetsClient, useDeadlockClient } from '..';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';

export default class ShowMatchPlayersButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'show_players',
      description: 'Show the players in the match.',
      cooldown: 6,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [action, matchId] = interaction.customId.split(':');

    try {
      const deadlockMatch = await useDeadlockClient.MatchService.GetMatch(Number());

      const allPlayers = [
        ...(deadlockMatch?.team0Players ?? []),
        ...(deadlockMatch?.team1Players ?? []),
      ];

      const playerPromises = allPlayers.map(async (player) => {
        const hero = await useAssetsClient.HeroService.GetHero(player.heroId);

        return `${hero?.name}: ${player.accountId}`;
      });

      const playerIds = (await Promise.all(playerPromises)).join('\n');

      await interaction.reply({
        content: t('buttons.show_players.title', {
          matchId: matchId,
          playerIds: playerIds,
        }),
        flags: ['Ephemeral'],
      });
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(
          error instanceof CommandError ? error.message : t('buttons.show_players.error_generic')
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
