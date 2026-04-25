"use client";

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

export function FlipCommunityCard({
  card,
  delay = 0,
  cardBackFilter,
}: {
  card: AnyCard;
  delay?: number;
  cardBackFilter?: string;
}) {
  const { rank, symbol, color } = displayCard(card);

  return (
    // Perspective wrapper — required for the 3D flip to look correct
    <div style={{ perspective: 700, width: 56, height: 80 }}>
      <motion.div
        style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", position: "relative" }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        transition={{ duration: 0.5, delay, ease: "easeInOut" }}
      >
        {/* Back face — visible at rotateY 0 */}
        <img
          src="/card-back-red.png"
          alt=""
          className="absolute w-full h-full rounded-lg object-cover shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            ...(cardBackFilter ? { filter: cardBackFilter } : {}),
          }}
        />
        {/* Front face — visible at rotateY 180 (rotateY(180deg) cancels the container's 180) */}
        <div
          className="absolute w-full h-full bg-slate-700 rounded-lg border border-slate-500 flex flex-col items-center justify-center shadow-xl select-none"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <span className="text-lg font-bold text-white leading-none">{rank}</span>
          <span className={`text-xl leading-none ${color}`}>{symbol}</span>
        </div>
      </motion.div>
    </div>
  );
}
