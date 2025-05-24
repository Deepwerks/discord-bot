export interface ISteamID {
  value: string;
  type: 'steamID' | 'steamID3' | 'steamID64';
}

export interface ISteamPlayer {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  avatarhash: string;
  lastlogoff: number;
  personastate: number;
  primaryclanid: string;
  timecreated: number;
  personastateflags: number;
}

export interface ISteamPlayersResponse {
  response: {
    players: ISteamPlayer[];
  };
}
