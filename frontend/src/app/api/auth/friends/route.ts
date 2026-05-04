import { auth } from "@/auth";
import { findUserFromSession } from "@/lib/auth-user";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

type FriendRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isOnline: boolean;
};

type FriendPayload = {
  id: string;
  name: string;
  image: string | null;
  isOnline: boolean;
};

type FriendshipStateRow = { accepted: boolean };

type CurrentUserResult =
  | { currentUser: { id: string } }
  | { error: Response };

//Normalize DB rows into the payload expected by the friends UI
function mapFriendRows(rows: FriendRow[]): FriendPayload[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? row.email ?? "Unknown player",
    image: row.image,
    isOnline: row.isOnline,
  }));
}

//Shared auth/user guard used by all handlers in this route
async function getCurrentUserOrError(): Promise<CurrentUserResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: jsonError("Unauthorized", 401) };
  }

  const currentUser = await findUserFromSession(session);
  if (!currentUser) {
    return { error: jsonError("User not found", 404) };
  }

  return { currentUser: { id: currentUser.id } };
}

export async function GET() {
  try {
    //Return accepted friends and pending requests for the authenticated user
    const authResult = await getCurrentUserOrError();
    if ("error" in authResult) {
      return authResult.error;
    }
    const { currentUser } = authResult;

    // Accepted friends
    const friendsRows = await prisma.$queryRaw<FriendRow[]>`
      SELECT
        u.id,
        u.username AS name,
        u.email,
        u.image,
        (u."lastSeenAt" IS NOT NULL AND u."lastSeenAt" >= NOW() - INTERVAL '10 seconds') AS "isOnline"
      FROM "Friendship" f
      JOIN "User" u ON u.id = f."friendId"
      WHERE f."userId" = ${currentUser.id} AND f."accepted" = true
      ORDER BY COALESCE(u.username, u.email, '') ASC
    `;

    // Pending incoming requests (other users sent requests to me)
    const pendingRows = await prisma.$queryRaw<FriendRow[]>`
      SELECT
        u.id,
        u.username AS name,
        u.email,
        u.image,
        (u."lastSeenAt" IS NOT NULL AND u."lastSeenAt" >= NOW() - INTERVAL '10 seconds') AS "isOnline"
      FROM "Friendship" f
      JOIN "User" u ON u.id = f."userId"
      WHERE f."friendId" = ${currentUser.id} AND f."accepted" = false
      ORDER BY COALESCE(u.username, u.email, '') ASC
    `;

    return jsonOk({ friends: mapFriendRows(friendsRows), pending: mapFriendRows(pendingRows) });
  } catch {
    return jsonError("Failed to load friends", 500);
  }
}
// Accept a pending friend request
export async function PATCH(request: Request) {
  try {
    const authResult = await getCurrentUserOrError();
    if ("error" in authResult) {
      return authResult.error;
    }
    const { currentUser } = authResult;
    const { friendId } = (await request.json()) as { friendId?: string };
    if (!friendId) {
      return jsonError("Friend id is required", 400);
    }

    // Accept the pending request and create reciprocal
    await prisma.$transaction([
      prisma.$executeRaw`
        UPDATE "Friendship"
        SET "accepted" = true
        WHERE "userId" = ${friendId} AND "friendId" = ${currentUser.id}
      `,
      prisma.$executeRaw`
        INSERT INTO "Friendship" ("userId", "friendId", "accepted", "createdAt")
        VALUES (${currentUser.id}, ${friendId}, true, NOW())
        ON CONFLICT ("userId", "friendId") DO UPDATE SET "accepted" = true
      `,
    ]);

    return jsonOk({ message: "Friend request accepted" });
  } catch {
    return jsonError("Failed to accept friend request", 500);
  }
}

export async function POST(request: Request) {
  try {
    //Add friend flow supports either sending a request or auto-accepting a reciprocal request
    const authResult = await getCurrentUserOrError();
    if ("error" in authResult) {
      return authResult.error;
    }
    const { currentUser } = authResult;

    const { identifier } = (await request.json()) as { identifier?: string };
    const normalizedIdentifier = identifier?.trim();

    if (!normalizedIdentifier) {
      return jsonError("Friend username or email is required", 400);
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
      },
      select: { id: true },
    });

    if (!targetUser) {
      return jsonOk({ error: "User not found" });
    }

    if (targetUser.id === currentUser.id) {
      return jsonOk({ error: "You cannot add yourself" });
    }

    //Existing outgoing relation means request already exists from current -> target
    const existingOutgoing = await prisma.$queryRaw<FriendshipStateRow[]>`
      SELECT "accepted"
      FROM "Friendship"
      WHERE "userId" = ${currentUser.id} AND "friendId" = ${targetUser.id}
      LIMIT 1
    `;

    const outgoing = existingOutgoing[0];
    if (outgoing) {
      if (outgoing.accepted) {
        return jsonOk({ error: "Already friends" });
      }
      return jsonOk({ error: "Friend request already sent" });
    }

    //Existing incoming relation means target already has a request toward current user
    const existingIncoming = await prisma.$queryRaw<FriendshipStateRow[]>`
      SELECT "accepted"
      FROM "Friendship"
      WHERE "userId" = ${targetUser.id} AND "friendId" = ${currentUser.id}
      LIMIT 1
    `;

    const incoming = existingIncoming[0];
    if (incoming) {
      if (incoming.accepted) {
        //Ensure reciprocal edge exists so friendship is symmetrical in both directions
        await prisma.$executeRaw`
          INSERT INTO "Friendship" ("userId", "friendId", "accepted", "createdAt")
          VALUES (${currentUser.id}, ${targetUser.id}, true, NOW())
          ON CONFLICT ("userId", "friendId") DO UPDATE SET "accepted" = true
        `;
        return jsonOk({ message: "Already friends" });
      }

      //Accept pending incoming request and create/update reciprocal accepted relation
      await prisma.$transaction([
        prisma.$executeRaw`
          UPDATE "Friendship"
          SET "accepted" = true
          WHERE "userId" = ${targetUser.id} AND "friendId" = ${currentUser.id}
        `,
        prisma.$executeRaw`
          INSERT INTO "Friendship" ("userId", "friendId", "accepted", "createdAt")
          VALUES (${currentUser.id}, ${targetUser.id}, true, NOW())
          ON CONFLICT ("userId", "friendId") DO UPDATE SET "accepted" = true
        `,
      ]);

      return jsonOk({ message: "Friend request accepted" });
    }

    //No existing relation in either direction: create a pending outgoing request
    await prisma.$executeRaw`
      INSERT INTO "Friendship" ("userId", "friendId", "accepted", "createdAt")
      VALUES (${currentUser.id}, ${targetUser.id}, false, NOW())
      ON CONFLICT ("userId", "friendId") DO NOTHING
    `;

    return jsonOk({ message: "Friend request sent" }, 201);
  } catch {
    return jsonError("Failed to add friend", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    //Remove friendship edges in both directions
    const authResult = await getCurrentUserOrError();
    if ("error" in authResult) {
      return authResult.error;
    }
    const { currentUser } = authResult;

    const { friendId } = (await request.json()) as { friendId?: string };
    if (!friendId) {
      return jsonError("Friend id is required", 400);
    }

    await prisma.$transaction([
      prisma.$executeRaw`
        DELETE FROM "Friendship"
        WHERE "userId" = ${currentUser.id} AND "friendId" = ${friendId}
      `,
      prisma.$executeRaw`
        DELETE FROM "Friendship"
        WHERE "userId" = ${friendId} AND "friendId" = ${currentUser.id}
      `,
    ]);

    return jsonOk({ message: "Friend removed" });
  } catch {
    return jsonError("Failed to remove friend", 500);
  }
}
