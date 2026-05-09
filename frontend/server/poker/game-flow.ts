import { Table } from "poker-ts";
import type { Server } from "socket.io";
import type { GameSession, PokerCard } from "./types";
import { HAND_RANKING_NAMES } from "./types";
import type { PokerServerState } from "./state";
import { Pool } from "pg";
import { randomUUID } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ----------------------------------------------------------------
// ACHIEVEMENTS
// ----------------------------------------------------------------

// returns the achievement types a player just unlocked based on their
// post-match stats. uses === on win thresholds so each fires exactly once.
function computeNewAchievements(
  stats: { wins: number; losses: number; handsPlayed: number; isWinner: boolean },
  alreadyUnlocked: Set<string>
): string[] {
  const earned: string[] = [];

  // FIRST ACTIONS — fires the first time the player ever finishes a match
  if (stats.handsPlayed > 0 && !alreadyUnlocked.has("FIRST_GAME")) {
    earned.push("FIRST_GAME");
    if (!stats.isWinner) earned.push("FIRST_GAME_LOSS");
  }

  // WIN BASED — only when the player won this match AND just hit a threshold
  if (stats.isWinner) {
    const winThresholds: Array<{ count: number; type: string }> = [
      { count: 1,  type: "WIN_1"  },
      { count: 3,  type: "WIN_3"  },
      { count: 5,  type: "WIN_5"  },
      { count: 10, type: "WIN_10" },
      { count: 25, type: "WIN_25" },
    ];
    for (const { count, type } of winThresholds) {
      if (stats.wins === count) earned.push(type);
    }
  }

  // defensive: filter out any that were already unlocked
  return earned.filter((t) => !alreadyUnlocked.has(t));
}

async function persistMatch(io: Server, session: GameSession) {
  const orderedPlayers = [...session.allPlayers].sort((a, b) => a.seatIndex - b.seatIndex);
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

for (const playerId of playerIds)
{
  if (!playerId) continue;

  const isWinner = playerId === winnerId;

  // find this player's username so we can look up their hand count from session
  const player = orderedPlayers.find((p) => idByUsername.get(p.username) === playerId);
  const handsThisMatch = player ? (session.handsPlayedByUsername[player.username] ?? 0) : 0;

  const updated = await pool.query<{
    wins: number;
    losses: number;
    handsPlayed: number;
  }>(
    `UPDATE "User"
    SET
    "wins" = "wins" + $1,
    "losses" = "losses" + $2,
    "handsPlayed" = "handsPlayed" + $3
    WHERE id = $4
    RETURNING "wins", "losses", "handsPlayed"`,
    [
      isWinner ? 1 : 0,
      isWinner ? 0 : 1,
      handsThisMatch,
      playerId
    ]
  );

  if (updated.rows.length === 0) continue;
  const stats = { ...updated.rows[0], isWinner };

  console.log(`Updated stats for ${playerId} isWinner=${isWinner} handsThisMatch=${handsThisMatch}`);

  const existing = await pool.query<{ type: string }>(
      `SELECT "type" FROM "Achievement" WHERE "userId" = $1`,
      [playerId]
    );
  const alreadyUnlocked = new Set(existing.rows.map((r) => r.type));


  const newAchievements = computeNewAchievements(stats, alreadyUnlocked);
  for (const type of newAchievements) {
  await pool.query(
    `INSERT INTO "Achievement" ("id", "userId", "type") VALUES ($1, $2, $3) ON CONFLICT ("userId", "type") DO NOTHING`,
    [randomUUID().replace(/-/g, ""), playerId, type]
    );
  console.log(`[Achievement] ${player?.username ?? playerId} unlocked: ${type}`);
  }
  }
}







export function endGame(io: Server, state: PokerServerState, gameId: string) {
  console.log(`\n>>>>>> [endGame] CALLED for gameId=${gameId}`);
  const session = state.games.get(gameId);
  if (!session) {
    console.log(`[endGame] !!! session=null, bailing out`);
    return;
  }

  console.log(`[endGame] allPlayers: ${session.allPlayers.map(p => `${p.username}(socket=${p.socketId})`).join(', ')}`);
  console.log(`[endGame] socketToGame keys BEFORE cleanup: [${[...state.socketToGame.keys()].join(', ')}]`);

  if (!session.matchSaved) {
    session.matchSaved = true;
    void persistMatch(io, session).catch((err) => {
      console.error(`Failed to persist match ${gameId}:`, err);
      session.matchSaved = false;
    });
  }

  const playersToClean = session.allPlayers;
  for (const p of playersToClean) {
    state.pendingGames.delete(p.username);
    const wasInMap = state.socketToGame.has(p.socketId);
    state.socketToGame.delete(p.socketId);
    console.log(`[endGame]   cleaned ${p.username} socket=${p.socketId} wasInMap=${wasInMap}`);
  }

  state.reservedGameNames.delete(gameId);
  state.games.delete(gameId);
  console.log(`[endGame] socketToGame keys AFTER cleanup: [${[...state.socketToGame.keys()].join(', ')}]`);
  console.log(`<<<<<< [endGame] DONE for gameId=${gameId}\n`);
}

export function advanceRounds(session: GameSession) {
  const { table } = session;
  let safety = 0;

  while (!table.isBettingRoundInProgress() && table.isHandInProgress() && safety++ < 5) {
    if (table.areBettingRoundsCompleted()) {
      session.lastCommunityCards = [...table.communityCards()];
      session.lastHoleCards = table.holeCards().map((h) => (h ? [...h] : null));
      const pots = table.pots();
      table.showdown();

      const rawWinners = table.winners();
      const potWonBySeat = new Map<number, number>();
      const handInfoBySeat = new Map<number, { ranking: number }>();

      for (let i = 0; i < rawWinners.length; i++) {
        const potWinners = rawWinners[i];
        const potSize = pots[i]?.size ?? 0;
        if (!potWinners || potWinners.length === 0) continue;
        const share = Math.floor(potSize / potWinners.length);
        for (const [seatIdx, handInfo] of potWinners) {
          potWonBySeat.set(seatIdx, (potWonBySeat.get(seatIdx) ?? 0) + share);
          if (!handInfoBySeat.has(seatIdx)) handInfoBySeat.set(seatIdx, handInfo);
        }
      }

      if (potWonBySeat.size > 0) {
        session.handResult = Array.from(potWonBySeat.entries()).map(([seatIdx, potWon]) => ({
          username: session.players.find((p) => p.seatIndex === seatIdx)!.username,
          handName: HAND_RANKING_NAMES[handInfoBySeat.get(seatIdx)?.ranking ?? -1] ?? "Unknown",
          holeCards: (session.lastHoleCards[seatIdx] ?? []) as PokerCard[],
          potWon,
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

export function handleElimination(io: Server, state: PokerServerState, gameId: string): boolean {
  console.log(`\n>>>>>> [handleElimination] CALLED for gameId=${gameId}`);
  const session = state.games.get(gameId);
  if (!session) {
    console.log(`[handleElimination] !!! session=null, returning true`);
    return true;
  }

  const seats = session.table.seats();

  const activePlayers = session.players.filter((p) => {
    const seat = seats[p.seatIndex];
    return seat && seat.totalChips > 0;
  });

  const bustedPlayers = session.players.filter((p) => {
    const seat = seats[p.seatIndex];
    return !seat || seat.totalChips === 0;
  });

  console.log(`[handleElimination] active=[${activePlayers.map(p => `${p.username}(seat=${p.seatIndex},chips=${seats[p.seatIndex]?.totalChips})`).join(', ')}]`);
  console.log(`[handleElimination] busted=[${bustedPlayers.map(p => `${p.username}(seat=${p.seatIndex},chips=${seats[p.seatIndex]?.totalChips})`).join(', ')}]`);

  const gameWillEnd = activePlayers.length <= 1;
  console.log(`[handleElimination] gameWillEnd=${gameWillEnd} (activePlayers.length=${activePlayers.length})`);

  if (gameWillEnd) {
    console.log(`[handleElimination] >>> GAME OVER PATH <<< setting session.isGameOver=true`);
    session.isGameOver = true;
    console.log(`<<<<<< [handleElimination] returning true\n`);
    return true;
  }

  console.log(`[handleElimination] MULTI-PLAYER PATH`);

  for (const p of bustedPlayers) {
    io.to(p.socketId).emit("eliminated");
    state.socketToGame.delete(p.socketId);
    state.pendingGames.delete(p.username);
  }

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
  session.lastHoleCards = new Array(activePlayers.length).fill(null);
  session.lastCommunityCards = [];
  session.nextDealerSeat = 0;

  console.log(`<<<<<< [handleElimination] returning false (game continues)\n`);
  return false;
}