"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { GameSnapshot, PokerCard } from "../../../../../server";
import Chat from "@/components/Chat";
import { usePokerSettings } from "@/lib/poker-settings/context";
import { SettingsGearButton } from "@/components/settings/SettingsGearButton";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import PokerBackground from "@/components/PokerBackground";

// CARD DISPLAY HELPERS

type CardDisplay = { rank: string; symbol: string; color: string };

function cardDisplay(card: PokerCard): CardDisplay {
  const rank = card.rank === "T" ? "10" : card.rank;
  const symbols: Record<string, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
  const colors: Record<string, string> = {
    hearts: "text-red-500", diamonds: "text-red-500",
    clubs: "text-white", spades: "text-white",
  };
  return { rank, symbol: symbols[card.suit] ?? "?", color: colors[card.suit] ?? "text-white" };
}

function CardFaceUp({ card }: { card: PokerCard }) {
  const d = cardDisplay(card);
  return (
    <div className="w-14 h-20 bg-slate-700 rounded-md border border-slate-500 flex flex-col items-center justify-center shadow-lg select-none">
      <span className="text-sm font-bold text-white leading-none">{d.rank}</span>
      <span className={`text-lg leading-none ${d.color}`}>{d.symbol}</span>
    </div>
  );
}

function CardFaceDown({ filter = "" }: { filter?: string }) {
  return (
    <img
      src="/card-back-red.png"
      alt="Card back"
      className="w-14 h-20 rounded-md shadow-lg object-cover"
      style={filter ? { filter } : undefined}
    />
  );
}

function CommunityCard({ card }: { card: PokerCard }) {
  const d = cardDisplay(card);
  return (
    <div className="w-14 h-20 bg-slate-700 rounded-lg border border-slate-500 flex flex-col items-center justify-center shadow-xl select-none">
      <span className="text-lg font-bold text-white leading-none">{d.rank}</span>
      <span className={`text-xl leading-none ${d.color}`}>{d.symbol}</span>
    </div>
  );
}

function EmptyCommunitySlot() {
  return (
    <div className="w-14 h-20 bg-slate-800/50 rounded-lg border border-slate-600/30 shadow-xl" />
  );
}

// ACTION BAR

function ActionBar({
  legalActions,
  myStack,
  pot,
  onAction,
  actionBarGradient,
  frameColor,
}: {
  legalActions: GameSnapshot["legalActions"];
  myStack: number;
  pot: number;
  onAction: (action: string, betSize?: number) => void;
  actionBarGradient: string;
  frameColor: string;
}) {
  const { actions, chipRange } = legalActions;
  const [raiseAmount, setRaiseAmount] = useState(chipRange?.min ?? 0);

  useEffect(() => {
    setRaiseAmount(chipRange?.min ?? 0);
  }, [chipRange?.min]);

  const canFold = actions.includes("fold");
  const canCheck = actions.includes("check");
  const canCall = actions.includes("call");
  const canBet = actions.includes("bet");
  const canRaise = actions.includes("raise");
  const canBetOrRaise = canBet || canRaise;
  const betAction = canBet ? "bet" : "raise";

  const minBet = chipRange?.min ?? 0;
  const maxBet = chipRange?.max ?? myStack;
  const step = Math.max(1, Math.floor(minBet / 2));

  const quickBtn = "bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  return (
    <div
      className="flex items-center gap-3 mt-6 px-8 py-4 rounded-2xl shadow-2xl"
      style={{
        background: actionBarGradient,
        boxShadow: "0 4px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,150,0.2), inset 0 -2px 4px rgba(0,0,0,0.4)",
        border: `2px solid ${frameColor}`,
        transition: "background 400ms ease, border-color 400ms ease",
      }}
    >
      {/* Quick bet buttons — left */}
      <div className="flex flex-col gap-1">
        <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(minBet)} className={quickBtn}>Min</button>
        <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(Math.min(maxBet, Math.max(minBet, Math.round(maxBet / 2))))} className={quickBtn}>1/2</button>
        <button disabled={!canCall} onClick={() => onAction("call")} className={quickBtn}>Call</button>
      </div>

      {/* Fold */}
      <button
        disabled={!canFold}
        onClick={() => onAction("fold")}
        className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-full text-lg transition-colors"
      >
        FOLD
      </button>

      {/* Bet amount stepper */}
      <div className="flex items-center gap-2">
        <button
          disabled={!canBetOrRaise}
          onClick={() => setRaiseAmount((v) => Math.max(minBet, v - step))}
          className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center transition-colors"
        >
          −
        </button>
        <span className="text-white font-bold text-xl min-w-[80px] text-center">
          ${raiseAmount.toLocaleString()}
        </span>
        <button
          disabled={!canBetOrRaise}
          onClick={() => setRaiseAmount((v) => Math.min(maxBet, v + step))}
          className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>

      {/* Raise / Bet */}
      <button
        disabled={!canBetOrRaise}
        onClick={() => onAction(betAction, raiseAmount)}
        className="bg-lime-500 hover:bg-lime-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold px-8 py-3 rounded-full text-lg transition-colors"
      >
        {canBet ? "BET" : "RAISE"}
      </button>

      {/* Quick bet buttons — right */}
      <div className="flex flex-col gap-1">
        <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(maxBet)} className={quickBtn}>Max</button>
        <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(Math.min(maxBet, Math.max(minBet, pot)))} className={quickBtn}>POT</button>
        <button disabled={!canCheck} onClick={() => onAction("check")} className={quickBtn}>Check</button>
      </div>
    </div>
  );
}

// RESULT OVERLAY

//display the outcome of a poker hand or the entire game, overlaying the table
function ResultOverlay({
  snapshot,
  myUsername,
  onNextHand,
  closeCountdown,
}: {
  snapshot: GameSnapshot;
  myUsername: string;
  onNextHand: () => void;
  closeCountdown: number | null;
}) {
  const { handResult, isGameOver, me, opponent } = snapshot;

  const winner = handResult?.[0];
  const iWon = winner?.username === myUsername;

  if (isGameOver) {
    const iWonGame = me.totalChips > opponent.totalChips;
    return (
      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-6 z-30 rounded-xl">
        <div className="text-5xl">{iWonGame ? "🏆" : "💸"}</div>
        <h2 className="text-3xl font-bold text-white">{iWonGame ? "You win the game!" : "You're busted!"}</h2>
        <p className="text-slate-300">Final chips — {me.username}: ${me.totalChips} | {opponent.username}: ${opponent.totalChips}</p>
        <p className="text-slate-500 text-sm">
          Window closes in {closeCountdown ?? 5}s…
        </p>
      </div>
    );
  }

  if (snapshot.phase !== "finished" || !handResult) return null;

  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-30 rounded-xl">
      <div className="text-4xl">{iWon ? "🎉" : "😔"}</div>
      <h2 className="text-2xl font-bold text-white">
        {iWon ? "You win!" : `${winner?.username ?? "Opponent"} wins!`}
      </h2>
      {winner?.handName && winner.handName !== "Fold" && (
        <p className="text-slate-300 text-lg">{winner.handName}</p>
      )}
      {winner?.handName === "Fold" && (
        <p className="text-slate-300">Opponent folded</p>
      )}

      {/* Show winner's cards */}
      {winner && winner.holeCards.length > 0 && (
        <div className="flex gap-2 mt-1">
          {winner.holeCards.map((card, i) => (
            <CardFaceUp key={i} card={card} />
          ))}
        </div>
      )}

    </div>
  );
}

// PHASE BADGE; show in which phase of the hand/game we are

const PHASE_LABELS: Record<string, string> = {
  preflop: "Pre-flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
  finished: "Showdown",
  gameover: "Game Over",
};

// MAIN GAME

export default function GameTable({ gameId, username }: { gameId: string; username: string }) {
  const { visuals } = usePokerSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState<number | null>(null);

  // auto close the tab if game is over (not working correctly?!)
  useEffect(() => {
    if (!snapshot?.isGameOver) return;
    setCloseCountdown(5);
    const interval = setInterval(() => {
      setCloseCountdown((n) => {
        if (n === null || n <= 1) {
          clearInterval(interval);
          window.close();
          return null;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [snapshot?.isGameOver]);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinGame", { gameId, username });
    });

    socket.on("gameState", (state: GameSnapshot) => {
      setSnapshot(state);
    });

    socket.on("opponentDisconnected", () => {
      setDisconnected(true);
    });

    socket.on("error", (err: { message: string }) => {
      console.error("Socket error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [gameId, username]);

  function sendAction(action: string, betSize?: number) {
    socketRef.current?.emit("playerAction", { action, betSize });
  }

  function sendNextHand() {
    socketRef.current?.emit("nextHand");
  }

  if (disconnected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-4">Opponent disconnected</p>
          <a href="/poker/lobby" className="bg-white text-slate-900 font-bold px-6 py-2 rounded-full">
            Back to Lobby
          </a>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const { me, opponent, communityCards, pot, myTurn, legalActions, phase } = snapshot;

  // fill community card slots up to 5
  const communitySlots = Array.from({ length: 5 }, (_, i) => communityCards[i] ?? null);

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
      {/* Background */}
      {visuals.backgroundVariant === "static" ? (
        <img
          src="/dark-poker-background-of-spades-and-clubs.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: visuals.bgFilter, zIndex: 0, transition: "filter 400ms ease" }}
        />
      ) : (
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <PokerBackground variant={visuals.backgroundVariant} />
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(255,255,255,0.15) 100%)",
          zIndex: 1,
        }}
      />
      <SettingsGearButton open={drawerOpen} onClick={() => setDrawerOpen((v) => !v)} />
      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Phase + game ID */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-black/60 text-white text-sm font-semibold px-3 py-1 rounded-full border border-white/20">
            {PHASE_LABELS[phase] ?? phase}
          </span>
          {myTurn && (
            <span className="bg-green-500/80 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
              Your turn
            </span>
          )}
          {!myTurn && phase !== "finished" && phase !== "gameover" && (
            <span className="bg-slate-700/80 text-slate-300 text-sm px-3 py-1 rounded-full">
              Opponent's turn
            </span>
          )}
        </div>

        {/* Table container */}
        <div className="relative w-full max-w-4xl aspect-[16/10]">
          {/* Table image */}
          <img
            src="/pokertable_no_bg.png"
            alt="Poker table"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: visuals.tableFilter, transition: "filter 400ms ease" }}
          />

          {/* Result overlay */}
          {(snapshot.phase === "finished" || snapshot.isGameOver) && (
            <ResultOverlay
              snapshot={snapshot}
              myUsername={username}
              onNextHand={sendNextHand}
              closeCountdown={closeCountdown}
            />
          )}

          {/* Pot */}
          <div className="absolute top-[28%] left-1/2 -translate-x-1/2 text-sm text-slate-300 font-medium">
            {pot > 0 && (
              <>Pot <span className="font-bold" style={{ color: visuals.accent }}>${pot.toLocaleString()}</span></>
            )}
          </div>

          {/* Community cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
            {communitySlots.map((card, i) =>
              card ? <CommunityCard key={i} card={card} /> : <EmptyCommunitySlot key={i} />
            )}
          </div>

          {/* Opponent seat (top) */}
          <div
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ top: "12%", left: "50%" }}
          >
            <div className="flex gap-1 mb-1">
              {opponent.holeCards.map((card, i) =>
                card ? <CardFaceUp key={i} card={card} /> : <CardFaceDown key={i} filter={visuals.cardBackFilter} />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {opponent.isDealer && (
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-900 text-[10px] font-black flex items-center justify-center">D</span>
              )}
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold text-white ${!myTurn && phase !== "finished" ? "border-green-400 bg-green-900/60 animate-pulse" : "border-slate-400 bg-slate-600"}`}>
                {opponent.username[0]?.toUpperCase()}
              </div>
            </div>
            <span className="text-white text-xs font-medium">{opponent.username}</span>
            <div className="flex flex-col items-center gap-0.5">
              <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs text-white font-medium">
                ${opponent.stack.toLocaleString()}
              </div>
              {opponent.betSize > 0 && (
                <div className="bg-yellow-700/80 px-2 py-0.5 rounded-full text-xs text-yellow-200">
                  bet ${opponent.betSize.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* My seat (bottom) */}
          <div
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ top: "88%", left: "50%" }}
          >
            <div className="flex gap-1 mb-1">
              {me.holeCards.map((card, i) =>
                card ? <CardFaceUp key={i} card={card} /> : <CardFaceDown key={i} filter={visuals.cardBackFilter} />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {me.isDealer && (
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-900 text-[10px] font-black flex items-center justify-center">D</span>
              )}
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold text-white ${myTurn ? "border-green-400 bg-green-900/60 animate-pulse" : "border-slate-400 bg-slate-600"}`}>
                {me.username[0]?.toUpperCase()}
              </div>
            </div>
            <span className="text-white text-xs font-medium">{me.username} (you)</span>
            <div className="flex flex-col items-center gap-0.5">
              <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs text-white font-medium">
                ${me.stack.toLocaleString()}
              </div>
              {me.betSize > 0 && (
                <div className="bg-yellow-700/80 px-2 py-0.5 rounded-full text-xs text-yellow-200">
                  bet ${me.betSize.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action bar */}
        {myTurn && phase !== "finished" && phase !== "gameover" && (
          <ActionBar
            legalActions={legalActions}
            myStack={me.stack}
            pot={pot}
            onAction={sendAction}
            actionBarGradient={visuals.actionBarGradient}
            frameColor={visuals.frameColor}
          />
        )}

        {!myTurn && phase !== "finished" && phase !== "gameover" && (
          <div className="mt-6 px-8 py-4 text-slate-400 text-sm">
            Waiting for {opponent.username}...
          </div>
        )}

        {/* Next Hand button — shown below table when hand is over */}
        {phase === "finished" && !snapshot.isGameOver && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              onClick={sendNextHand}
              disabled={snapshot.iReadyForNextHand}
              className="bg-white text-slate-900 font-bold px-10 py-3 rounded-full text-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {snapshot.iReadyForNextHand ? "Waiting for opponent…" : "Next Hand →"}
            </button>
          </div>
        )}

        <p className="text-slate-500 text-xs mt-4">
          ft_transcendence | {gameId}
        </p>
      </div>

      {/* Chat */}
      <div className="fixed bottom-4 left-4 w-80 z-50">
        <Chat username={username} gameId={gameId} />
      </div>
    </div>
  );
}
