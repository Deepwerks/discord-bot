import DeadlockMatchPlayer from "../clients/DeadlockClient/DeadlockMatchService/entities/DeadlockMatchPlayer";
import { useAssetsClient } from "../..";
import { getFormattedMatchTime } from "./getFormattedMatchTime";
import { Canvas, loadImage, SKRSContext2D } from "@napi-rs/canvas";

interface IDeadlockPlayerWithName extends DeadlockMatchPlayer {
  name: string;
}

export interface IGenerateMatchImageOptions {
  match: {
    match_id: number;
    duration_s: number;
    start_date: string;
    average_badge_team0: number;
    average_badge_team1: number;
    winning_team: number;
    team_0_players: IDeadlockPlayerWithName[];
    team_1_players: IDeadlockPlayerWithName[];
  };
}

// --- Constants ---

const Layout = {
  canvasWidth: 1800,
  canvasHeight: 850,
  avatarWidth: 80,
  playerSpacing: 130,
  labelGap: 60,
  startY: 300,
  nameStatGap: 20,
  marginX: 50,
};

const Fonts = {
  title: "bold 28px Arial",
  point: "22px Arial",
  playerName: "bold 16px Arial",
  stat: "16px Arial",
  label: "bold 16px Arial",
  victory: "italic bold 48px 'Georgia', 'Times New Roman', serif",
  team: "bold 22px Arial",
};

const Colors = {
  background: "#1e1e2f",
  white: "#ffffff",
  grey: "#999",
  sapphire: "#4fc3f7",
  amber: "#ffb74d",
};

const partyColors = new Map<number, string>([
  [0, "#FF6B6B"],
  [1, "#FF6B6B"],
  [2, "#6BCB77"],
  [3, "#4D96FF"],
  [4, "#FFD93D"],
  [5, "#9D4EDD"],
  [6, "#FF922B"],
]);

const bestStatColors = new Map<string, string>([
  ["souls", "#C2B4F0"],
  ["kills", "#F88080"],
  ["assists", "#90E0B0"],
  ["player_damage", "#F0A8A8"],
  ["obj_damage", "#E0C080"],
  ["healing", "#80E8D0"],
]);

const rowLabels = [
  "Souls",
  "Kills",
  "Deaths",
  "Assists",
  "Player Damage",
  "Obj Damage",
  "Healing",
];

// --- Helpers ---

const shortenPlayerName = (name: string) =>
  name.length <= 12 ? name : name.slice(0, 9) + "...";

async function safeLoadImage(
  url: string
): Promise<ReturnType<typeof loadImage> | null> {
  try {
    return await loadImage(url);
  } catch (error) {
    console.error("Failed to load image:", url, error);
    return null;
  }
}

function getBestStats(players: IDeadlockPlayerWithName[]) {
  return {
    souls: Math.max(...players.map((p) => p.net_worth)),
    kills: Math.max(...players.map((p) => p.kills)),
    assists: Math.max(...players.map((p) => p.assists)),
    player_damage: Math.max(...players.map((p) => p.damage_dealt)),
    obj_damage: Math.max(...players.map((p) => p.obj_damage)),
    healing: Math.max(...players.map((p) => p.healing)),
  };
}

// --- Drawing Functions ---

async function drawPlayer(
  ctx: SKRSContext2D,
  player: IDeadlockPlayerWithName,
  x: number,
  heroImages: Map<number, string>,
  bestStats: Record<string, number>
) {
  const { startY, labelGap, nameStatGap, playerSpacing } = Layout;

  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.fillRect(
    x - playerSpacing / 2 + 10,
    startY - Layout.avatarWidth + 10,
    playerSpacing - 20,
    labelGap * (rowLabels.length + 1) + 80
  );

  // Avatar
  const heroUrl = heroImages.get(player.hero_id);
  if (heroUrl) {
    const img = await safeLoadImage(heroUrl);
    if (img) {
      const avatarHeight = Layout.avatarWidth * (380 / 280);
      ctx.drawImage(
        img,
        x - Layout.avatarWidth / 2,
        startY - avatarHeight,
        Layout.avatarWidth,
        avatarHeight
      );
    }
  }

  // Player name
  ctx.fillStyle = Colors.white;
  ctx.font = Fonts.playerName;
  ctx.textAlign = "center";
  ctx.fillText(shortenPlayerName(player.name), x, startY + 10);

  // Party icon
  if (player.party !== 0) {
    ctx.beginPath();
    ctx.arc(x, startY + 30, 10, 0, Math.PI * 2);
    ctx.fillStyle = partyColors.get(player.party)!;
    ctx.fill();
  }

  // Stats
  const stats = [
    { value: player.net_worth, key: "souls" },
    { value: player.kills, key: "kills" },
    { value: player.deaths },
    { value: player.assists, key: "assists" },
    { value: player.damage_dealt, key: "player_damage" },
    { value: player.obj_damage, key: "obj_damage" },
    { value: player.healing, key: "healing" },
  ];

  for (let i = 0; i < stats.length; i++) {
    const { value, key } = stats[i];
    const isBest = key && bestStats[key] === value;

    ctx.fillStyle = isBest ? bestStatColors.get(key!)! : Colors.white;
    ctx.font = isBest ? `bold 16px Arial` : Fonts.stat;
    ctx.fillText(
      typeof value === "number" ? value.toLocaleString() : value,
      x,
      startY + labelGap * (i + 1) + nameStatGap
    );
  }
}

async function drawTeam(
  ctx: SKRSContext2D,
  team: IDeadlockPlayerWithName[],
  startX: number,
  heroImages: Map<number, string>,
  bestStats: Record<string, number>
) {
  const promises = team.map((player, i) =>
    drawPlayer(
      ctx,
      player,
      startX + i * Layout.playerSpacing,
      heroImages,
      bestStats
    )
  );
  await Promise.all(promises);
}

function drawLabels(ctx: SKRSContext2D) {
  const { startY, labelGap, nameStatGap, marginX } = Layout;
  ctx.textAlign = "center";
  ctx.font = Fonts.label;
  rowLabels.forEach((label, i) => {
    const y = startY + labelGap * (i + 1) + nameStatGap;
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(
        marginX,
        y - labelGap / 2,
        Layout.canvasWidth - marginX * 2,
        labelGap
      );
    }
    ctx.fillStyle = Colors.grey;
    ctx.fillText(label, Layout.canvasWidth / 2, y);
  });
}

// --- Main Function ---

export async function generateMatchImage(
  options: IGenerateMatchImageOptions
): Promise<Buffer> {
  const { match } = options;
  const { team_0_players: sapphireTeam, team_1_players: amberTeam } = match;
  const allPlayers = [...sapphireTeam, ...amberTeam];
  const bestStats = getBestStats(allPlayers);

  const canvas = new Canvas(Layout.canvasWidth, Layout.canvasHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = Colors.background;
  ctx.fillRect(0, 0, Layout.canvasWidth, Layout.canvasHeight);
  ctx.textBaseline = "middle";

  const [team0BadgeUrl, team1BadgeUrl] = await Promise.all([
    useAssetsClient.DefaultService.GetRankImage(match.average_badge_team0),
    useAssetsClient.DefaultService.GetRankImage(match.average_badge_team1),
  ]);

  const [team0Badge, team1Badge] = await Promise.all([
    safeLoadImage(team0BadgeUrl!),
    safeLoadImage(team1BadgeUrl!),
  ]);

  const heroPromises = allPlayers.map((player) =>
    useAssetsClient.HeroService.GetHeroCached(player.hero_id)
  );
  const resolvedHeroes = await Promise.all(heroPromises);
  const heroImages = new Map<number, string>();
  for (const hero of resolvedHeroes) {
    if (hero?.images.icon_hero_card) {
      heroImages.set(hero.id, hero.images.icon_hero_card);
    }
  }

  // Title
  const boxWidth = 500;
  const boxHeight = 80;
  const boxX = Layout.canvasWidth / 2 - boxWidth / 2;
  const boxY = 20;

  ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; // semi-transparent white
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  ctx.fillStyle = Colors.white;
  ctx.font = Fonts.title;
  ctx.textAlign = "center";
  ctx.fillText(
    getFormattedMatchTime(match.duration_s),
    Layout.canvasWidth / 2,
    60
  );

  // Team Points
  ctx.font = Fonts.point;
  ctx.textAlign = "left";
  ctx.fillText(
    sapphireTeam.reduce((sum, p) => sum + p.net_worth, 0).toLocaleString(),
    Layout.canvasWidth / 2 - 175,
    60
  );

  ctx.textAlign = "right";
  ctx.fillText(
    amberTeam.reduce((sum, p) => sum + p.net_worth, 0).toLocaleString(),
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
    drawTeam(ctx, sapphireTeam, sapphireStartX, heroImages, bestStats),
    drawTeam(ctx, amberTeam, amberStartX, heroImages, bestStats),
  ]);

  // Badges
  const sapphireLeftmostX = sapphireStartX;
  const amberRightmostX =
    amberStartX + (amberTeam.length - 1) * Layout.playerSpacing;

  if (team0Badge)
    ctx.drawImage(team0Badge, sapphireLeftmostX - 60, 10, 120, 120);
  if (team1Badge) ctx.drawImage(team1Badge, amberRightmostX - 60, 10, 120, 120);

  // Team names + Victory
  ctx.font = Fonts.team;
  ctx.textAlign = "left";
  ctx.fillStyle = Colors.sapphire;
  ctx.fillText("The Sapphire Flame", sapphireLeftmostX + 80, 70);

  ctx.textAlign = "right";
  ctx.fillStyle = Colors.amber;
  ctx.fillText("The Amber Hand", amberRightmostX - 80, 70);

  ctx.font = Fonts.victory;
  ctx.fillStyle = Colors.white;

  if (match.winning_team === 0) {
    ctx.textAlign = "left";
    ctx.fillText("Victory", sapphireLeftmostX + 80, 120);
  } else if (match.winning_team === 1) {
    ctx.textAlign = "right";
    ctx.fillText("Victory", amberRightmostX - 80, 120);
  }

  // Labels
  drawLabels(ctx);

  // Footer
  ctx.font = Fonts.label;
  ctx.fillStyle = Colors.grey;
  ctx.textAlign = "right";
  ctx.fillText(
    match.match_id.toString(),
    Layout.canvasWidth - 75,
    Layout.canvasHeight - 45
  );
  ctx.fillText(
    match.start_date,
    Layout.canvasWidth - 75,
    Layout.canvasHeight - 25
  );

  return canvas.toBuffer("image/png");
}
