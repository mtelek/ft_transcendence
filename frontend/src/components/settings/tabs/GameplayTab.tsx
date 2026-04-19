"use client";

import { usePokerSettings } from "@/lib/poker-settings/context";
import { BLIND_PRESETS, STACK_PRESETS } from "@/lib/poker-settings/defaults";
import type { AnimationSpeed, TableSize, TimerOption } from "@/lib/poker-settings/types";
import { ChipPreset } from "../controls/ChipPreset";
import { Segmented } from "../controls/Segmented";

const TABLE_OPTIONS: { value: TableSize; label: string }[] = [
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 6, label: "6" },
];

const TIMER_OPTIONS: { value: TimerOption; label: string }[] = [
  { value: "off", label: "Off" },
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
];

const SPEED_OPTIONS: { value: AnimationSpeed; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

export function GameplayTab() {
  const { settings, update } = usePokerSettings();
  const blindKey = `${settings.blinds.small}/${settings.blinds.big}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-xs text-slate-300 block mb-2">Table size</label>
        <Segmented
          value={settings.tableSize}
          options={TABLE_OPTIONS}
          onChange={(v) => update({ tableSize: v })}
        />
      </div>

      <div>
        <label className="text-xs text-slate-300 block mb-2">
          Blinds (small / big)
        </label>
        <Segmented
          value={blindKey}
          options={BLIND_PRESETS.map((b) => ({
            value: `${b.small}/${b.big}`,
            label: `${b.small}/${b.big}`,
          }))}
          onChange={(v) => {
            const [s, b] = v.split("/").map(Number);
            update({ blinds: { small: s, big: b } });
          }}
        />
      </div>

      <div>
        <label className="text-xs text-slate-300 block mb-2">Starting stack</label>
        <ChipPreset
          value={settings.startingStack}
          options={STACK_PRESETS}
          onChange={(v) => update({ startingStack: v })}
        />
      </div>

      <div>
        <label className="text-xs text-slate-300 block mb-2">Action timer</label>
        <Segmented
          value={settings.timer}
          options={TIMER_OPTIONS}
          onChange={(v) => update({ timer: v })}
        />
        <p className="text-[10px] text-slate-500 mt-2">
          Shows a countdown ring around the active seat.
        </p>
      </div>

      <div>
        <label className="text-xs text-slate-300 block mb-2">
          Animation speed
        </label>
        <Segmented
          value={settings.animationSpeed}
          options={SPEED_OPTIONS}
          onChange={(v) => update({ animationSpeed: v })}
        />
      </div>
    </div>
  );
}
