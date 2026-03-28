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
    <div className="w-14 h-20 bg-red-400 rounded-md border border-red-300 shadow-lg" />
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

export default function PokerTable({ username }: { username: string }) {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 6>(6);
  const [betAmount, setBetAmount] = useState(750);

  const players = getDemoPlayers(playerCount);
  const positions = SEAT_POSITIONS[playerCount];
  const pot = 69420;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900 flex flex-col items-center justify-center p-4">
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
        {/* Outer table border */}
        <div className="absolute inset-0 bg-slate-700 rounded-[50%] shadow-2xl shadow-black/50" />
        {/* Inner table felt */}
        <div className="absolute inset-[6%] bg-slate-800 rounded-[50%] border-2 border-slate-600" />
        {/* Inner felt surface */}
        <div className="absolute inset-[10%] bg-slate-750 rounded-[50%]" style={{ backgroundColor: "#3a4a5c" }} />

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
      <div className="flex items-center gap-3 mt-6">
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

      {/* Chat */}
      <div className="fixed bottom-4 left-4 w-80 z-50">
        <Chat username={username} />
      </div>
    </div>
  );
}
