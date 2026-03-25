export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export type Card = {
  rank: Rank;
  suit: Suit;
};

export const SUITS: { name: Suit; symbol: string; color: string }[] = [
  { name: "hearts", symbol: "♥", color: "text-red-500" },
  { name: "diamonds", symbol: "♦", color: "text-red-500" },
  { name: "clubs", symbol: "♣", color: "text-white" },
  { name: "spades", symbol: "♠", color: "text-white" },
];

export const RANKS: Rank[] = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
];

// Full 52-card deck
export const DECK: Card[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ rank, suit: suit.name }))
);

export function getCardDisplay(card: Card) {
  const suit = SUITS.find((s) => s.name === card.suit)!;
  return {
    rank: card.rank,
    symbol: suit.symbol,
    color: suit.color,
  };
}
