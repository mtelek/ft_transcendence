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
