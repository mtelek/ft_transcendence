"use client";

import type { ThemeVisuals } from "@/lib/poker-settings/types";

export function ThemeCard({
  label,
  visuals,
  active,
  onClick,
}: {
  label: string;
  visuals: ThemeVisuals;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden rounded-lg text-left transition-transform hover:scale-[1.03]"
      style={{
        background: visuals.actionBarGradient,
        outline: active ? `2px solid ${visuals.accent}` : "none",
        outlineOffset: "2px",
      }}
    >
      <div className="h-16 w-full" />
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: "rgba(2, 6, 23, 0.75)" }}
      >
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
    </button>
  );
}
