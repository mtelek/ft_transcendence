//Proxy runs on the server before matched pages are rendered
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  //Resolve session for the incoming request
  const session = await auth();

  // Determine whether current user is authenticated
  const isAuthenticated = Boolean(session?.user);

  //Guard only guest-only auth pages.
  const isAuthPage =
    request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register";

  //If an authenticated user tries to access login/register,
  // redirect to homepage before those pages render
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  //Otherwise continue to the requested route.
  return NextResponse.next();
}

export const config = {
  //Run this proxy only on login/register routes.
  matcher: ["/login", "/register"],
};