"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { getCardImage, getCardBack } from "@/lib/cards";

type AnyCard = { rank: string; suit: string };

export function FlipCommunityCard({
  card,
  delay = 0,
  cardBackImage = "back01",
}: {
  card: AnyCard;
  delay?: number;
  cardBackImage?: string;
}) {
  return (
    <div style={{ perspective: 700, width: 56, height: 80 }}>
      <motion.div
        style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", position: "relative" }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        transition={{ duration: 0.5, delay, ease: "easeInOut" }}
      >
        {/* Back face — visible at rotateY 0 */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden shadow-xl"
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
        {/* Front face — visible at rotateY 180 */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden shadow-xl"
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
    </div>
  );
}
