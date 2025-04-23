import { EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import CustomClient from "../base/classes/CustomClient";
import Modal from "../base/classes/CustomModal";
import logger from "../services/logger";
import { steam64ToSteamID3 } from "../services/utils/steam64Tosteam3";
import { useSteamClient } from "..";
import StoredPlayerSchema from "../base/schemas/StoredPlayerSchema";
import CommandError from "../base/errors/CommandError";
import { statlockerProfileCache, steamProfileCache } from "../services/cache";

export default class StoreSteam extends Modal {
  constructor(client: CustomClient) {
    super(client, {
      customId: "submitSteamId",
      description: "Handles Steam ID submissions",
    });
  }

  async Execute(interaction: ModalSubmitInteraction) {
    const input = interaction.fields.getTextInputValue("steam_id_input");

    try {
      let steamID3 = input;

      if (!/^\[U:1:\d+\]$/.test(input)) {
        let steam64: string | null = null;

        if (input.includes("/profiles/")) {
          const match = input.match(/\/profiles\/(\d{17})/);
          if (match) steam64 = match[1];
        } else if (input.includes("/id/")) {
          const match = input.match(/\/id\/([\w-]+)/);
          if (match) {
            const vanity = match[1];
            const res = await useSteamClient.ProfileService.GetIdFromUsername(
              vanity
            );
            steam64 = res;
          }
        }

        if (steam64) {
          steamID3 = steam64ToSteamID3(steam64);
        } else {
          throw new CommandError(
            "❌ Couldn't resolve a valid SteamID3 from that input."
          );
        }
      }

      await StoredPlayerSchema.findOneAndUpdate(
        { discordId: interaction.user.id },
        { steamId: steamID3, steamIdType: "steamID3" },
        { upsert: true }
      );

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription("You have successfully linked your Steam account!"),
        ],
        flags: ["Ephemeral"],
      });
    } catch (error) {
      logger.error(error);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              "❌ Couldn't resolve a valid SteamID3 from that input."
            ),
        ],
        flags: ["Ephemeral"],
      });
    }
  }
}
