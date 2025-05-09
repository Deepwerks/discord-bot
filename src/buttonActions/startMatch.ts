import {ButtonInteraction, TextChannel, ThreadAutoArchiveDuration, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle} from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import {logger, useDeadlockClient} from "..";
import dayjs from "dayjs";

export default class StartMatchButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: "start_match",
      description: "Start a match with the current party members",
      cooldown: 10,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    try {
      // Parse the custom ID to get creator ID and settings
      const [action, creatorId, maxPlayers] = interaction.customId.split(":");

      // Check if the user is the party initiator
      if (interaction.user.id !== creatorId) {
        await interaction.reply({
          content: "Only the party initiator can start the match!",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Get the original message
      const message = interaction.message;
      const embed = message.embeds[0];

      if (!embed) {
        throw new Error("Could not find the original message embed");
      }

      // Extract current players from the embed
      const playersField = embed.fields.find(field => field.name.startsWith("Players"));
      if (!playersField) {
        throw new Error("Could not find players field in the embed");
      }

      // Parse the current players list
      const currentPlayers = playersField.value.split('\n');

      // Check if there are enough players (at least 1)
      if (currentPlayers.length < 1) {
        await interaction.reply({
          content: "You need at least one player to start a match!",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Create deadlock custom match
      let retries = 2;
      let customMatch;
      while (retries > 0) {
        try {
          customMatch = await useDeadlockClient.MatchService.CreateCustomMatch();
          break;
        } catch (error) {
          logger.error("Failed to create custom match:", error);
          retries--;
          if (retries === 0) {
            throw new Error("Failed to create custom match after 5 retries");
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (!customMatch) {
        await interaction.reply({
          content: "❌ Failed to create custom match. Please try again later.",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Create a private thread for the match
      const time_string = dayjs().format("HH:mm");
      const threadName = `Match-${interaction.user.username}-${time_string}`;

      // Create the thread in the channel where the command was used
      const channel = interaction.channel as TextChannel;
      const thread = await channel.threads.create({
        name: threadName,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        reason: "Match thread for players",
        type: ChannelType.PrivateThread,
      });

      if (!thread) {
        throw new Error("Failed to create thread");
      }

      // Add all players to the thread
      // Extract user IDs from mentions like <@123456789>
      const playerIds = currentPlayers.map(player => {
        const match = player.match(/<@(\d+)>/);
        return match ? match[1] : null;
      }).filter(id => id !== null);

      // Add each player to the thread
      for (const playerId of playerIds) {
        try {
          await thread.members.add(playerId as string);
        } catch (error) {
          logger.error(`Failed to add player ${playerId} to thread: ${error}`);
          // Continue with other players even if one fails
        }
      }

      // Create a "Finish" button
      const finishButton = new ButtonBuilder()
        .setCustomId("finish_match")
        .setLabel("Finish")
        .setStyle(ButtonStyle.Primary);

      // Add the button to an action row
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(finishButton);

      // Send welcome message in the thread with the button
      await thread.send({
        content: `# Welcome to the Match!\n\nPlayers: ${currentPlayers.join(', ')}\n\nParty ID: \`${customMatch.party_id}\`Party Code: \`${customMatch.party_code}\`\n\nGood luck and have fun!`,
        components: [row],
      });

      // Delete Create Lobby Panel
      await message.delete();

    } catch (error) {
      logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ Failed to start the match. Please try again later.",
        });
      } else {
        await interaction.reply({
          content: "❌ Failed to start the match. Please try again later.",
          flags: ["Ephemeral"],
        });
      }
    }
  }
}
