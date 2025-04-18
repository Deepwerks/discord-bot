import { createCanvas } from "canvas";
import DeadlockMatchPlayer from "../clients/DeadlockClient/DeadlockMatchService/entities/DeadlockMatchPlayer";
import ISteamPlayer from "../clients/SteamClient/SteamProfileService/interfaces/ISteamPlayer";

export interface IGenerateMatchImageOptions {
  match: {
    id: number;
    duration: number;
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

  const width = 1000;
  const height = 700;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Háttérszín
  ctx.fillStyle = "#b3f2f2";
  ctx.fillRect(0, 0, width, height);

  // Cím - Duration
  ctx.fillStyle = "#000";
  ctx.font = "bold 28px Arial";
  ctx.fillText(`Duration: ${match.duration}`, 20, 50);

  const startY = 120;
  const rowHeight = 40;
  const baseX = 50;

  const drawRow = (
    player: {
      deadlock_player: DeadlockMatchPlayer;
      steam_player: ISteamPlayer;
    },
    y: number,
    index: number
  ) => {
    // Váltakozó háttérszín (zebra stílus)
    ctx.fillStyle = index % 2 === 0 ? "#e0f7f7" : "#ffffff";
    ctx.fillRect(baseX - 20, y - 28, width - 100, rowHeight - 5);

    ctx.fillStyle = "#000";
    ctx.font = "18px Arial";
    ctx.fillText(player.steam_player.personaname, baseX + 100, y);
    ctx.fillText(`${player.deadlock_player.net_worth}`, baseX + 300, y);
    ctx.fillText(
      `${player.deadlock_player.kills}/${player.deadlock_player.deaths}/${player.deadlock_player.assists}`,
      baseX + 400,
      y
    );
  };

  ctx.fillStyle = "#000";
  ctx.font = "bold 22px Arial";
  match.team0WithSteamData.forEach((p, i) =>
    drawRow(p, startY + i * rowHeight, i)
  );

  const offsetY = startY + match.team0WithSteamData.length * rowHeight + 50;
  ctx.fillStyle = "#000";
  ctx.font = "bold 22px Arial";
  match.team1WithSteamData.forEach((p, i) =>
    drawRow(p, offsetY + i * rowHeight, i)
  );

  return canvas.toBuffer();
}
