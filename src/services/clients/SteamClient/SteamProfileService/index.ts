import { ICachedSteamProfile } from "../../../../base/interfaces/ICachedSteamProfile";
import StoredPlayer from "../../../../base/schemas/StoredPlayer";
import { steamProfileCache } from "../../../cache";
import logger from "../../../logger";
import { getSteamIdType } from "../../../utils/getSteamIdType";
import { isValidSteamId } from "../../../utils/isValidSteamId";
import { resolveToSteamID64 } from "../../../utils/resolveToSteamID64";
import BaseClient from "../../BaseClient";
import ISteamID from "./interfaces/ISteamID";
import ISteamPlayer from "./interfaces/ISteamPlayer";
import ISteamPlayersResponse from "./interfaces/ISteamPlayersResponse";

export interface ISteamProfileService {
  GetPlayer(steamID: ISteamID): Promise<ISteamPlayer>;
  GetPlayers(steamIDs: ISteamID[]): Promise<ISteamPlayer[]>;
  GetIdFromUsername(username: string): Promise<string | null>;
}

export default class SteamProfileService implements ISteamProfileService {
  private client: BaseClient;
  private readonly STEAM_ID64_BASE = BigInt("76561197960265728");

  constructor(client: BaseClient) {
    this.client = client;
  }

  async GetPlayer(steamID: ISteamID): Promise<ISteamPlayer> {
    logger.info("[API CALL] Fetching steam profile...");
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

  async GetIdFromUsername(username: string): Promise<string | null> {
    const response = await this.client.request<any>(
      "GET",
      `/ISteamUser/ResolveVanityURL/v1/?key=${this.client.apiKey}&vanityurl=${username}`
    );

    if (response.response.success !== 1) {
      return null;
    }

    return response.response.steamid;
  }

  // Cached
  async GetProfile(
    account_id: string | null,
    isValidSteamID64: boolean = false
  ) {
    if (!account_id) return null;
    let steamID64: string = account_id;

    if (!isValidSteamID64) {
      let steamId: string | undefined;
      let steamIdType: "steamID3" | "steamID" | "steamID64" | null;

      if (isValidSteamId(account_id)) steamId = account_id;
      else {
        let _steamId = await this.GetIdFromUsername(account_id);

        if (!_steamId || !isValidSteamId(_steamId)) return null;

        steamId = _steamId;
      }

      steamIdType = getSteamIdType(steamId);

      if (!steamIdType) {
        logger.error("Could not determine steamID type");
        return null;
      }

      steamID64 = await resolveToSteamID64(steamId);
    }

    const cachedProfile = await steamProfileCache.get(steamID64);

    if (!cachedProfile) {
      const steamProfile = await this.GetPlayer({
        type: "steamID64",
        value: steamID64,
      });

      steamProfileCache.set(steamID64, steamProfile as ICachedSteamProfile);
      return steamProfile as ICachedSteamProfile;
    }

    return cachedProfile as ICachedSteamProfile;
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
