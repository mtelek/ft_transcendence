import type {
  AccentStyle,
  CardBackStyle,
  CustomChoice,
  FeltStyle,
  ThemeId,
  ThemeVisuals,
} from "./types";

const FELT_FILTERS: Record<FeltStyle, string> = {
  green: "none",
  red: "hue-rotate(-100deg) saturate(1.4)",
  blue: "hue-rotate(120deg) saturate(1.2)",
  brown: "sepia(0.9) hue-rotate(-35deg) saturate(1.4) brightness(0.85)",
  sage: "sepia(0.3) hue-rotate(20deg) saturate(0.7) brightness(1.1)",
  amber: "sepia(1) hue-rotate(-20deg) saturate(1.3) brightness(0.95)",
};

const BG_FILTERS_BY_FELT: Record<FeltStyle, string> = {
  green: "sepia(1) hue-rotate(90deg) saturate(2) brightness(0.6)",
  red: "sepia(1) hue-rotate(335deg) saturate(5) brightness(0.55)",
  blue: "sepia(1) hue-rotate(190deg) saturate(3) brightness(0.6)",
  brown: "sepia(1) saturate(2.5) brightness(0.55) contrast(1.1)",
  sage: "sepia(0.4) hue-rotate(60deg) saturate(1.4) brightness(0.9)",
  amber: "sepia(1) hue-rotate(20deg) saturate(2.5) brightness(0.7)",
};

const CARD_BACK_FILTERS: Record<CardBackStyle, string> = {
  red: "none",
  wood: "sepia(0.7) hue-rotate(-20deg) saturate(1.2)",
  floral: "sepia(1) hue-rotate(260deg) saturate(0.9) brightness(1.2)",
};

const ACCENT_HEX: Record<AccentStyle, string> = {
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  amber: "#d97706",
  purple: "#a78bfa",
};

const CHIP_PALETTES: Record<AccentStyle, readonly [string, string, string, string]> = {
  green: ["#fbbf24", "#dc2626", "#ffffff", "#111827"],
  red: ["#fecaca", "#991b1b", "#ffffff", "#1f2937"],
  blue: ["#bfdbfe", "#1e40af", "#ffffff", "#0f172a"],
  amber: ["#b45309", "#fde68a", "#78350f", "#fff7ed"],
  purple: ["#fbcfe8", "#a7f3d0", "#ddd6fe", "#fef3c7"],
};

const FRAME_BY_ACCENT: Record<AccentStyle, string> = {
  green: "#3d1f0a",
  red: "#3d1f0a",
  blue: "#111827",
  amber: "#2d1206",
  purple: "#6a4e32",
};

const ACTION_BAR_BY_ACCENT: Record<AccentStyle, string> = {
  green: "linear-gradient(180deg,#8B5E3C 0%,#6B3F1F 30%,#7A4A28 70%,#5C3317 100%)",
  red: "linear-gradient(180deg,#8B5E3C 0%,#6B3F1F 30%,#7A4A28 70%,#5C3317 100%)",
  blue: "linear-gradient(180deg,#1f2937 0%,#0f172a 30%,#1e293b 70%,#0a0f1a 100%)",
  amber: "linear-gradient(180deg,#5C3317 0%,#3d1f0a 30%,#4a2812 70%,#2d1206 100%)",
  purple: "linear-gradient(180deg,#9f7a4f 0%,#7d5d3e 30%,#8e6b48 70%,#6a4e32 100%)",
};

export function resolveCustom(choice: CustomChoice): ThemeVisuals {
  return {
    bgFilter: BG_FILTERS_BY_FELT[choice.feltStyle],
    tableFilter: "none",
    cardBackFilter: CARD_BACK_FILTERS[choice.cardBackStyle],
    accent: ACCENT_HEX[choice.accentStyle],
    chipPalette: CHIP_PALETTES[choice.accentStyle],
    actionBarGradient: ACTION_BAR_BY_ACCENT[choice.accentStyle],
    backgroundVariant: choice.bgVariant,
    frameColor: FRAME_BY_ACCENT[choice.accentStyle],
  };
}

export const PRESETS: Record<Exclude<ThemeId, "custom">, ThemeVisuals> = {
  "classic-vegas": resolveCustom({
    feltStyle: "green",
    cardBackStyle: "red",
    accentStyle: "green",
    bgVariant: "static",
  }),
  "wood-lodge": resolveCustom({
    feltStyle: "brown",
    cardBackStyle: "wood",
    accentStyle: "amber",
    bgVariant: "wood",
  }),
  garden: resolveCustom({
    feltStyle: "sage",
    cardBackStyle: "floral",
    accentStyle: "purple",
    bgVariant: "garden",
  }),
};

export const PRESET_LABELS: Record<ThemeId, string> = {
  "classic-vegas": "Classic Vegas",
  "wood-lodge": "Wood Lodge",
  garden: "Garden",
  custom: "Custom",
};

export const FELT_LABELS: Record<FeltStyle, string> = {
  green: "Green",
  red: "Red",
  blue: "Blue",
  brown: "Brown",
  sage: "Sage",
  amber: "Amber",
};

export const CARD_BACK_LABELS: Record<CardBackStyle, string> = {
  red: "Classic Red",
  wood: "Wood",
  floral: "Floral",
};

export const ACCENT_LABELS: Record<AccentStyle, string> = {
  green: "Emerald",
  red: "Ruby",
  blue: "Sapphire",
  amber: "Amber",
  purple: "Violet",
};

export const FELT_SWATCHES: Record<FeltStyle, string> = {
  green: "#2d7a3a",
  red: "#b02020",
  blue: "#1e4fa0",
  brown: "#7a4a1e",
  sage: "#7fa37b",
  amber: "#c8a800",
};

export const ACCENT_SWATCHES = ACCENT_HEX;
