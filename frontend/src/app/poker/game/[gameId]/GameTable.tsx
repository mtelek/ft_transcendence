"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { SpecialChip } from "@/components/poker/SpecialChip";
import { getCardImage, getCardBack } from "@/lib/cards";
import Link from "next/link";

// ----------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------

// seat positions for opponents as [top%, left%] based on player count
const OPPONENT_POSITIONS: Record<number, [number, number][]> = {
  1: [[12, 50]],
  2: [[12, 25], [12, 75]],
};

// maps game phase keys to display labels shown in the phase badge
const PHASE_LABELS: Record<string, string> = {
  preflop: "Pre-flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
  finished: "Showdown",
  gameover: "Game Over",
};

// interval between each card being dealt in the animation (seconds)
const DEAL_CARD_INTERVAL = 0.2;

// placeholder card used for opponent face-down cards during deal animation
const PLACEHOLDER_CARD: PokerCard = { rank: "A", suit: "spades" };

// ----------------------------------------------------------------
// CARD COMPONENTS
// ----------------------------------------------------------------

// renders a face-up card using the card image
function CardFaceUp({ card }: { card: PokerCard }) {
  return (
    <div className="w-14 h-20 rounded-md overflow-hidden shadow-lg select-none">
      <Image src={getCardImage(card)} alt="" width={56} height={80} className="w-full h-full object-cover" />
    </div>
  );
}

// renders a face-down card using the selected card back image
function CardFaceDown({ backImage = "back01" }: { backImage?: string }) {
  return (
    <div className="w-14 h-20 rounded-md overflow-hidden shadow-lg">
      <Image src={getCardBack(backImage)} alt="Card back" width={56} height={80} className="w-full h-full object-cover" />
    </div>
  );
}

// empty placeholder slot shown before community cards are dealt
function EmptyCommunitySlot() {
  return (
    <div className="w-14 h-20 bg-slate-800/50 rounded-lg border border-slate-600/30 shadow-xl" />
  );
}

// ----------------------------------------------------------------
// ACTION BAR
// ----------------------------------------------------------------

// bottom action panel shown when it's the player's turn
// contains fold/check/call/bet/raise buttons, a raise slider, and the special chip button
function ActionBar({
  legalActions,
  myStack,
  pot,
  callAmount,
  opponents,
  onAction,
  onUseSpecialChip,
  specialChipEnabled,
  specialChipUsed,
  bannerImage,
}: {
  legalActions: GameSnapshot["legalActions"];
  myStack: number;
  pot: number;
  callAmount: number;
  opponents: { username: string; image?: string; seatIndex: number }[];
  onAction: (action: string, betSize?: number) => void;
  onUseSpecialChip: (targetId: string) => void;
  specialChipEnabled: boolean;
  specialChipUsed: boolean;
  bannerImage: string;
}) {
  const { actions, chipRange } = legalActions;
  const [raiseAmount, setRaiseAmount] = useState(chipRange?.min ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // reset raise amount when chip range changes (new hand or new betting round)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setRaiseAmount(chipRange?.min ?? 0);
    });
    return () => clearTimeout(timeout);
  }, [chipRange?.min, chipRange?.max]);

  const canFold = actions.includes("fold");
  const canCheck = actions.includes("check");
  const canCall = actions.includes("call");
  const canBet = actions.includes("bet");
  const canRaise = actions.includes("raise");
  const canBetOrRaise = canBet || canRaise;
  const betAction = canBet ? "bet" : "raise";

  const minBet = chipRange?.min ?? 0;
  const maxBet = chipRange?.max ?? myStack;
  const step = 1;

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
      {/* preset bet size buttons + slider — only shown when bet/raise is possible */}
      {canBetOrRaise && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(minBet)} className={quickBtn}>Min</button>
            <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(Math.min(maxBet, Math.max(minBet, Math.round((pot + 2 * callAmount) / 2))))} className={quickBtn}>½ Pot</button>
            <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(Math.min(maxBet, Math.max(minBet, pot + 2 * callAmount)))} className={quickBtn}>Pot</button>
            <button disabled={!canBetOrRaise} onClick={() => setRaiseAmount(maxBet)} className={quickBtn}>Max</button>
          </div>
          <input
            id="raiseamount"
            type="range"
            min={minBet}
            max={maxBet}
            step={step}
            value={raiseAmount}
            disabled={!canBetOrRaise}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="w-36 accent-lime-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            autoComplete="off"
          />
        </div>
      )}

      {/* primary action buttons */}
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
          <div className="flex flex-1 items-center justify-center gap-3">
            {/* bet/raise button with inline amount editor */}
            <button
              disabled={!canBetOrRaise}
              onClick={() => {
                let amount = raiseAmount;
                if (isEditing) {
                  const parsed = parseInt(editValue, 10);
                  if (!isNaN(parsed)) amount = Math.max(minBet, Math.min(maxBet, parsed));
                }
                onAction(betAction, amount);
              }}
              className="flex-1 flex flex-col items-center justify-center bg-lime-500 hover:bg-lime-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold px-8 py-3 rounded-full text-lg transition-colors"
            >
              <span className="leading-none">{canBet ? "BET" : "RAISE"}</span>
              {isEditing ? (
                <input
                  id="editvalue"
                  type="number"
                  min={minBet}
                  max={maxBet}
                  className="mt-1 text-slate-900 font-semibold text-sm bg-transparent border-b border-slate-900/40 text-center w-[4.5rem] outline-none leading-none tabular-nums"
                  value={editValue}
                  autoFocus
                  autoComplete="off"
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
            {/* special chip button — lets player reveal opponent's cards for 5 seconds */}
            {specialChipEnabled && (
              <SpecialChip
                disabled={false}
                isUsed={specialChipUsed}
                targets={opponents.map((o) => ({ id: String(o.seatIndex), username: o.username, image: o.image }))}
                onUse={onUseSpecialChip}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// RESULT OVERLAY
// ----------------------------------------------------------------

// shown on top of the table when a hand ends or the full game ends
// displays win/loss message, winner name, winning hand, and exit button
function ResultOverlay({
  snapshot,
  myUsername,
}: {
  snapshot: GameSnapshot;
  myUsername: string;
}) {
  const { handResult, isGameOver, me, opponents } = snapshot;
  const totalChips = me.totalChips + opponents.reduce((s, o) => s + o.totalChips, 0);
  const isMatchOver = isGameOver || me.totalChips === 0 || opponents.every((o) => o.totalChips === 0);

  const winner = handResult?.[0];
  const iWon = winner?.username === myUsername;

  // full game over screen — shown when match is completely finished
  if (isMatchOver) {
    const iWonGame = opponents.every((o) => o.totalChips === 0) || (me.totalChips > 0 && opponents.every((o) => o.totalChips < me.totalChips / opponents.length));
    const actualWinner = me.totalChips > 0
      ? me.username
      : opponents.reduce((best, o) => (o.totalChips > (opponents.find(x => x.username === best)?.totalChips ?? 0) ? o.username : best), opponents[0]?.username ?? "");
    return (
      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-6 z-30 rounded-xl">
        <h2 className="text-3xl font-bold text-white">
          {iWonGame ? "You win the game!" : isGameOver && me.totalChips > 0 ? "You win the game!" : "You have lost!"}
        </h2>
        <p className="text-slate-300">
          Winner: <span className="font-bold text-yellow-400">{isGameOver && me.totalChips > 0 ? me.username : actualWinner}</span>
          {" "}— €{totalChips.toLocaleString()} chips
        </p>
        <Link
          href="/dashboard"
          className="bg-white text-slate-900 font-bold px-8 py-3 rounded-full text-lg hover:bg-slate-200 transition-colors">
          Exit to Dashboard
        </Link>
      </div>
    );
  }

  // single hand result — shown between hands after showdown or fold
  if (snapshot.phase !== "finished" || !handResult) return null;

  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-30 rounded-xl">
      <Image src={iWon ? "/winner.png" : "/loser.png"} alt={iWon ? "Winner" : "Loser"} width={288} height={288} className="object-contain" />
      <h2 className="text-2xl font-bold text-white">
        {iWon ? "You win!" : `${winner?.username ?? "Opponent"} wins!`}
      </h2>
      {winner?.handName && winner.handName !== "Fold" && (
        <p className="text-slate-300 text-lg">{winner.handName}</p>
      )}
      {winner?.handName === "Fold" && (
        <p className="text-slate-300">{iWon ? "Opponent folded" : "You folded"}</p>
      )}
      {iWon && winner?.potWon != null && winner.potWon > 0 && (
        <p className="text-orange-400 font-semibold text-lg">+€{winner.potWon.toLocaleString()}</p>
      )}
      {/* show winner's hole cards after showdown */}
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

// ----------------------------------------------------------------
// DEAL ANIMATION TYPE
// ----------------------------------------------------------------

// describes a single card being animated from the deck to a seat
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

// ----------------------------------------------------------------
// MAIN GAME COMPONENT
// ----------------------------------------------------------------

export default function GameTable({ gameId, username, image }: { gameId: string; username: string; image: string }) {
  const { settings, visuals } = usePokerSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const [eliminated, setEliminated] = useState(false);
  const router = useRouter();

  // ----------------------------------------------------------------
  // DEAL ANIMATION STATE
  // ----------------------------------------------------------------

  const [dealPhase, setDealPhase] = useState<"idle" | "dealing" | "done">("idle");
  const [dealEntries, setDealEntries] = useState<DealEntry[]>([]);
  const [settledCount, setSettledCount] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const lastDealHandRef = useRef<string | null>(null);
  const communityCountRef = useRef(0);
  const [prevCommunityCount, setPrevCommunityCount] = useState(0);

  // refs to ghost card slots — used to calculate where to animate cards to
  const myCardSlotRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const oppCardSlotRefs = useRef<(HTMLDivElement | null)[][]>([
    [null, null],
    [null, null],
  ]);

  // ----------------------------------------------------------------
  // SOCKET SETUP
  // ----------------------------------------------------------------

  useEffect(() => {
    const socket: Socket = io();
    socketRef.current = socket;

    // join the game room as soon as socket connects
    socket.on("connect", () => {
      socket.emit("joinGame", { gameId, username, image });
    });

    // update game state whenever server sends a new snapshot
    socket.on("gameState", (state: GameSnapshot) => {
      setSnapshot(state);
    });

    // show disconnected screen if opponent leaves mid-game
    socket.on("opponentDisconnected", () => {
      setDisconnected(true);
    });

    // show eliminated screen if this player ran out of chips
    socket.on("eliminated", () => {
      setEliminated(true);
    });

    // redirect to dashboard if server rejects this player
    socket.on("error", (err: { message: string }) => {
      if (err.message && err.message.toLowerCase().includes("not authorized")) {
        router.replace("/dashboard");
      } else {
        console.error("Socket error:", err.message);
      }
    });

    // disconnect socket when component unmounts
    return () => {
      socket.disconnect();
    };
  }, [gameId, username, image, router]);

  // ----------------------------------------------------------------
  // DEAL ANIMATION EFFECTS
  // ----------------------------------------------------------------

  // reset deal animation when a hand ends
  useEffect(() => {
    if (snapshot?.phase === "finished" || snapshot?.phase === "gameover") {
      setTimeout(() => {
        setDealPhase("idle");
        setDealEntries([]);
        setSettledCount(0);
        lastDealHandRef.current = null;
      });
    }
  }, [snapshot?.phase]);

  // trigger deal animation at the start of each new preflop hand
  useEffect(() => {
    if (!snapshot || snapshot.phase !== "preflop" || dealPhase !== "idle") return;
    if (!tableRef.current) return;

    const cards = snapshot.me.holeCards.filter(Boolean) as PokerCard[];
    if (cards.length < 2) return;

    // use hole card identity as a hand ID to avoid re-triggering on re-renders
    const handId = cards.map((c) => `${c.rank}${c.suit}`).join("");
    if (handId === lastDealHandRef.current) return;
    lastDealHandRef.current = handId;

    const tableRect = tableRef.current.getBoundingClientRect();
    const w = tableRef.current.offsetWidth;
    const h = tableRef.current.offsetHeight;
    const deckX = w * 0.5;
    const deckY = h * 0.5;

    function slotCenter(el: HTMLDivElement | null, fallbackX: number, fallbackY: number) {
      if (el) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - tableRect.left, y: r.top + r.height / 2 - tableRect.top };
      }
      return { x: fallbackX, y: fallbackY };
    }

    const oppPositions = OPPONENT_POSITIONS[snapshot.opponents.length] ?? OPPONENT_POSITIONS[1];

    const entries: DealEntry[] = [];
    let cardIdx = 0;

    // deal round 1: my first card, then each opponent's first card
    const me0 = slotCenter(myCardSlotRefs.current[0], w * 0.5, h * 0.88);
    entries.push({ id: "me-0", card: cards[0], fromX: deckX, fromY: deckY, toX: me0.x, toY: me0.y, delay: cardIdx++ * DEAL_CARD_INTERVAL, faceUp: true });

    snapshot.opponents.forEach((_, oi) => {
      const [topPct, leftPct] = oppPositions[oi] ?? [12, 50];
      const opp0 = slotCenter(oppCardSlotRefs.current[oi]?.[0] ?? null, w * (leftPct / 100), h * (topPct / 100));
      entries.push({ id: `opp-${oi}-0`, card: PLACEHOLDER_CARD, fromX: deckX, fromY: deckY, toX: opp0.x, toY: opp0.y, delay: cardIdx++ * DEAL_CARD_INTERVAL, faceUp: false });
    });

    // deal round 2: my second card, then each opponent's second card
    const me1 = slotCenter(myCardSlotRefs.current[1], w * 0.5, h * 0.88);
    entries.push({ id: "me-1", card: cards[1], fromX: deckX, fromY: deckY, toX: me1.x, toY: me1.y, delay: cardIdx++ * DEAL_CARD_INTERVAL, faceUp: true });

    snapshot.opponents.forEach((_, oi) => {
      const [topPct, leftPct] = oppPositions[oi] ?? [12, 50];
      const opp1 = slotCenter(oppCardSlotRefs.current[oi]?.[1] ?? null, w * (leftPct / 100), h * (topPct / 100));
      entries.push({ id: `opp-${oi}-1`, card: PLACEHOLDER_CARD, fromX: deckX, fromY: deckY, toX: opp1.x, toY: opp1.y, delay: cardIdx++ * DEAL_CARD_INTERVAL, faceUp: false });
    });

    setDealEntries(entries);
    setSettledCount(0);
    setDealPhase("dealing");
  }, [snapshot, dealPhase]);

  // switch deal phase to "done" once all cards have finished animating
  useEffect(() => {
    if (dealPhase === "dealing" && dealEntries.length > 0 && settledCount >= dealEntries.length) {
      const t = setTimeout(() => setDealPhase("done"), 300);
      return () => clearTimeout(t);
    }
  }, [settledCount, dealEntries.length, dealPhase]);

  // in non-preflop phases cards must always be visible immediately
  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.phase !== "preflop" && dealPhase !== "dealing") {
      setTimeout(() => setDealPhase("done"));
    }
  }, [snapshot, dealPhase]);

  // track community card count to trigger flip animation on new cards
  useEffect(() => {
    setPrevCommunityCount(communityCountRef.current);
    communityCountRef.current = snapshot?.communityCards.length ?? 0;
  }, [snapshot?.communityCards.length]);

  // ----------------------------------------------------------------
  // SOCKET ACTION SENDERS
  // ----------------------------------------------------------------

  function sendAction(action: string, betSize?: number) {
    socketRef.current?.emit("playerAction", { action, betSize });
  }

  function sendNextHand() {
    socketRef.current?.emit("nextHand");
  }

  function sendUseSpecialChip(targetId: string) {
    const targetSeatIndex = parseInt(targetId, 10);
    socketRef.current?.emit("useSpecialChip", { targetSeatIndex });
  }

  // ----------------------------------------------------------------
  // EARLY RETURN SCREENS
  // ----------------------------------------------------------------

  // shown when this player ran out of chips and was eliminated
  if (eliminated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-5xl">💀</div>
          <p className="text-white text-2xl font-bold">You&apos;ve been eliminated!</p>
          <p className="text-slate-400">You ran out of chips.</p>
          <Link href="/dashboard" className="bg-white text-slate-900 font-bold px-6 py-2 rounded-full hover:bg-slate-200 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  //shown when the opponent disconnected mid-game
  if (disconnected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-4">Opponent disconnected</p>
          <Link href="/dashboard" className="bg-white text-slate-900 font-bold px-6 py-2 rounded-full">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // loading spinner shown while waiting for first game state from server
  if (!snapshot) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // ----------------------------------------------------------------
  // DERIVED STATE
  // ----------------------------------------------------------------

  const { me, opponents, communityCards, pot, myTurn, legalActions, phase } = snapshot;
  const isMatchOver = snapshot.isGameOver || me.totalChips === 0 || opponents.every((o) => o.totalChips === 0);
  const totalChipsAll = me.totalChips + opponents.reduce((s, o) => s + o.totalChips, 0);
  const maxBalance = Math.round(totalChipsAll / (opponents.length + 1));

  // how much it costs to call — capped at the player's available stack
  const maxOppBet = opponents.reduce((m, o) => Math.max(m, o.betSize), 0);
  const callAmount = Math.min(me.stack, Math.max(0, maxOppBet - me.betSize));

  // pad community cards to always show 5 slots
  const communitySlots = Array.from({ length: 5 }, (_, i) => communityCards[i] ?? null);
  const oppPositions = OPPONENT_POSITIONS[opponents.length] ?? OPPONENT_POSITIONS[1];

  // name of the opponent currently acting (shown in waiting label)
  const actingOpponent = opponents.find(() => !myTurn && phase !== "finished" && phase !== "gameover");
  const waitingForName = actingOpponent?.username ?? opponents[0]?.username ?? "Opponent";

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------

  return (
    <div className="poker-ui relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
      <p className="fixed top-20 left-4 text-slate-400 text-xs z-50">Room: {gameId}</p>

      {/* Background — either static image or animated variant */}
      {visuals.backgroundVariant === "static" ? (
        <Image
          src="/dark-poker-background-of-spades-and-clubs.jpg"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          loading="eager"
          className="object-cover"
          style={{ filter: visuals.bgFilter, zIndex: 0, transition: "filter 400ms ease" }}
        />
      ) : (
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <PokerBackground variant={visuals.backgroundVariant} />
        </div>
      )}

      {/* vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(255,255,255,0.15) 100%)",
          zIndex: 1,
        }}
      />

      {/* settings gear + drawer */}
      <SettingsGearButton open={drawerOpen} onClick={() => setDrawerOpen((v) => !v)} />
      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="relative flex flex-col items-center w-full">

        {/* phase badge + turn indicator */}
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
              {waitingForName}&apos;s turn
            </span>
          )}
        </div>

        {/* main table container — holds all seats, cards, and the result overlay */}
        <div ref={tableRef} className="relative w-full max-w-4xl aspect-[16/10]" style={{ zIndex: 10 }}>

          {/* table felt image */}
          <Image
            src="/pokertable_no_bg.png"
            alt="Poker table"
            fill
            sizes="(max-width: 1024px) 100vw, 64rem"
            className="object-contain"
            style={{ filter: visuals.tableFilter, transition: "filter 400ms ease" }}
          />

          {/* result overlay — shown after hand ends or game ends */}
          {(snapshot.phase === "finished" || isMatchOver) && (
            <ResultOverlay snapshot={snapshot} myUsername={username} />
          )}

          {/* pot amount + community cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            {pot > 0 && (
              <div className="text-sm text-slate-300 font-medium whitespace-nowrap">
                Pot <span className="font-bold text-orange-400">€{pot.toLocaleString()}</span>
              </div>
            )}
            <div className="flex gap-2">
              {communitySlots.map((card, i) =>
                card ? (
                  <FlipCommunityCard
                    key={i}
                    card={card}
                    delay={Math.max(0, i - prevCommunityCount) * 0.12}
                    cardBackImage={settings.cardBackImage}
                  />
                ) : (
                  <EmptyCommunitySlot key={i} />
                )
              )}
            </div>
          </div>

          {/* opponent seats — positioned absolutely based on player count */}
          {opponents.map((opp, oi) => {
            const [topPct, leftPct] = oppPositions[oi] ?? [12, 50];
            const isOppTurn = !myTurn && phase !== "finished" && phase !== "gameover";
            return (
              <div
                key={opp.seatIndex}
                className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${topPct}%`, left: `${leftPct}%` }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs text-white font-medium">
                    €{opp.stack.toLocaleString()}
                  </div>
                  {opp.betSize > 0 && (
                    <div className="bg-yellow-700/80 px-2 py-0.5 rounded-full text-xs text-yellow-200">
                      bet €{opp.betSize.toLocaleString()}
                    </div>
                  )}
                </div>
                <span className="text-white text-xs font-medium">{opp.username}</span>
                <div className="flex items-center gap-1.5">
                  {opp.isDealer && (
                    <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-900 text-[10px] font-black flex items-center justify-center">D</span>
                  )}
                  <PlayerAvatar
                    src={opp.image}
                    fallback={opp.username}
                    className={`w-10 h-10 rounded-full border-2 ${isOppTurn ? "border-green-400" : "border-slate-400"}`}
                  />
                </div>
                <div className="flex items-end gap-2 mt-1">
                  <ChipStacks balance={opp.totalChips} maxBalance={maxBalance} />
                  <div className="flex gap-1">
                    {/* show actual cards after deal animation, ghost slots during animation */}
                    {dealPhase === "done"
                      ? opp.holeCards.map((card, i) =>
                          card ? <CardFaceUp key={i} card={card} /> : <CardFaceDown key={i} backImage={settings.cardBackImage} />
                        )
                      : [0, 1].map((i) => (
                          <div
                            key={i}
                            ref={(el) => {
                              if (!oppCardSlotRefs.current[oi]) oppCardSlotRefs.current[oi] = [null, null];
                              oppCardSlotRefs.current[oi][i] = el;
                            }}
                            className="w-14 h-20 rounded-md border border-slate-600/30 bg-slate-800/30"
                          />
                        ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* animated cards flying from deck to seats */}
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

          {/* my seat at the bottom of the table */}
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
              <ChipStacks balance={me.totalChips} maxBalance={maxBalance} />
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

        {/* action bar + game controls */}
        <div style={{ position: "relative", zIndex: 60 }}>
          {/* action buttons — only shown when it's my turn */}
          {myTurn && phase !== "finished" && phase !== "gameover" && (
            <ActionBar
              legalActions={legalActions}
              myStack={me.stack}
              pot={pot}
              callAmount={callAmount}
              opponents={opponents}
              onAction={sendAction}
              onUseSpecialChip={sendUseSpecialChip}
              specialChipEnabled={snapshot.specialChip.isEnabled}
              specialChipUsed={snapshot.specialChip.isUsed}
              bannerImage={settings.bannerImage}
            />
          )}

          {/* waiting message — shown when it's the opponent's turn */}
          {!myTurn && phase !== "finished" && phase !== "gameover" && (
            <div className="mt-6 px-8 py-4 text-slate-400 text-sm">
              Waiting for {waitingForName}...
            </div>
          )}

          {/* next hand button — shown after a hand ends but before the game is over */}
          {phase === "finished" && !snapshot.isGameOver && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                onClick={sendNextHand}
                disabled={snapshot.iReadyForNextHand}
                className="bg-white text-slate-900 font-bold px-10 py-3 rounded-full text-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {snapshot.iReadyForNextHand ? "Waiting for others…" : "Next Hand →"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* chat box — fixed to bottom left */}
      <div className="fixed bottom-4 left-4 w-80" style={{ zIndex: 40 }}>
        <Chat username={username} gameId={gameId} />
      </div>
    </div>
  );
}