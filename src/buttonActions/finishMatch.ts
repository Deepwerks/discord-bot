import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { logger, useDeadlockClient, useStatlockerClient } from '..';
import { generateMatchImage } from '../services/utils/generateMatchImage';
import { lobbyStore } from '../services/stores/LobbyStore';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';

export default class FinishMatchButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'finish_match',
      description: 'Finish a match and automatically show match details',
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    try {
      await interaction.deferReply();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, creatorId] = interaction.customId.split(':');

      const startTime = performance.now();

      // Get match data from Deadlock API
      const partyId = lobbyStore.getPartyId(creatorId);

      if (!partyId) {
        throw new CommandError(t('buttons.finish_match.no_party_id'));
      }

      const matchId = await useDeadlockClient.MatchService.FetchMatchIdFromPartyId(partyId);

      if (!matchId) {
        throw new CommandError('Failed to get match ID from party ID');
      }

      const deadlockMatch = await matchId.getMatch();

      if (!deadlockMatch) {
        throw new CommandError('Failed to get match from match ID');
      }

      const allPlayers = [
        ...(deadlockMatch?.team0Players ?? []),
        ...(deadlockMatch?.team1Players ?? []),
      ];

      const results = await useStatlockerClient.ProfileService.GetProfiles(
        allPlayers.map((p) => p.accountId)
      );

      const statlockerProfileMap = new Map<number, string>();
      for (const profile of results) {
        statlockerProfileMap.set(profile.accountId, profile.name);
      }

      const linkButton = new ButtonBuilder()
        .setLabel(t('buttons.finish_match.statlocker_link'))
        .setStyle(ButtonStyle.Link)
        .setURL(`https://statlocker.gg/match/${deadlockMatch.matchId}`)
        .setEmoji('1367520315244023868');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

      const imageBuffer = await generateMatchImage({ match: deadlockMatch });
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: 'match.png',
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Blue')
            .setTimestamp()
            .setFooter({
              text: t('buttons.finish_match.footer_duration', { duration }),
            }),
        ],
        files: [attachment],
        components: [row],
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
          error instanceof CommandError ? error.message : t('buttons.finish_match.error_generic')
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
