"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Image from "next/image";
import type { GameSnapshot, PokerCard } from "../../../../../server";
import Chat from "@/components/Chat";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ChipStacks } from "@/components/ChipStack";
import { usePokerSettings } from "@/lib/poker-settings/context";
import { SettingsGearButton } from "@/components/settings/SettingsGearButton";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import PokerBackground from "@/components/PokerBackground";
import { DealingCard } from "@/components/poker/DealingCard";
import { FlipCommunityCard } from "@/components/poker/FlipCommunityCard";
import { getCardImage, getCardBack } from "@/lib/cards";

function CardFaceUp({ card }: { card: PokerCard }) {
  return (
    <div className="w-14 h-20 rounded-md overflow-hidden shadow-lg select-none">
      <Image src={getCardImage(card)} alt="" width={56} height={80} className="w-full h-full object-cover" />
    </div>
  );
}

function CardFaceDown({ backImage = "back01" }: { backImage?: string }) {
  return (
    <div className="w-14 h-20 rounded-md overflow-hidden shadow-lg">
      <Image src={getCardBack(backImage)} alt="Card back" width={56} height={80} className="w-full h-full object-cover" />
    </div>
  );
}

function CommunityCard({ card }: { card: PokerCard }) {
  return (
    <div className="w-14 h-20 rounded-lg overflow-hidden shadow-xl select-none">
      <Image src={getCardImage(card)} alt="" width={56} height={80} className="w-full h-full object-cover" />
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
  bannerImage,
}: {
  legalActions: GameSnapshot["legalActions"];
  myStack: number;
  pot: number;
  callAmount: number;
  onAction: (action: string, betSize?: number) => void;
  bannerImage: string;
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
      className="flex flex-col gap-3 mt-6"
      style={{
        backgroundImage: `url('${bannerImage}')`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        paddingTop: "20px",
        paddingBottom: "20px",
        paddingLeft: "80px",
        paddingRight: "80px",
        marginTop: "30px",
        marginBottom: "10px"
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
            className="flex-1 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-full text-lg transition-colors"
            style={{ backgroundColor: "#ea580c" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#c2410c"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ea580c"; }}
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

type DealEntry = {
  id: string;
  card: PokerCard;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
  faceUp: boolean;
};

const DEAL_CARD_INTERVAL = 0.2; // seconds between each card
// Placeholder card for opponent face-down cards (value never shown)
const PLACEHOLDER_CARD: PokerCard = { rank: "A", suit: "spades" };

export default function GameTable({ gameId, username, image }: { gameId: string; username: string; image: string }) {
  const { settings, visuals } = usePokerSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState<number | null>(null);

  // Dealing animation state
  const [dealPhase, setDealPhase] = useState<"idle" | "dealing" | "done">("idle");
  const [dealEntries, setDealEntries] = useState<DealEntry[]>([]);
  const [settledCount, setSettledCount] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  // Tracks which hand (by card fingerprint) has already been animated
  const lastDealHandRef = useRef<string | null>(null);
  // Tracks how many community cards were visible before the last update (for stagger delay)
  const communityCountRef = useRef(0);
  // Ghost card slot refs for measuring exact final positions
  const myCardSlotRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const oppCardSlotRefs = useRef<(HTMLDivElement | null)[]>([null, null]);

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

  // Reset to idle when a hand finishes so ghost slots are mounted before the next deal
  useEffect(() => {
    if (snapshot?.phase === "finished" || snapshot?.phase === "gameover") {
      setDealPhase("idle");
      setDealEntries([]);
      setSettledCount(0);
      lastDealHandRef.current = null;
    }
  }, [snapshot?.phase]);

  // Trigger deal animation when a new preflop hand arrives AND ghost slots are in the DOM
  useEffect(() => {
    if (!snapshot || snapshot.phase !== "preflop" || dealPhase !== "idle") return;
    if (!tableRef.current) return;

    const cards = snapshot.me.holeCards.filter(Boolean) as PokerCard[];
    if (cards.length < 2) return;

    const handId = cards.map((c) => `${c.rank}${c.suit}`).join("");
    if (handId === lastDealHandRef.current) return;
    lastDealHandRef.current = handId;

    const tableRect = tableRef.current.getBoundingClientRect();
    const w = tableRef.current.offsetWidth;
    const h = tableRef.current.offsetHeight;
    const deckX = w * 0.5;
    const deckY = h * 0.5;

    function slotCenter(refs: (HTMLDivElement | null)[], idx: number, fx: number, fy: number) {
      const el = refs[idx];
      if (el) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - tableRect.left, y: r.top + r.height / 2 - tableRect.top };
      }
      return { x: fx, y: fy };
    }

    const me0  = slotCenter(myCardSlotRefs.current,  0, w * 0.5, h * 0.88);
    const me1  = slotCenter(myCardSlotRefs.current,  1, w * 0.5, h * 0.88);
    const opp0 = slotCenter(oppCardSlotRefs.current, 0, w * 0.5, h * 0.12);
    const opp1 = slotCenter(oppCardSlotRefs.current, 1, w * 0.5, h * 0.12);

    const entries: DealEntry[] = [
      { id: "me-0",  card: cards[0],         fromX: deckX, fromY: deckY, toX: me0.x,  toY: me0.y,  delay: 0 * DEAL_CARD_INTERVAL, faceUp: true  },
      { id: "opp-0", card: PLACEHOLDER_CARD, fromX: deckX, fromY: deckY, toX: opp0.x, toY: opp0.y, delay: 1 * DEAL_CARD_INTERVAL, faceUp: false },
      { id: "me-1",  card: cards[1],         fromX: deckX, fromY: deckY, toX: me1.x,  toY: me1.y,  delay: 2 * DEAL_CARD_INTERVAL, faceUp: true  },
      { id: "opp-1", card: PLACEHOLDER_CARD, fromX: deckX, fromY: deckY, toX: opp1.x, toY: opp1.y, delay: 3 * DEAL_CARD_INTERVAL, faceUp: false },
    ];

    setDealEntries(entries);
    setSettledCount(0);
    setDealPhase("dealing");
  }, [snapshot, dealPhase]);

  // When all cards have settled, switch to "done" so static cards appear
  useEffect(() => {
    if (dealPhase === "dealing" && dealEntries.length > 0 && settledCount >= dealEntries.length) {
      const t = setTimeout(() => setDealPhase("done"), 300);
      return () => clearTimeout(t);
    }
  }, [settledCount, dealEntries.length, dealPhase]);

  // In non-preflop phases (flop onwards), cards must always be visible
  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.phase !== "preflop" && dealPhase !== "dealing") {
      setDealPhase("done");
    }
  }, [snapshot?.phase, dealPhase]);

  // Update community card count AFTER render so the stagger ref reflects the previous state
  useEffect(() => {
    communityCountRef.current = snapshot?.communityCards.length ?? 0;
  });

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
    <div className="poker-ui relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
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

      <div className="relative flex flex-col items-center w-full">
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
        <div ref={tableRef} className="relative w-full max-w-4xl aspect-[16/10]" style={{ zIndex: 10 }}>
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
              <>Pot <span className="font-bold" style={{ color: visuals.accent }}>€{pot.toLocaleString()}</span></>
            )}
          </div>

          {/* Community cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
            {communitySlots.map((card, i) =>
              card ? (
                <FlipCommunityCard
                  key={i}
                  card={card}
                  delay={Math.max(0, i - communityCountRef.current) * 0.12}
                  cardBackImage={settings.cardBackImage}
                />
              ) : (
                <EmptyCommunitySlot key={i} />
              )
            )}
          </div>

          {/* Opponent seat (top) — ordered from screen edge → table center */}
          <div
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ top: "12%", left: "50%" }}
          >
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
            <span className="text-white text-xs font-medium">{opponent.username}</span>
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
            <div className="flex items-end gap-2 mt-1">
              <ChipStacks balance={opponent.totalChips} maxBalance={Math.round((me.totalChips + opponent.totalChips) / 2)} />
              <div className="flex gap-1">
                {dealPhase === "done"
                  ? opponent.holeCards.map((card, i) =>
                      card ? <CardFaceUp key={i} card={card} /> : <CardFaceDown key={i} backImage={settings.cardBackImage} />
                    )
                  : [0, 1].map((i) => (
                      <div key={i} ref={(el) => { oppCardSlotRefs.current[i] = el; }} className="w-14 h-20 rounded-md border border-slate-600/30 bg-slate-800/30" />
                    ))}
              </div>
            </div>
          </div>

          {/* Animated dealing cards overlay */}
          {dealPhase === "dealing" && dealEntries.map((entry) => (
            <DealingCard
              key={entry.id}
              card={entry.card}
              fromX={entry.fromX}
              fromY={entry.fromY}
              toX={entry.toX}
              toY={entry.toY}
              delay={entry.delay}
              faceUp={entry.faceUp}
              cardBackImage={settings.cardBackImage}
              onSettled={() => setSettledCount((n) => n + 1)}
            />
          ))}

          {/* My seat (bottom) */}
          <div
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ top: "88%", left: "50%" }}
          >
            <div className="flex items-start gap-2 mb-1">
              <div className="flex gap-1">
                {dealPhase === "done"
                  ? me.holeCards.map((card, i) =>
                      card ? <CardFaceUp key={i} card={card} /> : <CardFaceDown key={i} backImage={settings.cardBackImage} />
                    )
                  : [0, 1].map((i) => (
                      <div key={i} ref={(el) => { myCardSlotRefs.current[i] = el; }} className="w-14 h-20 rounded-md border border-slate-600/30 bg-slate-800/30" />
                    ))}
              </div>
              <ChipStacks balance={me.totalChips} maxBalance={Math.round((me.totalChips + opponent.totalChips) / 2)} />
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

        {/* Action bar + controls — above chat */}
        <div style={{ position: "relative", zIndex: 60 }}>
          {myTurn && phase !== "finished" && phase !== "gameover" && (
            <ActionBar
              legalActions={legalActions}
              myStack={me.stack}
              pot={pot}
              callAmount={Math.min(me.stack, Math.max(0, opponent.betSize - me.betSize))}
              onAction={sendAction}
              bannerImage={settings.bannerImage}
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
      </div>

      {/* Chat */}
      <div className="fixed bottom-4 left-4 w-80" style={{ zIndex: 40 }}>
        <Chat username={username} gameId={gameId} />
      </div>
    </div>
  );
}
