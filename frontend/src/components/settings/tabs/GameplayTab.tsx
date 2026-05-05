"use client";

import { usePokerSettings } from "@/lib/poker-settings/context";
import { BLIND_PRESETS, STACK_PRESETS } from "@/lib/poker-settings/defaults";
import type { TableSize } from "@/lib/poker-settings/types";
import { ChipPreset } from "../controls/ChipPreset";
import { Segmented } from "../controls/Segmented";

const TABLE_OPTIONS: { value: TableSize; label: string }[] = [
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  // { value: 4, label: "4" },
  // { value: 5, label: "5" },
  // { value: 6, label: "6" },
];

export function GameplayTab() {
  const { settings, update } = usePokerSettings();
  const blindKey = `${settings.blinds.small}/${settings.blinds.big}`;

  return (
    <div className="flex flex-row justify-between pb-3 w-full overflow-hidden">
      <div>
        <label className="text-xs text-slate-300 block mb-1">Table size</label>
        <Segmented
          value={settings.tableSize}
          options={TABLE_OPTIONS}
          onChange={(v) => update({ tableSize: v })}
        />
      </div>

      <div>
        <label className="text-xs text-slate-300 block mb-1">
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
        <label className="text-xs text-slate-300 block mb-1">Starting stack</label>
        <ChipPreset
          value={settings.startingStack}
          options={STACK_PRESETS}
          onChange={(v) => update({ startingStack: v })}
        />
      </div>

      <div>
        <label className="text-xs text-slate-300 block mb-1">Special Chip</label>
        <button
          type="button"
          onClick={() => update({ useSpecialChip: !settings.useSpecialChip })}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.useSpecialChip ? "bg-teal-500" : "bg-slate-600"}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settings.useSpecialChip ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

    </div>
  );
}
