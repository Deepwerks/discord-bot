import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import CommandError from "../../base/errors/CommandError";

export default class Help extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "help",
      description: "Help command for the bot",
      category: Category.Utilities,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 3,
      dev: false,
      options: [
        {
          name: "command",
          description: "The name of the command you want help with.",
          type: ApplicationCommandOptionType.String,
          required: false,
          autocomplete: true,
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction) {
    const input = interaction.options.getString("command", false);
    const commands = this.client.commands;

    if (input) {
      const cmd = commands.get(input.toLowerCase());

      if (!cmd || cmd.dev) {
        throw new CommandError(`❌ Command \`${input}\` not found.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`📘 Help: /${cmd.name}`)
        .setDescription(cmd.description)
        .addFields(
          { name: "Category", value: cmd.category, inline: true },
          { name: "Cooldown", value: `${cmd.cooldown}s`, inline: true },
          {
            name: "Options",
            value:
              cmd.options.length > 0
                ? cmd.options
                    .map((opt: any) => `• \`${opt.name}\` — ${opt.description}`)
                    .join("\n")
                : "None",
          }
        )
        .setColor(0x00bcd4);

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Default: List all commands (as before)
    const grouped = new Map<Category, string[]>();

    for (const [, cmd] of commands) {
      if (cmd.dev || cmd.category === Category.Developer) continue;

      if (!grouped.has(cmd.category)) {
        grouped.set(cmd.category, []);
      }

      grouped.get(cmd.category)!.push(`</${cmd.name}:0> — ${cmd.description}`);
    }

    const embed = new EmbedBuilder()
      .setTitle("📖 Bot Commands")
      .setDescription("Here’s a list of all available commands:")
      .setColor(0x00bcd4);

    for (const [category, cmds] of grouped) {
      embed.addFields({
        name: `📂 ${category}`,
        value: cmds.join("\n"),
      });
    }

    await interaction.reply({ embeds: [embed] });
  }

  async AutoComplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const commands = this.client.commands;

    const suggestions = [...commands.values()]
      .filter(
        (cmd) =>
          !cmd.dev &&
          cmd.name.toLowerCase().includes(focused) &&
          cmd.category !== Category.Developer
      )
      .slice(0, 25) // Discord max autocomplete results
      .map((cmd) => ({
        name: cmd.name,
        value: cmd.name,
      }));

    await interaction.respond(suggestions);
  }
}
