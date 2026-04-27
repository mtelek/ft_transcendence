"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Card, DECK, getCardImage, getCardBack } from "@/lib/cards";
import Chat from "@/components/Chat";
import { usePokerSettings } from "@/lib/poker-settings/context";
import { ANIMATION_DURATION_MS } from "@/lib/poker-settings/defaults";
import { SettingsGearButton } from "@/components/settings/SettingsGearButton";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import PokerBackground from "@/components/PokerBackground";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ChipStacks } from "@/components/ChipStack";
import type { TableSize } from "@/lib/poker-settings/types";
import { DealingCard } from "@/components/poker/DealingCard";
import { FlipCommunityCard } from "@/components/poker/FlipCommunityCard";

const COMMUNITY_CARDS: Card[] = [
  DECK[6],
  DECK[24],
  DECK[22],
  DECK[21],
  DECK[38],
];

const PLAYER_NAMES = ["You", "Matthias", "Kevin", "Tom", "Marton", "Iberogast"];
const STACK_RATIOS = [1, 0.7, 0.26, 0.42, 0.85, 0.54];
const PLAYER_CARDS: Array<[Card, Card]> = [
  [DECK[11], DECK[25]],
  [DECK[0], DECK[13]],
  [DECK[2], DECK[15]],
  [DECK[4], DECK[17]],
  [DECK[7], DECK[20]],
  [DECK[9], DECK[35]],
];

type Player = {
  name: string;
  chips: number;
  cards: Card[];
  isCurrentPlayer: boolean;
  image: string;
};

const MOCK_AVATARS = [
  "/avatars/gentleman.jpg",
  "/avatars/lady.jpg",
  "/avatars/king_red.jpg",
  "/avatars/queen_black.jpg",
  "/avatars/funny_black.jpg",
];

function buildPlayers(count: TableSize, startingStack: number, myImage: string): Player[] {
  return PLAYER_NAMES.slice(0, count).map((name, i) => ({
    name,
    chips: Math.round(startingStack * STACK_RATIOS[i]),
    cards: [PLAYER_CARDS[i][0], PLAYER_CARDS[i][1]],
    isCurrentPlayer: i === 0,
    image: i === 0 ? myImage : MOCK_AVATARS[(i - 1) % MOCK_AVATARS.length],
  }));
}

const SEAT_POSITIONS: Record<TableSize, [number, number][]> = {
  2: [
    [85, 50],
    [5, 50],
  ],
  3: [
    [85, 50],
    [5, 30],
    [5, 70],
  ],
  6: [
    [85, 50],
    [5, 25],
    [5, 50],
    [5, 75],
    [45, 95],
    [45, 5],
  ],
};

function CardFaceUp({ card }: { card: Card }) {
  return (
    <div className="w-14 h-20 rounded-md overflow-hidden shadow-lg transition-transform hover:scale-105"
         style={{ transitionDuration: "var(--poker-anim-duration)" }}>
      <Image src={getCardImage(card)} alt="" width={56} height={80} className="w-full h-full object-cover" />
    </div>
  );
}

function CardFaceDown({ backImage }: { backImage: string }) {
  return (
    <div className="w-14 h-20 rounded-md overflow-hidden shadow-lg transition-transform hover:scale-105"
         style={{ transitionDuration: "var(--poker-anim-duration)" }}>
      <Image src={getCardBack(backImage)} alt="Card back" width={56} height={80} className="w-full h-full object-cover" />
    </div>
  );
}

function CommunityCard({ card }: { card: Card }) {
  return (
    <div className="w-14 h-20 rounded-lg overflow-hidden shadow-xl transition-transform hover:scale-105"
         style={{ transitionDuration: "var(--poker-anim-duration)" }}>
      <Image src={getCardImage(card)} alt="" width={56} height={80} className="w-full h-full object-cover" />
    </div>
  );
}

function TimerRing({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = seconds - (elapsed % seconds);
      setRemaining(Math.max(0, left));
    }, 100);
    return () => window.clearInterval(id);
  }, [seconds]);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - remaining / seconds);

  return (
    <svg
      className="absolute inset-0 -m-1 pointer-events-none"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
      />
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke="#34d399"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 24 24)"
        style={{ transition: "stroke-dashoffset 100ms linear" }}
      />
    </svg>
  );
}

function PlayerSeat({
  player,
  position,
  cardBackImage,
  showTimer,
  timerSeconds,
  showCards,
  maxBalance,
  getCardSlotRef,
}: {
  player: Player;
  position: [number, number];
  cardBackImage: string;
  showTimer: boolean;
  timerSeconds: number;
  showCards: boolean;
  maxBalance: number;
  getCardSlotRef?: (cardIndex: number) => (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
      style={{ top: `${position[0]}%`, left: `${position[1]}%` }}
    >
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          {showCards
            ? player.isCurrentPlayer
              ? player.cards.map((card, i) => <CardFaceUp key={i} card={card} />)
              : player.cards.map((_, i) => <CardFaceDown key={i} backImage={cardBackImage} />)
            : player.cards.map((_, i) => (
                <div
                  key={i}
                  ref={getCardSlotRef?.(i)}
                  className="w-14 h-20 rounded-md border border-slate-600/30 bg-slate-800/30"
                />
              ))}
        </div>
        <ChipStacks balance={player.chips} maxBalance={maxBalance} />
      </div>
      <div className="relative w-10 h-10">
        <PlayerAvatar
          src={player.image}
          fallback={player.name}
          className="w-10 h-10 rounded-full border-2 border-slate-400"
        />
        {showTimer && player.isCurrentPlayer && <TimerRing seconds={timerSeconds} />}
      </div>
      <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs text-white font-medium">
        €{player.chips.toLocaleString()}
      </div>
    </div>
  );
}

type DealEntry = {
  id: string;
  card: Card;
  playerIndex: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
  faceUp: boolean;
};

type DealPhase = "idle" | "dealing" | "done";

const DEAL_CARD_INTERVAL = 0.2; // seconds between each card

export default function PokerTable({ username }: { username: string }) {
  const { settings, visuals } = usePokerSettings();
  const { data: session } = useSession();
  const myImage = session?.user?.image ?? "/avatars/funny_white.jpg";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [betAmount, setBetAmount] = useState(
    Math.max(settings.blinds.small * 10, 100),
  );
  const [isEditingBet, setIsEditingBet] = useState(false);
  const [editBetValue, setEditBetValue] = useState("");

  // Dealing animation state
  const [dealPhase, setDealPhase] = useState<DealPhase>("idle");
  const [dealEntries, setDealEntries] = useState<DealEntry[]>([]);
  const [settledCount, setSettledCount] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  // Flat array of ghost card slot refs: index = playerIndex * 2 + cardIndex
  const cardSlotRefs = useRef<(HTMLDivElement | null)[]>(new Array(12).fill(null));

  const players = useMemo(
    () => buildPlayers(settings.tableSize, settings.startingStack, myImage),
    [settings.tableSize, settings.startingStack, myImage],
  );
  const positions = SEAT_POSITIONS[settings.tableSize];
  const pot = Math.round(settings.startingStack * 0.69 * players.length / 6);

  // When all cards have settled, transition to done after a short pause
  useEffect(() => {
    if (dealPhase === "dealing" && dealEntries.length > 0 && settledCount >= dealEntries.length) {
      const t = setTimeout(() => setDealPhase("done"), 300);
      return () => clearTimeout(t);
    }
  }, [settledCount, dealEntries.length, dealPhase]);

  // Reset deal state when table size or players change
  useEffect(() => {
    setDealPhase("idle");
    setDealEntries([]);
    setSettledCount(0);
  }, [settings.tableSize]);

  const startDealing = useCallback(() => {
    if (!tableRef.current || dealPhase !== "idle") return;

    const tableRect = tableRef.current.getBoundingClientRect();
    const deckX = tableRef.current.offsetWidth * 0.5;
    const deckY = tableRef.current.offsetHeight * 0.5;

    // Measure the exact center of each ghost card slot relative to the table container
    function slotCenter(pi: number, ci: number): { x: number; y: number } {
      const el = cardSlotRefs.current[pi * 2 + ci];
      if (el) {
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - tableRect.left,
          y: r.top + r.height / 2 - tableRect.top,
        };
      }
      // Fallback: seat percentage center
      const [top, left] = SEAT_POSITIONS[settings.tableSize][pi];
      return {
        x: tableRef.current!.offsetWidth * (left / 100),
        y: tableRef.current!.offsetHeight * (top / 100),
      };
    }

    const entries: DealEntry[] = [];
    let cardIndex = 0;
    for (let round = 0; round < 2; round++) {
      for (let pi = 0; pi < players.length; pi++) {
        const { x: toX, y: toY } = slotCenter(pi, round);
        entries.push({
          id: `${pi}-${round}`,
          card: players[pi].cards[round],
          playerIndex: pi,
          fromX: deckX,
          fromY: deckY,
          toX,
          toY,
          delay: cardIndex * DEAL_CARD_INTERVAL,
          faceUp: players[pi].isCurrentPlayer,
        });
        cardIndex++;
      }
    }

    setDealEntries(entries);
    setSettledCount(0);
    setDealPhase("dealing");
  }, [dealPhase, players, settings.tableSize]);

  const resetDeal = useCallback(() => {
    setDealPhase("idle");
    setDealEntries([]);
    setSettledCount(0);
  }, []);

  const step = settings.blinds.small;
  const animDurationMs = ANIMATION_DURATION_MS[settings.animationSpeed];
  const timerSeconds = settings.timer === "off" ? 0 : settings.timer;

  return (
    <div
      className="poker-ui relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4"
      style={{ ["--poker-anim-duration" as string]: `${animDurationMs}ms` }}
    >
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
        <div ref={tableRef} className="relative w-full max-w-4xl aspect-[16/10]">
          <img
            src="/pokertable_no_bg.png"
            alt="Poker table"
            fill
            className="object-contain"
            style={{ filter: visuals.tableFilter, transition: "filter 400ms ease" }}
          />

          <div
            className="absolute top-[30%] left-1/2 -translate-x-1/2 text-sm text-slate-300 font-medium"
          >
            Pot{" "}
            <span className="font-bold" style={{ color: visuals.accent }}>
              €{pot.toLocaleString()}
            </span>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
            {COMMUNITY_CARDS.map((card, i) => (
              <FlipCommunityCard
                key={i}
                card={card}
                delay={i * 0.12}
                cardBackImage={settings.cardBackImage}
              />
            ))}
          </div>

          {players.map((player, pi) => (
            <PlayerSeat
              key={pi}
              player={player}
              position={positions[pi]}
              cardBackImage={settings.cardBackImage}
              showTimer={settings.timer !== "off"}
              timerSeconds={timerSeconds}
              showCards={dealPhase === "done"}
              maxBalance={settings.startingStack}
              getCardSlotRef={(ci) => (el) => { cardSlotRefs.current[pi * 2 + ci] = el; }}
            />
          ))}

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
        </div>

        {/* Deal / Re-deal controls */}
        <div className="flex gap-3 mt-4">
          {dealPhase === "idle" && (
            <button
              onClick={startDealing}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-6 py-2 rounded-full text-sm transition-colors shadow-lg"
            >
              Deal Cards
            </button>
          )}
          {dealPhase === "done" && (
            <button
              onClick={resetDeal}
              className="bg-slate-600 hover:bg-slate-500 text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors"
            >
              Re-deal
            </button>
          )}
        </div>

        <div
          className="flex flex-col gap-3 mt-6"
          style={{
            backgroundImage: `url('${settings.bannerImage}')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            paddingTop: "20px",
            paddingBottom: "20px",
            paddingLeft: "80px",
            paddingRight: "80px",
            marginTop: "30px",
            marginBottom: "10px",
          }}
        >
          {/* Top row: preset chips (left) + slider (right) */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button onClick={() => setBetAmount(settings.blinds.big * 2)} className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600 transition-colors">Min</button>
              <button onClick={() => setBetAmount(Math.round(pot / 2))} className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600 transition-colors">½ Pot</button>
              <button onClick={() => setBetAmount(pot)} className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600 transition-colors">Pot</button>
              <button onClick={() => setBetAmount(settings.startingStack)} className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600 transition-colors">Max</button>
            </div>
            <input
              type="range"
              min={0}
              max={settings.startingStack}
              step={step}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-36 accent-lime-400 cursor-pointer"
            />
          </div>

          {/* Primary action buttons — equal height via items-stretch */}
          <div className="flex items-stretch gap-3">
            <button className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full text-lg transition-colors">
              FOLD
            </button>
            <button className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full text-lg transition-colors">
              CALL
            </button>
            <button className="flex-1 flex flex-col items-center justify-center bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold px-8 py-3 rounded-full text-lg transition-colors">
              <span className="leading-none">BET</span>
              {isEditingBet ? (
                <input
                  type="number"
                  className="mt-1 text-slate-900 font-semibold text-sm bg-transparent border-b border-slate-900/40 text-center w-[4.5rem] outline-none leading-none tabular-nums"
                  value={editBetValue}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditBetValue(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(editBetValue, 10);
                    if (!isNaN(parsed)) setBetAmount(Math.max(0, Math.min(settings.startingStack, parsed)));
                    setIsEditingBet(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur();
                  }}
                />
              ) : (
                <span
                  className="mt-1 text-sm font-semibold leading-none cursor-pointer hover:underline inline-block w-[4.5rem] text-center tabular-nums"
                  onClick={(e) => { e.stopPropagation(); setEditBetValue(String(betAmount)); setIsEditingBet(true); }}
                >
                  €{betAmount.toLocaleString()}
                </span>
              )}
            </button>
          </div>
        </div>

        <p className="text-slate-500 text-xs mt-4">
          ft_transcendence | Room 42 | Seats {settings.tableSize} | Blinds €{settings.blinds.small}/€{settings.blinds.big}
        </p>
      </div>

      <div className="fixed bottom-4 left-4 w-80 z-50">
        <Chat username={username} />
      </div>
    </div>
  );
}
