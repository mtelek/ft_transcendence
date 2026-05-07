import type { PokerSettings, AnimationSpeed } from "./types";

export const DEFAULT_SETTINGS: PokerSettings = {
  theme: "classic-vegas",
  custom: {
    feltStyle: "green",
    cardBackStyle: "red",
    bgVariant: "static",
  },
  tableSize: 6,
  blinds: { small: 25, big: 50 },
  startingStack: 10_000,
  timer: "off",
  animationSpeed: "normal",
  cardBackImage: "back06",
  bannerImage: "/banners/banner3.png",
  useSpecialChip: false,
};

const ANIMATION_DURATION_MS: Record<AnimationSpeed, number> = {
  slow: 500,
  normal: 250,
  fast: 100,
};

export const BLIND_PRESETS: Array<{ small: number; big: number }> = [
  { small: 10, big: 20 },
  { small: 25, big: 50 },
  { small: 50, big: 100 },
  { small: 100, big: 200 },
];

export const STACK_PRESETS = [1_000, 5_000, 10_000, 25_000] as const;
