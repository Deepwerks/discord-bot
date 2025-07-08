import { logger, useAssetsClient } from '../..';
import DeadlockMatch from '../clients/DeadlockClient/services/DeadlockMatchService/entities/DeadlockMatch';
import DeadlockMatchPlayer from '../clients/DeadlockClient/services/DeadlockMatchService/entities/DeadlockMatchPlayer';
import { getFormattedMatchTime } from './getFormattedMatchTime';
import { Canvas, loadImage, SKRSContext2D, Image } from '@napi-rs/canvas';

export interface IGenerateMatchImageOptions {
  match: DeadlockMatch;
  useGenericNames: boolean;
  highlightedPlayerId?: number;
}

// --- Constants ---

const Layout = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  avatarWidth: 85,
  playerSpacing: 140,
  labelGap: 76,
  startY: 380,
  nameStatGap: 25,
  marginX: 50,
  badgeDesiredWidth: 128,
};

const Fonts = {
  title: 'bold 34px Arial',
  point: '28px Arial',
  playerName: 'bold 20px Arial',
  stat: '20px Arial',
  label: 'bold 20px Arial',
  victory: "italic bold 58px 'Georgia', 'Times New Roman', serif",
  team: 'bold 28px Arial',
};

const Colors = {
  background: '#1e1e2f',
  white: '#ffffff',
  grey: '#999',
  sapphire: '#4fc3f7',
  amber: '#ffb74d',
};

const partyColors = new Map<number, string>([
  [0, '#FF6B6B'],
  [1, '#FF6B6B'],
  [2, '#6BCB77'],
  [3, '#4D96FF'],
  [4, '#FFD93D'],
  [5, '#9D4EDD'],
  [6, '#FF922B'],
]);

const bestStatColors = new Map<string, string>([
  ['souls', '#C2B4F0'],
  ['kills', '#F88080'],
  ['assists', '#90E0B0'],
  ['player_damage', '#F0A8A8'],
  ['obj_damage', '#E0C080'],
  ['healing', '#80E8D0'],
]);

const rowLabels = ['Souls', 'Kills', 'Deaths', 'Assists', 'Player Damage', 'Obj Damage', 'Healing'];

// --- Helpers ---

const shortenPlayerName = async (player: DeadlockMatchPlayer) => {
  const profile = await player.getProfile();

  return profile.name.length <= 12 ? profile.name : profile.name.slice(0, 9) + '...';
};

async function safeLoadImage(url: string | null): Promise<ReturnType<typeof loadImage> | null> {
  if (!url) return null;

  try {
    return await loadImage(url);
  } catch (error) {
    logger.warn('Failed to load image:', url, error);
    return null;
  }
}

function getBestStats(players: DeadlockMatchPlayer[]) {
  return {
    souls: Math.max(...players.map((p) => p.netWorth)),
    kills: Math.max(...players.map((p) => p.kills)),
    assists: Math.max(...players.map((p) => p.assists)),
    player_damage: Math.max(...players.map((p) => p.stats.at(-1)?.player_damage ?? 0)),
    obj_damage: Math.max(...players.map((p) => p.stats.at(-1)?.boss_damage ?? 0)),
    healing: Math.max(...players.map((p) => p.stats.at(-1)?.player_healing ?? 0)),
  };
}

function getCenteredPosition(x: number, y: number, imageWidth: number, imageHeight: number) {
  return {
    x: x - imageWidth / 2,
    y: y - imageHeight / 2,
  };
}

function cropBadgeCentered(
  img: Image,
  maxWidth: number
): { sx: number; sy: number; sw: number; sh: number } {
  if (img.width <= maxWidth) {
    return { sx: 0, sy: 0, sw: img.width, sh: img.height };
  }
  const excessWidth = img.width - maxWidth;
  const sx = excessWidth / 2;
  return { sx, sy: 0, sw: maxWidth, sh: img.height };
}

// --- Drawing Functions ---

async function drawPlayer(
  ctx: SKRSContext2D,
  player: DeadlockMatchPlayer,
  x: number,
  heroImages: Map<number, string>,
  heroNames: Map<number, string>,
  bestStats: Record<string, number>,
  useGenericNames: boolean,
  highlightedPlayerId?: number
) {
  const { startY, labelGap, nameStatGap, playerSpacing } = Layout;

  // Background
  ctx.fillStyle =
    highlightedPlayerId && player.accountId === highlightedPlayerId
      ? 'rgba(255, 255, 255, 0.10)'
      : 'rgba(255, 255, 255, 0.03)';
  ctx.fillRect(
    x - playerSpacing / 2 + 10,
    startY - Layout.avatarWidth + 10,
    playerSpacing - 20,
    labelGap * (rowLabels.length + 1) + 80
  );

  // Avatar
  const heroUrl = heroImages.get(player.heroId);
  if (heroUrl) {
    const img = await safeLoadImage(heroUrl);
    if (img) {
      const avatarHeight = Layout.avatarWidth * (380 / 280);
      ctx.drawImage(
        img,
        x - Layout.avatarWidth / 2,
        startY - avatarHeight - 10,
        Layout.avatarWidth,
        avatarHeight
      );

      ctx.beginPath();
      ctx.strokeStyle = '#c1c1d7';
      ctx.lineWidth = 2;
      ctx.moveTo(x - Layout.avatarWidth / 2 - 5, startY - 10);
      ctx.lineTo(x - Layout.avatarWidth / 2 + Layout.avatarWidth + 5, startY - 10);
      ctx.stroke();
    }
  }

  // Player name
  ctx.fillStyle = Colors.white;
  ctx.font = Fonts.playerName;
  ctx.textAlign = 'center';
  ctx.fillText(
    useGenericNames
      ? (heroNames.get(player.heroId) ?? 'Unknown Hero')
      : await shortenPlayerName(player),
    x,
    startY + 10
  );

  // Party icon
  if (player.party !== 0) {
    const color = partyColors.get(player.party)!;
    const lineWidth = 4;
    const bracketWidth = 60;
    const bracketHeight = 20;
    const centerY = startY + 35;
    const startX = x - bracketWidth / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(startX, centerY - bracketHeight / 2);
    ctx.lineTo(startX + bracketWidth, centerY - bracketHeight / 2);
    ctx.stroke();
  }

  // Stats
  const stats = [
    { value: player.netWorth, key: 'souls' },
    { value: player.kills, key: 'kills' },
    { value: player.deaths },
    { value: player.assists, key: 'assists' },
    { value: player.stats.at(-1)?.player_damage ?? 0, key: 'player_damage' },
    { value: player.stats.at(-1)?.boss_damage ?? 0, key: 'obj_damage' },
    { value: player.stats.at(-1)?.player_healing ?? 0, key: 'healing' },
  ];

  for (let i = 0; i < stats.length; i++) {
    const { value, key } = stats[i];
    const isBest = key && bestStats[key] === value;

    ctx.fillStyle = isBest ? bestStatColors.get(key!)! : Colors.white;
    ctx.font = isBest ? `bold 20px Arial` : Fonts.stat;
    ctx.fillText(
      typeof value === 'number' ? value.toLocaleString() : value,
      x,
      startY + labelGap * (i + 1) + nameStatGap
    );
  }
}

async function drawTeam(
  ctx: SKRSContext2D,
  team: DeadlockMatchPlayer[],
  startX: number,
  heroImages: Map<number, string>,
  heroNames: Map<number, string>,
  bestStats: Record<string, number>,
  useGenericNames: boolean,
  highlightedPlayerId?: number
) {
  const promises = team.map((player, i) =>
    drawPlayer(
      ctx,
      player,
      startX + i * Layout.playerSpacing,
      heroImages,
      heroNames,
      bestStats,
      useGenericNames,
      highlightedPlayerId
    )
  );
  await Promise.all(promises);
}

function drawLabels(ctx: SKRSContext2D) {
  const { startY, labelGap, nameStatGap, marginX } = Layout;
  ctx.textAlign = 'center';
  ctx.font = Fonts.label;
  rowLabels.forEach((label, i) => {
    const y = startY + labelGap * (i + 1) + nameStatGap;
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(marginX, y - labelGap / 2, Layout.canvasWidth - marginX * 2, labelGap);
    }
    ctx.fillStyle = Colors.grey;
    ctx.fillText(label, Layout.canvasWidth / 2, y);
  });
}

// --- Main Function ---

export async function generateMatchImage(options: IGenerateMatchImageOptions): Promise<Buffer> {
  const { match, useGenericNames, highlightedPlayerId } = options;

  await match.loadPlayerProfiles();

  const { team0Players: sapphireTeam, team1Players: amberTeam } = match;
  const allPlayers = [...sapphireTeam, ...amberTeam];
  const bestStats = getBestStats(allPlayers);

  const scale = 2;
  const canvas = new Canvas(Layout.canvasWidth * scale, Layout.canvasHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = 'high';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = Colors.background;
  ctx.fillRect(0, 0, Layout.canvasWidth, Layout.canvasHeight);
  ctx.textBaseline = 'middle';

  const team0BadgeUrl = await match.getAverageBadgeTeam0Url();
  const team1BadgeUrl = await match.getAverageBadgeTeam1Url();

  const [team0Badge, team1Badge] = await Promise.all([
    safeLoadImage(team0BadgeUrl),
    safeLoadImage(team1BadgeUrl),
  ]);

  const heroPromises = allPlayers.map((player) =>
    useAssetsClient.HeroService.GetHero(player.heroId)
  );
  const resolvedHeroes = await Promise.all(heroPromises);
  const heroImages = new Map<number, string>();
  const heroNames = new Map<number, string>();
  for (const hero of resolvedHeroes) {
    if (hero) {
      if (hero.images.icon_hero_card) {
        heroImages.set(hero.id, hero.images.icon_hero_card);
      }
      heroNames.set(hero.id, hero.name);
    }
  }

  // Title
  const boxWidth = 500;
  const boxHeight = 80;
  const boxX = Layout.canvasWidth / 2 - boxWidth / 2;
  const boxY = 20;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  ctx.fillStyle = Colors.white;
  ctx.font = Fonts.title;
  ctx.textAlign = 'center';
  ctx.fillText(getFormattedMatchTime(match.durationS), Layout.canvasWidth / 2, 60);

  // Team Points
  ctx.font = Fonts.point;
  ctx.textAlign = 'left';
  ctx.fillText(
    sapphireTeam.reduce((sum, p) => sum + p.netWorth, 0).toLocaleString(),
    Layout.canvasWidth / 2 - 175,
    60
  );

  ctx.textAlign = 'right';
  ctx.fillText(
    amberTeam.reduce((sum, p) => sum + p.netWorth, 0).toLocaleString(),
    Layout.canvasWidth / 2 + 175,
    60
  );

  // Teams
  const sapphireStartX =
    Layout.canvasWidth / 2 -
    Layout.playerSpacing * (sapphireTeam.length - 1) -
    Layout.playerSpacing;
  const amberStartX = Layout.canvasWidth / 2 + Layout.playerSpacing;

  await Promise.all([
    drawTeam(
      ctx,
      sapphireTeam,
      sapphireStartX,
      heroImages,
      heroNames,
      bestStats,
      useGenericNames,
      highlightedPlayerId
    ),
    drawTeam(
      ctx,
      amberTeam,
      amberStartX,
      heroImages,
      heroNames,
      bestStats,
      useGenericNames,
      highlightedPlayerId
    ),
  ]);

  // Badges
  const sapphireLeftmostX = sapphireStartX;
  const amberRightmostX = amberStartX + (amberTeam.length - 1) * Layout.playerSpacing;

  if (team0Badge) {
    const crop = cropBadgeCentered(team0Badge, 500); // pl. 500px max width
    const scaledHeight = Layout.badgeDesiredWidth * (crop.sh / crop.sw);

    const sapphireLeftmostX = sapphireStartX;
    const team0Position = getCenteredPosition(
      sapphireLeftmostX,
      scaledHeight / 2 + 25,
      Layout.badgeDesiredWidth,
      scaledHeight
    );

    ctx.drawImage(
      team0Badge,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      team0Position.x,
      team0Position.y,
      Layout.badgeDesiredWidth,
      scaledHeight
    );
  }

  if (team1Badge) {
    const crop = cropBadgeCentered(team1Badge, 500);
    const scaledHeight = Layout.badgeDesiredWidth * (crop.sh / crop.sw);

    const amberRightmostX = amberStartX + (amberTeam.length - 1) * Layout.playerSpacing;
    const team1Position = getCenteredPosition(
      amberRightmostX,
      scaledHeight / 2 + 25,
      Layout.badgeDesiredWidth,
      scaledHeight
    );

    ctx.drawImage(
      team1Badge,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      team1Position.x,
      team1Position.y,
      Layout.badgeDesiredWidth,
      scaledHeight
    );
  }

  // Team names + Victory
  ctx.font = Fonts.team;
  ctx.textAlign = 'left';
  ctx.fillStyle = Colors.sapphire;
  ctx.fillText('The Sapphire Flame', sapphireLeftmostX + 80, 70);

  ctx.textAlign = 'right';
  ctx.fillStyle = Colors.amber;
  ctx.fillText('The Amber Hand', amberRightmostX - 80, 70);

  ctx.font = Fonts.victory;
  ctx.fillStyle = Colors.white;

  if (match.winningTeam === 0) {
    ctx.textAlign = 'left';
    ctx.fillText('Victory', sapphireLeftmostX + 80, 120);
  } else if (match.winningTeam === 1) {
    ctx.textAlign = 'right';
    ctx.fillText('Victory', amberRightmostX - 80, 120);
  }

  // Labels
  drawLabels(ctx);

  // Footer
  ctx.font = Fonts.label;
  ctx.fillStyle = Colors.grey;
  ctx.textAlign = 'right';
  ctx.fillText(
    useGenericNames ? 'Hidden due to privacy settings' : match.matchId.toString(),
    Layout.canvasWidth - 75,
    Layout.canvasHeight - 45
  );
  if (!useGenericNames) {
    ctx.fillText(
      match.startDate.format('D MMMM, YYYY'),
      Layout.canvasWidth - 75,
      Layout.canvasHeight - 25
    );
  }

  return canvas.toBuffer('image/png');
}
