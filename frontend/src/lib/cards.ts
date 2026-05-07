type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

type Card = {
  rank: Rank;
  suit: Suit;
};

const SUITS: { name: Suit; symbol: string; color: string }[] = [
  { name: "hearts", symbol: "♥", color: "text-red-500" },
  { name: "diamonds", symbol: "♦", color: "text-red-500" },
  { name: "clubs", symbol: "♣", color: "text-white" },
  { name: "spades", symbol: "♠", color: "text-white" },
];

const RANKS: Rank[] = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
];

// Full 52-card deck
const DECK: Card[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ rank, suit: suit.name }))
);

function getCardDisplay(card: Card) {
  const suit = SUITS.find((s) => s.name === card.suit)!;
  return {
    rank: card.rank,
    symbol: suit.symbol,
    color: suit.color,
  };
}

const FACE_RANK_MAP: Record<string, string> = {
  J: "jack",
  Q: "queen",
  K: "king",
  A: "ace",
};

export function getCardImage(card: { rank: string; suit: string }): string {
  const rank = card.rank === "T" ? "10" : card.rank;
  const num = parseInt(rank, 10);
  const rankPart = !isNaN(num)
    ? num.toString().padStart(2, "0")
    : (FACE_RANK_MAP[rank] ?? rank.toLowerCase());
  return `/cards/${card.suit}_${rankPart}.png`;
}

export function getCardBack(backId = "back01"): string {
  return `/cards/${backId}.png`;
}
