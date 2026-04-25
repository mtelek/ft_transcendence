"use client";

import { memo } from "react";

export function getChipDenominations(startingStack: number): [number, number, number] {
  return [
    Math.round(startingStack * 0.1),
    Math.round(startingStack * 0.05),
    Math.round(startingStack * 0.01),
  ];
}

const CHIPS_PER_STACK = 3;
const CHIP_SIZE = 22;
const CHIP_OFFSET = 5;

interface ChipStackProps {
  startingStack: number;
  chipPalette: readonly [string, string, string, string];
}

export const ChipStack = memo(function ChipStack({ startingStack, chipPalette }: ChipStackProps) {
  const denoms = getChipDenominations(startingStack);
  const stackHeight = CHIP_SIZE + (CHIPS_PER_STACK - 1) * CHIP_OFFSET;

  return (
    <div className="flex gap-1.5 items-end">
      {denoms.map((_, stackIndex) => {
        const color = chipPalette[stackIndex];
        return (
          <div
            key={stackIndex}
            className="relative flex-shrink-0"
            style={{ width: CHIP_SIZE, height: stackHeight }}
          >
            {Array.from({ length: CHIPS_PER_STACK }, (_, chipIndex) => (
              <div
                key={chipIndex}
                style={{
                  position: "absolute",
                  bottom: chipIndex * CHIP_OFFSET,
                  width: CHIP_SIZE,
                  height: CHIP_SIZE,
                  borderRadius: "50%",
                  backgroundColor: color,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)",
                  border: "1px solid rgba(0,0,0,0.3)",
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
});
