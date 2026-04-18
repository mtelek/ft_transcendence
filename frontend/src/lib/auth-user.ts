import { prisma } from "@/lib/prisma";

type SessionLike = {
  user?: {
    email?: string | null;
    name?: string | null;
  };
};

export function getSessionIdentity(session: SessionLike) {
  const email = session.user?.email ?? undefined;
  const username = session.user?.name ?? undefined;

  if (!email && !username) {
    return null;
  }

  return { email, username };
}

export async function findUserFromSession(session: SessionLike) {
  const identity = getSessionIdentity(session);

  if (!identity) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: [
        ...(identity.email ? [{ email: identity.email }] : []),
        ...(identity.username ? [{ username: identity.username }] : []),
      ],
    },
    select: { id: true, username: true, email: true, password: true },
  });
}
