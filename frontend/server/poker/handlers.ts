import { Table } from "poker-ts";
import type { Server } from "socket.io";
import type { PokerServerState } from "./state";
import type { GameSession } from "./types";
import { buildSnapshot, broadcastState } from "./snapshot";
import { advanceRounds, endGame, handleElimination } from "./game-flow";

function hasBustedPlayer(session: GameSession) {
  const seats = session.table.seats();
  return session.players.some((p) => {
    const seat = seats[p.seatIndex];
    return !seat || seat.totalChips === 0;
  });
}

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
    lastCommunityCards: [],
    lastHoleCards: new Array(n).fill(null),
    specialChipEnabled: useSpecialChip,
    specialChipUsedBy: new Array(n).fill(false),
    specialRevealActiveBySeat: new Array(n).fill(-1),
    handResult: null,
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
  const specialRevealTimers = new Map<string, NodeJS.Timeout>();
  const nextHandTimers = new Map<string, NodeJS.Timeout>();

  function scheduleNextHand(gameId: string) {
    const existing = nextHandTimers.get(gameId);
    if (existing) clearTimeout(existing);

    nextHandTimers.set(gameId, setTimeout(() => {
      nextHandTimers.delete(gameId);
      const session = state.games.get(gameId);
      if (!session || session.isGameOver) return;

      session.handResult = null;
      session.lastCommunityCards = [];
      session.lastHoleCards = new Array(session.players.length).fill(null);
      session.specialRevealActiveBySeat = new Array(session.players.length).fill(-1);
      for (let i = 0; i < session.players.length; i++) clearSpecialRevealTimer(gameId, i);

      if (hasBustedPlayer(session)) {
        const { gameOver, eliminatedSockets } = handleElimination(io, state, gameId);
        broadcastState(io, state, gameId);
        for (const s of eliminatedSockets) io.to(s).emit("eliminated");
        if (gameOver) endGame(io, state, gameId);
        return;
      }

      try {
        session.table.startHand(session.nextDealerSeat);
        session.nextDealerSeat = (session.nextDealerSeat + 1) % session.players.length;
        io.to(gameId).emit("message", { username: "game", text: "DEALER: — New Hand —", type: "game" });
        // advance rounds automatically if a player is allin 
        advanceRounds(session);
        broadcastState(io, state, gameId);
        if (session.handResult) {
          if (hasBustedPlayer(session)) {
            const { gameOver, eliminatedSockets } = handleElimination(io, state, gameId);
            broadcastState(io, state, gameId);
            setTimeout(() => { for (const s of eliminatedSockets) io.to(s).emit("eliminated"); }, 5000);
            if (gameOver) endGame(io, state, gameId);
            else scheduleNextHand(gameId);
          } else {
            scheduleNextHand(gameId);
          }
        } else {
          autoActForDisconnected(gameId);
        }
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

  function applyAction(gameId: string, seatIndex: number, action: string, betSize?: number) {
    const session = state.games.get(gameId);
    if (!session || session.isGameOver) return;
    const { table } = session;
    if (!table.isBettingRoundInProgress() || table.playerToAct() !== seatIndex) return;

    const isFold = action === "fold";
    const seats = table.seats() as any[];
    const potBeforeAction = (table.pots() as any[]).reduce((sum: number, p) => sum + p.size, 0);
    const chipsBefore = seats.map((s) => s?.totalChips ?? 0);
    const actorName = session.players.find((p) => p.seatIndex === seatIndex)?.username ?? "Unknown";
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
        broadcastState(io, state, gameId);
        const { gameOver, eliminatedSockets } = handleElimination(io, state, gameId);
        broadcastState(io, state, gameId);
        setTimeout(() => { for (const s of eliminatedSockets) io.to(s).emit("eliminated"); }, 5000);
        if (gameOver) endGame(io, state, gameId);
        else if (session.handResult) scheduleNextHand(gameId);
        return;
      }
    } else {
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

      const commCountAfter = session.lastCommunityCards.length;
      if (commCountAfter > commCountBefore) {
        const phaseNames: Record<number, string> = { 3: "— Flop —", 4: "— Turn —", 5: "— River —" };
        const phaseName = phaseNames[commCountAfter];
        if (phaseName) emitGameEvent(phaseName);
      }

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
        broadcastState(io, state, gameId);
        const { gameOver, eliminatedSockets } = handleElimination(io, state, gameId);
        broadcastState(io, state, gameId);
        setTimeout(() => { for (const s of eliminatedSockets) io.to(s).emit("eliminated"); }, 5000);
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

  function autoActForDisconnected(gameId: string) {
    for (let i = 0; i < 10; i++) {
      const session = state.games.get(gameId);
      if (!session || session.isGameOver) break;
      const { table } = session;
      if (!table.isHandInProgress() || !table.isBettingRoundInProgress()) break;
      const actorSeat = table.playerToAct();
      const actor = session.players.find((p) => p.seatIndex === actorSeat);
      if (!actor) break;
      const seats = table.seats() as any[];
      const isAllIn = (seats[actorSeat]?.stack ?? 1) === 0;
      const myBet = seats[actorSeat]?.betSize ?? 0;
      const maxOppBet = seats
        .filter((_: unknown, i: number) => i !== actorSeat)
        .reduce((max: number, s: any) => Math.max(max, s?.betSize ?? 0), 0);
      const callCost = Math.max(0, maxOppBet - myBet);
      const legal = table.legalActions();
      const canBetOrRaise = legal.actions.includes("bet") || legal.actions.includes("raise");
      const isFreeCall = !isAllIn && callCost === 0 && !canBetOrRaise;
      if (actor.isActive && !isAllIn && !isFreeCall) break;
      if (!legal.actions.length) break;
      const action = legal.actions.includes("check") ? "check"
        : (isAllIn || isFreeCall) && legal.actions.includes("call") ? "call"
        : "fold";
      applyAction(gameId, actorSeat, action);
    }
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
        const wasDisconnected = !entry.isActive;
        state.socketToGame.delete(entry.socketId);
        entry.socketId = socket.id;
        entry.isActive = true;
        if (image) entry.image = image;
        if (wasDisconnected) {
          io.to(gameId).emit("message", { username: "game", text: `DEALER: ${username} reconnected`, type: "game" });
        }
      }

      state.socketToGame.set(socket.id, { gameId, seatIndex: pending.seatIndex });
      socket.join(gameId);
      socket.emit("gameState", buildSnapshot(state, gameId, pending.seatIndex));
      broadcastState(io, state, gameId);
    });

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
          const seat = (session.table.seats() as any[])[info.seatIndex];
          const alreadyEliminated = !seat || seat.totalChips === 0;

          if (alreadyEliminated) {
            session.players = session.players.filter((p) => p.socketId !== socket.id);
          } else {
            const player = session.players.find((p) => p.socketId === socket.id);
            if (player) {
              player.isActive = false;
              io.to(info.gameId).emit("message", { username: "game", text: `DEALER: ${player.username} disconnected`, type: "game" });
              broadcastState(io, state, info.gameId);
              autoActForDisconnected(info.gameId);
            }
          }
        }
        state.socketToGame.delete(socket.id);
      }

      console.log("User disconnected:", socket.id);
    });
  });
}
