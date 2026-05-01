import { Table } from "poker-ts";
import type { Server } from "socket.io";
import type { GameSession, PokerCard } from "./types";
import { HAND_RANKING_NAMES } from "./types";
import type { PokerServerState } from "./state";

export function endGame(state: PokerServerState, gameId: string) {
  const session = state.games.get(gameId);
  if (!session) return;

  for (const p of session.players) {
    state.pendingGames.delete(p.username);
    state.socketToGame.delete(p.socketId);
  }

  state.reservedGameNames.delete(gameId);
  setTimeout(() => state.games.delete(gameId), 15_000);
  console.log(`Game ${gameId} ended - players released`);
}

export function advanceRounds(session: GameSession) {
  const { table } = session;
  let safety = 0;

  while (!table.isBettingRoundInProgress() && table.isHandInProgress() && safety++ < 5) {
    if (table.areBettingRoundsCompleted()) {
      session.lastCommunityCards = [...table.communityCards()];
      session.lastHoleCards = table.holeCards().map((h) => (h ? [...h] : null));
      const totalPot = table.pots().reduce((sum, p) => sum + p.size, 0);
      table.showdown();

      const rawWinners = table.winners();
      if (rawWinners.length > 0 && rawWinners[0].length > 0) {
        const potPerWinner = rawWinners[0].length > 1 ? Math.floor(totalPot / rawWinners[0].length) : totalPot;
        session.handResult = rawWinners[0].map(([seatIdx, handInfo]) => ({
          username: session.players.find((p) => p.seatIndex === seatIdx)!.username,
          handName: HAND_RANKING_NAMES[handInfo.ranking] ?? "Unknown",
          holeCards: (session.lastHoleCards[seatIdx] ?? []) as PokerCard[],
          potWon: potPerWinner,
        }));
      }
      return;
    }

    table.endBettingRound();
    if (table.isHandInProgress()) {
      session.lastCommunityCards = [...table.communityCards()];
    }
  }
}

// returns true if the game is now over (1 or 0 players with chips).
// eliminates busted players: notifies them, removes them from session, reseats remaining on a fresh table (with 2 seats)
export function handleElimination(io: Server, state: PokerServerState, gameId: string): boolean {
  const session = state.games.get(gameId);
  if (!session) return true;

  const seats = session.table.seats();

  const activePlayers = session.players.filter((p) => {
    const seat = seats[p.seatIndex];
    return seat && seat.totalChips > 0;
  });

  const bustedPlayers = session.players.filter((p) => {
    const seat = seats[p.seatIndex];
    return !seat || seat.totalChips === 0;
  });

  for (const p of bustedPlayers) {
    io.to(p.socketId).emit("eliminated");
    state.socketToGame.delete(p.socketId);
    state.pendingGames.delete(p.username);
  }

  if (activePlayers.length <= 1) {
    // re-index the single winner to seat 0 for snapshot consistency
    activePlayers.forEach((p, newSeat) => {
      const entry = state.socketToGame.get(p.socketId);
      if (entry) entry.seatIndex = newSeat;
      p.seatIndex = newSeat;
    });
    session.players = activePlayers;
    session.isGameOver = true;
    return true;
  }

  // create a fresh table with the surviving players
  const newTable = new Table({ smallBlind: 10, bigBlind: 20 }, activePlayers.length);
  activePlayers.forEach((p, newSeat) => {
    const oldSeat = seats[p.seatIndex];
    newTable.sitDown(newSeat, oldSeat!.totalChips);
  });

  activePlayers.forEach((p, newSeat) => {
    const entry = state.socketToGame.get(p.socketId);
    if (entry) entry.seatIndex = newSeat;
    p.seatIndex = newSeat;
  });

  session.table = newTable;
  session.players = activePlayers;
  session.nextHandReady = new Array(activePlayers.length).fill(false);
  session.lastHoleCards = new Array(activePlayers.length).fill(null);
  session.lastCommunityCards = [];
  session.nextDealerSeat = 0;
  // keep handResult so players see who won the last hand before clicking "next hand"

  return false;
}
