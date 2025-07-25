import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import Bottleneck from 'bottleneck';
import { Guilds } from '../../services/database/orm/init';
import { logger } from '../..';

const limiter = new Bottleneck({
  minTime: 1500, // 1 DM / 1.5 second
  maxConcurrent: 1,
});

const sentOwners = new Set<string>();

export default class MassDm extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'massdm',
      description: 'Send message to all server owners',
      category: Category.Developer,
      default_member_permissions: PermissionsBitField.Flags.Administrator,
      dm_permission: false,
      cooldown: 1,
      dev: true,
      options: [
        {
          name: 'message',
          description: 'Message',
          required: true,
          type: ApplicationCommandOptionType.String,
        },
        {
          name: 'attachment',
          description: 'Attachment',
          required: false,
          type: ApplicationCommandOptionType.Attachment,
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, _t: TFunction<'translation', undefined>) {
    const messageContent = interaction.options.getString('message', true);
    const image = interaction.options.getAttachment('attachment');

    await interaction.reply({
      content: 'Sending DMs to all server owners (100+ members)...',
      flags: ['Ephemeral'],
    });

    const storedGuilds = await Guilds.findAll();

    let sent = 0;
    let skipped = 0;

    for (const storedGuild of storedGuilds) {
      limiter.schedule(async () => {
        try {
          const guild = await interaction.client.guilds.fetch(storedGuild.guildId);
          if ((guild.memberCount ?? 0) < 1) {
            logger.warn('Skipped server due to not enough members.');
            skipped++;
            return;
          }

          if (!storedGuild.sendDMs) {
            logger.warn('Skipped server due config settings');
            skipped++;
            return;
          }

          const owner = await guild.fetchOwner();
          if (sentOwners.has(owner.id)) {
            logger.warn('Skipped server due to the owner has already been contacted.');
            skipped++;
            return;
          }

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`no_more_dm:${storedGuild.guildId}`)
              .setLabel('Dont send me more DMs in the future')
              .setStyle(ButtonStyle.Secondary)
          );

          await owner.send({
            content: messageContent,
            files: image ? [image.url] : undefined,
            components: [row],
          });

          sentOwners.add(owner.id);
          logger.info(
            `✅ DM sent to ${owner.user.tag} (server: ${guild.name} [${guild.memberCount} members])`
          );
          sent++;
        } catch (err) {
          logger.warn(`❌ Failed to DM for ${storedGuild.guildId}: ${(err as Error).message}`);
        }
      });
    }

    limiter.on('idle', async () => {
      sentOwners.clear();

      await interaction.followUp({
        content: `✅ Done. DMs sent: ${sent}, skipped: ${skipped}`,
        flags: ['Ephemeral'],
      });
    });
  }
}
