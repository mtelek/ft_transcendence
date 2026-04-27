import { auth } from "@/auth";
import { findUserFromSession } from "@/lib/auth-user";
import { redirect } from "next/navigation";

export async function getExistingUserSessionOrNull() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await findUserFromSession(session);

  if (!user) {
    return null;
  }

  return { session, user };
}

export async function requireExistingUserSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await findUserFromSession(session);

  if (!user) {
    redirect("/");
  }

  return { session, user };
}