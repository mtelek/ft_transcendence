import { Table } from "poker-ts";

export type PokerCard = { rank: string; suit: string };

export interface Seat {
  totalChips: number;
  betSize: number;
  stack: number;
}

interface PlayerEntry {
  socketId: string;
  username: string;
  image?: string;
  seatIndex: number;
  isActive: boolean;
}

interface WinnerInfo {
  username: string;
  handName: string;
  holeCards: PokerCard[];
  potWon: number;
}

export interface GameSession {
  table: InstanceType<typeof Table>;
  players: PlayerEntry[];     //avtive players
  allPlayers: PlayerEntry[];  //all players
  lastCommunityCards: PokerCard[];
  lastHoleCards: (PokerCard[] | null)[];
  startingStack: number;
  blinds: { small: number; big: number };
  specialChipEnabled: boolean;
  specialChipUsedBy: boolean[];
  specialRevealActiveBySeat: number[];  // -1 = inactive, N = target seatIndex
  handResult: WinnerInfo[] | null;
  nextDealerSeat: number;
  isGameOver: boolean;
  totalPlayers: number;
  matchSaved: boolean;
  handsPlayedByUsername: Record<string, number>;
}

export type OpponentSnapshot = {
  username: string;
  image?: string;
  stack: number;
  betSize: number;
  totalChips: number;
  holeCards: (PokerCard | null)[];
  isDealer: boolean;
  seatIndex: number;
  isDisconnected: boolean;
};

export type GameSnapshot = {
  gameId: string;
  phase: "preflop" | "flop" | "turn" | "river" | "finished" | "gameover";
  startingStack: number;
  me: {
    username: string;
    image?: string;
    stack: number;
    betSize: number;
    totalChips: number;
    holeCards: (PokerCard | null)[];
    isDealer: boolean;
    seatIndex: number;
  };
  opponents: OpponentSnapshot[];
  communityCards: PokerCard[];
  pot: number;
  myTurn: boolean;
  legalActions: { actions: string[]; chipRange?: { min: number; max: number } };
  specialChip: {
    isEnabled: boolean;
    isUsed: boolean;
    revealedOpponentCards: boolean;
  };
  handResult: WinnerInfo[] | null;
  isGameOver: boolean;
  totalPlayers: number;
};

export const HAND_RANKING_NAMES = [
  "High Card", "Pair", "Two Pair", "Three of a Kind",
  "Straight", "Flush", "Full House", "Four of a Kind",
  "Straight Flush", "Royal Flush",
];
