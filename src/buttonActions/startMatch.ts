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
import { lobbyStore } from '../services/stores/LobbyStore';
import CommandError from '../base/errors/CommandError';
import { TFunction } from 'i18next';
import i18n from '../services/i18n';
import { getStoredPlayersByDiscordIds } from '../services/database/repository';
import { StoredPlayers } from '../services/database/orm/init';

enum TeamShuffleMode {
  Balanced = 'balanced',
  Random = 'random',
}

export default class StartMatchButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: 'start_match',
      description: 'Start a match with the current party members',
      cooldown: 10,
    });
  }

  async Execute(interaction: ButtonInteraction, t: TFunction<'translation', undefined>) {
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

    const expirationTs = Math.floor(Date.now() / 1000) + 60;
    const relativeTs = `<t:${expirationTs}:R>`;

    const channel = interaction.channel as TextChannel;
    const thread = await channel.threads.create({
      name: lobby.name,
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
        content: 'You are now ready! ✅',
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
          const votes = new Map<string, TeamShuffleMode>();
          let selectedMode: TeamShuffleMode | null = null;

          const players = await getStoredPlayersByDiscordIds(Array.from(playerIds));
          const isEveryPlayerAuthenticated =
            players.length === playerIds.size
              ? players.every((p) => p.authenticated === true)
              : false;

          await statusMessage.delete();

          const voteMessage = await thread.send({
            content: '[@here]\nAll players are ready! Please vote for team shuffle mode:',
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId('vote:balanced')
                  .setLabel('Balanced')
                  .setDisabled(!isEveryPlayerAuthenticated)
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId('vote:random')
                  .setLabel('Random')
                  .setStyle(ButtonStyle.Secondary)
              ),
            ],
          });

          if (!isEveryPlayerAuthenticated) {
            await thread.send({
              content:
                '⚠️ **Balanced** Option is disabled: *Not all players were authenticated. Use `/store` to authenticate!*',
            });
          }

          const voteCollector = thread.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 10_000,
          });

          voteCollector.on('collect', async (btnInt) => {
            if (!playerIds.has(btnInt.user.id)) return;

            const choice =
              btnInt.customId === 'vote:balanced'
                ? TeamShuffleMode.Balanced
                : TeamShuffleMode.Random;

            votes.set(btnInt.user.id, choice);
            await btnInt.reply({
              content: 'You have voted...',
              flags: ['Ephemeral'],
            });

            // Check if majority or all voted
            const tally = {
              balanced: [...votes.values()].filter((v) => v === TeamShuffleMode.Balanced).length,
              random: [...votes.values()].filter((v) => v === TeamShuffleMode.Random).length,
            };

            if (
              votes.size === playerIds.size ||
              Math.max(tally.balanced, tally.random) > playerIds.size / 2
            ) {
              selectedMode =
                tally.balanced > tally.random ? TeamShuffleMode.Balanced : TeamShuffleMode.Random;
              voteCollector.stop('decided');
            }
          });

          voteCollector.on('end', async (_, _voteReason) => {
            if (!selectedMode) {
              // Default to random
              selectedMode = TeamShuffleMode.Random;
            }

            await voteMessage.edit({
              content: `Voting ended! Team shuffle mode selected: **${selectedMode}**. \nStarting match...`,
              components: [],
            });

            const match = await useDeadlockClient.MatchService.CreateCustomMatch();

            if (!match) {
              throw new CommandError('Failed to create match');
            }

            lobbyStore.setPartId(creatorId, String(match.partyId));

            const playersArray = Array.from(playerIds);
            const [teamA, teamB] =
              selectedMode === TeamShuffleMode.Random
                ? shuffleTeamsRandom(playersArray)
                : await shuffleTeamsBalanced(players);

            const finishButton = new ButtonBuilder()
              .setCustomId(`finish_match:${creatorId}`)
              .setLabel('Finish')
              .setStyle(ButtonStyle.Primary);

            const closeThread = new ButtonBuilder()
              .setCustomId(`close_thread:${thread.id}:${creatorId}`)
              .setLabel('Close Thread')
              .setEmoji('🗑️')
              .setStyle(ButtonStyle.Danger);

            const archiveThread = new ButtonBuilder()
              .setCustomId(`archive_thread:${thread.id}:${creatorId}`)
              .setLabel('Archive Thread')
              .setEmoji('📃')
              .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              finishButton,
              archiveThread,
              closeThread
            );

            await sleep(1000);

            const embed = buildMatchEmbed(match.partyId, match.party_code, teamA, teamB);
            await thread.send({
              content: '@here',
              embeds: [embed],
              components: [row],
            });
          });
        } catch (err) {
          logger.warn('Match creation failed:', err);
          await thread.send(t('buttons.start_match.match_creation_failed'));
          await thread.setArchived(true);

          await sleep(3000);
          await thread.delete();
          lobbyStore.removeLobby(creatorId);
        }
      } else {
        await thread.send(t('buttons.start_match.not_all_ready'));
        await thread.setArchived(true);
        lobbyStore.removeLobby(creatorId);
      }
    });

    await interaction.message.delete();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMatchEmbed(
  partyId: string,
  partyCode: string,
  teamA: string[],
  teamB: string[]
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('Green')
    .setTitle('✅ All players are ready!')
    .setDescription('GLHF!')
    .addFields(
      {
        name: 'Party ID',
        value: `\`${partyId}\``,
        inline: true,
      },
      {
        name: 'Party Code',
        value: `\`${partyCode}\``,
        inline: true,
      },
      {
        name: 'Team A',
        value: teamA.length > 0 ? teamA.map((id) => `<@${id}>`).join('\n') : 'None',
        inline: false,
      },
      {
        name: 'Team B',
        value: teamB.length > 0 ? teamB.map((id) => `<@${id}>`).join('\n') : 'None',
        inline: false,
      }
    );
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

function shuffleTeamsRandom(playerIds: string[]): [string[], string[]] {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

  const mid = Math.ceil(shuffled.length / 2);
  const teamA = shuffled.slice(0, mid);
  const teamB = shuffled.slice(mid);

  return [teamA, teamB];
}

async function shuffleTeamsBalanced(players: StoredPlayers[]): Promise<[string[], string[]]> {
  const NOISE_FACTOR = 0.01;

  const playersWithMMR = await Promise.all(
    players.map(async (player) => {
      const mmr = await estimateMMR(Number(player.steamId));
      return {
        id: player.discordId,
        mmr,
        noisyMMR: mmr + (Math.random() - 0.5) * NOISE_FACTOR * mmr,
      };
    })
  );

  playersWithMMR.sort((a, b) => b.noisyMMR - a.noisyMMR);

  const teamA: string[] = [];
  const teamB: string[] = [];

  let sumA = 0;
  let sumB = 0;

  for (const player of playersWithMMR) {
    if (sumA <= sumB) {
      teamA.push(player.id);
      sumA += player.mmr;
    } else {
      teamB.push(player.id);
      sumB += player.mmr;
    }
  }

  console.log(`TeamA: ${sumA}`);
  console.log(`TeamB: ${sumB}`);

  return [teamA, teamB];
}

async function estimateMMR(playerId: number) {
  const mmrHistory = await useDeadlockClient.PlayerService.fetchMMRHistory(playerId, 10);

  if (mmrHistory.length === 0) return 0;

  const weights = mmrHistory.map((_, i) => i + 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const weightedSum = mmrHistory.reduce((sum, match, i) => {
    return sum + match.playerScore * weights[i];
  }, 0);

  return weightedSum / totalWeight;
}
