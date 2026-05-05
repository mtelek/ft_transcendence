import type { GameSession } from "./types";

export type LobbyPlayer = {
  socketId: string;
  username: string;
  image?: string;
};

export type NamedLobbyEntry = {
  password: string;
  maxPlayers: number;
  blinds: {
    small: number;
    big: number;
  };
  startingStack: number;
  useSpecialChip: boolean;
  players: LobbyPlayer[];
};

export type PendingGameEntry = {
  gameId: string;
  seatIndex: number;
};

export type SocketGameEntry = {
  gameId: string;
  seatIndex: number;
};

export type PokerServerState = {
  namedLobbies: Map<string, NamedLobbyEntry>;
  reservedGameNames: Set<string>;
  games: Map<string, GameSession>;
  pendingGames: Map<string, PendingGameEntry>;
  socketToGame: Map<string, SocketGameEntry>;
};

export function createPokerServerState(): PokerServerState {
  return {
    namedLobbies: new Map<string, NamedLobbyEntry>(),
    reservedGameNames: new Set<string>(),
    games: new Map<string, GameSession>(),
    pendingGames: new Map<string, PendingGameEntry>(),
    socketToGame: new Map<string, SocketGameEntry>(),
  };
}
