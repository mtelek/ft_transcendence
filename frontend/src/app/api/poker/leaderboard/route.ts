import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { findUserFromSession } from "@/lib/auth-user";

type WinRow = {
  winnerId: string;
  wins: number;
};

type LeaderboardEntry = {
  id: string;
  name: string;
  image: string | null;
  wins: number;
};

function sortByWinsThenName(a: LeaderboardEntry, b: LeaderboardEntry) {
  if (b.wins !== a.wins) return b.wins - a.wins;
  return a.name.localeCompare(b.name);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return jsonError("Unauthorized", 401);

    const currentUser = await findUserFromSession(session);
    if (!currentUser) return jsonError("User not found", 404);

    const friendships = await prisma.friendship.findMany({
      where: {
        accepted: true,
        OR: [{ userId: currentUser.id }, { friendId: currentUser.id }],
      },
      select: { userId: true, friendId: true },
    });

    const friendIds = new Set<string>([currentUser.id]);
    for (const edge of friendships) {
      if (edge.userId === currentUser.id) friendIds.add(edge.friendId);
      if (edge.friendId === currentUser.id) friendIds.add(edge.userId);
    }

    const winRows = await prisma.$queryRaw<WinRow[]>`
      SELECT "winnerId", COUNT(*)::int AS wins
      FROM "Match"
      WHERE "winnerId" IS NOT NULL
      GROUP BY "winnerId"
    `;

    const winsByUserId = new Map<string, number>();
    for (const row of winRows) {
      winsByUserId.set(row.winnerId, Number(row.wins) || 0);
    }

    const friendsUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(friendIds) } },
      select: { id: true, username: true, image: true },
    });

    const friendsLeaderboard: LeaderboardEntry[] = friendsUsers
      .map((u) => ({
        id: u.id,
        name: u.username ?? "Unknown",
        image: u.image ?? null,
        wins: winsByUserId.get(u.id) ?? 0,
      }))
      .sort(sortByWinsThenName);

    const globalWinnersRows = await prisma.$queryRaw<LeaderboardEntry[]>`
      SELECT u.id,
             COALESCE(u.username, 'Unknown') AS name,
             u.image,
             COUNT(m.id)::int AS wins
      FROM "User" u
      JOIN "Match" m ON m."winnerId" = u.id
      GROUP BY u.id, u.username, u.image
      HAVING COUNT(m.id) > 0
      ORDER BY COUNT(m.id) DESC, COALESCE(u.username, 'Unknown') ASC
    `;

    return jsonOk({
      friends: friendsLeaderboard,
      global: globalWinnersRows,
    });
  } catch {
    return jsonError("Failed to load leaderboard", 500);
  }
}
