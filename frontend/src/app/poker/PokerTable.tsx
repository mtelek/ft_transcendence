"use client";

import { useState } from "react";
import { Card, getCardDisplay, DECK } from "@/lib/cards";
import Chat from "@/components/Chat";

// Demo cards
const COMMUNITY_CARDS: Card[] = [
  DECK[6],  // 8♥
  DECK[24], // Q♣
  DECK[22], // J♦
  DECK[21], // 10♦
  DECK[38], // A♠
];

type Player = {
  name: string;
  chips: number;
  cards: Card[];
  isCurrentPlayer: boolean;
};

function getDemoPlayers(count: 2 | 3 | 6): Player[] {
  const all: Player[] = [
    { name: "You", chips: 12500, cards: [DECK[11], DECK[25]], isCurrentPlayer: true },
    { name: "Matthias", chips: 8600, cards: [DECK[0], DECK[13]], isCurrentPlayer: false },
    { name: "Kevin", chips: 3250, cards: [DECK[2], DECK[15]], isCurrentPlayer: false },
    { name: "Tom", chips: 5200, cards: [DECK[4], DECK[17]], isCurrentPlayer: false },
    { name: "Marton", chips: 10550, cards: [DECK[7], DECK[20]], isCurrentPlayer: false },
    { name: "Iberogast", chips: 6750, cards: [DECK[9], DECK[35]], isCurrentPlayer: false },
  ];
  return all.slice(0, count);
}

// Seat positions around the table for each player count
// Values are percentage-based [top%, left%] from the table container
const SEAT_POSITIONS: Record<2 | 3 | 6, [number, number][]> = {
  2: [
    [85, 50], // bottom center (You)
    [5, 50],  // top center
  ],
  3: [
    [85, 50],  // bottom center (You)
    [5, 30],   // top left
    [5, 70],   // top right
  ],
  6: [
    [85, 50],  // bottom center (You)
    [5, 25],   // top left
    [5, 50],   // top center
    [5, 75],   // top right
    [45, 95],  // right
    [45, 5],   // left
  ],
};

function CardFaceUp({ card }: { card: Card }) {
  const display = getCardDisplay(card);
  return (
    <div className="w-14 h-20 bg-slate-700 rounded-md border border-slate-500 flex flex-col items-center justify-center shadow-lg">
      <span className="text-sm font-bold text-white leading-none">{display.rank}</span>
      <span className={`text-lg leading-none ${display.color}`}>{display.symbol}</span>
    </div>
  );
}

function CardFaceDown() {
  return (
    <img
      src="/card-back-red.png"
      alt="Card back"
      className="w-14 h-20 rounded-md shadow-lg object-cover"
    />
  );
}

function CommunityCard({ card }: { card: Card }) {
  const display = getCardDisplay(card);
  return (
    <div className="w-14 h-20 bg-slate-700 rounded-lg border border-slate-500 flex flex-col items-center justify-center shadow-xl">
      <span className="text-lg font-bold text-white leading-none">{display.rank}</span>
      <span className={`text-xl leading-none ${display.color}`}>{display.symbol}</span>
    </div>
  );
}

function PlayerSeat({ player, position }: { player: Player; position: [number, number] }) {
  return (
    <div
      className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
      style={{ top: `${position[0]}%`, left: `${position[1]}%` }}
    >
      {/* Cards */}
      <div className="flex gap-1">
        {player.isCurrentPlayer ? (
          player.cards.map((card, i) => <CardFaceUp key={i} card={card} />)
        ) : (
          player.cards.map((_, i) => <CardFaceDown key={i} />)
        )}
      </div>
      {/* Avatar + name */}
      <div className="w-10 h-10 rounded-full bg-slate-600 border-2 border-slate-400 flex items-center justify-center text-xs font-bold text-white">
        {player.name[0]}
      </div>
      {/* Chip count */}
      <div className="bg-slate-900/80 px-3 py-0.5 rounded-full text-xs text-white font-medium">
        ${player.chips.toLocaleString()}
      </div>
    </div>
  );
}

type BgColor = "green" | "red" | "blue" | "brown" | "white" | "yellow";

const BG_FILTERS: Record<BgColor, string> = {
  green:  "sepia(1) hue-rotate(90deg) saturate(2) brightness(0.6)",
  red:    "sepia(1) hue-rotate(335deg) saturate(5) brightness(0.55)",
  blue:   "sepia(1) hue-rotate(190deg) saturate(3) brightness(0.6)",
  brown:  "sepia(1) saturate(1.5) brightness(0.55)",
  white:  "grayscale(1) brightness(1.4)",
  yellow: "sepia(1) hue-rotate(30deg) saturate(3) brightness(0.75)",
};

const BG_SWATCHES: Record<BgColor, string> = {
  green:  "#2d7a3a",
  red:    "#b02020",
  blue:   "#1e4fa0",
  brown:  "#7a4a1e",
  white:  "#d0d0d0",
  yellow: "#c8a800",
};

export default function PokerTable({ username }: { username: string }) {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 6>(6);
  const [betAmount, setBetAmount] = useState(750);
  const [bgColor, setBgColor] = useState<BgColor>("green");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const players = getDemoPlayers(playerCount);
  const positions = SEAT_POSITIONS[playerCount];
  const pot = 69420;

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4"
      /* Original SVG background (deactivated):
      style={{
        backgroundColor: "#1a3a2a",
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>` +
          `<style>text{font-size:26px;fill:%231f4a35;opacity:0.5;text-anchor:middle;dominant-baseline:central;font-family:serif}</style>` +
          `<text x='20' y='20'>♠</text><text x='60' y='20'>♥</text><text x='100' y='20'>♦</text><text x='140' y='20'>♣</text>` +
          `<text x='0' y='60'>♠</text><text x='40' y='60'>♥</text><text x='80' y='60'>♦</text><text x='120' y='60'>♣</text><text x='160' y='60'>♠</text>` +
          `<text x='20' y='100'>♦</text><text x='60' y='100'>♣</text><text x='100' y='100'>♠</text><text x='140' y='100'>♥</text>` +
          `<text x='0' y='140'>♦</text><text x='40' y='140'>♣</text><text x='80' y='140'>♠</text><text x='120' y='140'>♥</text><text x='160' y='140'>♦</text>` +
          `</svg>`
        )}")`,
        backgroundSize: "160px 160px",
      }}
      */
    >
      {/* Green image background */}
      <img
        src="/dark-poker-background-of-spades-and-clubs.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: BG_FILTERS[bgColor], zIndex: 0 }}
      />
      {/* Reverse vignette: brighten edges, darken center */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(255,255,255,0.15) 100%)",
          zIndex: 1,
        }}
      />
      {/* Content above background */}
      <div className="relative z-10 flex flex-col items-center w-full">

      {/* Color picker — fixed below header */}
      <div className="fixed top-[72px] left-4 z-20">
        <button
          onClick={() => setShowColorPicker(v => !v)}
          className="w-8 h-8 rounded-full border-2 border-white/60 shadow-lg transition-transform hover:scale-110"
          style={{ background: BG_SWATCHES[bgColor] }}
          title="Change table color"
        />
        {showColorPicker && (
          <div className="absolute top-10 left-0 flex flex-col gap-2 bg-black/70 backdrop-blur-sm p-2 rounded-xl shadow-xl">
            {(Object.keys(BG_SWATCHES) as BgColor[]).map(color => (
              <button
                key={color}
                onClick={() => { setBgColor(color); setShowColorPicker(false); }}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="w-5 h-5 rounded-full border-2 border-white/40 flex-shrink-0" style={{ background: BG_SWATCHES[color] }} />
                <span className="text-white text-xs capitalize">{color}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Player count selector */}
      <div className="flex gap-2 mb-4">
        {([2, 3, 6] as const).map((count) => (
          <button
            key={count}
            onClick={() => setPlayerCount(count)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              playerCount === count
                ? "bg-white text-slate-900"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {count} Players
          </button>
        ))}
      </div>
      <br></br><br></br>
      {/* Table container */}
      <div className="relative w-full max-w-4xl aspect-[16/10]">
        {/* Poker table image */}
        <img
          src="/pokertable_no_bg.png"
          alt="Poker table"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Pot display */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 text-sm text-slate-300 font-medium">
          Pot <span className="text-green-400 font-bold">${pot.toLocaleString()}</span>
        </div>

        {/* Community cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
          {COMMUNITY_CARDS.map((card, i) => (
            <CommunityCard key={i} card={card} />
          ))}
        </div>

        {/* Player seats */}
        {players.map((player, i) => (
          <PlayerSeat key={i} player={player} position={positions[i]} />
        ))}
      </div>

      {/* Action bar */}
      <div
        className="flex items-center gap-3 mt-6 px-8 py-4 rounded-2xl shadow-2xl"
        style={{
          background: "linear-gradient(180deg, #8B5E3C 0%, #6B3F1F 30%, #7A4A28 70%, #5C3317 100%)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,150,0.2), inset 0 -2px 4px rgba(0,0,0,0.4)",
          border: "2px solid #3d1f0a",
        }}
      >
        {/* Quick bet buttons left */}
        <div className="flex flex-col gap-1">
          <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">Min</button>
          <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">1/2</button>
          <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">Call</button>
        </div>

        {/* Fold button */}
        <button className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-full text-lg transition-colors">
          FOLD
        </button>

        {/* Bet amount */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBetAmount(Math.max(0, betAmount - 250))}
            className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center transition-colors"
          >
            -
          </button>
          <span className="text-white font-bold text-xl min-w-[80px] text-center">
            ${betAmount.toLocaleString()}
          </span>
          <button
            onClick={() => setBetAmount(betAmount + 250)}
            className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 text-white font-bold flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>

        {/* Raise button */}
        <button className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold px-8 py-3 rounded-full text-lg transition-colors">
          RAISE
        </button>

        {/* Quick bet buttons right */}
        <div className="flex flex-col gap-1">
          <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">Max</button>
          <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">POT</button>
          <button className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded hover:bg-slate-600">Check</button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-slate-500 text-xs mt-4">
        ft_transcendence | Room 42 | Seats {playerCount}
      </p>

      </div>{/* end z-10 content wrapper */}

      {/* Chat */}
      <div className="fixed bottom-4 left-4 w-80 z-50">
        <Chat username={username} />
      </div>
    </div>
  );
}
