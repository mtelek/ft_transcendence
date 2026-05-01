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
