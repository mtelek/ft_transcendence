import type { NextAuthConfig } from "next-auth";

//Keep lightweight shared auth settings separate from auth.ts
//auth.ts contains the full runtime logic, providers, adapter, and callbacks,
// while this file holds simple base config that can be reused cleanly
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
};
