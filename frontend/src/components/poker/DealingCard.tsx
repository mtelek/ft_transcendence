"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { getCardImage, getCardBack } from "@/lib/cards";

type AnyCard = { rank: string; suit: string };

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededOffset(seed: string, amplitude: number) {
  const unit = hashSeed(seed) / 4294967295;
  return (unit - 0.5) * amplitude;
}

export type DealingCardProps = {
  card: AnyCard;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
  faceUp: boolean;
  cardBackImage?: string;
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
  cardBackImage = "back01",
  onSettled,
}: DealingCardProps) {
  const [arrived, setArrived] = useState(false);

  const dx = toX - fromX;
  const dy = toY - fromY;

  const seed = `${card.rank}:${card.suit}:${fromX}:${fromY}:${toX}:${toY}:${delay}:${faceUp ? "1" : "0"}`;
  const tilt = useMemo(() => seededOffset(`${seed}:tilt`, 10), [seed]);
  const jitterX = useMemo(() => seededOffset(`${seed}:jx`, 20), [seed]);
  const jitterY = useMemo(() => seededOffset(`${seed}:jy`, 10), [seed]);

  const cardAnimate = useMemo(() => ({
    x:       [0, dx * 0.55 + jitterX, dx],
    y:       [0, dy * 0.55 + jitterY, dy],
    rotate:  [0, tilt, 0],
    scale:   [0.8, 1.05, 1],
    opacity: [0, 1, 1],
  }), [dx, dy, jitterX, jitterY, tilt]);

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
        <div
          className="absolute inset-0 rounded-md overflow-hidden shadow-xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Image
            src={getCardBack(cardBackImage)}
            alt=""
            width={56}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-md overflow-hidden shadow-xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Image
            src={getCardImage(card)}
            alt=""
            width={56}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
