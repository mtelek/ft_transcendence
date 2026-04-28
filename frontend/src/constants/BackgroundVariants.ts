export const DEFAULT_VARIANT: Variant = "classic";

export type Variant = "classic" | "wood" | "garden";

export const VARIANT_BG: Record<Variant, string> = {
  classic: "#0a142e", // dark blue
  wood: "#241f1c",    // dulux dark oak brown
  garden: "#065f46",  // dark emerald green
};

export interface Particle {
  x: number;
  y: number;
  size: number;
  suit: string;
  color: string;
  speed: number;
  baseOpacity: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
  drift: number;
  vx: number;
  vy: number;
}

export const VARIANT_SYMBOLS: Record<Variant, readonly string[]> = {
  classic: ["♠", "♥", "♦", "♣"],
  wood: ["♠", "♣", "♦"],
  garden: ["♣", "♥", "❀", "✿"],
};

export const VARIANT_COLORS: Record<Variant, Record<string, string>> = {
  classic: {
    "♠": "#c8d6e5",
    "♥": "#e74c3c",
    "♦": "#e74c3c",
    "♣": "#c8d6e5",
  },
  wood: {
    "♠": "#d4a373",
    "♣": "#b08968",
    "♦": "#d97706",
  },
  garden: {
    "♣": "#a7f3d0",
    "♥": "#fbcfe8",
    "❀": "#fcd5ce",
    "✿": "#ddd6fe",
  },
};
