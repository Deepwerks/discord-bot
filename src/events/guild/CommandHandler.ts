import { Collection, EmbedBuilder, Events, Interaction } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import Command from "../../base/classes/Command";
import i18next from "../../services/i18n";
import GuildConfig from "../../base/schemas/GuildConfigSchema";
import { logger } from "../..";
import logInteraction from "../../services/logger/logInteraction";
import { InteractionType } from "../../base/schemas/UserInteractionSchema";

export default class CommandHandler extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "Command handler event",
      once: false,
    });
  }

  async Execute(interaction: Interaction) {
    // Check if the interaction is a command or autocomplete
    if (interaction.isChatInputCommand()) {
      const guildLang = await GuildConfig.findOne({
        guildId: interaction.guildId!,
      });
      const t = i18next.getFixedT(guildLang?.lang!);

      const command: Command = this.client.commands.get(
        interaction.commandName
      )!;

      if (!command)
        return (
          //@ts-ignore
          interaction.reply({
            content: t("warnings.no_command"),
            flags: ["Ephemeral"],
          }) && this.client.commands.delete(interaction.commandName)
        );

      if (
        command.dev &&
        !this.client.config.developer_user_ids.includes(interaction.user.id)
      ) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(t("warnings.no_permission")),
          ],
          flags: ["Ephemeral"],
        });
      }

      const { cooldowns } = this.client;
      if (!cooldowns.has(command.name))
        cooldowns.set(command.name, new Collection());

      const now = Date.now();
      const timestamps = cooldowns.get(command.name)!;
      const cooldownAmount = (command.cooldown || 3) * 1000;

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

      const subCommandGroup = interaction.options.getSubcommandGroup(false);
      const subCommand = `${interaction.commandName}${
        subCommandGroup ? `${subCommandGroup}` : ""
      }.${interaction.options.getSubcommand(false) || ""}`;

      logger.info(
        `[COMMAND] ${interaction.user.tag} used /${interaction.commandName}`
      );

      logInteraction(
        command.name,
        InteractionType.Command,
        interaction.user.id,
        interaction.guildId
      );

      try {
        const subCommandHandler = this.client.subCommands.get(subCommand);
        if (subCommandHandler) {
          return await subCommandHandler.Execute(interaction, t);
        } else {
          return await command.Execute(interaction, t);
        }
      } catch (err) {
        logger.error("Command execution error", err);

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

    // Check if it's an Autocomplete interaction
    else if (interaction.isAutocomplete()) {
      const command = this.client.commands.get(interaction.commandName);
      if (!command || !command.AutoComplete) return;

      try {
        await command.AutoComplete(interaction);
      } catch (error) {
        logger.error(error);
      }
    }
  }
}
