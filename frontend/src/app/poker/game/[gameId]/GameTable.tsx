"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { GameSnapshot, PokerCard } from "../../../../../server";
import Chat from "@/components/Chat";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { usePokerSettings } from "@/lib/poker-settings/context";
import { SettingsGearButton } from "@/components/settings/SettingsGearButton";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import PokerBackground from "@/components/PokerBackground";
import Image from "next/image";

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
    <Image
      src="/card-back-red.png"
      alt="Card back"
      width={56}
      height={80}
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
  callAmount,
  onAction,
  actionBarGradient,
  frameColor,
}: {
  legalActions: GameSnapshot["legalActions"];
  myStack: number;
  pot: number;
  callAmount: number;
  onAction: (action: string, betSize?: number) => void;
  actionBarGradient: string;
  frameColor: string;
}) {
  const { actions, chipRange } = legalActions;
  const [raiseAmount, setRaiseAmount] = useState(chipRange?.min ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

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
      className="flex flex-col gap-3 mt-6 px-8 py-4 rounded-2xl shadow-2xl"
      style={{
        background: actionBarGradient,
        boxShadow: "0 4px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,150,0.2), inset 0 -2px 4px rgba(0,0,0,0.4)",
        border: `2px solid ${frameColor}`,
        transition: "background 400ms ease, border-color 400ms ease",
      }}
    >
      {/* Top row: preset chips (left) + slider (right) — only when canBetOrRaise */}
      {canBetOrRaise && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(minBet)} className={quickBtn}>Min</button>
            <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(Math.min(maxBet, Math.max(minBet, Math.round(maxBet / 2))))} className={quickBtn}>½ Pot</button>
            <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(Math.min(maxBet, Math.max(minBet, pot)))} className={quickBtn}>Pot</button>
            <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(maxBet)} className={quickBtn}>Max</button>
          </div>
          <input
            type="range"
            min={minBet}
            max={maxBet}
            step={step}
            value={raiseAmount}
            disabled={!canBetOrRaise}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="w-36 accent-lime-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Primary action buttons — equal height via items-stretch */}
      <div className="flex items-stretch gap-3">
        {canFold && (
          <button
            disabled={!canFold}
            onClick={() => onAction("fold")}
            className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-full text-lg transition-colors"
          >
            FOLD
          </button>
        )}
        {canCheck && (
          <button
            disabled={!canCheck}
            onClick={() => onAction("check")}
            className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-full text-lg transition-colors"
          >
            CHECK
          </button>
        )}
        {canCall && (
          <button
            disabled={!canCall}
            onClick={() => onAction("call")}
            className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-full text-lg transition-colors"
          >
            CALL €{callAmount.toLocaleString()}
          </button>
        )}
        {canBetOrRaise && (
          <button
            disabled={!canBetOrRaise}
            onClick={() => onAction(betAction, raiseAmount)}
            className="flex-1 flex flex-col items-center justify-center bg-lime-500 hover:bg-lime-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold px-8 py-3 rounded-full text-lg transition-colors"
          >
            <span className="leading-none">{canBet ? "BET" : "RAISE"}</span>
            {isEditing ? (
              <input
                type="number"
                className="mt-1 text-slate-900 font-semibold text-sm bg-transparent border-b border-slate-900/40 text-center w-[4.5rem] outline-none leading-none tabular-nums"
                value={editValue}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  const parsed = parseInt(editValue, 10);
                  if (!isNaN(parsed)) setRaiseAmount(Math.max(minBet, Math.min(maxBet, parsed)));
                  setIsEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur();
                }}
              />
            ) : (
              <span
                className="mt-1 text-sm font-semibold leading-none cursor-pointer hover:underline inline-block w-[4.5rem] text-center tabular-nums"
                onClick={(e) => { e.stopPropagation(); setEditValue(String(raiseAmount)); setIsEditing(true); }}
              >
                €{raiseAmount.toLocaleString()}
              </span>
            )}
          </button>
        )}
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
        <p className="text-slate-300">Final chips — {me.username}: €{me.totalChips} | {opponent.username}: €{opponent.totalChips}</p>
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

export default function GameTable({ gameId, username, image }: { gameId: string; username: string; image: string }) {
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
      socket.emit("joinGame", { gameId, username, image });
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
        <Image
          src="/dark-poker-background-of-spades-and-clubs.jpg"
          alt=""
          aria-hidden="true"
          fill
          className="object-cover"
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
          <Image
            src="/pokertable_no_bg.png"
            alt="Poker table"
            fill
            className="object-contain"
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
              <>Pot <span className="font-bold" style={{ color: visuals.accent }}>€{pot.toLocaleString()}</span></>
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
              <PlayerAvatar
                src={opponent.image}
                fallback={opponent.username}
                className={`w-10 h-10 rounded-full border-2 ${!myTurn && phase !== "finished" ? "border-green-400" : "border-slate-400"}`}
              />
            </div>
            <span className="text-white text-xs font-medium">{opponent.username}</span>
            <div className="flex flex-col items-center gap-0.5">
              <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs text-white font-medium">
                €{opponent.stack.toLocaleString()}
              </div>
              {opponent.betSize > 0 && (
                <div className="bg-yellow-700/80 px-2 py-0.5 rounded-full text-xs text-yellow-200">
                  bet €{opponent.betSize.toLocaleString()}
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
              <PlayerAvatar
                src={me.image}
                fallback={me.username}
                className={`w-10 h-10 rounded-full border-2 ${myTurn ? "border-green-400" : "border-slate-400"}`}
              />
            </div>
            <span className="text-white text-xs font-medium">{me.username} (you)</span>
            <div className="flex flex-col items-center gap-0.5">
              <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs text-white font-medium">
                €{me.stack.toLocaleString()}
              </div>
              {me.betSize > 0 && (
                <div className="bg-yellow-700/80 px-2 py-0.5 rounded-full text-xs text-yellow-200">
                  bet €{me.betSize.toLocaleString()}
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
            callAmount={Math.min(me.stack, Math.max(0, opponent.betSize - me.betSize))}
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
