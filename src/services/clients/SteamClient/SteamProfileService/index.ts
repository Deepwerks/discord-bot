import logger from "../../../logger";
import BaseClient from "../../BaseClient";
import ISteamID from "./interfaces/ISteamID";
import ISteamPlayer from "./interfaces/ISteamPlayer";
import ISteamPlayersResponse from "./interfaces/ISteamPlayersResponse";

export interface ISteamProfileService {
  GetPlayer(steamID: ISteamID): Promise<ISteamPlayer>;
  GetPlayers(steamIDs: ISteamID[]): Promise<ISteamPlayer[]>;
}

export default class SteamProfileService implements ISteamProfileService {
  private client: BaseClient;
  private readonly STEAM_ID64_BASE = BigInt("76561197960265728");

  constructor(client: BaseClient) {
    this.client = client;
  }

  async GetPlayer(steamID: ISteamID): Promise<ISteamPlayer> {
    const response = await this.client.request<ISteamPlayersResponse>(
      "GET",
      `/ISteamUser/GetPlayerSummaries/v0002/?key=${
        this.client.apiKey
      }&steamids=${this.convertToSteamId64(steamID)}`
    );

    const players = response.response.players;

    if (players.length === 0) {
      logger.warn("Player not found!");
      throw new Error("Player not found");
    }

    return players[0];
  }

  async GetPlayers(steamIDs: ISteamID[]): Promise<ISteamPlayer[]> {
    const players: ISteamPlayer[] = [];

    const steamIDs64 = steamIDs.map((steamID) =>
      this.convertToSteamId64(steamID)
    );

    const response = await this.client.request<ISteamPlayersResponse>(
      "GET",
      `/ISteamUser/GetPlayerSummaries/v0002/?key=${
        this.client.apiKey
      }&steamids=${steamIDs64.join(",")}`
    );

    for (const player of response.response.players) players.push(player);

    return players;
  }

  convertToSteamId64(steamID: ISteamID): string | null {
    try {
      switch (steamID.type) {
        case "steamID":
        case "steamID3":
          return (this.STEAM_ID64_BASE + BigInt(steamID.value)).toString();
        case "steamID64":
          return steamID.value;
        default:
          return null;
      }
    } catch (e) {
      console.error("Conversion error:", e);
      return null;
    }
  }
}
