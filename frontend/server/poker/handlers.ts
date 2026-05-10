import { Table } from "poker-ts";
import type { Server } from "socket.io";
import type { PokerServerState } from "./state";
import type { GameSession } from "./types";
import { buildSnapshot, broadcastState } from "./snapshot";
import { advanceRounds, endGame, handleElimination } from "./game-flow";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });



// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------

// detects players whose seat has 0 chips OR has been removed by the table.
// poker-ts removes seats entirely on bust, so we must check both conditions.
function hasBustedPlayer(session: GameSession) {
  const seats = session.table.seats();
  return session.players.some((p) => {
    const seat = seats[p.seatIndex];
    return !seat || seat.totalChips === 0;
  });
}

// ----------------------------------------------------------------
// GAME CREATION
// ----------------------------------------------------------------

// creates a new poker session and notifies all players to navigate to the game page
function startGame(
  io: Server,
  state: PokerServerState,
  gameId: string,
  players: Array<{ socketId: string; username: string; image?: string }>,
  blinds: { small: number; big: number },
  startingStack: number,
  useSpecialChip: boolean
) {
  const n = players.length;
  const table = new Table({ smallBlind: blinds.small, bigBlind: blinds.big }, n);
  for (let i = 0; i < n; i++) table.sitDown(i, startingStack);
  table.startHand(0);

  const session: GameSession = {
    table,
    players: players.map((p, i) => ({ socketId: p.socketId, username: p.username, image: p.image, seatIndex: i, isActive: true })),
    // allPlayers is a permanent snapshot of all players — never modified by elimination.
    // used by persistMatch and endGame to ensure stats/cleanup covers everyone
    // even after handleElimination removes busted players from session.players (multi-player case).
    allPlayers: players.map((p, i) => ({ socketId: p.socketId, username: p.username, image: p.image, seatIndex: i, isActive: true })),
    lastCommunityCards: [],
    lastHoleCards: new Array(n).fill(null),
    startingStack,
    specialChipEnabled: useSpecialChip,
    specialChipUsedBy: new Array(n).fill(false),
    specialRevealActiveBySeat: new Array(n).fill(-1),
    handResult: null,
    nextDealerSeat: 1,
    isGameOver: false,
    totalPlayers: n,
    matchSaved: false,
    handsPlayedByUsername: Object.fromEntries(players.map((p) => [p.username, 1])),
  };

  state.games.set(gameId, session);
  for (let i = 0; i < n; i++) {
    state.pendingGames.set(players[i].username, { gameId, seatIndex: i });
    io.to(players[i].socketId).emit("gameStarted", { gameId });
  }
}

// ----------------------------------------------------------------
// SOCKET HANDLERS
// ----------------------------------------------------------------

export function registerPokerHandlers(io: Server, state: PokerServerState) {

  async function clearActiveGameForUser(username: string, expectedGameId?: string) {
    try {
      if (expectedGameId) {
        await pool.query(
          'UPDATE "User" SET "activeGameId" = NULL, "activeGameSeatIndex" = NULL WHERE "username" = $1 AND "activeGameId" = $2',
          [username, expectedGameId]
        );
        return;
      }

      await pool.query(
        'UPDATE "User" SET "activeGameId" = NULL, "activeGameSeatIndex" = NULL WHERE "username" = $1',
        [username]
      );
    } catch (err) {
      console.error(`Failed clearing active game marker for ${username}:`, err);
    }
  }

  // On restart, in-memory games are gone, so clear stale DB game markers globally.
  void pool
    .query(
      'UPDATE "User" SET "activeGameId" = NULL, "activeGameSeatIndex" = NULL WHERE "activeGameId" IS NOT NULL OR "activeGameSeatIndex" IS NOT NULL'
    )
    .then(() => {
      console.log("[Poker] Cleared stale active game markers at startup");
    })
    .catch((err) => {
      console.error("[Poker] Failed clearing stale active game markers at startup:", err);
    });

  // timers for tracking special chip reveal duration and auto-advance to next hand
  const specialRevealTimers = new Map<string, NodeJS.Timeout>();
  const nextHandTimers = new Map<string, NodeJS.Timeout>();

  // schedules the next hand to auto-start after 5 seconds — gives players time to see the result
  function scheduleNextHand(gameId: string) {
    const existing = nextHandTimers.get(gameId);
    if (existing) clearTimeout(existing);

    nextHandTimers.set(gameId, setTimeout(() => {
      nextHandTimers.delete(gameId);
      const session = state.games.get(gameId);
      if (!session || session.isGameOver) return;

      // reset state for the new hand
      session.handResult = null;
      session.lastCommunityCards = [];
      session.lastHoleCards = new Array(session.players.length).fill(null);
      session.specialRevealActiveBySeat = new Array(session.players.length).fill(-1);
      for (let i = 0; i < session.players.length; i++) clearSpecialRevealTimer(gameId, i);

      if (hasBustedPlayer(session)) {
        const gameOver = handleElimination(io, state, gameId);
        broadcastState(io, state, gameId);
        if (gameOver) endGame(io, state, gameId);
        return;
      }

      try {
        session.table.startHand(session.nextDealerSeat);
        session.nextDealerSeat = (session.nextDealerSeat + 1) % session.players.length;

        // increments the handsPlayed for each user
        const seats = session.table.seats();
        for (const p of session.players) {
        if (seats[p.seatIndex]) {
          session.handsPlayedByUsername[p.username] =
            (session.handsPlayedByUsername[p.username] ?? 0) + 1;
          }
        }

        io.to(gameId).emit("message", { username: "game", text: "DEALER: — New Hand —", type: "game" });
        broadcastState(io, state, gameId);
        autoActForDisconnected(gameId);
      } catch (err) {
        console.error("startHand error:", err);
      }
    }, 5000));
  }

  function specialRevealTimerKey(gameId: string, seatIndex: number) {
    return `${gameId}:${seatIndex}`;
  }

  function clearSpecialRevealTimer(gameId: string, seatIndex: number) {
    const key = specialRevealTimerKey(gameId, seatIndex);
    const timer = specialRevealTimers.get(key);
    if (!timer) return;
    clearTimeout(timer);
    specialRevealTimers.delete(key);
  }

  // applies a poker action (fold/check/call/bet/raise) to the table and advances game state.
  // shared between human-triggered playerAction events and the auto-act loop for disconnected players.
  function applyAction(gameId: string, seatIndex: number, action: string, betSize?: number) {
    const session = state.games.get(gameId);
    if (!session || session.isGameOver) return;
    const { table } = session;
    if (!table.isBettingRoundInProgress() || table.playerToAct() !== seatIndex) return;

    const isFold = action === "fold";
    const seats = table.seats() as any[];
    const potBeforeAction = (table.pots() as any[]).reduce((sum: number, p) => sum + p.size, 0);
    const chipsBefore = seats.map((s) => s?.totalChips ?? 0);
    const actorName =
      session.players.find((p) => p.seatIndex === seatIndex)?.username ??
      session.allPlayers.find((p) => p.seatIndex === seatIndex)?.username ??
      "Unknown";
    const myBetBefore = seats[seatIndex]?.betSize ?? 0;
    const myStackBefore = seats[seatIndex]?.stack ?? 0;
    const maxOppBetBefore = seats
      .filter((_: unknown, i: number) => i !== seatIndex)
      .reduce((max: number, s) => Math.max(max, s?.betSize ?? 0), 0);

    try {
      table.actionTaken(action as "fold" | "check" | "call" | "bet" | "raise", betSize);
    } catch {
      return;
    }

    // helper to emit dealer messages to the game room
    const emitGameEvent = (text: string) =>
      io.to(gameId).emit("message", { username: "game", text: `DEALER: ${text}`, type: "game" });

    const callAmt = Math.min(myStackBefore, Math.max(0, maxOppBetBefore - myBetBefore));
    if (isFold) emitGameEvent(`${actorName} folds`);
    else if (action === "check") emitGameEvent(`${actorName} checks`);
    else if (action === "call") emitGameEvent(`${actorName} calls €${callAmt.toLocaleString()}`);
    else if (action === "bet") emitGameEvent(`${actorName} bets €${(betSize ?? 0).toLocaleString()}`);
    else if (action === "raise") emitGameEvent(`${actorName} raises to €${(betSize ?? 0).toLocaleString()}`);

    const foldPot = isFold ? potBeforeAction + (betSize ?? 0) : 0;

    const allHoles = table.holeCards() as any[];
    session.lastHoleCards = allHoles.map((h: any) => {
      if (h) return [...h];
      return null;
    });

    if (!table.isHandInProgress()) {
      // hand just ended (fold or all-in resolution)
      if (isFold) {
        const chipsAfter = (table.seats() as any[]).map((s) => s?.totalChips ?? 0);
        const winnerSeatIdx = chipsAfter.findIndex((chips: number, i: number) => chips > chipsBefore[i]);
        const winner = winnerSeatIdx >= 0
          ? session.players.find((p) => p.seatIndex === winnerSeatIdx)
          : session.players.find((p) => p.seatIndex !== seatIndex);
        if (winner) {
          session.handResult = [{ username: winner.username, handName: "Fold", holeCards: [], potWon: foldPot }];
          emitGameEvent(`${winner.username} wins the pot of €${foldPot.toLocaleString()}`);
        }
      }

      if (hasBustedPlayer(session)) {
        const gameOver = handleElimination(io, state, gameId);
        broadcastState(io, state, gameId);
        if (gameOver) endGame(io, state, gameId);
        else if (session.handResult) scheduleNextHand(gameId);
        return;
      }
    } else {
      // hand still in progress — advance through any automatic rounds
      const commCountBefore = table.communityCards().length;
      advanceRounds(session);

      if (isFold && !table.isHandInProgress() && !session.handResult) {
        const chipsAfter = (table.seats() as any[]).map((s) => s?.totalChips ?? 0);
        const winnerSeatIdx = chipsAfter.findIndex((chips: number, i: number) => chips > chipsBefore[i]);
        const winner = winnerSeatIdx >= 0
          ? session.players.find((p) => p.seatIndex === winnerSeatIdx)
          : session.players.find((p) => p.seatIndex !== seatIndex);
        if (winner) {
          session.handResult = [{ username: winner.username, handName: "Fold", holeCards: [], potWon: foldPot }];
          emitGameEvent(`${winner.username} wins the pot of €${foldPot.toLocaleString()}`);
        }
      }

      // announce new street (flop, turn, river)
      const commCountAfter = session.lastCommunityCards.length;
      if (commCountAfter > commCountBefore) {
        const phaseNames: Record<number, string> = { 3: "— Flop —", 4: "— Turn —", 5: "— River —" };
        const phaseName = phaseNames[commCountAfter];
        if (phaseName) emitGameEvent(phaseName);
      }

      // announce showdown winner
      if (session.handResult && session.handResult.length > 0 && session.handResult[0].handName !== "Fold") {
        const totalPot = session.handResult.reduce((sum, w) => sum + w.potWon, 0);
        if (session.handResult.length === 1) {
          const w = session.handResult[0];
          emitGameEvent(`${w.username} wins the pot of €${totalPot.toLocaleString()} (${w.handName})`);
        } else {
          const names = session.handResult.map((w) => w.username).join(" and ");
          emitGameEvent(`SPLIT POT: ${names} share the pot of €${totalPot.toLocaleString()}`);
        }
      }

      if (!table.isHandInProgress() && hasBustedPlayer(session)) {
        const gameOver = handleElimination(io, state, gameId);
        broadcastState(io, state, gameId);
        if (gameOver) endGame(io, state, gameId);
        else if (session.handResult) scheduleNextHand(gameId);
        return;
      }
      if (table.isHandInProgress()) {
        session.lastCommunityCards = [...table.communityCards()];
      }
    }

    broadcastState(io, state, gameId);
    if (session.handResult && !session.isGameOver) scheduleNextHand(gameId);
  }

  // automatically folds or checks for any disconnected player whose turn it is.
  // loops up to 10 times in case multiple disconnected players are stacked back-to-back.
  function autoActForDisconnected(gameId: string) {
    for (let i = 0; i < 10; i++) {
      const session = state.games.get(gameId);
      if (!session || session.isGameOver) break;
      const { table } = session;
      if (!table.isHandInProgress() || !table.isBettingRoundInProgress()) break;
      const actorSeat = table.playerToAct();
      const actor = session.players.find((p) => p.seatIndex === actorSeat);
      const isAbandonedSeat = !actor;
      if (!isAbandonedSeat && actor.isActive) break;
      const legal = table.legalActions();
      const action = legal.actions.includes("fold")
        ? "fold"
        : legal.actions.includes("check")
          ? "check"
          : "fold";
      applyAction(gameId, actorSeat, action);
    }
  }

  io.on("connection", (socket) => {
    console.log("[Socket.io] User connected:", socket.id);

    // ----------------------------------------------------------------
    // CHAT
    // ----------------------------------------------------------------

    // broadcasts a chat message — scoped to a game room if gameId is provided
    socket.on("message", (data: { username: string; text: string; gameId?: string }) => {
      if (!data.text.trim()) {
        return;
      }

      const { gameId, ...msg } = data;
      if (gameId) {
        io.to(gameId).emit("message", msg);
      } else {
        io.emit("message", msg);
      }
    });

    // ----------------------------------------------------------------
    // ROOM SUBSCRIPTIONS
    // ----------------------------------------------------------------

    // joins the socket.io room for game-scoped chat
    socket.on("joinGameRoom", ({ gameId }: { gameId: string }) => {
      socket.join(gameId);
    });

    // subscribes to match history updates for a specific user
    socket.on("subscribeMatchHistory", ({ username }: { username?: string }) => {
      if (!username) return;
      socket.join(`history:${username}`);
    });

    socket.on("unsubscribeMatchHistory", ({ username }: { username?: string }) => {
      if (!username) return;
      socket.leave(`history:${username}`);
    });

    // ----------------------------------------------------------------
    // LOBBY — HOST AND JOIN
    // ----------------------------------------------------------------

    // creates a named lobby and waits for other players to join
    socket.on("hostGame", ({ username, image, gameName, password, gameSize, blinds, startingStack, useSpecialChip }: { username: string; image?: string; gameName: string; password: string; gameSize?: number; blinds?: { small: number; big: number }; startingStack?: number; useSpecialChip?: boolean }) => {
      const normalizedGameName = gameName.trim();
      if (!normalizedGameName) {
        socket.emit("lobbyError", { message: "Game name is required" });
        return;
      }

      if (state.reservedGameNames.has(normalizedGameName) || state.games.has(normalizedGameName)) {
        socket.emit("lobbyError", { message: "A game with that name already exists" });
        return;
      }

      // remove player from any existing lobby they might be in
      for (const [name, entry] of state.namedLobbies) {
        if (entry.players.some((p) => p.socketId === socket.id)) {
          state.namedLobbies.delete(name);
          state.reservedGameNames.delete(name);
          break;
        }
      }

      const maxPlayers = gameSize === 3 ? 3 : 2;
      const smallBlind = blinds?.small ?? 10;
      const bigBlind = blinds?.big ?? 20;
      const normalizedBlinds = {
        small: Number.isFinite(smallBlind) && smallBlind > 0 ? Math.floor(smallBlind) : 10,
        big: Number.isFinite(bigBlind) && bigBlind > 0 ? Math.floor(bigBlind) : 20,
      };

      if (normalizedBlinds.big < normalizedBlinds.small) {
        normalizedBlinds.big = normalizedBlinds.small * 2;
      }

      const requestedStartingStack = startingStack ?? 1000;
      const normalizedStartingStack =
        Number.isFinite(requestedStartingStack) && requestedStartingStack > 0
          ? Math.floor(requestedStartingStack)
          : 1000;
      const normalizedUseSpecialChip = Boolean(useSpecialChip);

      state.namedLobbies.set(normalizedGameName, {
        password,
        maxPlayers,
        blinds: normalizedBlinds,
        startingStack: normalizedStartingStack,
        useSpecialChip: normalizedUseSpecialChip,
        players: [{ socketId: socket.id, username, image }],
      });
      state.reservedGameNames.add(normalizedGameName);
      socket.emit("waitingForPlayers", { current: 1, needed: maxPlayers });
    });

    // joins an existing named lobby — starts the game when lobby is full
    socket.on("joinNamedGame", ({ username, image, gameName, password }: { username: string; image?: string; gameName: string; password: string }) => {
      const normalizedGameName = gameName.trim();
      const lobby = state.namedLobbies.get(normalizedGameName);
      if (!lobby) {
        socket.emit("lobbyError", { message: "Game not found" });
        return;
      }
      if (lobby.password !== password) {
        socket.emit("lobbyError", { message: "Wrong password" });
        return;
      }
      if (lobby.players.some((p) => p.username === username)) {
        socket.emit("lobbyError", { message: "You are already in this lobby" });
        return;
      }

      lobby.players.push({ socketId: socket.id, username, image });

      if (lobby.players.length >= lobby.maxPlayers) {
        // lobby is full — start the game
        state.namedLobbies.delete(normalizedGameName);
        startGame(io, state, normalizedGameName, lobby.players, lobby.blinds, lobby.startingStack, lobby.useSpecialChip);
      } else {
        // not full yet — notify everyone in the lobby
        const current = lobby.players.length;
        const needed = lobby.maxPlayers;
        for (const p of lobby.players) {
          io.to(p.socketId).emit("waitingForPlayers", { current, needed });
        }
      }
    });

    // ----------------------------------------------------------------
    // GAME — JOIN AND RECONNECT
    // ----------------------------------------------------------------

    // called when player navigates to the game page
    // handles both initial join and reconnect after page navigation or disconnect
    socket.on("joinGame", async ({ gameId, username, image }: { gameId: string; username: string; image?: string }) => {
      const pending = state.pendingGames.get(username);
      if (!pending || pending.gameId !== gameId) {
        await clearActiveGameForUser(username, gameId);
        socket.emit("error", { message: "Not authorized for this game" });
        return;
      }

      const session = state.games.get(gameId);
      if (!session) {
        await clearActiveGameForUser(username, gameId);
        socket.emit("error", { message: "Game not found" });
        return;
      }

      const entry = session.players.find((p) => p.username === username);
      if (entry) {
        // update socket ID since it changes on every page navigation, mark as active again
        const wasDisconnected = !entry.isActive;
        state.socketToGame.delete(entry.socketId);
        entry.socketId = socket.id;
        entry.isActive = true;
        if (image) entry.image = image;
        if (wasDisconnected) {
          io.to(gameId).emit("message", { username: "game", text: `DEALER: ${username} reconnected`, type: "game" });
        }
      }

      // also keep allPlayers in sync — endGame and persistMatch use it for cleanup
      const allEntry = session.allPlayers.find((p) => p.username === username);
      if (allEntry) {
        allEntry.socketId = socket.id;
        allEntry.isActive = true;
        if (image) allEntry.image = image;
      }

      state.socketToGame.set(socket.id, { gameId, seatIndex: pending.seatIndex });
      // Keep DB active-game marker in sync, but do not block game join on DB hiccups.
      void pool.query(
        'UPDATE "User" SET "activeGameId" = $1, "activeGameSeatIndex" = $2 WHERE "username" = $3',
        [gameId, pending.seatIndex, username]
      ).catch((err) => {
        console.error(`Failed setting active game for ${username}:`, err);
      });
      socket.join(gameId);
      socket.emit("gameState", buildSnapshot(state, gameId, pending.seatIndex));
      broadcastState(io, state, gameId);
    });

    // ----------------------------------------------------------------
    // GAME — PLAYER ACTIONS
    // ----------------------------------------------------------------

    // handles fold, check, call, bet, raise from a connected player.
    // delegates to applyAction (shared with auto-act path), then advances any disconnected players.
    socket.on("playerAction", ({ action, betSize }: { action: string; betSize?: number }) => {
      const info = state.socketToGame.get(socket.id);
      if (!info) return;
      const session = state.games.get(info.gameId);
      if (!session || session.isGameOver) return;
      const { table } = session;
      if (!table.isBettingRoundInProgress() || table.playerToAct() !== info.seatIndex) return;
      applyAction(info.gameId, info.seatIndex, action, betSize);
      autoActForDisconnected(info.gameId);
    });

    // ----------------------------------------------------------------
    // GAME — GIVE UP GAME
    // ----------------------------------------------------------------
    // permanent disconnect: player gives up and cannot rejoin this game.
    // unlike elimination, we do not rebuild the table here; abandoned seats are auto-acted.
    socket.on("giveUp", () => {
      const info = state.socketToGame.get(socket.id);
      if (!info) return;

      const session = state.games.get(info.gameId);
      if (!session || session.isGameOver) return;

      const giver = session.players.find((p) => p.seatIndex === info.seatIndex);
      if (!giver) return;

      clearSpecialRevealTimer(info.gameId, info.seatIndex);

      io.to(info.gameId).emit("message", {
        username: "game",
        text: `DEALER: ${giver.username} gave up and disconnected permanently`,
        type: "game",
      });

      // Prevent rejoin, clear active game marker, and remove from active roster.
      state.pendingGames.delete(giver.username);
      state.socketToGame.delete(socket.id);
      void clearActiveGameForUser(giver.username, info.gameId);
      session.players = session.players.filter((p) => p.seatIndex !== info.seatIndex);

      const allEntry = session.allPlayers.find((p) => p.username === giver.username);
      if (allEntry) allEntry.isActive = false;

      io.to(socket.id).emit("eliminated");

      if (session.players.length <= 1) {
        session.isGameOver = true;
        broadcastState(io, state, info.gameId);
        endGame(io, state, info.gameId);
      } else {
        broadcastState(io, state, info.gameId);
        autoActForDisconnected(info.gameId);
      }

      socket.leave(info.gameId);
      socket.disconnect(true);
    });

    // ----------------------------------------------------------------
    // GAME — SPECIAL CHIP
    // ----------------------------------------------------------------

    // activates the special chip to reveal an opponent's hole cards for 5 seconds
    socket.on("useSpecialChip", ({ targetSeatIndex }: { targetSeatIndex: number }) => {
      const info = state.socketToGame.get(socket.id);
      if (!info) return;

      const session = state.games.get(info.gameId);
      if (!session || session.isGameOver) return;
      if (!session.specialChipEnabled) return;
      if (!session.table.isHandInProgress()) return;
      if (!session.table.isBettingRoundInProgress()) return;
      if (session.table.playerToAct() !== info.seatIndex) return;

      const seat = info.seatIndex;
      if (session.specialChipUsedBy[seat]) return;

      session.specialChipUsedBy[seat] = true;
      session.specialRevealActiveBySeat[seat] = targetSeatIndex;
      broadcastState(io, state, info.gameId);

      // auto-hide the revealed cards after 5 seconds
      clearSpecialRevealTimer(info.gameId, seat);
      specialRevealTimers.set(
        specialRevealTimerKey(info.gameId, seat),
        setTimeout(() => {
          const activeSession = state.games.get(info.gameId);
          if (!activeSession || activeSession.isGameOver) return;
          activeSession.specialRevealActiveBySeat[seat] = -1;
          specialRevealTimers.delete(specialRevealTimerKey(info.gameId, seat));
          broadcastState(io, state, info.gameId);
        }, 5000)
      );
    });

    // ----------------------------------------------------------------
    // GAME — PENDING GAME CHECK
    // ----------------------------------------------------------------

    // lets the client check if the user has an active game to rejoin (e.g. after page reload)
    socket.on("checkPendingGame", ({ username }: { username: string }) => {
      const pending = state.pendingGames.get(username);
      if (pending) {
        const session = state.games.get(pending.gameId);
        if (session && !session.isGameOver) {
          socket.emit("hasPendingGame", { gameId: pending.gameId });
          return;
        }
      }
      socket.emit("hasPendingGame", { gameId: null });
    });

    // ----------------------------------------------------------------
    // DISCONNECT
    // ----------------------------------------------------------------

    // handles player disconnects — differentiates between:
    // 1. player leaving lobby before game starts
    // 2. eliminated player closing the tab (game continues, silent removal)
    // 3. active player disconnecting mid-game (mark inactive, auto-act on their turn, allow reconnect)
    socket.on("disconnect", () => {
      // remove from lobby if still waiting for a game to start
      for (const [name, entry] of state.namedLobbies) {
        const idx = entry.players.findIndex((p) => p.socketId === socket.id);
        if (idx !== -1) {
          entry.players.splice(idx, 1);
          if (entry.players.length === 0) {
            state.namedLobbies.delete(name);
            state.reservedGameNames.delete(name);
          } else {
            // notify remaining lobby members
            for (const p of entry.players) {
              io.to(p.socketId).emit("waitingForPlayers", { current: entry.players.length, needed: entry.maxPlayers });
            }
          }
          break;
        }
      }

      const info = state.socketToGame.get(socket.id);
      if (info) {
        clearSpecialRevealTimer(info.gameId, info.seatIndex);
        const session = state.games.get(info.gameId);
        if (session && !session.isGameOver) {
          const seat = (session.table.seats() as any[])[info.seatIndex];
          const alreadyEliminated = !seat || seat.totalChips === 0;

          if (alreadyEliminated) {
            // eliminated player closed tab — remove them silently, game continues
            session.players = session.players.filter((p) => p.socketId !== socket.id);
          } else {
            // active player disconnected mid-game — mark inactive, game continues with auto-act
            const player = session.players.find((p) => p.socketId === socket.id);
            if (player) {
              player.isActive = false;
              // also reflect in allPlayers
              const allPlayer = session.allPlayers.find((p) => p.username === player.username);
              if (allPlayer) allPlayer.isActive = false;
              io.to(info.gameId).emit("message", { username: "game", text: `DEALER: ${player.username} disconnected`, type: "game" });
              broadcastState(io, state, info.gameId);
              autoActForDisconnected(info.gameId);
            }
          }

          // if every remaining player is now disconnected, clean up the ghost game
          if (session.players.length > 0 && session.players.every((p) => !p.isActive)) {
            session.isGameOver = true;
            endGame(io, state, info.gameId, true);
          }
        }
        // always clean up this socket from tracking map
        state.socketToGame.delete(socket.id);
      }

      console.log("User disconnected:", socket.id);
    });
  });
}
