import DeadlockMatchPlayer from "../clients/DeadlockClient/DeadlockMatchService/entities/DeadlockMatchPlayer";
import { useAssetsClient } from "../..";
import { Collection } from "discord.js";
import { getFormattedMatchTime } from "./getFormattedMatchTime";

import { Canvas, loadImage } from "@napi-rs/canvas";

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

export async function generateMatchImage(
  options: IGenerateMatchImageOptions
): Promise<Buffer> {
  const { match } = options;

  const sapphireTeam = match.team_0_players;
  const amberTeam = match.team_1_players;

  const party_colors = new Collection<number, string>([
    [0, "#FF6B6B"],
    [1, "#FF6B6B"],
    [2, "#6BCB77"],
    [3, "#4D96FF"],
    [4, "#FFD93D"],
    [5, "#9D4EDD"],
    [6, "#FF922B"],
  ]);

  const nameStatGap = 20;

  const canvasWidth = 1800;
  const canvasHeight = 850;
  const canvas = new Canvas(canvasWidth, canvasHeight);
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
  const startY = 300;
  const startTeamLabelY = 250;
  const teamLabelYOffset = 160;
  const rowLabels = [
    "Souls",
    "Kills",
    "Deaths",
    "Assists",
    "Player Damage",
    "Obj Damage",
    "Healing",
  ];

  const centerX = canvasWidth / 2;
  const rowLabelX = centerX;

  const spacingBetweenTeams = playerSpacing * 1.5;
  const sapphireStartX =
    centerX - playerSpacing * (sapphireTeam.length - 1) - spacingBetweenTeams;
  const amberStartX = centerX + spacingBetweenTeams;

  const team0BadgeUrl = await useAssetsClient.DefaultService.GetRankImage(
    match.average_badge_team0
  );
  const team1BadgeUrl = await useAssetsClient.DefaultService.GetRankImage(
    match.average_badge_team1
  );

  const team0RankBadge = await loadImage(team0BadgeUrl!);
  const team1RankBadge = await loadImage(team1BadgeUrl!);

  const fixedWidth = 120;
  const aspectRatio = team0RankBadge.height / team0RankBadge.width;
  const scaledHeight = fixedWidth * aspectRatio;

  const heroes = [
    ...match.team_0_players.map((h) => h.hero_id),
    ...match.team_1_players.map((h) => h.hero_id),
  ];

  const heroPromises = heroes.map(
    async (hero) => await useAssetsClient.HeroService.GetHeroCached(hero)
  );
  const resolvedHeroes = await Promise.all(heroPromises);

  const heroImages: Collection<number, string> = new Collection();

  for (const hero of resolvedHeroes) {
    heroImages.set(hero?.id!, hero?.images.icon_hero_card!);
  }

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(getFormattedMatchTime(match.duration_s), canvasWidth / 2, 60);

  // Team names
  if (match.winning_team === 0) {
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#4fc3f7";
    ctx.fillText(
      "The Sapphire Flame",
      sapphireStartX + fixedWidth / 2,
      startTeamLabelY - teamLabelYOffset - 48
    );

    ctx.font = "italic bold 48px 'Georgia', 'Times New Roman', serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(
      "Victory",
      sapphireStartX + fixedWidth / 2,
      startTeamLabelY - teamLabelYOffset
    );
  } else {
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#4fc3f7";
    ctx.fillText(
      "The Sapphire Flame",
      sapphireStartX + fixedWidth / 2,
      startTeamLabelY - teamLabelYOffset
    );
  }

  ctx.drawImage(
    team0RankBadge,
    sapphireStartX - fixedWidth * 0.5,
    10,
    fixedWidth,
    scaledHeight
  );

  const amberTeamLabelX = amberStartX + playerSpacing * (amberTeam.length - 1);

  if (match.winning_team === 1) {
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffb74d";

    ctx.fillText(
      "The Amber Hand",
      amberTeamLabelX - fixedWidth / 2,
      startTeamLabelY - teamLabelYOffset - 48
    );

    ctx.font = "italic bold 48px 'Georgia', 'Times New Roman', serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(
      "Victory",
      amberTeamLabelX - fixedWidth / 2,
      startTeamLabelY - teamLabelYOffset
    );
  } else {
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffb74d";
    ctx.fillText(
      "The Amber Hand",
      amberTeamLabelX - fixedWidth / 2,
      startTeamLabelY - teamLabelYOffset
    );
  }

  ctx.drawImage(
    team1RankBadge,
    amberTeamLabelX - fixedWidth * 0.5,
    10,
    fixedWidth,
    scaledHeight
  );

  ctx.textAlign = "center";
  ctx.font = "16px Arial";

  const columnTopY = startY - avatarHeight;
  const columnBottomY = startY + labelGap * rowLabels.length;

  // Date
  ctx.fillStyle = "#999";
  ctx.textAlign = "right";
  ctx.font = "bold 16px Arial";
  ctx.fillText(match.match_id.toString(), canvasWidth - 75, canvasHeight - 50);
  ctx.fillText(match.start_date, canvasWidth - 75, canvasHeight - 30);

  async function renderPlayerData(
    team: IDeadlockPlayerWithName[],
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
      const heroAvatar = heroImages.get(player.hero_id);
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
      ctx.textAlign = "center";
      ctx.fillText(shortenPlayerName(player.name), x, startY + 10);

      if (player.party !== 0) {
        ctx.beginPath();
        ctx.arc(x, startY + 30, 10, 0, Math.PI * 2);
        ctx.fillStyle = party_colors.get(player.party)!;
        ctx.fill();
      }

      // --- Stats ---
      ctx.fillStyle = "#fff";
      ctx.font = "16px Arial";
      ctx.fillText(
        player.net_worth.toLocaleString(),
        x,
        startY + labelGap * 1 + nameStatGap
      );
      ctx.fillText(
        player.kills.toString(),
        x,
        startY + labelGap * 2 + nameStatGap
      );
      ctx.fillText(
        player.deaths.toString(),
        x,
        startY + labelGap * 3 + nameStatGap
      );
      ctx.fillText(
        player.assists.toString(),
        x,
        startY + labelGap * 4 + nameStatGap
      );
      ctx.fillText(
        player.damage_dealt.toLocaleString(),
        x,
        startY + labelGap * 5 + nameStatGap
      );
      ctx.fillText(
        player.obj_damage.toLocaleString(),
        x,
        startY + labelGap * 6 + nameStatGap
      );
      ctx.fillText(
        player.healing.toLocaleString(),
        x,
        startY + labelGap * 7 + nameStatGap
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

  return canvas.toBuffer("image/png");
}

const shortenPlayerName = (playername: string) => {
  if (playername.length < 12) return playername;

  return playername.slice(0, 9) + "...";
};
