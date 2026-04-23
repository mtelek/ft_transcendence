import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";
import { Table } from "poker-ts";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const activeSocketIds = new Set<string>();

// TYPE DEFINITION

// single card
export type PokerCard = { rank: string; suit: string };

// player
interface PlayerEntry {
  socketId: string;
  username: string; 
  seatIndex: number; 
}

// info about who won a hand and with what
interface WinnerInfo {
  username: string;
  handName: string;
  holeCards: PokerCard[]; 
}

// Everything the server keeps track of for one active gamesession
interface GameSession {
  table: InstanceType<typeof Table>; // the poker-ts engine — handles all game logic (for example: dealing, betting, etc)
  players: PlayerEntry[];   

  // poker-ts only lets you read the cards while a hand is in progress, so we need to snapshot so we can show them after the hand
  lastCommunityCards: PokerCard[];
  lastHoleCards: (PokerCard[] | null)[]; // index matches seatIndex

  handResult: WinnerInfo[] | null; // null while hand is in progress, filled in after showdown/fold

  // Tracks which players have clicked "Next Hand". Index 0 = seat 0, index 1 = seat 1.
  // Both must be true before we actually start the next hand.
  nextHandReady: [boolean, boolean];

  nextDealerSeat: number; // alternates each hand so the dealer button rotates fairly
  isGameOver: boolean;    // true when one player has run out of chips
}

// snapshot of all the relevant data sent to each client after change of state
// different players get different version (holecards of other players stay unvisible)
export type GameSnapshot = {
  gameId: string;
  phase: "preflop" | "flop" | "turn" | "river" | "finished" | "gameover";

  me: {
    username: string;
    stack: number;       // chips not yet bet this round
    betSize: number;     // chips bet so far this round
    totalChips: number;  // stack + betSize (total chips the player owns)
    holeCards: (PokerCard | null)[]; // your 2 private cards (null = no cards dealt yet)
    isDealer: boolean;
  };

  opponent: {
    username: string;
    stack: number;
    betSize: number;
    totalChips: number;
    holeCards: (PokerCard | null)[]; // hidden mid-hand (shown as face-down); revealed after showdown
    isDealer: boolean;
  };

  communityCards: PokerCard[]; // the shared board cards (up to 5)
  pot: number;                 // total chips in the middle
  myTurn: boolean;             // true when it's this player's turn to act

  // which actions this player can take right now (fold, call or raise)
  // chipRange is optional(only present if bet/raise is possible)
  legalActions: { actions: string[]; chipRange?: { min: number; max: number } };

  handResult: WinnerInfo[] | null; // filled in after the hand ends
  iReadyForNextHand: boolean;      // if the player has already clicked "next hand"
  isGameOver: boolean;
};

// CONSTANTS

// poker-ts returns a numeric hand ranking (0–9). Here we "translate" into readable names
const HAND_RANKING_NAMES = [
  "High Card", "Pair", "Two Pair", "Three of a Kind",
  "Straight", "Flush", "Full House", "Four of a Kind",
  "Straight Flush", "Royal Flush",
];

// APP

app.prepare().then(() => {
  // Create a plain node.js HTTP server and let next.js handle all page/API requests.
  const httpServer = createServer((req, res) => handle(req, res));

  // attach socket.io to our server
  const io = new Server(httpServer, { cors: { origin: "*" } });

  // Memory (things/information that will be saved relevant for the game but no database needed)

  // players waiting in the lobby for a game
  const lobby: Array<{ socketId: string; username: string }> = [];

  // all active game sessions, key is by gameId
  const games = new Map<string, GameSession>();

  // remembers which game a player belongs to, key is username
  // survives page navigation (for example when you refresh, the socket ID changes when you navigate, but the username stays)
  const pendingGames = new Map<string, { gameId: string; seatIndex: number }>();

  // maps the current socket connection ID to a game, so we can look up the game on every event
  // updated whenever a player reconnects with a new socket ID
  const socketToGame = new Map<string, { gameId: string; seatIndex: number }>();

  let gameCounter = 0;
  // create gameID based on current game + gamecounter
  const makeGameId = () => `game_${Date.now()}_${gameCounter++}`;

  // SNAPSHOT BUILDER

  // build the gamesnapshot object that gets sent to one specific player
  // called separately for each player so we can hide and show the right cards
  function buildSnapshot(gameId: string, mySeatIndex: number): GameSnapshot {
    const session = games.get(gameId)!;
    const { table, players, lastCommunityCards, lastHoleCards, handResult, nextHandReady, isGameOver } = session;

    const myEntry = players.find((p) => p.seatIndex === mySeatIndex)!;
    const oppEntry = players.find((p) => p.seatIndex !== mySeatIndex)!;
    const oppSeatIndex = oppEntry.seatIndex;

    const seats = table.seats();
    const mySeat = seats[mySeatIndex];
    const oppSeat = seats[oppSeatIndex];

    const handInProgress = table.isHandInProgress();
    const bettingInProgress = handInProgress && table.isBettingRoundInProgress();

    // Use the live community cards while a hand is going; fall back to the snapshot after it ends.
    const communityCards: PokerCard[] = handInProgress ? table.communityCards() : lastCommunityCards;

    // Your own hole cards are always visible. The opponent's cards are hidden mid-hand
    // and only revealed after showdown (when lastHoleCards is populated).
    let myHoleCards: (PokerCard | null)[] = [null, null];
    let oppHoleCards: (PokerCard | null)[] = [null, null];
    if (handInProgress) {
      const all = table.holeCards();
      myHoleCards = (all[mySeatIndex] ?? []) as PokerCard[];
      oppHoleCards = (all[oppSeatIndex] ?? [null, null]).map(() => null); // mask opponent's cards
    } else {
      myHoleCards = lastHoleCards[mySeatIndex] ?? [null, null];
      oppHoleCards = lastHoleCards[oppSeatIndex] ?? [null, null]; // revealed after hand ends
    }

    // checks which poker betting phase to display in the UI
    let phase: GameSnapshot["phase"] = "preflop";
    if (isGameOver) phase = "gameover";
    else if (!handInProgress) phase = "finished";
    else phase = table.roundOfBetting(); // returns "preflop" | "flop" | "turn" | "river"

    // sum up all the side pots into one number for UI 
    const pot = handInProgress ? table.pots().reduce((s, p) => s + p.size, 0) : 0;

    // send action only to player who is to act
    const myTurn = bettingInProgress && table.playerToAct() === mySeatIndex;
    const rawLegal = myTurn ? table.legalActions() : { actions: [] as string[] };
    const legalActions = {
      actions: rawLegal.actions,
      chipRange: (rawLegal as any).chipRange
        ? { min: (rawLegal as any).chipRange.min, max: (rawLegal as any).chipRange.max }
        : undefined,
    };

    // set dealer button position to either the current dealers seat or -1 (no active hand)
    const dealerSeat = handInProgress ? table.button() : -1;

    return {
      gameId,
      phase,
      me: {
        username: myEntry.username,
        stack: mySeat?.stack ?? 0,
        betSize: mySeat?.betSize ?? 0,
        totalChips: mySeat?.totalChips ?? 0,
        holeCards: myHoleCards,
        isDealer: dealerSeat === mySeatIndex,
      },
      opponent: {
        username: oppEntry.username,
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

  // send an current snapshot to every player in the game
  function broadcastState(gameId: string) {
    const session = games.get(gameId);
    if (!session) return;
    for (const p of session.players) {
      if (p.socketId) io.to(p.socketId).emit("gameState", buildSnapshot(gameId, p.seatIndex));
    }
  }

  // called when a game ends permanently, emoves the players from all tracking maps so they can go back to the lobby and start a fresh game
  function endGame(gameId: string) {
    const session = games.get(gameId);
    if (!session) return;
    for (const p of session.players) {
      pendingGames.delete(p.username);
      socketToGame.delete(p.socketId);
    }
    // keep the game object alive for 15 seconds so the client can still read the final "game over" snapshot during its countdown before closing the window.
    setTimeout(() => games.delete(gameId), 15_000);
    console.log(`Game ${gameId} ended — players released`);
  }

  // automatically progresses through betting rounds and streets when no player needs to act (for example all in)
  // before every showdown it snapshots the cards because poker-ts clears data during showdown
  function advanceRounds(session: GameSession) {
    const { table } = session;
    let safety = 0; // prevent infinite loop
    while (!table.isBettingRoundInProgress() && table.isHandInProgress() && safety++ < 5) {
      if (table.areBettingRoundsCompleted()) {
        // all betting is done — snapshot cards before showdown clears them
        session.lastCommunityCards = [...table.communityCards()];
        session.lastHoleCards = table.holeCards().map((h) => (h ? [...h] : null));
        table.showdown();
        // store the winner so the UI can display the result
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
      // move to the next street and snapshot the new board
      table.endBettingRound();
      if (table.isHandInProgress()) {
        session.lastCommunityCards = [...table.communityCards()];
      }
    }
  }

  // SOCKET HANDLERS

  io.on("connection", (socket) => {
    activeSocketIds.add(socket.id);
    console.log("[Socket.io] User connected:", socket.id);

    // chat message — scoped to a game room if gameId is provided, otherwise global
    socket.on("message", (data: { username: string; text: string; gameId?: string }) => {
      const { gameId, ...msg } = data;
      if (gameId) {
        io.to(gameId).emit("message", msg);
      } else {
        io.emit("message", msg);
      }
    });

    // join the Socket.IO room for game-scoped chat (Chat component connects separately from GameTable)
    socket.on("joinGameRoom", ({ gameId }: { gameId: string }) => {
      socket.join(gameId);
    });

    // player wants to find a game. Either match them with a waiting player or put them in the queue
    socket.on("joinLobby", ({ username }: { username: string }) => {
      // if this player already has an active game  send them back to active table
      if (pendingGames.has(username)) {
        const pending = pendingGames.get(username)!;
        const session = games.get(pending.gameId);
        if (session && !session.isGameOver) {
          socket.emit("gameStarted", { gameId: pending.gameId });
          return;
        }
        // if the game the player was in is over, cleanup so they can queue for a new game
        pendingGames.delete(username);
      }

      // Search for other waiting players
      const waitingIdx = lobby.findIndex((p) => p.username !== username);
      if (waitingIdx !== -1) {
        // match found -> create new game session
        const opponent = lobby.splice(waitingIdx, 1)[0];
        const gameId = makeGameId();

        // set up the poker table: small blind 10, big blind 20, each player starts with 1000 chips
        const table = new Table({ smallBlind: 10, bigBlind: 20 }, 2);
        table.sitDown(0, 1000);
        table.sitDown(1, 1000);
        table.startHand(0); // seat 0 is dealer for the first hand

        const session: GameSession = {
          table,
          players: [
            { socketId: opponent.socketId, username: opponent.username, seatIndex: 0 },
            { socketId: socket.id, username, seatIndex: 1 },
          ],
          lastCommunityCards: [],
          lastHoleCards: [null, null],
          handResult: null,
          nextHandReady: [false, false],
          nextDealerSeat: 1, // seat 1 gets the button on the second hand
          isGameOver: false,
        };

        games.set(gameId, session);
        pendingGames.set(opponent.username, { gameId, seatIndex: 0 });
        pendingGames.set(username, { gameId, seatIndex: 1 });

        // tell players to navigate to game page
        io.to(opponent.socketId).emit("gameStarted", { gameId });
        socket.emit("gameStarted", { gameId });
      } else {
        // if noone is waiting for same game put player to queue
        const dup = lobby.findIndex((p) => p.username === username);
        if (dup !== -1) lobby.splice(dup, 1); // remove duplicate entry first

        lobby.push({ socketId: socket.id, username });
        socket.emit("waitingForOpponent");
      }
    });

    // Player left the lobby page before finding a match
    socket.on("leaveLobby", () => {
      const idx = lobby.findIndex((p) => p.socketId === socket.id);
      if (idx !== -1) lobby.splice(idx, 1);
    });

    // game page loaded, wire new socket connection to existing game session
    // (socket ID changes everytime the page navigates, so we need to relink with username)
    socket.on("joinGame", ({ gameId, username }: { gameId: string; username: string }) => {
      const pending = pendingGames.get(username);
      if (!pending || pending.gameId !== gameId) {
        socket.emit("error", { message: "Not authorized for this game" });
        return;
      }

      const session = games.get(gameId);
      if (!session) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      // update the players socket ID in this session (it changed on navigation)
      const entry = session.players.find((p) => p.username === username);
      if (entry) {
        socketToGame.delete(entry.socketId); // remove the old socket mapping
        entry.socketId = socket.id;
      }

      socketToGame.set(socket.id, { gameId, seatIndex: pending.seatIndex });
      socket.join(gameId); // join the Socket.IO room for this game
      socket.emit("gameState", buildSnapshot(gameId, pending.seatIndex)); // send initial state
    });

    // player clicked an action button (fold / check/ call/ bet/ raise).
    socket.on("playerAction", ({ action, betSize }: { action: string; betSize?: number }) => {
      const info = socketToGame.get(socket.id);
      if (!info) return;

      const session = games.get(info.gameId);
      if (!session || session.isGameOver) return;

      const { table } = session;

      // ignore actions if its not player to act
      if (!table.isBettingRoundInProgress() || table.playerToAct() !== info.seatIndex) return;

      const isFold = action === "fold";

      try {
        table.actionTaken(action as any, betSize);
      } catch (err) {
        socket.emit("error", { message: (err as Error).message });
        return;
      }

      // snapshot hole cards
      const allHoles = table.holeCards();
      session.lastHoleCards = allHoles.map((h) => {
        if (h) {
          return [...h];
        }
        return null;}
      );

      if (!table.isHandInProgress()) {
        // hand just ended (fold or all chips in)
        if (isFold) {
          // poker-ts doesn't fill in winners() on a fold, so we do it manually
          const winner = session.players.find((p) => p.seatIndex !== info.seatIndex)!;
          session.handResult = [{ username: winner.username, handName: "Fold", holeCards: [] }];
        }
        // check if someone run out of chips, if yes end the game
        const seats = table.seats();
        if (seats.some((s) => s && s.totalChips === 0)) {
          session.isGameOver = true;
          broadcastState(info.gameId);
          endGame(info.gameId);
          return;
        }
      } else {
        // hand is still going — advance through any automatic round transitions
        advanceRounds(session);
        if (table.isHandInProgress()) {
          session.lastCommunityCards = [...table.communityCards()];
        }
      }

      broadcastState(info.gameId);
    });

    // a player clicked "Next Hand" - once both players have clicked it, new hand can start
    socket.on("nextHand", () => {
      const info = socketToGame.get(socket.id);
      if (!info) return;

      const session = games.get(info.gameId);
      if (!session || session.table.isHandInProgress() || session.isGameOver) return;

      // mark this player as ready and broadcast immediately so button switches to "Waiting for opponent"
      session.nextHandReady[info.seatIndex as 0 | 1] = true;
      broadcastState(info.gameId);

      // both players ready, start next hand
      if (session.nextHandReady[0] && session.nextHandReady[1]) {
        // reset flags, and clear last rounds results
        session.nextHandReady = [false, false];
        session.handResult = null;
        session.lastCommunityCards = [];
        session.lastHoleCards = [null, null];

        // another check if players run out of chips
        const seats = session.table.seats();
        if (seats.some((s) => s && s.totalChips === 0)) {
          session.isGameOver = true;
          broadcastState(info.gameId);
          endGame(info.gameId);
          return;
        }

        try {
          session.table.startHand(session.nextDealerSeat);
          session.nextDealerSeat = session.nextDealerSeat === 0 ? 1 : 0; // rotate the dealer button
          broadcastState(info.gameId);
        } catch (err) {
          console.error("startHand error:", err);
        }
      }
    });

    // player closed the tab or lost connection
    socket.on("disconnect", () => {
      // remove from lobby if they were still waiting for a match
      const lobbyIdx = lobby.findIndex((p) => p.socketId === socket.id);
      if (lobbyIdx !== -1) lobby.splice(lobbyIdx, 1);

      // if they were in a game, tell the opponent and end the game
      const info = socketToGame.get(socket.id);
      if (info) {
        const session = games.get(info.gameId);
        if (session && !session.isGameOver) {
          const opp = session.players.find((p) => p.seatIndex !== info.seatIndex);
          if (opp?.socketId) io.to(opp.socketId).emit("opponentDisconnected");
          session.isGameOver = true;
          endGame(info.gameId);
        }
        socketToGame.delete(socket.id);
      }

      console.log("User disconnected:", socket.id);
    });
  });

  httpServer.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
