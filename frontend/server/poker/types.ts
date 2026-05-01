import { Table } from "poker-ts";

export type PokerCard = { rank: string; suit: string };

export interface PlayerEntry {
  socketId: string;
  username: string;
  image?: string;
  seatIndex: number;
}

export interface WinnerInfo {
  username: string;
  handName: string;
  holeCards: PokerCard[];
  potWon: number;
}

export interface GameSession {
  table: InstanceType<typeof Table>;
  players: PlayerEntry[];
  lastCommunityCards: PokerCard[];
  lastHoleCards: (PokerCard[] | null)[];
  handResult: WinnerInfo[] | null;
  nextHandReady: [boolean, boolean];
  nextDealerSeat: number;
  isGameOver: boolean;
}

export type GameSnapshot = {
  gameId: string;
  phase: "preflop" | "flop" | "turn" | "river" | "finished" | "gameover";
  me: {
    username: string;
    image?: string;
    stack: number;
    betSize: number;
    totalChips: number;
    holeCards: (PokerCard | null)[];
    isDealer: boolean;
  };
  opponent: {
    username: string;
    image?: string;
    stack: number;
    betSize: number;
    totalChips: number;
    holeCards: (PokerCard | null)[];
    isDealer: boolean;
  };
  communityCards: PokerCard[];
  pot: number;
  myTurn: boolean;
  legalActions: { actions: string[]; chipRange?: { min: number; max: number } };
  handResult: WinnerInfo[] | null;
  iReadyForNextHand: boolean;
  isGameOver: boolean;
};

export const HAND_RANKING_NAMES = [
  "High Card", "Pair", "Two Pair", "Three of a Kind",
  "Straight", "Flush", "Full House", "Four of a Kind",
  "Straight Flush", "Royal Flush",
];
