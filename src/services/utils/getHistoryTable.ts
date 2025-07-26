import {
  escapeMarkdown,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from 'discord.js';
import { useDeadlockClient, useAssetsClient } from '../..';
import getProfile from '../database/repository';
import { getFormattedMatchTime } from './getFormattedMatchTime';
import pLimit from 'p-limit';
import { TFunction } from 'i18next';

export default async (player: string, userId: string, t: TFunction<'translation', undefined>) => {
  const { steamProfile, steamAuthNeeded } = await getProfile(player, userId, t);

  const matchHistory = await useDeadlockClient.PlayerService.fetchMatchHistory(
    steamProfile.accountId,
    15
  );
  const mmrHistory = await useDeadlockClient.PlayerService.fetchMMRHistory(
    steamProfile.accountId,
    15
  );

  const limit = pLimit(10);

  const matchesString: string[] = await Promise.all(
    matchHistory.map((match) =>
      limit(async () => {
        const hero = await match.getHero();
        const heroName = hero ? hero.name : 'Unknown';

        const mmrRecord = mmrHistory.find((record) => record.matchId === match.matchId);

        const champion = heroName.slice(0, 14).padEnd(15);
        const time = getFormattedMatchTime(match.matchDurationS).padEnd(9);

        const rank = (
          await useAssetsClient.DefaultService.GetRankName(
            mmrRecord?.division,
            mmrRecord?.divisionTier
          )
        )
          ?.slice(0, 12)
          .padEnd(13);
        const kda = `(${match.playerKills}/${match.playerDeaths}/${match.playerAssists})`.padEnd(
          13
        );
        const matchId = match.matchId.toString().padEnd(13);
        const date = match.startDate.format('D MMM YYYY').padEnd(12);

        const line = `${champion}${time}${rank}${kda}${matchId}${date}`;

        const prefix = match.matchResult === match.playerTeam ? '+' : '-';
        return `${prefix}${line}`;
      })
    )
  );

  const header =
    'Character'.padEnd(16) +
    'Time'.padEnd(9) +
    'Rank'.padEnd(13) +
    'KDA'.padEnd(13) +
    'Match ID'.padEnd(13) +
    'Date'.padEnd(12);

  const response = `\`\`\`diff
${escapeMarkdown(steamProfile.name)}'s (${steamProfile.accountId}) last ${matchHistory.length} matches:

${header}
${matchesString.join('\n')}
      \`\`\``;

  const linkButton = new ButtonBuilder()
    .setLabel(t('commands.history.view_on_statlocker'))
    .setStyle(ButtonStyle.Link)
    .setURL(`https://statlocker.gg/profile/${steamProfile.accountId}`)
    .setEmoji('1367520315244023868');

  const selectMatchButton = new StringSelectMenuBuilder()
    .setCustomId(`get_match_details`)
    .setPlaceholder(t('commands.history.match_details_placeholder'))
    .addOptions(
      await Promise.all(
        matchHistory.map(async (match) => {
          const win = match.matchResult === match.playerTeam ? 'Win' : 'Loss';
          const hero = await match.getHero();

          return new StringSelectMenuOptionBuilder()
            .setLabel(`${hero?.name} — ${win}`)
            .setDescription(`${String(match.matchId)} (${match.startDate.format('D MMMM, YYYY')})`)
            .setValue(String(match.matchId));
        })
      )
    );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);
  const interactiveRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMatchButton
  );

  return {
    response,
    buttonRow,
    interactiveRow,
    steamAuthNeeded,
  };
};
