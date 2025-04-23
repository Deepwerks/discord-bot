import { ActivityType, Collection, Events, REST, Routes } from "discord.js";
import CustomClient from "../../base/classes/CustomClient";
import Event from "../../base/classes/Event";
import Command from "../../base/classes/Command.";
import logger from "../../services/logger";

export default class Ready extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.ClientReady,
      description: "Ready Event",
      once: true,
    });
  }

  async Execute() {
    logger.info(`${this.client.user?.tag} is now ready!`);

    this.client.user?.setPresence({
      activities: [
        {
          name: "your Statlocker 📊",
          type: ActivityType.Watching,
        },
      ],
      status: "online", // online | idle | dnd | invisible
    });

    const cliendId = this.client.config.discord_client_id;
    const rest = new REST().setToken(this.client.config.discord_bot_token);

    if (!this.client.developmentMode) {
      const globalCommands: any = await rest.put(
        Routes.applicationCommands(cliendId),
        {
          body: this.GetJson(this.client.commands.filter((cmd) => !cmd.dev)),
        }
      );

      logger.info(
        `Successfully loaded ${globalCommands.length} global application commands!`
      );
    }

    const devCommands: any = await rest.put(
      Routes.applicationGuildCommands(
        cliendId,
        this.client.config.dev_guild_id
      ),
      {
        body: this.GetJson(this.client.commands.filter((cmd) => cmd.dev)),
      }
    );

    logger.info(
      `Successfully loaded ${devCommands.length} developer application commands!`
    );
  }

  private GetJson(commands: Collection<string, Command>): object[] {
    const data: object[] = [];

    commands.forEach((command) => {
      data.push({
        name: command.name,
        description: command.description,
        options: command.options,
        default_member_permissions:
          command.default_member_permissions.toString(),
        dm_permission: command.dm_permission,
      });
    });

    return data;
  }
}
