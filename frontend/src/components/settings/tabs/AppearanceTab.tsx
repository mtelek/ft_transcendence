"use client";

import { usePokerSettings } from "@/lib/poker-settings/context";
import {
  ACCENT_LABELS,
  ACCENT_SWATCHES,
  CARD_BACK_LABELS,
  FELT_LABELS,
  FELT_SWATCHES,
  PRESETS,
  PRESET_LABELS,
  resolveCustom,
} from "@/lib/poker-settings/presets";
import type {
  AccentStyle,
  BgVariant,
  CardBackStyle,
  FeltStyle,
  ThemeId,
} from "@/lib/poker-settings/types";
import { Segmented } from "../controls/Segmented";
import { SwatchRow } from "../controls/SwatchRow";
import { ThemeCard } from "../controls/ThemeCard";

const PRESET_IDS: Exclude<ThemeId, "custom">[] = [
  "classic-vegas",
  "wood-lodge",
  "garden",
];

const FELT_OPTIONS: { value: FeltStyle; label: string }[] = (
  ["green", "red", "blue", "brown", "sage", "amber"] as const
).map((v) => ({ value: v, label: FELT_LABELS[v] }));

const CARD_BACK_OPTIONS: { value: CardBackStyle; label: string }[] = (
  ["red", "wood", "floral"] as const
).map((v) => ({ value: v, label: CARD_BACK_LABELS[v] }));

const ACCENT_OPTIONS: { value: AccentStyle; label: string }[] = (
  ["green", "red", "blue", "amber", "purple"] as const
).map((v) => ({ value: v, label: ACCENT_LABELS[v] }));

const BG_OPTIONS: { value: BgVariant; label: string }[] = [
  { value: "static", label: "Static" },
  { value: "classic", label: "Classic" },
  { value: "wood", label: "Wood" },
  { value: "garden", label: "Garden" },
];

export function AppearanceTab() {
  const { settings, update, updateCustom } = usePokerSettings();
  const customVisuals = resolveCustom(settings.custom);

  return (
    <div className="flex flex-col" style={{ gap: "32px" }}>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Themes
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
          }}
        >
          {PRESET_IDS.map((id) => (
            <ThemeCard
              key={id}
              label={PRESET_LABELS[id]}
              visuals={PRESETS[id]}
              active={settings.theme === id}
              onClick={() => update({ theme: id })}
            />
          ))}
          <ThemeCard
            label="Custom"
            visuals={customVisuals}
            active={settings.theme === "custom"}
            onClick={() => update({ theme: "custom" })}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <label className="text-slate-200 block mb-2" style={{ fontSize: "15px", fontWeight: 600 }}>Felt color</label>
          <SwatchRow
            value={settings.custom.feltStyle}
            options={FELT_OPTIONS}
            swatches={FELT_SWATCHES}
            onChange={(v) => updateCustom({ feltStyle: v })}
          />
        </div>

        <div>
          <label className="text-slate-200 block mb-2" style={{ fontSize: "15px", fontWeight: 600 }}>Card back</label>
          <Segmented
            value={settings.custom.cardBackStyle}
            options={CARD_BACK_OPTIONS}
            onChange={(v) => updateCustom({ cardBackStyle: v })}
          />
        </div>

        <div>
          <label className="text-slate-200 block mb-2" style={{ fontSize: "15px", fontWeight: 600 }}>Accent color</label>
          <SwatchRow
            value={settings.custom.accentStyle}
            options={ACCENT_OPTIONS}
            swatches={ACCENT_SWATCHES}
            onChange={(v) => updateCustom({ accentStyle: v })}
          />
        </div>

        <div>
          <label className="text-slate-200 block mb-2" style={{ fontSize: "15px", fontWeight: 600 }}>Background</label>
          <Segmented
            value={settings.custom.bgVariant}
            options={BG_OPTIONS}
            onChange={(v) => updateCustom({ bgVariant: v })}
          />
        </div>
      </section>
    </div>
  );
}
