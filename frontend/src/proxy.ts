import { getExistingUserSessionOrNull } from "@/lib/require-existing-user-session";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  //Gate auth pages only for sessions that still map to a real DB user.
  //Stale sessions (e.g. after DB reset) must be allowed through to login/register.
  const existingSession = await getExistingUserSessionOrNull();

  if (existingSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  //Run this proxy only on login/register routes.
  matcher: ["/login", "/register"],
};