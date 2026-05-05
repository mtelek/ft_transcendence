import { Table } from "poker-ts";
import type { Server } from "socket.io";
import type { PokerServerState } from "./state";
import type { GameSession } from "./types";
import { buildSnapshot, broadcastState } from "./snapshot";
import { advanceRounds, endGame, handleElimination } from "./game-flow";

function hasBustedPlayer(session: GameSession) {
  return session.table.seats().some((seat) => seat && seat.totalChips === 0);
}

function startGame(io: Server, state: PokerServerState, gameId: string, players: Array<{ socketId: string; username: string; image?: string }>) {
  const n = players.length;
  const table = new Table({ smallBlind: 10, bigBlind: 20 }, n);
  for (let i = 0; i < n; i++) table.sitDown(i, 1000);
  table.startHand(0);

  const session: GameSession = {
    table,
    players: players.map((p, i) => ({ socketId: p.socketId, username: p.username, image: p.image, seatIndex: i })),
    lastCommunityCards: [],
    lastHoleCards: new Array(n).fill(null),
    specialChipUsedBy: new Array(n).fill(false),
    specialRevealActiveBySeat: new Array(n).fill(false),
    handResult: null,
    nextHandReady: new Array(n).fill(false),
    nextDealerSeat: 1,
    isGameOver: false,
    totalPlayers: n,
    matchSaved: false,
  };

  state.games.set(gameId, session);
  for (let i = 0; i < n; i++) {
    state.pendingGames.set(players[i].username, { gameId, seatIndex: i });
    io.to(players[i].socketId).emit("gameStarted", { gameId });
  }
}

export function registerPokerHandlers(io: Server, state: PokerServerState) {
  // Track disconnect timers by username
  const disconnectTimers = new Map<string, NodeJS.Timeout>();
  const specialRevealTimers = new Map<string, NodeJS.Timeout>();

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

  io.on("connection", (socket) => {
    console.log("[Socket.io] User connected:", socket.id);

    socket.on("message", (data: { username: string; text: string; gameId?: string }) => {
      const { gameId, ...msg } = data;
      if (gameId) {
        io.to(gameId).emit("message", msg);
      } else {
        io.emit("message", msg);
      }
    });

    socket.on("joinGameRoom", ({ gameId }: { gameId: string }) => {
      socket.join(gameId);
    });

    socket.on("subscribeMatchHistory", ({ username }: { username?: string }) => {
      if (!username) return;
      socket.join(`history:${username}`);
    });

    socket.on("unsubscribeMatchHistory", ({ username }: { username?: string }) => {
      if (!username) return;
      socket.leave(`history:${username}`);
    });

    socket.on("hostGame", ({ username, image, gameName, password, gameSize }: { username: string; image?: string; gameName: string; password: string; gameSize?: number }) => {
      const normalizedGameName = gameName.trim();
      if (!normalizedGameName) {
        socket.emit("lobbyError", { message: "Game name is required" });
        return;
      }

      if (state.reservedGameNames.has(normalizedGameName) || state.games.has(normalizedGameName)) {
        socket.emit("lobbyError", { message: "A game with that name already exists" });
        return;
      }

      for (const [name, entry] of state.namedLobbies) {
        if (entry.players.some((p) => p.socketId === socket.id)) {
          state.namedLobbies.delete(name);
          state.reservedGameNames.delete(name);
          break;
        }
      }

      const maxPlayers = gameSize === 3 ? 3 : 2;
      state.namedLobbies.set(normalizedGameName, {
        password,
        maxPlayers,
        players: [{ socketId: socket.id, username, image }],
      });
      state.reservedGameNames.add(normalizedGameName);
      socket.emit("waitingForPlayers", { current: 1, needed: maxPlayers });
    });

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
        state.namedLobbies.delete(normalizedGameName);
        startGame(io, state, normalizedGameName, lobby.players);
      } else {
        // not full yet — notify everyone in the lobby
        const current = lobby.players.length;
        const needed = lobby.maxPlayers;
        for (const p of lobby.players) {
          io.to(p.socketId).emit("waitingForPlayers", { current, needed });
        }
      }


    });

    socket.on("joinGame", ({ gameId, username, image }: { gameId: string; username: string; image?: string }) => {
      const pending = state.pendingGames.get(username);
      if (!pending || pending.gameId !== gameId) {
        socket.emit("error", { message: "Not authorized for this game" });
        return;
      }

      const session = state.games.get(gameId);
      if (!session) {
        socket.emit("error", { message: "Game not found" });
        return;
      }


      const entry = session.players.find((p) => p.username === username);
      if (entry) {
        // clear disconnect timer if reconnecting within 10s
        if (disconnectTimers.has(username)) {
          clearTimeout(disconnectTimers.get(username));
          disconnectTimers.delete(username);
        }
        state.socketToGame.delete(entry.socketId);
        entry.socketId = socket.id;
        if (image) entry.image = image;
      }

      state.socketToGame.set(socket.id, { gameId, seatIndex: pending.seatIndex });
      socket.join(gameId);
      socket.emit("gameState", buildSnapshot(state, gameId, pending.seatIndex));
    });

    socket.on("playerAction", ({ action, betSize }: { action: string; betSize?: number }) => {
      const info = state.socketToGame.get(socket.id);
      if (!info) return;

      const session = state.games.get(info.gameId);
      if (!session || session.isGameOver) return;

      const { table } = session;
      if (!table.isBettingRoundInProgress() || table.playerToAct() !== info.seatIndex) return;

      const isFold = action === "fold";
      const foldWinner = isFold
        ? session.players.find((p) => p.seatIndex !== info.seatIndex)!
        : null;
      // capture pot before the action so it's available after the hand ends
      const potBeforeAction = table.pots().reduce((sum, p) => sum + p.size, 0);

      // snapshot chip counts before action to detect who won on fold
      const chipsBefore = table.seats().map((s) => s?.totalChips ?? 0);

      try {
        table.actionTaken(action as "fold" | "check" | "call" | "bet" | "raise", betSize);
      } catch (err) {
        socket.emit("error", { message: (err as Error).message });
        return;
      }

      // After fold the pot may already be cleared by the library; use pre-action value
      const foldPot = isFold
        ? potBeforeAction + (betSize ?? 0)
        : 0;

      const allHoles = table.holeCards();
      session.lastHoleCards = allHoles.map((h) => {
        if (h) return [...h];
        return null;
      });

      if (!table.isHandInProgress()) {
        if (isFold) {
          // find who gained chips (chip-diff works for any number of players)
          const chipsAfter = table.seats().map((s) => s?.totalChips ?? 0);
          const winnerSeatIdx = chipsAfter.findIndex((chips, i) => chips > chipsBefore[i]);
          const winner = winnerSeatIdx >= 0
            ? session.players.find((p) => p.seatIndex === winnerSeatIdx)
            : session.players.find((p) => p.seatIndex !== info.seatIndex);
          if (winner) {
            session.handResult = [{ username: winner.username, handName: "Fold", holeCards: [], potWon: foldPot }];
          }
        }

        if (hasBustedPlayer(session)) {
          const gameOver = handleElimination(io, state, info.gameId);
          broadcastState(io, state, info.gameId);
          if (gameOver) endGame(io, state, info.gameId);
          return;
        }
      } else {
        advanceRounds(session);
        if (!table.isHandInProgress() && hasBustedPlayer(session)) {
          const gameOver = handleElimination(io, state, info.gameId);
          broadcastState(io, state, info.gameId);
          if (gameOver) endGame(io, state, info.gameId);
          return;
        }
        if (table.isHandInProgress()) {
          session.lastCommunityCards = [...table.communityCards()];
        }
      }

      broadcastState(io, state, info.gameId);
    });

    socket.on("useSpecialChip", () => {
      const info = state.socketToGame.get(socket.id);
      if (!info) return;

      const session = state.games.get(info.gameId);
      if (!session || session.isGameOver) return;

      if (!session.table.isHandInProgress()) return;
      if (!session.table.isBettingRoundInProgress()) return;
      if (session.table.playerToAct() !== info.seatIndex) return;

      const seat = info.seatIndex;
      if (session.specialChipUsedBy[seat]) return;

      session.specialChipUsedBy[seat] = true;
      session.specialRevealActiveBySeat[seat] = true;
      broadcastState(io, state, info.gameId);

      clearSpecialRevealTimer(info.gameId, seat);
      specialRevealTimers.set(
        specialRevealTimerKey(info.gameId, seat),
        setTimeout(() => {
          const activeSession = state.games.get(info.gameId);
          if (!activeSession || activeSession.isGameOver) return;
          activeSession.specialRevealActiveBySeat[seat] = false;
          specialRevealTimers.delete(specialRevealTimerKey(info.gameId, seat));
          broadcastState(io, state, info.gameId);
        }, 5000)
      );
    });

    socket.on("nextHand", () => {
      const info = state.socketToGame.get(socket.id);
      if (!info) return;

      const session = state.games.get(info.gameId);
      if (!session || session.table.isHandInProgress() || session.isGameOver) return;

      session.nextHandReady[info.seatIndex] = true;
      broadcastState(io, state, info.gameId);

      if (session.nextHandReady.every(Boolean)) {
        session.nextHandReady = new Array(session.players.length).fill(false);
        session.handResult = null;
        session.lastCommunityCards = [];
        session.lastHoleCards = new Array(session.players.length).fill(null);
        session.specialRevealActiveBySeat = new Array(session.players.length).fill(false);
        for (let i = 0; i < session.players.length; i++) clearSpecialRevealTimer(info.gameId, i);

        if (hasBustedPlayer(session)) {
          const gameOver = handleElimination(io, state, info.gameId);
          broadcastState(io, state, info.gameId);
          if (gameOver) endGame(io, state, info.gameId);
          return;
        }

        try {
          session.table.startHand(session.nextDealerSeat);
          session.nextDealerSeat = (session.nextDealerSeat + 1) % session.players.length;
          broadcastState(io, state, info.gameId);
        } catch (err) {
          console.error("startHand error:", err);
        }
      }
    });

    socket.on("disconnect", () => {
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
          // check if this player still has chips or if theyre already busted (if they discconnect it should not end the other players game)
         
          const seat = session.table.seats()[info.seatIndex];
          const alreadyEliminated = !seat || seat.totalChips === 0;

          if (alreadyEliminated) {
            //  remove them; the game continues as if they closed the tab
            session.players = session.players.filter((p) => p.socketId !== socket.id);
          } else {
            for (const p of session.players) {
              if (p.socketId !== socket.id) io.to(p.socketId).emit("opponentDisconnected");
            }
            session.isGameOver = true;
            endGame(io, state, info.gameId);
          }
        }
        state.socketToGame.delete(socket.id);
      }

      console.log("User disconnected:", socket.id);
    });
  });
}
