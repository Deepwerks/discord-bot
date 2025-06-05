import DeadlockMatchHistoryRecord from '../../clients/DeadlockClient/services/DeadlockPlayerService/entities/DeadlockMatchHistoryRecord';

export interface IPerformanceTag {
  name: string;
  description: string;
  criteria: string;
  calculate: (matches: DeadlockMatchHistoryRecord[]) => boolean;
}

const averages = {
  kills: 6.82,
  deaths: 6.8,
  assists: 11.13,
  netWorth: 37255.24,
  lastHits: 155.35,
  matchDuration: 2112.84,
};

export default class PerformanceTagService {
  tags: IPerformanceTag[];
  matches: DeadlockMatchHistoryRecord[];

  constructor(matches: DeadlockMatchHistoryRecord[]) {
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
            map.set(match.heroId, (map.get(match.heroId) || 0) + 1);
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
          average(matches.map((m) => m.netWorth)) > averages.netWorth &&
          average(matches.map((m) => m.playerKills)) > averages.kills * 1.3 &&
          average(matches.map((m) => m.playerDeaths)) <= averages.deaths,
      },
      {
        name: '🩺 Support',
        description: 'High assists, low kills.',
        criteria: `Avg assists > ${averages.assists.toFixed(
          2
        )}, kills < ${averages.kills.toFixed(2)}.`,
        calculate: (matches) =>
          average(matches.map((m) => m.playerAssists)) > averages.assists &&
          average(matches.map((m) => m.playerKills)) < averages.kills,
      },
      {
        name: '🧩 Flex',
        description: 'Plays many different heroes regularly.',
        criteria: 'Has played at least 10 unique heroes in 50 matches.',
        calculate: (matches) => new Set(matches.slice(0, 50).map((m) => m.heroId)).size >= 10,
      },
      {
        name: '🎲 Risky',
        description: 'Aggressive play with high kills and deaths.',
        criteria: `Avg kills > ${averages.kills.toFixed(
          2
        )} and deaths > ${averages.deaths.toFixed(2)}.`,
        calculate: (matches) =>
          average(matches.map((m) => m.playerKills)) > averages.kills &&
          average(matches.map((m) => m.playerDeaths)) > averages.deaths,
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
          average(matches.map((m) => m.lastHits)) > averages.lastHits &&
          average(matches.map((m) => m.netWorth)) > averages.netWorth * 1.1,
      },
      {
        name: '🚪 Leaver',
        description: 'Leaves or abandons matches frequently.',
        criteria: `More than 10% of matches are abandoned.`,
        calculate: (matches) =>
          matches.filter((m) => m.teamAbandoned !== null).length / matches.length > 0.1,
      },
      {
        name: '🧨 Clutch',
        description: 'Wins more often in long matches.',
        criteria: `Winrate > 10% in matches longer than 40 minutes.`,
        calculate: (matches) => {
          const longMatches = matches.filter((m) => m.matchDurationS > 2400);
          return (
            longMatches.length >= 10 &&
            longMatches.filter((m) => m.matchResult === m.playerTeam).length / longMatches.length >=
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
          average(matches.map((m) => m.playerDeaths)) > averages.deaths * 1.3 &&
          average(matches.map((m) => m.playerKills)) <= averages.kills,
      },
      {
        name: '🛡️ Durable',
        description: 'Rarely dies and survives well.',
        criteria: `Average deaths < ${(averages.deaths * 0.7).toFixed(2)}.`,
        calculate: (matches) => average(matches.map((m) => m.playerDeaths)) < averages.deaths * 0.7,
      },
      {
        name: '⏳ Long Games',
        description: 'Often plays long matches.',
        criteria: 'More than 30% of matches are longer than 45 minutes.',
        calculate: (matches) =>
          matches.filter((m) => m.matchDurationS > 2700).length / matches.length > 0.3,
      },
      {
        name: '⚡ Speedrunner',
        description: 'Finishes matches very quickly.',
        criteria: 'More than 30% of matches are under 25 minutes.',
        calculate: (matches) =>
          matches.filter((m) => m.matchDurationS < 1500).length / matches.length > 0.3,
      },
      {
        name: '🏆 On a Win Streak',
        description: 'Currently on a strong win streak.',
        criteria: 'Last 5 matches are all wins.',
        calculate: (matches) => matches.slice(0, 5).every((m) => m.matchResult === m.playerTeam),
      },
      {
        name: '💔 On a Lose Streak',
        description: 'Currently on a losing streak.',
        criteria: 'Last 5 matches are all losses.',
        calculate: (matches) => matches.slice(0, 5).every((m) => m.matchResult !== m.playerTeam),
      },
      {
        name: '🚀 Peaking',
        description: 'Player is currently doing very well.',
        criteria: 'At least 3 wins in last 5 matches and average KDA > 4.',
        calculate: (matches) => {
          const recent = matches.slice(0, 5);
          const wins = recent.filter((m) => m.matchResult === m.playerTeam).length;
          return recent.length === 5 && wins >= 3 && average(recent.map(calculateKDA)) > 4;
        },
      },
      {
        name: '❄️ Ice Cold',
        description: 'Player is in a slump.',
        criteria: 'At least 3 losses in last 5 matches and average KDA < 2.',
        calculate: (matches) => {
          const recent = matches.slice(0, 5);
          const losses = recent.filter((m) => m.matchResult !== m.playerTeam).length;
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
  playerKills: number;
  playerAssists: number;
  playerDeaths: number;
}): number => (m.playerKills + m.playerAssists) / Math.max(1, m.playerDeaths);
