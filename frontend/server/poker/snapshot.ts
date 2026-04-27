import type { Server } from "socket.io";
import type { PokerServerState } from "./state";
import type { GameSnapshot, PokerCard } from "./types";

export function buildSnapshot(state: PokerServerState, gameId: string, mySeatIndex: number): GameSnapshot {
  const session = state.games.get(gameId)!;
  const { table, players, lastCommunityCards, lastHoleCards, handResult, nextHandReady, isGameOver } = session;

  const myEntry = players.find((p) => p.seatIndex === mySeatIndex)!;
  const oppEntry = players.find((p) => p.seatIndex !== mySeatIndex)!;
  const oppSeatIndex = oppEntry.seatIndex;

  const seats = table.seats();
  const mySeat = seats[mySeatIndex];
  const oppSeat = seats[oppSeatIndex];

  const handInProgress = table.isHandInProgress();
  const bettingInProgress = handInProgress && table.isBettingRoundInProgress();
  const communityCards: PokerCard[] = handInProgress ? table.communityCards() : lastCommunityCards;

  let myHoleCards: (PokerCard | null)[] = [null, null];
  let oppHoleCards: (PokerCard | null)[] = [null, null];
  if (handInProgress) {
    const all = table.holeCards();
    myHoleCards = (all[mySeatIndex] ?? []) as PokerCard[];
    oppHoleCards = (all[oppSeatIndex] ?? [null, null]).map(() => null);
  } else {
    myHoleCards = lastHoleCards[mySeatIndex] ?? [null, null];
    oppHoleCards = lastHoleCards[oppSeatIndex] ?? [null, null];
  }

  let phase: GameSnapshot["phase"] = "preflop";
  if (isGameOver) phase = "gameover";
  else if (!handInProgress) phase = "finished";
  else phase = table.roundOfBetting();

  const pot = handInProgress ? table.pots().reduce((sum, p) => sum + p.size, 0) : 0;

  const myTurn = bettingInProgress && table.playerToAct() === mySeatIndex;
  const rawLegal = myTurn ? table.legalActions() : { actions: [] as string[] };
  const legalActions = {
    actions: rawLegal.actions,
    chipRange: (rawLegal as any).chipRange
      ? { min: (rawLegal as any).chipRange.min, max: (rawLegal as any).chipRange.max }
      : undefined,
  };

  const dealerSeat = handInProgress ? table.button() : -1;

  return {
    gameId,
    phase,
    me: {
      username: myEntry.username,
      image: myEntry.image,
      stack: mySeat?.stack ?? 0,
      betSize: mySeat?.betSize ?? 0,
      totalChips: mySeat?.totalChips ?? 0,
      holeCards: myHoleCards,
      isDealer: dealerSeat === mySeatIndex,
    },
    opponent: {
      username: oppEntry.username,
      image: oppEntry.image,
      stack: oppSeat?.stack ?? 0,
      betSize: oppSeat?.betSize ?? 0,
      totalChips: oppSeat?.totalChips ?? 0,
      holeCards: oppHoleCards,
      isDealer: dealerSeat === oppSeatIndex,
    },
    communityCards,
    pot,
    myTurn,
    legalActions,
    handResult,
    iReadyForNextHand: nextHandReady[mySeatIndex as 0 | 1],
    isGameOver,
  };
}

export function broadcastState(io: Server, state: PokerServerState, gameId: string) {
  const session = state.games.get(gameId);
  if (!session) return;

  for (const p of session.players) {
    if (p.socketId) io.to(p.socketId).emit("gameState", buildSnapshot(state, gameId, p.seatIndex));
  }
}
