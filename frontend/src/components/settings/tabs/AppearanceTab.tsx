"use client";

import Image from "next/image";
import { usePokerSettings } from "@/lib/poker-settings/context";
import {
  FELT_LABELS,
  FELT_SWATCHES,
} from "@/lib/poker-settings/presets";
import type {
  BgVariant,
  FeltStyle,
} from "@/lib/poker-settings/types";
import { Segmented } from "../controls/Segmented";
import { SwatchRow } from "../controls/SwatchRow";

const BANNER_OPTIONS = [
  { src: "/banners/banner1.png", label: "Banner 1" },
  { src: "/banners/banner2.png", label: "Banner 2" },
  { src: "/banners/banner3.png", label: "Banner 3" },
  { src: "/banners/banner4.png", label: "Banner 4" },
];

const FELT_OPTIONS: { value: FeltStyle; label: string }[] = (
  ["green", "red", "blue", "brown", "sage", "amber"] as const
).map((v) => ({ value: v, label: FELT_LABELS[v] }));

const CARD_BACK_IDS = ["back01", "back02", "back03", "back04", "back05", "back06", "back07", "back08"];

const BG_OPTIONS: { value: BgVariant; label: string }[] = [
  { value: "static", label: "Static" },
  { value: "classic", label: "Classic" },
  { value: "wood", label: "Wood" },
  { value: "garden", label: "Garden" },
];

export function AppearanceTab() {
  const { settings, update, updateCustom } = usePokerSettings();

  return (
    <div className="flex flex-col" style={{ gap: "32px" }}>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Banner
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {BANNER_OPTIONS.map(({ src, label }) => (
            <button
              key={src}
              type="button"
              onClick={() => update({ bannerImage: src })}
              className="relative overflow-hidden rounded-lg text-left transition-transform hover:scale-[1.03]"
              style={{
                outline: settings.bannerImage === src ? "2px solid white" : "none",
                outlineOffset: "2px",
              }}
            >
              <div className="h-16 w-full relative">
                <Image src={src} alt={label} fill sizes="100vw" style={{ objectFit: "fill" }} unoptimized />
              </div>
              <div className="px-3 py-2" style={{ background: "rgba(2, 6, 23, 0.75)" }}>
                <span className="text-sm font-medium text-white">{label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">

        <div>
          <label className="text-slate-200 block mb-2" style={{ fontSize: "15px", fontWeight: 600 }}>Card back</label>
          <div className="flex flex-wrap gap-1.5">
            {CARD_BACK_IDS.map((id) => (
              <button
                key={id}
                onClick={() => update({ cardBackImage: id })}
                className={`rounded overflow-hidden border-2 transition-colors flex-shrink-0 ${
                  settings.cardBackImage === id ? "border-white" : "border-transparent"
                }`}
              >
                <Image src={`/cards/${id}.png`} alt={id} width={28} height={40} className="block" />
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-slate-200 block mb-2" style={{ fontSize: "15px", fontWeight: 600 }}>Background color</label>
          <SwatchRow
            value={settings.custom.feltStyle}
            options={FELT_OPTIONS}
            swatches={FELT_SWATCHES}
            onChange={(v) => updateCustom({ feltStyle: v })}
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
