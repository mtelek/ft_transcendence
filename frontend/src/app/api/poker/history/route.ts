import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { findUserFromSession } from "@/lib/auth-user";

type HistoryRow = {
  id: string;
  playedAt: string;
  mode: string;
  result: "WIN" | "LOSS" | "PENDING";
  opponent: { name: string; image: string | null } | null;
  score: number | null;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return jsonError("Unauthorized", 401);
    const user = await findUserFromSession(session);
    if (!user) return jsonError("User not found", 404);

    // Fetch matches where user is a participant
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: user.id },
          { player2Id: user.id },
          { player3Id: user.id },
          { player4Id: user.id },
          { player5Id: user.id },
          { player6Id: user.id },
        ],
      },
      include: {
        player1: { select: { id: true, username: true, image: true } },
        player2: { select: { id: true, username: true, image: true } },
        player3: { select: { id: true, username: true, image: true } },
        player4: { select: { id: true, username: true, image: true } },
        player5: { select: { id: true, username: true, image: true } },
        player6: { select: { id: true, username: true, image: true } },
      },
      orderBy: { playedAt: "desc" },
      take: 20,
    });

    let wins = 0;
    let losses = 0;
    const history: HistoryRow[] = matches.map((m) => {
      const players = [m.player1, m.player2, m.player3, m.player4, m.player5, m.player6].filter(
        (p): p is NonNullable<typeof p> => Boolean(p)
      );
      const mySeatIndex = players.findIndex((p) => p.id === user.id);
      const opponents = players.filter((p) => p.id !== user.id);
      const opponent = opponents.length > 0 ? opponents[0] : null;

      let result: HistoryRow["result"] = "PENDING";
      if (m.winnerId === user.id) {
        result = "WIN";
        wins++;
      } else if (m.winnerId) {
        result = "LOSS";
        losses++;
      }

      const score = mySeatIndex >= 0 && mySeatIndex < m.scores.length ? m.scores[mySeatIndex] : null;

      return {
        id: m.id,
        playedAt: m.playedAt.toISOString(),
        mode: m.mode,
        result,
        opponent: opponent ? { name: opponent.username ?? "Unknown", image: opponent.image ?? null } : null,
        score,
      };
    });

    return jsonOk({
      wins,
      losses,
      matches: history,
    });
  } catch {
    return jsonError("Failed to load match history", 500);
  }
}
