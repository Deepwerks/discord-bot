import { RedisClientType } from 'redis';
import { redisClient } from '..';

type LobbyState = {
  name: string;
  creatorId: string;
  maxPlayers: number;
  players: string[];
  messageId: string;
  shuffleMode?: 'Random';
  partyId?: string;
};

class LobbyStore {
  private client;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  private getKey(id: string) {
    return `lobby:${id}`;
  }

  async createLobby(id: string, state: LobbyState) {
    const data = JSON.stringify({ ...state, players: [...state.players] });
    await this.client.set(this.getKey(id), data);
  }

  async getLobby(id: string): Promise<LobbyState | undefined> {
    const data = await this.client.get(this.getKey(id));
    if (!data) return undefined;
    const parsed = JSON.parse(data);
    return parsed;
  }

  async updateLobby(id: string, update: Partial<LobbyState>) {
    const lobby = await this.getLobby(id);
    if (!lobby) return;

    const updated = { ...lobby, ...update };
    updated.players = [...new Set(lobby.players)]; // ensure it's an array
    await this.client.set(this.getKey(id), JSON.stringify(updated));
  }

  async addPlayer(lobbyId: string, userId: string): Promise<boolean> {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) return false;

    const players = new Set(lobby.players);
    if (players.has(userId) || players.size >= lobby.maxPlayers) return false;

    players.add(userId);
    lobby.players = Array.from(players);
    await this.client.set(this.getKey(lobbyId), JSON.stringify(lobby));
    return true;
  }

  async removeLobby(id: string) {
    await this.client.del(this.getKey(id));
  }

  async setPartId(lobbyId: string, partId: string) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby) return false;

    lobby.partyId = partId;
    await this.client.set(this.getKey(lobbyId), JSON.stringify(lobby));
    return true;
  }

  async getPartyId(lobbyId: string) {
    const lobby = await this.getLobby(lobbyId);
    if (!lobby || !lobby.partyId) return false;
    return lobby.partyId;
  }

  async isUserInAnyLobby(userId: string): Promise<boolean> {
    const iter = this.client.scanIterator({ MATCH: 'lobby:*' });

    for await (const rawKey of iter) {
      const key = typeof rawKey === 'string' ? rawKey : String(rawKey); // ensures it's a string
      const data = await this.client.get(key);
      if (!data) continue;

      const lobby: LobbyState = JSON.parse(data);
      if (lobby.players.includes(userId)) {
        return true;
      }
    }

    return false;
  }

  async removeUserFromOtherLobbies(userId: string): Promise<true | false> {
    const iter = this.client.scanIterator({ MATCH: 'lobby:*' });

    let removed = false;

    for await (const rawKey of iter) {
      const key = typeof rawKey === 'string' ? rawKey : String(rawKey);
      const data = await this.client.get(key);
      if (!data) continue;

      const lobby: LobbyState = JSON.parse(data);

      // Skip if user is the creator of this lobby
      if (lobby.creatorId === userId) {
        return false; // early exit: cannot remove from this one
      }

      // If user is in the players list, remove them
      if (lobby.players.includes(userId)) {
        lobby.players = lobby.players.filter((id) => id !== userId);
        await this.client.set(key, JSON.stringify(lobby));
        removed = true;
      }
    }

    return removed;
  }
}

export const lobbyStore = new LobbyStore(redisClient);
