import ISteamPlayer from './ISteamPlayer';

export default interface ISteamPlayersResponse {
  response: {
    players: ISteamPlayer[];
  };
}
