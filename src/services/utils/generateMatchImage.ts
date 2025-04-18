import { createCanvas, loadImage } from "canvas";
import DeadlockMatchPlayer from "../clients/DeadlockClient/DeadlockMatchService/entities/DeadlockMatchPlayer";
import ISteamPlayer from "../clients/SteamClient/SteamProfileService/interfaces/ISteamPlayer";
import { getDeadlockHero } from "./getDeadlockHero";
import { useAssetsClient } from "../..";
import { getCachedHero } from "../cache/heroCache";

export interface IGenerateMatchImageOptions {
  match: {
    id: number;
    duration: number;
    average_badge_team0: number;
    average_badge_team1: number;
    winning_team: number;
    team0WithSteamData: {
      deadlock_player: DeadlockMatchPlayer;
      steam_player: ISteamPlayer;
    }[];
    team1WithSteamData: {
      deadlock_player: DeadlockMatchPlayer;
      steam_player: ISteamPlayer;
    }[];
  };
}

export async function generateMatchImage(
  options: IGenerateMatchImageOptions
): Promise<Buffer> {
  const { match } = options;

  const canvasWidth = 1800;
  const canvasHeight = 800;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1e1e2f";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const statLabels = ["Souls", "Kills", "Deaths", "Assists"];

  const sapphirePlayers = match.team0WithSteamData;
  const amberPlayers = match.team1WithSteamData;

  const colWidth = 100;
  const statLabelWidth = 100;
  const rowHeight = 80;
  const avatarHeight = 120;
  const avatarNameGap = 10;

  const totalCols = sapphirePlayers.length + amberPlayers.length;
  const tableWidth = totalCols * colWidth + statLabelWidth + 40;
  const centerX = canvasWidth / 2;
  const sapphireStartX = centerX - tableWidth / 2;
  const statLabelX = sapphireStartX + sapphirePlayers.length * colWidth + 20;
  const amberStartX = statLabelX + statLabelWidth + 20;

  const startY = 300;

  // Title
  ctx.font = "bold 28px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("Match Summary", canvasWidth / 2, 50);

  // Team names
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#3cb6ff";
  ctx.textAlign = "left";
  ctx.fillText("The Sapphire Flame", sapphireStartX, startY - 200);
  ctx.fillStyle = "#f5a623";
  ctx.fillText("The Amber Hand", amberStartX + 50, startY - 200);

  ctx.textAlign = "center";

  // Játékosnevek
  for (const [teamPlayers, teamStartX] of [
    [sapphirePlayers, sapphireStartX],
    [amberPlayers, amberStartX],
  ] as const) {
    for (let i = 0; i < teamPlayers.length; i++) {
      const player = teamPlayers[i];
      try {
        const img = await loadImage(
          (
            await getDeadlockHero(player.deadlock_player.hero_id)
          ).imageUrl
        );
        const aspectRatio = img.width / img.height;
        const avatarWidth = avatarHeight * aspectRatio;

        const x = teamStartX + i * colWidth + (colWidth - avatarWidth) / 2;
        const y = startY - avatarHeight - avatarNameGap - 10;

        ctx.drawImage(img, x, y, avatarWidth, avatarHeight);
      } catch (err) {
        console.warn(
          `Failed to load avatar for ${player.steam_player.personaname}`,
          err
        );
      }

      // Név kirajzolása
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        player.steam_player.personaname,
        teamStartX + i * colWidth + colWidth / 2,
        startY
      );
    }
  }

  // Statisztikák
  statLabels.forEach((label, rowIdx) => {
    const y = startY + (rowIdx + 1) * rowHeight;

    // Stat név középen
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, statLabelX + statLabelWidth / 2, y);

    // Sapphire stat értékek
    sapphirePlayers.forEach((p, i) => {
      const val = getStatValue(p, label);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        String(val),
        sapphireStartX + i * colWidth + colWidth / 2,
        y
      );
    });

    // Amber stat értékek
    amberPlayers.forEach((p, i) => {
      const val = getStatValue(p, label);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(String(val), amberStartX + i * colWidth + colWidth / 2, y);
    });
  });

  return canvas.toBuffer();
}

function getStatValue(
  player: {
    deadlock_player: DeadlockMatchPlayer;
    steam_player: ISteamPlayer;
  },
  label: string
): number {
  switch (label) {
    case "Souls":
      return player.deadlock_player.net_worth;
    case "Kills":
      return player.deadlock_player.kills;
    case "Deaths":
      return player.deadlock_player.deaths;
    case "Assists":
      return player.deadlock_player.assists;
    default:
      return 0;
  }
}
