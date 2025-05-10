import {
  ButtonInteraction,
  TextChannel,
  ThreadAutoArchiveDuration,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import { logger, useDeadlockClient } from "..";
import dayjs from "dayjs";
import { lobbyStore } from "../services/stores/LobbyStore";

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
      const [_, creatorId] = interaction.customId.split(":");

      if (interaction.user.id !== creatorId) {
        await interaction.reply({
          content: "Only the party initiator can start the match!",
          flags: ["Ephemeral"],
        });
        return;
      }

      const lobby = lobbyStore.getLobby(creatorId);
      if (!lobby) {
        await interaction.reply({
          content: "Lobby not found or expired.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const playerIds = lobby.players;
      if (playerIds.size < 1) {
        await interaction.reply({
          content: "You need at least one player to start a match!",
          flags: ["Ephemeral"],
        });
        return;
      }

      const timeStr = dayjs().format("HH:mm");

      const expirationTs = Math.floor(Date.now() / 1000) + 60;
      const relativeTs = `<t:${expirationTs}:R>`;

      const channel = interaction.channel as TextChannel;
      const thread = await channel.threads.create({
        name: `Match-${interaction.user.username}-${timeStr}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        type: ChannelType.PrivateThread,
        reason: "Ready check for match",
      });

      for (const id of playerIds) {
        try {
          await thread.members.add(id);
        } catch (err) {
          logger.warn(`Failed to add player ${id}:`, err);
        }
      }

      const readyButton = new ButtonBuilder()
        .setCustomId("ready_up")
        .setLabel("✅ I'm Ready")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        readyButton
      );

      const readySet = new Set<string>();
      const statusMessage = await thread.send({
        content: buildReadyMessage(Array.from(playerIds), readySet, relativeTs),
        components: [row],
      });

      const collector = thread.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60 * 1000,
      });

      collector.on("collect", async (btnInteraction) => {
        if (!playerIds.has(btnInteraction.user.id)) {
          await btnInteraction.reply({
            content: "You're not a player in this match.",
            flags: ["Ephemeral"],
          });
          return;
        }

        if (readySet.has(btnInteraction.user.id)) {
          await btnInteraction.reply({
            content: "You're already marked as ready.",
            flags: ["Ephemeral"],
          });
          return;
        }

        readySet.add(btnInteraction.user.id);
        await btnInteraction.reply({
          content: "You are marked as ready! ✅",
          flags: ["Ephemeral"],
        });

        await statusMessage.edit({
          content: buildReadyMessage(
            Array.from(playerIds),
            readySet,
            relativeTs
          ),
          components: [row],
        });

        if (readySet.size === playerIds.size) {
          collector.stop("all_ready");
        }
      });

      collector.on("end", async (_collected, reason) => {
        if (reason === "all_ready") {
          try {
            const match =
              await useDeadlockClient.MatchService.CreateCustomMatch();
            lobbyStore.setPartId(creatorId, String(match.party_id));

            // Create a "Finish" button
            const finishButton = new ButtonBuilder()
              .setCustomId(`finish_match:${creatorId}`)
              .setLabel("Finish")
              .setStyle(ButtonStyle.Primary);

            // Create a "Finish" button
            const closeThread = new ButtonBuilder()
              .setCustomId(`close_thread:${thread.id}:${creatorId}`)
              .setLabel("Close Thread")
              .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              finishButton,
              closeThread
            );

            await statusMessage.edit({
              content: `✅ All players are ready!\n\n**Party ID:** \`${match.party_id}\`\n**Party Code:** \`${match.party_code}\`\nGLHF!`,
              components: [row],
            });
          } catch (err) {
            logger.error("Match creation failed:", err);
            await thread.send(
              "❌ Failed to create match after all players were ready. Start a new lobby!"
            );
            await thread.setArchived(true);
            lobbyStore.removeLobby(creatorId);
          }
        } else {
          await thread.send(
            "❌ Not all players were ready in time. Archiving thread..."
          );
          await thread.setArchived(true);
          lobbyStore.removeLobby(creatorId);
        }
      });

      await interaction.message.delete();
      lobbyStore.removeLobby(creatorId);
    } catch (error) {
      logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ Failed to start the match.",
        });
      } else {
        await interaction.reply({
          content: "❌ Failed to start the match.",
          flags: ["Ephemeral"],
        });
      }
    }
  }
}

function buildReadyMessage(
  playerIds: string[],
  readySet: Set<string>,
  relativeTs: string
): string {
  const readyList = playerIds
    .filter((id) => readySet.has(id))
    .map((id) => `<@${id}>`);
  const notReadyList = playerIds
    .filter((id) => !readySet.has(id))
    .map((id) => `<@${id}>`);

  return `# ✅ Ready Check\nClick the button below to mark yourself as ready. Check in will close ${relativeTs}.\n\n**Ready:** ${
    readyList.join(", ") || "None"
  }\n**Not Ready:** ${notReadyList.join(", ") || "None"}`;
}
