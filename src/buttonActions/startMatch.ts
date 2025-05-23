import {
  ButtonInteraction,
  TextChannel,
  ThreadAutoArchiveDuration,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} from 'discord.js';
import ButtonAction from '../base/classes/ButtonAction';
import CustomClient from '../base/classes/CustomClient';
import { logger, useDeadlockClient } from '..';
import dayjs from 'dayjs';
import { lobbyStore } from '../services/stores/LobbyStore';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';
import i18n from '../services/i18n';

export default class StartMatchButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'start_match',
      description: 'Start a match with the current party members',
      cooldown: 10,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
    try {
      const [_, creatorId] = interaction.customId.split(':');

      if (interaction.user.id !== creatorId) {
        throw new CommandError(t('buttons.start_match.only_creator_can_start'));
      }

      const lobby = lobbyStore.getLobby(creatorId);
      if (!lobby) {
        throw new CommandError(t('buttons.start_match.lobby_not_found'));
      }

      const playerIds = lobby.players;
      if (playerIds.size < 1) {
        throw new CommandError(t('buttons.start_match.not_enough_players'));
      }

      const timeStr = dayjs().format('HH:mm');

      const expirationTs = Math.floor(Date.now() / 1000) + 60;
      const relativeTs = `<t:${expirationTs}:R>`;

      const channel = interaction.channel as TextChannel;
      const thread = await channel.threads.create({
        name: `Match-${interaction.user.username}-${timeStr}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        type: ChannelType.PrivateThread,
        reason: 'Ready check for match',
      });

      for (const id of playerIds) {
        try {
          await thread.members.add(id);
        } catch (err) {
          logger.warn(`Failed to add player ${id}:`, err);
        }
      }

      const readyButton = new ButtonBuilder()
        .setCustomId('ready_up')
        .setLabel(t('buttons.start_match.player_ready_label'))
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(readyButton);

      const readySet = new Set<string>();
      const statusMessage = await thread.send({
        content: buildReadyMessage(t, Array.from(playerIds), readySet, relativeTs),
        components: [row],
      });

      const collector = thread.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60 * 1000,
      });

      collector.on('collect', async (btnInteraction) => {
        if (!playerIds.has(btnInteraction.user.id)) {
          throw new CommandError(t('buttons.start_match.not_a_player'));
        }

        if (readySet.has(btnInteraction.user.id)) {
          throw new CommandError(t('buttons.start_match.already_ready'));
        }

        readySet.add(btnInteraction.user.id);
        await btnInteraction.reply({
          content: t('buttons.start_match.marked_ready'),
          flags: ['Ephemeral'],
        });

        await statusMessage.edit({
          content: buildReadyMessage(t, Array.from(playerIds), readySet, relativeTs),
          components: [row],
        });

        if (readySet.size === playerIds.size) {
          collector.stop('all_ready');
        }
      });

      collector.on('end', async (_collected, reason) => {
        if (reason === 'all_ready') {
          try {
            const match = await useDeadlockClient.MatchService.CreateCustomMatch();

            lobbyStore.setPartId(creatorId, String(match.party_id));

            // Create a "Finish" button
            const finishButton = new ButtonBuilder()
              .setCustomId(`finish_match:${creatorId}`)
              .setLabel('Finish')
              .setStyle(ButtonStyle.Primary);

            // Create a "Finish" button
            const closeThread = new ButtonBuilder()
              .setCustomId(`close_thread:${thread.id}:${creatorId}`)
              .setLabel('Close Thread')
              .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              finishButton,
              closeThread
            );

            await statusMessage.edit({
              content: t('buttons.start_match.all_ready', {
                party_id: match.party_id,
                party_code: match.party_code,
              }),
              components: [row],
            });
          } catch (err) {
            logger.error('Match creation failed:', err);
            await thread.send(t('buttons.start_match.match_creation_failed'));
            await thread.setArchived(true);
            lobbyStore.removeLobby(creatorId);
          }
        } else {
          await thread.send(t('buttons.start_match.not_all_ready'));
          await thread.setArchived(true);
          lobbyStore.removeLobby(creatorId);
        }
      });

      await interaction.message.delete();
    } catch (error) {
      logger.error({
        error,
        user: interaction.user.id,
        interaction: this.customId,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(
          error instanceof CommandError ? error.message : t('buttons.start_match.start_failed')
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}

function buildReadyMessage(
  t: ReturnType<typeof i18n.getFixedT>,
  playerIds: string[],
  readySet: Set<string>,
  relativeTs: string
): string {
  const readyList =
    playerIds
      .filter((id) => readySet.has(id))
      .map((id) => `<@${id}>`)
      .join(', ') || 'None';

  const notReadyList =
    playerIds
      .filter((id) => !readySet.has(id))
      .map((id) => `<@${id}>`)
      .join(', ') || 'None';

  return t('buttons.start_match.ready_check', {
    relativeTs,
    readyList,
    notReadyList,
  });
}
