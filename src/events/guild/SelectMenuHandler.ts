import {
  Collection,
  EmbedBuilder,
  Events,
  StringSelectMenuInteraction,
} from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import { logger } from "../..";
import i18next from "../../services/i18n";
import GuildConfig from "../../base/schemas/GuildConfigSchema";
import logInteraction from "../../services/logger/logInteraction";
import { InteractionType } from "../../base/schemas/UserInteractionSchema";

export default class SelectMenuHandler extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "SelectMenu handler event",
      once: false,
    });
  }

  async Execute(interaction: StringSelectMenuInteraction) {
    if (!interaction.isStringSelectMenu()) return;

    const [action] = interaction.customId.split(":");

    const guildLang = await GuildConfig.findOne({
      guildId: interaction.guildId!,
    });
    const t = i18next.getFixedT(guildLang?.lang!);

    try {
      const selectMenuHandler = this.client.selectMenus.get(action);

      if (!selectMenuHandler) {
        return (
          //@ts-ignore
          interaction.reply({
            content: t("warnings.no_button_action"),
            flags: ["Ephemeral"],
          }) && this.client.buttons.delete(action)
        );
      }

      const { cooldowns } = this.client;
      if (!cooldowns.has(selectMenuHandler.customId))
        cooldowns.set(selectMenuHandler.customId, new Collection());

      const now = Date.now();
      const timestamps = cooldowns.get(selectMenuHandler.customId)!;
      const cooldownAmount = (selectMenuHandler.cooldown || 3) * 1000;

      if (
        timestamps.has(interaction.user.id) &&
        now < (timestamps.get(interaction.user.id) || 0) + cooldownAmount
      )
        return interaction.reply({
          embeds: [
            new EmbedBuilder().setColor("Red").setDescription(
              t("warnings.cooldown", {
                time: (
                  ((timestamps.get(interaction.user.id) || 0) +
                    cooldownAmount -
                    now) /
                  1000
                ).toFixed(1),
              })
            ),
          ],
          flags: ["Ephemeral"],
        });

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      logInteraction(
        selectMenuHandler.customId,
        InteractionType.Button,
        interaction.user.id,
        interaction.guildId
      );
      return await selectMenuHandler.Execute(interaction, t);
    } catch (err) {
      logger.error("SelectMenuInteraction execution error", err);

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                t("errors.generic_error") || "An unexpected error occurred."
              ),
          ],
        });
      }
    }
  }
}
