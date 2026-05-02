import type { GameSession, PokerCard } from "./types";
import { HAND_RANKING_NAMES } from "./types";
import type { PokerServerState } from "./state";
import type { Server } from "socket.io";
import { Pool } from "pg";
import { randomUUID } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function persistMatch(io: Server, session: GameSession) {
  const orderedPlayers = [...session.players].sort((a, b) => a.seatIndex - b.seatIndex);
  if (orderedPlayers.length === 0) return;

  const usernames = orderedPlayers.map((p) => p.username);
  const userRes = await pool.query<{ id: string; username: string | null }>(
    'SELECT id, username FROM "User" WHERE username = ANY($1)',
    [usernames]
  );

  const idByUsername = new Map<string, string>();
  for (const row of userRes.rows) {
    if (row.username) idByUsername.set(row.username, row.id);
  }

  const seats = session.table.seats();
  const scores = orderedPlayers.map((p) => seats[p.seatIndex]?.totalChips ?? 0);

  let winnerIndex = -1;
  let winnerScore = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > winnerScore) {
      winnerScore = scores[i];
      winnerIndex = i;
    }
  }

  const playerIds = orderedPlayers.map((p) => idByUsername.get(p.username) ?? null);
  const winnerId = winnerIndex >= 0 ? playerIds[winnerIndex] : null;
  const mode = orderedPlayers.length === 2 ? "1v1" : `${orderedPlayers.length}max`;

  const matchId = randomUUID().replace(/-/g, "");

  const insertResult = await pool.query<{ id: string }>(
    `INSERT INTO "Match" ("id", "mode", "winnerId", "scores", "player1Id", "player2Id", "player3Id", "player4Id", "player5Id", "player6Id")
     VALUES ($1, $2, $3, $4::int[], $5, $6, $7, $8, $9, $10)
     RETURNING "id"`,
    [
      matchId,
      mode,
      winnerId,
      scores,
      playerIds[0] ?? null,
      playerIds[1] ?? null,
      playerIds[2] ?? null,
      playerIds[3] ?? null,
      playerIds[4] ?? null,
      playerIds[5] ?? null,
    ]
  );

  const savedMatchId = insertResult.rows[0]?.id ?? "unknown";
  console.log(
    `[Poker] Match persisted id=${savedMatchId} players=${usernames.join(", ")} winner=${winnerId ?? "none"}`
  );

  for (const username of new Set(usernames)) {
    io.to(`history:${username}`).emit("matchHistoryUpdated", { matchId: savedMatchId });
  }
}

export function endGame(io: Server, state: PokerServerState, gameId: string) {
  const session = state.games.get(gameId);
  if (!session) return;

  if (!session.matchSaved) {
    session.matchSaved = true;
    void persistMatch(io, session).catch((err) => {
      console.error(`Failed to persist match ${gameId}:`, err);
      session.matchSaved = false;
    });
  }

  for (const p of session.players) {
    state.pendingGames.delete(p.username);
    state.socketToGame.delete(p.socketId);
  }

  state.reservedGameNames.delete(gameId);
  state.games.delete(gameId);
  console.log(`Game ${gameId} ended - players released`);
}

export function advanceRounds(session: GameSession) {
  const { table } = session;
  let safety = 0;

  while (!table.isBettingRoundInProgress() && table.isHandInProgress() && safety++ < 5) {
    if (table.areBettingRoundsCompleted()) {
      session.lastCommunityCards = [...table.communityCards()];
      session.lastHoleCards = table.holeCards().map((h) => (h ? [...h] : null));
      table.showdown();

      const rawWinners = table.winners();
      if (rawWinners.length > 0 && rawWinners[0].length > 0) {
        session.handResult = rawWinners[0].map(([seatIdx, handInfo]) => ({
          username: session.players.find((p) => p.seatIndex === seatIdx)!.username,
          handName: HAND_RANKING_NAMES[handInfo.ranking] ?? "Unknown",
          holeCards: (session.lastHoleCards[seatIdx] ?? []) as PokerCard[],
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
