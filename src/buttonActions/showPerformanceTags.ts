import { ButtonInteraction, EmbedBuilder } from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger } from "..";

export default class ShowPerformanceTagsButtonAction extends ButtonAction {
  tags: { name: string; description: string; criteria: string }[];
  constructor(client: CustomClient) {
    super(client, {
      customId: "show_performance_tags",
      description: "Show performance tags",
      cooldown: 6,
    });

    this.tags = [
      {
        name: "🎭 Flex",
        description: "The player uses many different heroes.",
        criteria:
          "Played at least 10 unique heroes and not a one-trick (most-played hero < 60%).",
      },
      {
        name: "🎯 One Trick Pony",
        description: "The player heavily prefers one hero.",
        criteria:
          "Most-played hero appears in more than 60% of matches, and total hero diversity is low (<10 unique).",
      },
      {
        name: "🌀 Rerolling Identity",
        description: "A mix of both one-trick and flex. Conflicting playstyle.",
        criteria:
          'Both "flex" and "one trick" conditions are true — probably switching main heroes frequently.',
      },
      {
        name: "📉 Inconsistent",
        description: "Performance varies a lot between matches.",
        criteria: "KDA standard deviation is higher than 3.0.",
      },
      {
        name: "⚰️ Feeder",
        description: "Frequently dies a lot in matches.",
        criteria: "Average deaths per match > 10.",
      },
      {
        name: "🔥 Hard Carry",
        description: "Player often leads their team to victory through kills.",
        criteria: "Average kills > 10 and win rate > 60%.",
      },
      {
        name: "🧱 Supportive",
        description: "Focused on helping the team rather than getting kills.",
        criteria: "Average assists > 15 and average kills < 4.",
      },
      {
        name: "🛡️ Durable",
        description: "Rarely dies, survives well.",
        criteria: "Average deaths < 5.",
      },
      {
        name: "⏳ Long Games",
        description: "Player tends to play longer matches.",
        criteria: "Average match duration > 40 minutes.",
      },
      {
        name: "🏃 Speedrunner",
        description:
          "Matches end quickly, possibly aggressive or fast wins/losses.",
        criteria: "Average match duration < 25 minutes.",
      },
      {
        name: "🏅 On a Winstreak",
        description: "Player has won the last 5 matches.",
        criteria: "At least 5 wins in the last 5 matches.",
      },
      {
        name: "😓 Red Carpet",
        description: "Player has recently lost a lot.",
        criteria: "At least 5 losses in the last 5 matches.",
      },
      {
        name: "☀️ Peaking",
        description: "Player is currently doing very well.",
        criteria:
          "At least 3 wins in the last 5 matches and recent average KDA > 4.",
      },
      {
        name: "🧊 Ice Cold",
        description: "In a slump with poor recent performance.",
        criteria:
          "At least 3 losses in the last 5 matches and recent average KDA < 2.",
      },
      {
        name: "📈 Climbing",
        description: "KDA is improving in each recent match.",
        criteria: "KDA is non-decreasing across the last 5 matches.",
      },
      {
        name: "🌀 Slumping",
        description: "KDA is getting worse each match.",
        criteria: "KDA is non-increasing across the last 5 matches.",
      },
      {
        name: "🎲 Wildcard",
        description: "No clear pattern found.",
        criteria: "None of the above tags matched.",
      },
    ];
  }

  async Execute(interaction: ButtonInteraction) {
    try {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Grey")
            .setTitle("Performance Tags")
            .setDescription(
              this.tags
                .map(
                  (tag) =>
                    `\`${tag.name}\`\n ${tag.description}\n${tag.criteria}`
                )
                .join("\n\n") +
                "\n\n**⚠️ These performance tags are currently EXPERIMENTAL and may not accurately reflect your playstyle or skill. They are based on simplified logic and limited match data. Expect changes as we improve the system.**"
            ),
        ],
        flags: ["Ephemeral"],
      });
    } catch (err) {
      logger.error(err);
      await interaction.reply({
        content: "❌ Failed to list tags.",
        flags: ["Ephemeral"],
      });
    }
  }
}
