import type { Server } from "socket.io";
import type { PokerServerState } from "./state";
import type { GameSnapshot, OpponentSnapshot, PokerCard } from "./types";

export function buildSnapshot(state: PokerServerState, gameId: string, mySeatIndex: number): GameSnapshot {
  const session = state.games.get(gameId)!;
  const {
    table,
    players,
    lastCommunityCards,
    lastHoleCards,
    handResult,
    isGameOver,
    totalPlayers,
    specialChipEnabled,
    specialChipUsedBy,
    specialRevealActiveBySeat,
  } = session;

  const myEntry = players.find((p) => p.seatIndex === mySeatIndex)!;
  const oppEntries = players.filter((p) => p.seatIndex !== mySeatIndex);

  const seats = table.seats();
  const mySeat = seats[mySeatIndex];

  const handInProgress = table.isHandInProgress();
  // handResult being set means the hand is logically over even if the library
  // hasn't fully transitioned state yet (e.g. fold before endBettingRound)
  const handActuallyInProgress = handInProgress && handResult === null;
  const bettingInProgress = handActuallyInProgress && table.isBettingRoundInProgress();
  const communityCards: PokerCard[] = handActuallyInProgress ? table.communityCards() : lastCommunityCards;

  let myHoleCards: (PokerCard | null)[] = [null, null];
  if (handActuallyInProgress) {
    const all = table.holeCards();
    myHoleCards = (all[mySeatIndex] ?? []) as PokerCard[];
  } else {
    myHoleCards = lastHoleCards[mySeatIndex] ?? [null, null];
  }

  const dealerSeat = handInProgress ? table.button() : -1;

  const opponents: OpponentSnapshot[] = oppEntries.map((oppEntry) => {
    const oppSeat = seats[oppEntry.seatIndex];
    let oppHoleCards: (PokerCard | null)[] = [null, null];
    if (handActuallyInProgress) {
      const all = table.holeCards();
      oppHoleCards = (all[oppEntry.seatIndex] ?? [null, null]).map(() => null);
      const revealTarget = specialRevealActiveBySeat[mySeatIndex] ?? -1;
      if (revealTarget === oppEntry.seatIndex) {
        const oppActualHoleCards = (all[oppEntry.seatIndex] ?? []) as PokerCard[];
        oppHoleCards = [oppActualHoleCards[0] ?? null, oppActualHoleCards[1] ?? null];
      }
    } else {
      oppHoleCards = lastHoleCards[oppEntry.seatIndex] ?? [null, null];
    }
    return {
      username: oppEntry.username,
      image: oppEntry.image,
      stack: oppSeat?.stack ?? 0,
      betSize: oppSeat?.betSize ?? 0,
      totalChips: oppSeat?.totalChips ?? 0,
      holeCards: oppHoleCards,
      isDealer: dealerSeat === oppEntry.seatIndex,
      seatIndex: oppEntry.seatIndex,
    };
  });

  let phase: GameSnapshot["phase"] = "preflop";
  if (isGameOver) phase = "gameover";
  else if (!handActuallyInProgress) phase = "finished";
  else phase = table.roundOfBetting();

  const pot = handActuallyInProgress ? table.pots().reduce((sum, p) => sum + p.size, 0) : 0;

  const myTurn = bettingInProgress && table.playerToAct() === mySeatIndex;
  const rawLegal = myTurn ? table.legalActions() : { actions: [] as string[] };
  const legalActions = {
    actions: rawLegal.actions,
    chipRange: (rawLegal as { chipRange?: { min: number; max: number } }).chipRange
      ? { min: (rawLegal as { chipRange: { min: number; max: number } }).chipRange.min, max: (rawLegal as { chipRange: { min: number; max: number } }).chipRange.max }
      : undefined,
  };

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
      seatIndex: mySeatIndex,
    },
    opponents,
    communityCards,
    pot,
    myTurn,
    legalActions,
    specialChip: {
      isEnabled: specialChipEnabled,
      isUsed: specialChipUsedBy[mySeatIndex] ?? false,
      revealedOpponentCards: (specialRevealActiveBySeat[mySeatIndex] ?? -1) !== -1,
    },
    handResult,
    isGameOver,
    totalPlayers,
  };
}

export function broadcastState(io: Server, state: PokerServerState, gameId: string) {
  const session = state.games.get(gameId);
  if (!session) return;

  for (const p of session.players) {
    if (p.socketId) io.to(p.socketId).emit("gameState", buildSnapshot(state, gameId, p.seatIndex));
  }
}
