import { createCanvas, CanvasRenderingContext2D } from "@napi-rs/canvas";

type LeaderboardEntry = {
  account_name: string;
  rank: number;
  badgeName: string;
};

export function drawLeaderboardImage(
  mappedLeaderboard: LeaderboardEntry[]
): Buffer {
  const MAX_ENTRIES = 100;
  const entries = mappedLeaderboard.slice(0, MAX_ENTRIES);

  // Alap konfig
  const entryHeight = 40;
  const padding = 20;
  const width = 800;
  const height = padding * 2 + entryHeight * entries.length;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Háttér
  ctx.fillStyle = "#1e1e2f";
  ctx.fillRect(0, 0, width, height);

  // Cím
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.fillText("🏆 Leaderboard", padding, padding + 10);

  // Fejléc
  const startY = padding + 40;
  ctx.font = "bold 20px Arial";
  ctx.fillText("Rank", 40, startY);
  ctx.fillText("Name", 140, startY);
  ctx.fillText("Badge", 500, startY);

  // Adatok
  ctx.font = "16px Arial";
  entries.forEach((entry, i) => {
    const y = startY + (i + 1) * entryHeight;
    ctx.fillStyle = i % 2 === 0 ? "#2a2a3d" : "#1e1e2f";
    ctx.fillRect(0, y - entryHeight + 10, width, entryHeight);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(`#${entry.rank}`, 40, y);
    ctx.fillText(entry.account_name, 140, y);
    ctx.fillText(entry.badgeName, 500, y);
  });

  return canvas.toBuffer("image/png");
}
