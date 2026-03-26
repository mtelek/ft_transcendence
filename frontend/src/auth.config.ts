import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [Credentials({})],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login") ||
                         nextUrl.pathname.startsWith("/register");
      const isLandingPage = nextUrl.pathname === "/";

      if (isLoggedIn && (isAuthPage || isLandingPage)) return Response.redirect(new URL("/dashboard", nextUrl));
      if (!isLoggedIn && !isAuthPage && !isLandingPage) return Response.redirect(new URL("/login", nextUrl));

      return true;
    },
  },
};
