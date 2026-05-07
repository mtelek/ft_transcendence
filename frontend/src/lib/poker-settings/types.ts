export type TableSize = 2 | 3 | 4 | 5 | 6;
type TimerOption = "off" | 15 | 30 | 60;
export type AnimationSpeed = "slow" | "normal" | "fast";
export type BgVariant = "static" | "classic" | "wood" | "garden";

export type ThemeId = "classic-vegas" | "wood-lodge" | "garden" | "custom";

export type ThemeVisuals = {
  bgFilter: string;
  tableFilter: string;
  cardBackFilter: string;
  chipPalette: readonly [string, string, string, string];
  actionBarGradient: string;
  backgroundVariant: BgVariant;
  frameColor: string;
};

export type FeltStyle = "green" | "red" | "blue" | "brown" | "sage" | "amber";
export type CardBackStyle = "red" | "wood" | "floral";

export type CustomChoice = {
  feltStyle: FeltStyle;
  cardBackStyle: CardBackStyle;
  bgVariant: BgVariant;
};

export type PokerSettings = {
  theme: ThemeId;
  custom: CustomChoice;
  tableSize: TableSize;
  blinds: { small: number; big: number };
  startingStack: number;
  timer: TimerOption;
  animationSpeed: AnimationSpeed;
  cardBackImage: string;
  bannerImage: string;
  useSpecialChip: boolean;
};
