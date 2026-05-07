"use client";

import { memo, useMemo } from "react";
import Image from "next/image";

type ChipStackData = { id: number; chips: number };

const CHIP_W = 21;
const CHIP_H = 21;
const CHIP_OVERLAP = 7;
const STACK_HEIGHT = CHIP_OVERLAP * 2 + CHIP_H;

const STACK_IMAGES = ["/chips/chips3.png", "/chips/chips4.png", "/chips/chips7.png"];

function getChipDistribution(balance: number, maxBalance: number): ChipStackData[] {
  const ratio = maxBalance > 0 ? Math.min(1, Math.max(0, balance / maxBalance)) : 0;
  const total = Math.round(ratio * 9);
  const s0 = Math.ceil(total / 3);
  const s1 = Math.ceil(Math.max(0, total - s0) / 2);
  const s2 = total - s0 - s1;
  return [
    { id: 0, chips: s0 },
    { id: 1, chips: s1 },
    { id: 2, chips: s2 },
  ];
}

function SingleStack({ count, image }: { count: number; image: string }) {
  return (
    <div className="relative" style={{ width: CHIP_W, height: STACK_HEIGHT }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute"
          style={{
            bottom: i * CHIP_OVERLAP,
            left: 0,
            opacity: i < count ? 1 : 0,
            transform: i < count ? "scale(1)" : "scale(0.85)",
            transition: "opacity 300ms ease, transform 300ms ease",
            pointerEvents: "none",
          }}
        >
          <Image
            src={image}
            alt=""
            width={CHIP_W}
            height={CHIP_H}
            unoptimized
            style={{ display: "block" }}
          />
        </div>
      ))}
    </div>
  );
}

interface ChipStacksProps {
  balance: number;
  maxBalance: number;
}

export const ChipStacks = memo(function ChipStacks({ balance, maxBalance }: ChipStacksProps) {
  const stacks = useMemo(
    () => getChipDistribution(balance, maxBalance),
    [balance, maxBalance]
  );

  return (
    <div className="flex items-end gap-1.5">
      {stacks.map((stack, i) => (
        <SingleStack key={stack.id} count={stack.chips} image={STACK_IMAGES[i]} />
      ))}
    </div>
  );
});
