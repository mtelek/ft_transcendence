import { auth } from "@/auth";
import { findUserFromSession } from "@/lib/auth-user";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    const currentUser = await findUserFromSession(session);
    if (!currentUser) {
      return jsonError("User not found", 404);
    }

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
