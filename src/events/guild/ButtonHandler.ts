import {
  ButtonInteraction,
  Collection,
  EmbedBuilder,
  Events,
} from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import { logger } from "../..";
import i18next from "../../services/i18n";
import GuildConfig from "../../base/schemas/GuildConfigSchema";
import logInteraction from "../../services/logger/logInteraction";
import { InteractionType } from "../../base/schemas/UserInteractionSchema";

export default class ButtonHandler extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "Button handler event",
      once: false,
    });
  }

  async Execute(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;
    const [action] = interaction.customId.split(":");
    if (action === "ready_up") return;

    const guildLang = await GuildConfig.findOne({
      guildId: interaction.guildId!,
    });
    const t = i18next.getFixedT(guildLang?.lang!);

    try {
      const buttonActionHandler = this.client.buttons.get(action);

      if (!buttonActionHandler) {
        return (
          //@ts-ignore
          interaction.reply({
            content: t("warnings.no_button_action"),
            flags: ["Ephemeral"],
          }) && this.client.buttons.delete(action)
        );
      }

      const { cooldowns } = this.client;
      if (!cooldowns.has(buttonActionHandler.customId))
        cooldowns.set(buttonActionHandler.customId, new Collection());

      const now = Date.now();
      const timestamps = cooldowns.get(buttonActionHandler.customId)!;
      const cooldownAmount = (buttonActionHandler.cooldown || 3) * 1000;

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
        buttonActionHandler.customId,
        InteractionType.Button,
        interaction.user.id,
        interaction.guildId
      );
      return await buttonActionHandler.Execute(interaction, t);
    } catch (err) {
      logger.error("ButtonAction execution error", err);

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
