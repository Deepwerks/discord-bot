import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  TextChannel,
  ThreadAutoArchiveDuration,
  ChannelType,
  Attachment,
  AutocompleteInteraction,
} from 'discord.js';
import Command from '../../base/classes/Command';
import CustomClient from '../../base/classes/CustomClient';
import Category from '../../base/enums/Category';
import { TFunction } from 'i18next';
import { useAssetsClient, useDeadlockClient } from '../..';
import CommandError from '../../base/errors/CommandError';
import { generateMatchImage } from '../../services/utils/generateMatchImage';
import { StoredPlayers } from '../../services/database/orm/init';
import { matchFeedbackStore } from '../../services/redis/stores/MatchFeedbackStore';

export default class MatchFeedback extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: 'match-feedback',
      description: 'Share a match video and collect feedback from the community',
      category: Category.Deadlock,
      default_member_permissions: PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: false, // Must be used in a server for threads
      cooldown: 10,
      dev: false,
      options: [
        {
          name: 'match_id',
          description: 'The match ID for this video',
          required: true,
          type: ApplicationCommandOptionType.Integer,
        },
        {
          name: 'title',
          description: 'Title for your match video',
          required: true,
          type: ApplicationCommandOptionType.String,
          max_length: 100,
        },
        {
          name: 'hero_played',
          description: 'Your played character (optional)',
          required: false,
          type: ApplicationCommandOptionType.Number,
          autocomplete: true,
        },
        {
          name: 'rank',
          description: 'Your current rank (optional)',
          required: false,
          type: ApplicationCommandOptionType.String,
          max_length: 50,
        },
        {
          name: 'video',
          description: 'Upload your match video file',
          required: false,
          type: ApplicationCommandOptionType.Attachment,
        },
      ],
    });
  }

  async Execute(interaction: ChatInputCommandInteraction, t: TFunction<'translation', undefined>) {
    const videoAttachment = interaction.options.getAttachment('video');
    const matchId = interaction.options.getInteger('match_id', true);
    const title = interaction.options.getString('title', true);
    const rank = interaction.options.getString('rank', false);
    const heroPlayed = interaction.options.getNumber('hero_played', false);

    await interaction.deferReply();

    // Validate video file
    if (videoAttachment && !videoAttachment.contentType?.startsWith('video/')) {
      throw new CommandError(t('commands.match_feedback.error_invalid_video'));
    }

    // Validate file size (Discord limit is 25MB for regular users, 100MB for Nitro)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (videoAttachment && videoAttachment.size > maxSize) {
      throw new CommandError(t('commands.match_feedback.error_file_too_large'));
    }

    // Fetch match data
    const match = await useDeadlockClient.MatchService.GetMatch(matchId);
    if (!match) {
      throw new CommandError(t('commands.match_feedback.error_match_not_found'));
    }

    const player = await StoredPlayers.findOne({
      where: {
        discordId: interaction.user.id,
      },
    });

    let playedCharacter = heroPlayed
      ? (await useAssetsClient.HeroService.GetHero(heroPlayed))?.name
      : null;

    if (player && !playedCharacter) {
      const playerInMatch = match.players.find((p) => p.account_id === +player.steamId);

      if (playerInMatch) {
        const hero = await useAssetsClient.HeroService.GetHero(playerInMatch.hero_id);
        playedCharacter = hero ? hero.name : null;
      }
    }

    // Generate match image
    const imageBuffer = await generateMatchImage({
      match,
      useGenericNames: false,
      highlightedPlayerId: heroPlayed
        ? match.players.find((p) => p.hero_id === heroPlayed)?.account_id
        : player?.steamId
          ? Number(player.steamId)
          : undefined,
    });

    // Create private thread first
    const channel = interaction.channel as TextChannel;
    const thread = await channel.threads.create({
      name: t('commands.match_feedback.thread_name', { title }),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      type: ChannelType.PrivateThread,
      reason: t('commands.match_feedback.thread_reason'),
    });

    // Add the command initiator to the thread
    await thread.members.add(interaction.user.id);

    // Create "Post Feedback" button
    const sessionId = `${interaction.user.id}_${Date.now()}`;
    const feedbackButton = new ButtonBuilder()
      .setCustomId(`post_feedback:${sessionId}`)
      .setLabel(t('commands.match_feedback.button_post_feedback'))
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💬');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(feedbackButton);

    // Create match image attachment
    const matchImageAttachment = new AttachmentBuilder(imageBuffer, {
      name: 'match.png',
    });

    // Create embed for the public post
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle(t('commands.match_feedback.embed_title', { title }))
      .setDescription(
        t('commands.match_feedback.embed_description', {
          matchId,
          rank,
          playedCharacter,
        })
      )
      .setFooter({
        text: t('commands.match_feedback.embed_footer', {
          displayName: interaction.user.displayName,
        }),
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    const files: (AttachmentBuilder | Attachment)[] = [matchImageAttachment];
    if (videoAttachment) files.push(videoAttachment);

    // Post in public channel
    const publicMessage = await interaction.editReply({
      content: t('commands.match_feedback.public_message_content', {
        displayedUserId: interaction.user.id,
        matchId,
      }),
      embeds: [embed],
      files: files,
      components: [row],
    });

    // Store session data
    await matchFeedbackStore.store(sessionId, {
      matchId,
      title,
      rank: rank || undefined,
      videoUrl: videoAttachment?.url,
      creatorId: interaction.user.id,
      threadId: thread.id,
      channelId: channel.id,
      messageId: publicMessage.id,
      ratings: [],
    });

    // Create delete session button for private thread
    const closeButton = new ButtonBuilder()
      .setCustomId(`close_feedback_session:${sessionId}`)
      .setLabel(t('commands.match_feedback.button_close_session'))
      .setStyle(ButtonStyle.Danger);

    const threadRow = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

    // Send initial message to private thread
    await thread.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle(t('commands.match_feedback.thread_initial_title'))
          .setDescription(
            t('commands.match_feedback.thread_initial_description', {
              title,
              matchId,
              video: videoAttachment ? `\n**Video:** [View Video](${videoAttachment.url})` : '',
            })
          )
          .setTimestamp(),
      ],
      components: [threadRow],
    });
  }

  async AutoComplete(interaction: AutocompleteInteraction) {
    // Check if the focused option is the hero_name option
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name !== 'hero_played') return;

    const focusedValue = focusedOption.value.toLowerCase();

    // Get all hero names from the cache
    const heroes = useAssetsClient.HeroService.GetHeroes();

    // Filter the hero names based on the focused value
    const suggestions = heroes
      .filter((h) => h.name.toLowerCase().includes(focusedValue))
      .sort((a, b) => {
        const aIndex = a.name.toLowerCase().indexOf(focusedValue);
        const bIndex = b.name.toLowerCase().indexOf(focusedValue);
        return aIndex - bIndex;
      })
      .map((h) => ({ name: h.name, value: h.id }))
      .slice(0, 25);

    await interaction.respond(suggestions);
  }
}
