import {ButtonInteraction, EmbedBuilder} from "discord.js";
import ButtonAction from "../base/classes/ButtonAction";
import CustomClient from "../base/classes/CustomClient";
import {logger} from "..";

export default class JoinPartyButtonAction extends ButtonAction {
  constructor(client: CustomClient) {
    super(client, {
      customId: "join_party",
      description: "Join a party/lobby",
      cooldown: 5,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    try {
      // Parse the custom ID to get creator ID and settings
      const [action, creatorId, maxPlayers] = interaction.customId.split(":");
      const maxPlayersNum = parseInt(maxPlayers || "10");

      // Get the original message
      const message = interaction.message;
      const embed = message.embeds[0];

      if (!embed) {
        throw new Error("Could not find the original message embed");
      }

      // Create a new embed builder from the original embed
      const newEmbed = EmbedBuilder.from(embed);

      // Extract current players from the embed
      const playersField = embed.fields.find(field => field.name.startsWith("Players"));
      if (!playersField) {
        throw new Error("Could not find players field in the embed");
      }

      // Parse the current players list
      const currentPlayers = playersField.value.split('\n');

      // Check if the user is already in the party
      const userMention = `<@${interaction.user.id}>`;
      if (currentPlayers.includes(userMention)) {
        await interaction.reply({
          content: "You are already in this party!",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Check if the lobby is full
      if (currentPlayers.length >= maxPlayersNum) {
        await interaction.reply({
          content: `This lobby is full (${currentPlayers.length}/${maxPlayersNum} players)`,
          flags: ["Ephemeral"],
        });
        return;
      }

      // Add the new player
      currentPlayers.push(userMention);

      // Update the players field in the embed
      const playerCount = currentPlayers.length;
      const playerFieldIndex = embed.fields.findIndex(field => field.name.startsWith("Players"));

      if (playerFieldIndex !== -1) {
        const updatedFields = [...embed.fields];
        updatedFields[playerFieldIndex] = {
          name: `Players (${playerCount}/${maxPlayersNum})`,
          value: currentPlayers.join('\n'),
          inline: false
        };

        // Update the embed with the new fields
        newEmbed.setFields(updatedFields);

        // Update the original message
        await message.edit({embeds: [newEmbed]});

        // Send confirmation to the user
        if (interaction.deferred) {
          await interaction.editReply({
            content: "You've joined the party!",
          });
        } else {
          await interaction.reply({
            content: "You've joined the party!",
            flags: ["Ephemeral"],
          });
        }
      } else {
        throw new Error("Failed to update players list");
      }
    } catch (error) {
      logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ Failed to join the party. Please try again later.",
        });
      } else {
        await interaction.reply({
          content: "❌ Failed to join the party. Please try again later.",
          flags: ["Ephemeral"],
        });
      }
    }
  }
}
