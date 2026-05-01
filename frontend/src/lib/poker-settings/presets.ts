import type {
  CardBackStyle,
  CustomChoice,
  FeltStyle,
  ThemeId,
  ThemeVisuals,
} from "./types";

/*const FELT_FILTERS: Record<FeltStyle, string> = {
  green: "none",
  red: "hue-rotate(-100deg) saturate(1.4)",
  blue: "hue-rotate(120deg) saturate(1.2)",
  brown: "sepia(0.9) hue-rotate(-35deg) saturate(1.4) brightness(0.85)",
  sage: "sepia(0.3) hue-rotate(20deg) saturate(0.7) brightness(1.1)",
  amber: "sepia(1) hue-rotate(-20deg) saturate(1.3) brightness(0.95)",
};
*/

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

export function resolveCustom(choice: CustomChoice): ThemeVisuals {
  return {
    bgFilter: BG_FILTERS_BY_FELT[choice.feltStyle],
    tableFilter: "none",
    cardBackFilter: CARD_BACK_FILTERS[choice.cardBackStyle],
    chipPalette: ["#fbbf24", "#dc2626", "#ffffff", "#111827"],
    actionBarGradient: "linear-gradient(180deg,#8B5E3C 0%,#6B3F1F 30%,#7A4A28 70%,#5C3317 100%)",
    backgroundVariant: choice.bgVariant,
    frameColor: "#3d1f0a",
  };
}

export const PRESETS: Record<Exclude<ThemeId, "custom">, ThemeVisuals> = {
  "classic-vegas": resolveCustom({
    feltStyle: "green",
    cardBackStyle: "red",
    bgVariant: "static",
  }),
  "wood-lodge": resolveCustom({
    feltStyle: "brown",
    cardBackStyle: "wood",
    bgVariant: "wood",
  }),
  garden: resolveCustom({
    feltStyle: "sage",
    cardBackStyle: "floral",
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

export const FELT_SWATCHES: Record<FeltStyle, string> = {
  green: "#2d7a3a",
  red: "#b02020",
  blue: "#1e4fa0",
  brown: "#7a4a1e",
  sage: "#7fa37b",
  amber: "#c8a800",
};

