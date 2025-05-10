type LobbyState = {
  name: string;
  creatorId: string;
  maxPlayers: number;
  players: Set<string>;
  messageId: string;
  partyId?: string;
};

class LobbyStore {
  private lobbies = new Map<string, LobbyState>();

  createLobby(id: string, state: LobbyState) {
    this.lobbies.set(id, state);
  }

  getLobby(id: string): LobbyState | undefined {
    return this.lobbies.get(id);
  }

  updateLobby(id: string, update: Partial<LobbyState>) {
    const lobby = this.lobbies.get(id);
    if (lobby) {
      this.lobbies.set(id, { ...lobby, ...update });
    }
  }

  addPlayer(lobbyId: string, userId: string): boolean {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return false;

    if (lobby.players.has(userId)) return false;
    if (lobby.players.size >= lobby.maxPlayers) return false;

    lobby.players.add(userId);
    return true;
  }

  removeLobby(id: string) {
    this.lobbies.delete(id);
  }

  setPartId(lobbyId: string, partId: string) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return false;

    lobby.partyId = partId;
  }

  getPartyId(lobbyId: string) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return false;
    if (!lobby.partyId) return false;

    return lobby.partyId;
  }
}

export const lobbyStore = new LobbyStore();
export const readyStore = new Map<string, Set<string>>();
