/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActivityType, Collection, Events, REST, Routes } from 'discord.js';
import CustomClient from '../../base/classes/CustomClient';
import Event from '../../base/classes/Event';
import Command from '../../base/classes/Command';
import { logger } from '../..';

export default class Ready extends Event {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.ClientReady,
      description: 'Ready Event',
      once: true,
    });
  }

  async Execute() {
    logger.info(`${this.client.user?.tag} is now ready!`);

    this.client.user?.setPresence({
      activities: [
        {
          name: `New command: /create-lobby`,
          type: ActivityType.Watching,
        },
      ],
      status: 'online', // online | idle | dnd | invisible
    });

    const cliendId = this.client.config.discord_client_id;
    const rest = new REST().setToken(this.client.config.discord_bot_token);

    if (!this.client.developmentMode) {
      const globalCommands: any = await rest.put(Routes.applicationCommands(cliendId), {
        body: this.GetJson(
          this.client.commands.filter((cmd) => !cmd.dev && cmd.limitedServers === undefined)
        ),
      });

      logger.info(`Successfully loaded ${globalCommands.length} global application commands!`);
    }

    const devCommands: any = await rest.put(
      Routes.applicationGuildCommands(cliendId, this.client.config.dev_guild_id),
      {
        body: this.GetJson(this.client.commands.filter((cmd) => cmd.dev)),
      }
    );

    logger.info(`Successfully loaded ${devCommands.length} developer application commands!`);

    const limitedCommandsMap = new Map<string, Command[]>();

    this.client.commands.forEach((cmd) => {
      if (!cmd.limitedServers) return;

      for (const guildId of cmd.limitedServers) {
        if (!limitedCommandsMap.has(guildId)) {
          limitedCommandsMap.set(guildId, []);
        }
        limitedCommandsMap.get(guildId)?.push(cmd);
      }
    });

    for (const [guildId, commands] of limitedCommandsMap.entries()) {
      try {
        const registered: any = await rest.put(Routes.applicationGuildCommands(cliendId, guildId), {
          body: this.GetJson(new Collection(commands.map((cmd) => [cmd.name, cmd]))),
        });

        logger.info(`✅ Registered ${registered.length} limited commands for guild ${guildId}`);
      } catch (err) {
        logger.error(`❌ Failed to register commands for guild ${guildId}: ${err}`);
      }
    }
  }

  private GetJson(commands: Collection<string, Command>): object[] {
    const data: object[] = [];

    commands.forEach((command) => {
      data.push({
        name: command.name,
        description: command.description,
        options: command.options,
        default_member_permissions: command.default_member_permissions.toString(),
        dm_permission: command.dm_permission,
      });
    });

    return data;
  }
}
