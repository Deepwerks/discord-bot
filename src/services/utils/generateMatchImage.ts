import { createCanvas, loadImage } from "canvas";
import DeadlockMatchPlayer from "../clients/DeadlockClient/DeadlockMatchService/entities/DeadlockMatchPlayer";
import ISteamPlayer from "../clients/SteamClient/SteamProfileService/interfaces/ISteamPlayer";
import { getDeadlockHero } from "./getDeadlockHero";
import { useAssetsClient } from "../..";

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

  const rowHeight = 108;
  const avatarHeight = rowHeight;
  const avatarWidth = avatarHeight * 1.222;
  const teamGap = 216;
  const headerHeight = 75;

  const startY = rowHeight;
  const baseX = 50;

  const totalRows =
    match.team0WithSteamData.length + match.team1WithSteamData.length;
  const maxHeight = totalRows * rowHeight + teamGap + headerHeight + 15;
  const height = 1524 > maxHeight ? 1524 : maxHeight;
  const width = 2304;

  const winColors = ["#e9f7ef", "#d4efdf"];
  const loseColors = ["#fdecea", "#fadbd8"];

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Háttérszín
  ctx.fillStyle = "#e8f8f5";
  ctx.fillRect(0, 0, width, height);

  const drawWinnersRow = async (
    player: {
      deadlock_player: DeadlockMatchPlayer;
      steam_player: ISteamPlayer;
    },
    y: number,
    index: number
  ) => {
    // Zebra háttér
    ctx.fillStyle = index % 2 === 0 ? winColors[0] : winColors[1];
    ctx.fillRect(0, y - rowHeight + 10, width - 500, rowHeight);

    // Avatar
    try {
      const avatar = await loadImage(
        (
          await getDeadlockHero(player.deadlock_player.hero_id)
        ).imageUrl
      );
      ctx.drawImage(
        avatar,
        baseX,
        y - avatarHeight + 10,
        avatarWidth,
        avatarHeight
      );
    } catch {
      ctx.fillStyle = "#ccc";
      ctx.fillRect(baseX, y - avatarHeight + 10, avatarWidth, avatarHeight);
      ctx.fillStyle = "#555";
      ctx.font = "bold 36px Arial";
      ctx.fillText("?", baseX + avatarWidth / 2 - 10, y - 20);
    }

    // Szöveg
    ctx.fillStyle = "#0C3D0C";
    ctx.font = "36px Arial";
    ctx.fillText(
      player.steam_player.personaname,
      baseX + avatarWidth + 25,
      y - 10
    );
    ctx.font = "36px Arial";
    ctx.fillText(`${player.deadlock_player.net_worth}`, baseX + 500, y - 10);
    ctx.fillText(
      `${player.deadlock_player.kills}/${player.deadlock_player.deaths}/${player.deadlock_player.assists}`,
      baseX + 750,
      y - 10
    );
  };

  const drawLosersRow = async (
    player: {
      deadlock_player: DeadlockMatchPlayer;
      steam_player: ISteamPlayer;
    },
    y: number,
    index: number
  ) => {
    // Zebra háttér
    ctx.fillStyle = index % 2 === 0 ? loseColors[0] : loseColors[1];
    ctx.fillRect(0, y - rowHeight + 10, width - 500, rowHeight);

    // Avatar
    try {
      const avatar = await loadImage(
        (
          await getDeadlockHero(player.deadlock_player.hero_id)
        ).imageUrl
      );
      ctx.drawImage(
        avatar,
        baseX,
        y - avatarHeight + 10,
        avatarWidth,
        avatarHeight
      );
    } catch {
      ctx.fillStyle = "#ccc";
      ctx.fillRect(baseX, y - avatarHeight + 10, avatarWidth, avatarHeight);
      ctx.fillStyle = "#555";
      ctx.font = "bold 36px Arial";
      ctx.fillText("?", baseX + avatarWidth / 2 - 10, y - 20);
    }

    // Szöveg
    ctx.fillStyle = "#7F1D1D";
    ctx.font = "36px Arial";
    ctx.fillText(
      player.steam_player.personaname,
      baseX + avatarWidth + 25,
      y - 10
    );
    ctx.font = "36px Arial";
    ctx.fillText(`${player.deadlock_player.net_worth}`, baseX + 500, y - 10);
    ctx.fillText(
      `${player.deadlock_player.kills}/${player.deadlock_player.deaths}/${player.deadlock_player.assists}`,
      baseX + 750,
      y - 10
    );
  };

  //   Oszlopfejlécek
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 36px Arial";
  ctx.fillText("Hero", baseX, 50);
  ctx.fillText("Player", baseX + avatarWidth + 25, 50);
  ctx.fillText("Net Worth", baseX + 500, 50);
  ctx.fillText("K/ D / A", baseX + 750, 50);

  // Team 1
  ctx.font = "bold 22px Arial";
  for (let i = 0; i < match.team0WithSteamData.length; i++) {
    if (match.winning_team === 0) {
      await drawWinnersRow(
        match.team0WithSteamData[i],
        headerHeight + (startY + i * rowHeight),
        i
      );
    } else {
      await drawLosersRow(
        match.team0WithSteamData[i],
        headerHeight + (startY + i * rowHeight),
        i
      );
    }
  }

  const offsetY =
    startY +
    match.team0WithSteamData.length * rowHeight +
    teamGap +
    headerHeight;

  // Team 2
  ctx.font = "bold 22px Arial";
  for (let i = 0; i < match.team1WithSteamData.length; i++) {
    if (match.winning_team === 1) {
      await drawWinnersRow(
        match.team1WithSteamData[i],
        offsetY + i * rowHeight,
        i
      );
    } else {
      await drawLosersRow(
        match.team1WithSteamData[i],
        offsetY + i * rowHeight,
        i
      );
    }
  }

  return canvas.toBuffer();
}
