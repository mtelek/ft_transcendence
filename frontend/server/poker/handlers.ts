import { Table } from "poker-ts";
import type { Server } from "socket.io";
import type { PokerServerState } from "./state";
import type { GameSession } from "./types";
import { buildSnapshot, broadcastState } from "./snapshot";
import { advanceRounds, endGame } from "./game-flow";

function hasBustedPlayer(session: GameSession) {
  return session.table.seats().some((seat) => seat && seat.totalChips === 0);
}

export function registerPokerHandlers(io: Server, state: PokerServerState) {
  // Track disconnect timers by username
  const disconnectTimers = new Map<string, NodeJS.Timeout>();

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

    socket.on("hostGame", ({ username, image, gameName, password }: { username: string; image?: string; gameName: string; password: string }) => {
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
        if (entry.socketId === socket.id) {
          state.namedLobbies.delete(name);
          state.reservedGameNames.delete(name);
          break;
        }
      }

      state.namedLobbies.set(normalizedGameName, { socketId: socket.id, username, image, password });
      state.reservedGameNames.add(normalizedGameName);
      socket.emit("waitingForOpponent");
    });

    socket.on("joinNamedGame", ({ username, image, gameName, password }: { username: string; image?: string; gameName: string; password: string }) => {
      const normalizedGameName = gameName.trim();
      const host = state.namedLobbies.get(normalizedGameName);
      if (!host) {
        socket.emit("lobbyError", { message: "Game not found" });
        return;
      }
      if (host.password !== password) {
        socket.emit("lobbyError", { message: "Wrong password" });
        return;
      }
      state.namedLobbies.delete(normalizedGameName);

      const gameId = normalizedGameName;
      const table = new Table({ smallBlind: 10, bigBlind: 20 }, 2);
      table.sitDown(0, 1000);
      table.sitDown(1, 1000);
      table.startHand(0);

      const session: GameSession = {
        table,
        players: [
          { socketId: host.socketId, username: host.username, image: host.image, seatIndex: 0 },
          { socketId: socket.id, username, image, seatIndex: 1 },
        ],
        lastCommunityCards: [],
        lastHoleCards: [null, null],
        handResult: null,
        nextHandReady: [false, false],
        nextDealerSeat: 1,
        isGameOver: false,
        matchSaved: false,
      };

      state.games.set(gameId, session);
      state.pendingGames.set(host.username, { gameId, seatIndex: 0 });
      state.pendingGames.set(username, { gameId, seatIndex: 1 });

      io.to(host.socketId).emit("gameStarted", { gameId });
      socket.emit("gameStarted", { gameId });
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
        // Clear disconnect timer if reconnecting within 10s
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

      try {
          table.actionTaken(action as 'fold' | 'check' | 'call' | 'bet' | 'raise', betSize);
      } catch (err) {
        socket.emit("error", { message: (err as Error).message });
        return;
      }

      const allHoles = table.holeCards();
      session.lastHoleCards = allHoles.map((h) => {
        if (h) return [...h];
        return null;
      });

      if (!table.isHandInProgress()) {
        if (isFold) {
          const winner = session.players.find((p) => p.seatIndex !== info.seatIndex)!;
          session.handResult = [{ username: winner.username, handName: "Fold", holeCards: [] }];
        }

        if (hasBustedPlayer(session)) {
          session.isGameOver = true;
          broadcastState(io, state, info.gameId);
          endGame(io, state, info.gameId);
          return;
        }
      } else {
        advanceRounds(session);
        if (!table.isHandInProgress() && hasBustedPlayer(session)) {
          session.isGameOver = true;
          broadcastState(io, state, info.gameId);
          endGame(io, state, info.gameId);
          return;
        }
        if (table.isHandInProgress()) {
          session.lastCommunityCards = [...table.communityCards()];
        }
      }

      broadcastState(io, state, info.gameId);
    });

    socket.on("nextHand", () => {
      const info = state.socketToGame.get(socket.id);
      if (!info) return;

      const session = state.games.get(info.gameId);
      if (!session || session.table.isHandInProgress() || session.isGameOver) return;

      session.nextHandReady[info.seatIndex as 0 | 1] = true;
      broadcastState(io, state, info.gameId);

      if (session.nextHandReady[0] && session.nextHandReady[1]) {
        session.nextHandReady = [false, false];
        session.handResult = null;
        session.lastCommunityCards = [];
        session.lastHoleCards = [null, null];

        if (hasBustedPlayer(session)) {
          session.isGameOver = true;
          broadcastState(io, state, info.gameId);
          endGame(io, state, info.gameId);
          return;
        }

        try {
          session.table.startHand(session.nextDealerSeat);
          session.nextDealerSeat = session.nextDealerSeat === 0 ? 1 : 0;
          broadcastState(io, state, info.gameId);
        } catch (err) {
          console.error("startHand error:", err);
        }
      }
    });

    socket.on("disconnect", () => {
      for (const [name, entry] of state.namedLobbies) {
        if (entry.socketId === socket.id) {
          state.namedLobbies.delete(name);
          state.reservedGameNames.delete(name);
          break;
        }
      }

      const info = state.socketToGame.get(socket.id);
      if (info) {
        const session = state.games.get(info.gameId);
        if (session && !session.isGameOver) {
          // Find the disconnecting player
          const player = session.players.find((p) => p.seatIndex === info.seatIndex);
          if (player) {
            // Start a 10s timer for reconnection
            disconnectTimers.set(player.username, setTimeout(() => {
              // After 10s, if not reconnected, end game/mark as left
              const opp = session.players.find((p) => p.seatIndex !== info.seatIndex);
              if (opp?.socketId) io.to(opp.socketId).emit("opponentDisconnected");
              session.isGameOver = true;
              endGame(io, state, info.gameId);
              disconnectTimers.delete(player.username);
            }, 10000));
          }
        }
        state.socketToGame.delete(socket.id);
      }

      console.log("User disconnected:", socket.id);
    });
  });
}
