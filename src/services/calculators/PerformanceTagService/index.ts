import HistoryMatch from '../../clients/DeadlockClient/DeadlockPlayerService/entities/HistoryMatch';

export interface IPerformanceTag {
  name: string;
  description: string;
  criteria: string;
  calculate: (matches: HistoryMatch[]) => boolean;
}

const averages = {
  kills: 7.024553,
  deaths: 6.759147,
  assists: 9.160868,
  netWorth: 32050.335539,
  lastHits: 148.591511,
  matchDuration: 1970.137647,
};

export default class PerformanceTagService {
  tags: IPerformanceTag[];
  matches: HistoryMatch[];

  constructor(matches: HistoryMatch[]) {
    this.matches = matches;
    this.tags = PerformanceTagService.buildTags();
  }

  public getMatchingTags(): IPerformanceTag[] {
    const matched = this.tags.filter((tag) => tag.calculate(this.matches));

    if (matched.length === 0) {
      const wildcardTag = this.tags.find((t) => t.name === 'Wildcard');
      if (wildcardTag) matched.push(wildcardTag);
    }

    return matched;
  }

  public static getAllTagDescriptions(): Omit<IPerformanceTag, 'calculate'>[] {
    return PerformanceTagService.buildTags().map(({ name, description, criteria }) => ({
      name,
      description,
      criteria,
    }));
  }

  private static buildTags(): IPerformanceTag[] {
    return [
      {
        name: '🎯 One Trick',
        description: 'Plays the same hero most of the time.',
        criteria: `More than 60% of matches are played on the same hero.`,
        calculate: (matches) => {
          const total = matches.length;
          const heroCount = matches.reduce((map, match) => {
            map.set(match.hero_id, (map.get(match.hero_id) || 0) + 1);
            return map;
          }, new Map<number, number>());
          return [...heroCount.values()].some((count) => count / total >= 0.6);
        },
      },
      {
        name: '🏋️‍♂️ Carry',
        description: 'High kills and net worth with low deaths.',
        criteria: `Avg net worth > ${averages.netWorth.toFixed().toLocaleString()}, kills > ${(
          averages.kills * 1.3
        ).toFixed(2)}, deaths <= ${averages.deaths.toFixed(2)}.`,
        calculate: (matches) =>
          average(matches.map((m) => m.net_worth)) > averages.netWorth &&
          average(matches.map((m) => m.player_kills)) > averages.kills * 1.3 &&
          average(matches.map((m) => m.player_deaths)) <= averages.deaths,
      },
      {
        name: '🩺 Support',
        description: 'High assists, low kills.',
        criteria: `Avg assists > ${averages.assists.toFixed(
          2
        )}, kills < ${averages.kills.toFixed(2)}.`,
        calculate: (matches) =>
          average(matches.map((m) => m.player_assists)) > averages.assists &&
          average(matches.map((m) => m.player_kills)) < averages.kills,
      },
      {
        name: '🧩 Flex',
        description: 'Plays many different heroes regularly.',
        criteria: 'Has played at least 10 unique heroes in 50 matches.',
        calculate: (matches) => new Set(matches.slice(0, 50).map((m) => m.hero_id)).size >= 10,
      },
      {
        name: '🎲 Risky',
        description: 'Aggressive play with high kills and deaths.',
        criteria: `Avg kills > ${averages.kills.toFixed(
          2
        )} and deaths > ${averages.deaths.toFixed(2)}.`,
        calculate: (matches) =>
          average(matches.map((m) => m.player_kills)) > averages.kills &&
          average(matches.map((m) => m.player_deaths)) > averages.deaths,
      },
      {
        name: '🌾 Farmer',
        description: 'Focuses on farming creeps.',
        criteria: `Avg last hits > ${averages.lastHits.toFixed()}, Avg networth > ${(
          averages.netWorth * 1.1
        )
          .toFixed()
          .toLocaleString()}`,
        calculate: (matches) =>
          average(matches.map((m) => m.last_hits)) > averages.lastHits &&
          average(matches.map((m) => m.net_worth)) > averages.netWorth * 1.1,
      },
      {
        name: '🚪 Leaver',
        description: 'Leaves or abandons matches frequently.',
        criteria: `More than 10% of matches are abandoned.`,
        calculate: (matches) =>
          matches.filter((m) => m.team_abandoned !== null).length / matches.length > 0.1,
      },
      {
        name: '🧨 Clutch',
        description: 'Wins more often in long matches.',
        criteria: `Winrate > 10% in matches longer than 40 minutes.`,
        calculate: (matches) => {
          const longMatches = matches.filter((m) => m.match_duration_s > 2400);
          return (
            longMatches.length >= 10 &&
            longMatches.filter((m) => m.match_result === m.player_team).length /
              longMatches.length >=
              0.1
          );
        },
      },
      {
        name: '💀 Feeder',
        description: 'Dies a lot across most matches, without securing kills.',
        criteria: `Average deaths > ${(averages.deaths * 1.3).toFixed(
          2
        )}, Avg kills <= ${averages.kills.toFixed(2)}.`,
        calculate: (matches) =>
          average(matches.map((m) => m.player_deaths)) > averages.deaths * 1.3 &&
          average(matches.map((m) => m.player_kills)) <= averages.kills,
      },
      {
        name: '🛡️ Durable',
        description: 'Rarely dies and survives well.',
        criteria: `Average deaths < ${(averages.deaths * 0.7).toFixed(2)}.`,
        calculate: (matches) =>
          average(matches.map((m) => m.player_deaths)) < averages.deaths * 0.7,
      },
      {
        name: '⏳ Long Games',
        description: 'Often plays long matches.',
        criteria: 'More than 30% of matches are longer than 45 minutes.',
        calculate: (matches) =>
          matches.filter((m) => m.match_duration_s > 2700).length / matches.length > 0.3,
      },
      {
        name: '⚡ Speedrunner',
        description: 'Finishes matches very quickly.',
        criteria: 'More than 30% of matches are under 25 minutes.',
        calculate: (matches) =>
          matches.filter((m) => m.match_duration_s < 1500).length / matches.length > 0.3,
      },
      {
        name: '🏆 On a Win Streak',
        description: 'Currently on a strong win streak.',
        criteria: 'Last 5 matches are all wins.',
        calculate: (matches) => matches.slice(0, 5).every((m) => m.match_result === m.player_team),
      },
      {
        name: '💔 On a Lose Streak',
        description: 'Currently on a losing streak.',
        criteria: 'Last 5 matches are all losses.',
        calculate: (matches) => matches.slice(0, 5).every((m) => m.match_result !== m.player_team),
      },
      {
        name: '🚀 Peaking',
        description: 'Player is currently doing very well.',
        criteria: 'At least 3 wins in last 5 matches and average KDA > 4.',
        calculate: (matches) => {
          const recent = matches.slice(0, 5);
          const wins = recent.filter((m) => m.match_result === m.player_team).length;
          return recent.length === 5 && wins >= 3 && average(recent.map(calculateKDA)) > 4;
        },
      },
      {
        name: '❄️ Ice Cold',
        description: 'Player is in a slump.',
        criteria: 'At least 3 losses in last 5 matches and average KDA < 2.',
        calculate: (matches) => {
          const recent = matches.slice(0, 5);
          const losses = recent.filter((m) => m.match_result !== m.player_team).length;
          return recent.length === 5 && losses >= 3 && average(recent.map(calculateKDA)) < 2;
        },
      },
      {
        name: '🃏 Wildcard',
        description: 'No strong or obvious patterns detected.',
        criteria: 'Displayed if no other tags are matched.',
        calculate: () => false,
      },
    ];
  }
}

// Helper functions
const average = (numbers: number[]): number =>
  numbers.length === 0 ? 0 : numbers.reduce((sum, n) => sum + n, 0) / numbers.length;

const calculateKDA = (m: {
  player_kills: number;
  player_assists: number;
  player_deaths: number;
}): number => (m.player_kills + m.player_assists) / Math.max(1, m.player_deaths);
