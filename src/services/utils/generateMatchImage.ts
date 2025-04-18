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

  const sapphireTeam = match.team0WithSteamData;
  const amberTeam = match.team1WithSteamData;

  const nameStatGap = 20;

  const canvasWidth = 1800;
  const canvasHeight = 800;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1e1e2f";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.textBaseline = "middle";

  const originalWidth = 280;
  const originalHeight = 380;

  const playerSpacing = 120;
  const avatarWidth = 80;
  const avatarHeight = avatarWidth * (originalHeight / originalWidth);
  const avatarNameGap = 10;
  const labelGap = 60;
  const startY = 250;
  const teamLabelYOffset = 160;
  const topY = startY - teamLabelYOffset - avatarHeight - 20;
  const rowLabels = ["Souls", "Kills", "Deaths", "Assists"];

  const maxPlayers = Math.max(sapphireTeam.length, amberTeam.length);
  const totalTeamWidth = (maxPlayers - 1) * playerSpacing;
  const centerX = canvasWidth / 2;
  const rowLabelX = centerX;

  const spacingBetweenTeams = playerSpacing * 1.5;
  const sapphireStartX =
    centerX - playerSpacing * (sapphireTeam.length - 1) - spacingBetweenTeams;
  const amberStartX = centerX + spacingBetweenTeams;

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Match Summary", canvasWidth / 2, 60);

  // Team names
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "#4fc3f7";
  ctx.fillText("The Sapphire Flame", 50, startY - teamLabelYOffset);

  ctx.textAlign = "right";
  ctx.fillStyle = "#ffb74d";
  const amberTeamLabelX = amberStartX + playerSpacing * (amberTeam.length - 1);
  ctx.fillText(
    "The Amber Hand",
    amberTeamLabelX + 50,
    startY - teamLabelYOffset
  );

  ctx.textAlign = "center";
  ctx.font = "16px Arial";

  const columnTopY = startY - avatarHeight; // az avatar teteje
  const columnBottomY = startY + labelGap * rowLabels.length; // az utolsó stat alj

  async function renderPlayerData(
    team: {
      deadlock_player: DeadlockMatchPlayer;
      steam_player: ISteamPlayer;
    }[],
    startX: number
  ) {
    for (let i = 0; i < team.length; i++) {
      const player = team[i];

      const x = startX + i * playerSpacing;

      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(
        x - playerSpacing / 2 + 10,
        columnTopY + avatarNameGap, // hogy az avatar aljától induljon
        playerSpacing - 20,
        columnBottomY - columnTopY + 20 + nameStatGap
      );

      // --- Avatar ---
      const heroAvatar = (await getDeadlockHero(player.deadlock_player.hero_id))
        .imageUrl;
      if (heroAvatar) {
        const img = await loadImage(heroAvatar);
        ctx.drawImage(
          img,
          x - avatarWidth / 2,
          startY - avatarHeight - avatarNameGap,
          avatarWidth,
          avatarHeight
        );
      }

      // --- Player name ---
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.fillText(
        shortenPlayerName(player.steam_player.personaname),
        x,
        startY + 10
      );

      // --- Stats ---
      ctx.fillStyle = "#fff";
      ctx.font = "16px Arial";
      ctx.fillText(
        player.deadlock_player.net_worth.toLocaleString(),
        x,
        startY + labelGap * 1 + nameStatGap
      );
      ctx.fillText(
        player.deadlock_player.kills.toString(),
        x,
        startY + labelGap * 2 + nameStatGap
      );
      ctx.fillText(
        player.deadlock_player.deaths.toString(),
        x,
        startY + labelGap * 3 + nameStatGap
      );
      ctx.fillText(
        player.deadlock_player.assists.toString(),
        x,
        startY + labelGap * 4 + nameStatGap
      );
    }
  }

  await renderPlayerData(sapphireTeam, sapphireStartX);
  await renderPlayerData(amberTeam, amberStartX);

  // Stat labels (center column)
  ctx.fillStyle = "#999";
  ctx.textAlign = "center";
  ctx.font = "bold 16px Arial";
  rowLabels.forEach((label, i) => {
    const rowY = startY + labelGap * (i + 1) + nameStatGap;

    // Háttér szín váltogatás
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(50, rowY - labelGap / 2, canvasWidth - 100, labelGap);
    }

    // Label szöveg
    ctx.fillStyle = "#999";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, rowLabelX, rowY);
  });

  return canvas.toBuffer();
}

const shortenPlayerName = (playername: string) => {
  if (playername.length < 12) return playername;

  return playername.slice(0, 9) + "...";
};
