import { auth } from "@/auth";
import { findUserFromSession } from "@/lib/auth-user";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

//Presence heartbeat endpoint: updates current user's last-seen timestamp
export async function POST() {
  try {
    //Only authenticated users can report presence
    const session = await auth();
    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    //Resolve database user identity from the active auth session
    const currentUser = await findUserFromSession(session);
    if (!currentUser) {
      return jsonError("User not found", 404);
    }

    //Heartbeat write used by online/offline checks in friends/presence UI
    await prisma.$executeRaw`
      UPDATE "User"
      SET "lastSeenAt" = NOW()
      WHERE id = ${currentUser.id}
    `;

    return jsonOk({ ok: true });
  } catch {
    return jsonError("Failed to update presence", 500);
  }
}
