"use client";

import { useState } from "react";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type SpecialChipProps = {
  disabled: boolean;
  isUsed: boolean;
  targets: Array<{
    id: string;
    username: string;
    image?: string;
  }>;
  onUse: (targetId: string) => void;
};

export function SpecialChip({ disabled, isUsed, targets, onUse }: SpecialChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDisabled = disabled || isUsed;

  function handlePick(targetId: string) {
    onUse(targetId);
    setIsOpen(false);
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isUsed ? "Special chip used" : "Use special chip"}
        className="group relative h-14 w-14 rounded-full border-4 border-amber-100 bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-[0_6px_12px_rgba(0,0,0,0.45)] transition-transform disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:scale-105 enabled:active:scale-95"
      >
        <span className="absolute inset-[5px] rounded-full border border-amber-200/80" />
        <span className="absolute inset-[11px] rounded-full border border-amber-200/60" />
        <span className="relative z-10 block text-[10px] font-black tracking-wide text-amber-100">
          {isUsed ? "USED" : "SPECIAL"}
        </span>
      </button>

      {!isDisabled && isOpen && (
        <div className="absolute left-[calc(100%+0.75rem)] top-1/2 z-20 w-52 -translate-y-1/2 rounded-xl border border-slate-600 bg-slate-900/95 p-2 shadow-xl">
          <p className="px-1 pb-2 text-center text-[11px] font-medium text-slate-300">Reveal both cards from:</p>
          <div className="flex flex-col gap-1.5">
            {targets.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => handlePick(target.id)}
                className="flex items-center gap-2 rounded-lg bg-slate-700/80 px-2 py-1.5 text-left text-xs font-semibold text-white transition-colors hover:bg-slate-600"
              >
                <PlayerAvatar
                  src={target.image}
                  fallback={target.username}
                  className="h-7 w-7 rounded-full border border-slate-500"
                />
                <span className="truncate">{target.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
