import { getExistingUserSessionOrNull } from "@/lib/existingUserSession";
import { NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = new Set(["/login", "/register"]);

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export async function proxy(request: NextRequest) {
  const pathname = normalizePath(request.nextUrl.pathname);
  const existingSession = await getExistingUserSessionOrNull();

  // Not signed in -> allow route, auth pages included.
  if (!existingSession) {
    return NextResponse.next();
  }

  const activeGameId = existingSession.user.activeGameId;
  const activeGamePath = activeGameId ? normalizePath(`/poker/${activeGameId}`) : null;

  // Signed in + active game -> force user to that exact game page.
  if (activeGamePath && pathname !== activeGamePath) {
    return NextResponse.redirect(new URL(activeGamePath, request.url));
  }

  // Signed in + no active game -> keep auth pages blocked.
  if (!activeGamePath && AUTH_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on app pages, skip internals/assets/API.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
