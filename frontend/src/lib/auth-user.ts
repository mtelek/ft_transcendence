import { prisma } from "@/lib/prisma";

//Minimal session shape needed to resolve the matching database user
type SessionLike = {
  user?: {
    email?: string | null;
    name?: string | null;
  };
};

function getSessionIdentity(session: SessionLike) {
  //Extract whichever stable identity fields are available from the session
  const email = session.user?.email ?? undefined;
  const username = session.user?.name ?? undefined;

  if (!email && !username) {
    return null;
  }

  return { email, username };
}

export async function findUserFromSession(session: SessionLike) {
  //Resolve the app user record from session data without assuming both fields exist
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
