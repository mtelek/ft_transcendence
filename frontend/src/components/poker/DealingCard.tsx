"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

type AnyCard = { rank: string; suit: string };

const SUIT_DISPLAY: Record<string, { symbol: string; color: string }> = {
  hearts:   { symbol: "♥", color: "text-red-500" },
  diamonds: { symbol: "♦", color: "text-red-500" },
  clubs:    { symbol: "♣", color: "text-white" },
  spades:   { symbol: "♠", color: "text-white" },
};

function displayCard(card: AnyCard) {
  const rank = card.rank === "T" ? "10" : card.rank;
  const suit = SUIT_DISPLAY[card.suit] ?? { symbol: "?", color: "text-white" };
  return { rank, symbol: suit.symbol, color: suit.color };
}

export type DealingCardProps = {
  card: AnyCard;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
  faceUp: boolean;
  cardBackFilter?: string;
  onSettled?: () => void;
};

export function DealingCard({
  card,
  fromX,
  fromY,
  toX,
  toY,
  delay,
  faceUp,
  cardBackFilter,
  onSettled,
}: DealingCardProps) {
  const [arrived, setArrived] = useState(false);
  const display = displayCard(card);

  const dx = toX - fromX;
  const dy = toY - fromY;

  // All random values are computed once at mount — never change on re-render.
  const tilt    = useMemo(() => (Math.random() - 0.5) * 10, []);
  const jitterX = useMemo(() => (Math.random() - 0.5) * 20, []);
  const jitterY = useMemo(() => (Math.random() - 0.5) * 10, []);

  // The entire animate object is memoized so Framer Motion never sees it change
  // (which would cause it to replay the animation on every re-render).
  const cardAnimate = useMemo(() => ({
    x:       [0, dx * 0.55 + jitterX, dx],
    y:       [0, dy * 0.55 + jitterY, dy],
    rotate:  [0, tilt, 0],   // tilt mid-flight, land straight
    scale:   [0.8, 1.05, 1], // slight overshoot then settle
    opacity: [0, 1, 1],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []); // deps intentionally empty — all inputs are stable after mount

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: fromX - 28,
        top: fromY - 40,
        width: 56,
        height: 80,
        zIndex: 50,
        perspective: 600,
      }}
      initial={{ x: 0, y: 0, rotate: 0, scale: 0.8, opacity: 0 }}
      animate={cardAnimate}
      transition={{ delay, duration: 0.5, ease: "easeOut", times: [0, 0.55, 1] }}
      onAnimationComplete={() => {
        setArrived(true);
        onSettled?.();
      }}
    >
      {/* 3D flip wrapper */}
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          position: "relative",
        }}
        animate={arrived && faceUp ? { rotateY: 180 } : { rotateY: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back face */}
        <img
          src="/card-back-red.png"
          alt=""
          className="absolute w-full h-full rounded-md object-cover shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            ...(cardBackFilter ? { filter: cardBackFilter } : {}),
          }}
        />
        {/* Front face */}
        <div
          className="absolute w-full h-full bg-slate-700 rounded-md border border-slate-500 flex flex-col items-center justify-center shadow-xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <span className="text-sm font-bold text-white leading-none">{display.rank}</span>
          <span className={`text-lg leading-none ${display.color}`}>{display.symbol}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
