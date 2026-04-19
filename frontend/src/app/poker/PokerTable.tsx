"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, getCardDisplay, DECK } from "@/lib/cards";
import Chat from "@/components/Chat";
import { usePokerSettings } from "@/lib/poker-settings/context";
import { ANIMATION_DURATION_MS } from "@/lib/poker-settings/defaults";
import { SettingsGearButton } from "@/components/settings/SettingsGearButton";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import PokerBackground from "@/components/PokerBackground";
import type { TableSize } from "@/lib/poker-settings/types";

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
};

function buildPlayers(count: TableSize, startingStack: number): Player[] {
  return PLAYER_NAMES.slice(0, count).map((name, i) => ({
    name,
    chips: Math.round(startingStack * STACK_RATIOS[i]),
    cards: [PLAYER_CARDS[i][0], PLAYER_CARDS[i][1]],
    isCurrentPlayer: i === 0,
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
  const display = getCardDisplay(card);
  return (
    <div className="w-14 h-20 bg-slate-700 rounded-md border border-slate-500 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105"
         style={{ transitionDuration: "var(--poker-anim-duration)" }}>
      <span className="text-sm font-bold text-white leading-none">{display.rank}</span>
      <span className={`text-lg leading-none ${display.color}`}>{display.symbol}</span>
    </div>
  );
}

function CardFaceDown({ filter }: { filter: string }) {
  return (
    <img
      src="/card-back-red.png"
      alt="Card back"
      className="w-14 h-20 rounded-md shadow-lg object-cover transition-transform hover:scale-105"
      style={{ filter, transitionDuration: "var(--poker-anim-duration)" }}
    />
  );
}

function CommunityCard({ card }: { card: Card }) {
  const display = getCardDisplay(card);
  return (
    <div className="w-14 h-20 bg-slate-700 rounded-lg border border-slate-500 flex flex-col items-center justify-center shadow-xl transition-transform hover:scale-105"
         style={{ transitionDuration: "var(--poker-anim-duration)" }}>
      <span className="text-lg font-bold text-white leading-none">{display.rank}</span>
      <span className={`text-xl leading-none ${display.color}`}>{display.symbol}</span>
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
  cardBackFilter,
  showTimer,
  timerSeconds,
}: {
  player: Player;
  position: [number, number];
  cardBackFilter: string;
  showTimer: boolean;
  timerSeconds: number;
}) {
  return (
    <div
      className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
      style={{ top: `${position[0]}%`, left: `${position[1]}%` }}
    >
      <div className="flex gap-1">
        {player.isCurrentPlayer
          ? player.cards.map((card, i) => <CardFaceUp key={i} card={card} />)
          : player.cards.map((_, i) => <CardFaceDown key={i} filter={cardBackFilter} />)}
      </div>
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full bg-slate-600 border-2 border-slate-400 flex items-center justify-center text-xs font-bold text-white">
          {player.name[0]}
        </div>
        {showTimer && player.isCurrentPlayer && <TimerRing seconds={timerSeconds} />}
      </div>
      <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs text-white font-medium">
        ${player.chips.toLocaleString()}
      </div>
    </div>
  );
}

export default function PokerTable({ username }: { username: string }) {
  const { settings, visuals } = usePokerSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [betAmount, setBetAmount] = useState(
    Math.max(settings.blinds.small * 10, 100),
  );

  const players = useMemo(
    () => buildPlayers(settings.tableSize, settings.startingStack),
    [settings.tableSize, settings.startingStack],
  );
  const positions = SEAT_POSITIONS[settings.tableSize];
  const pot = Math.round(settings.startingStack * 0.69 * players.length / 6);

  const step = settings.blinds.small;
  const animDurationMs = ANIMATION_DURATION_MS[settings.animationSpeed];
  const timerSeconds = settings.timer === "off" ? 0 : settings.timer;

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4"
      style={{ ["--poker-anim-duration" as string]: `${animDurationMs}ms` }}
    >
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
        <div className="relative w-full max-w-4xl aspect-[16/10]">
          <img
            src="/pokertable_no_bg.png"
            alt="Poker table"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: visuals.tableFilter, transition: "filter 400ms ease" }}
          />

          <div
            className="absolute top-[30%] left-1/2 -translate-x-1/2 text-sm text-slate-300 font-medium"
          >
            Pot{" "}
            <span className="font-bold" style={{ color: visuals.accent }}>
              ${pot.toLocaleString()}
            </span>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
            {COMMUNITY_CARDS.map((card, i) => (
              <CommunityCard key={i} card={card} />
            ))}
          </div>

          {players.map((player, i) => (
            <PlayerSeat
              key={i}
              player={player}
              position={positions[i]}
              cardBackFilter={visuals.cardBackFilter}
              showTimer={settings.timer !== "off"}
              timerSeconds={timerSeconds}
            />
          ))}
        </div>

        <div
          className="flex items-center gap-3 mt-6 px-8 py-4 rounded-2xl shadow-2xl"
          style={{
            background: visuals.actionBarGradient,
            boxShadow: "0 4px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,150,0.2), inset 0 -2px 4px rgba(0,0,0,0.4)",
            border: `2px solid ${visuals.frameColor}`,
            transition: "background 400ms ease, border-color 400ms ease",
          }}
        >
          <div className="flex flex-col gap-1">
            <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">Min</button>
            <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">1/2</button>
            <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">Call</button>
          </div>

          <button
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-full text-lg transition-colors"
          >
            FOLD
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBetAmount(Math.max(0, betAmount - step))}
              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className="text-white font-bold text-xl min-w-[80px] text-center">
              ${betAmount.toLocaleString()}
            </span>
            <button
              onClick={() => setBetAmount(betAmount + step)}
              className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 text-white font-bold flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>

          <button
            className="font-bold px-8 py-3 rounded-full text-lg transition-colors text-slate-900"
            style={{ background: visuals.accent }}
          >
            RAISE
          </button>

          <div className="flex flex-col gap-1">
            <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">Max</button>
            <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">POT</button>
            <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">Check</button>
          </div>
        </div>

        <p className="text-slate-500 text-xs mt-4">
          ft_transcendence | Room 42 | Seats {settings.tableSize} | Blinds ${settings.blinds.small}/${settings.blinds.big}
        </p>
      </div>

      <div className="fixed bottom-4 left-4 w-80 z-50">
        <Chat username={username} />
      </div>
    </div>
  );
}
