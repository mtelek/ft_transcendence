import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

//! comment missing
const adapter = PrismaAdapter(prisma);

async function getUniqueUsername(base?: string | null) {
  const firstName = base?.trim().split(/\s+/)[0];
  if (firstName) {
    const existing = await prisma.user.findUnique({
      where: { username: firstName },
      select: { id: true },
    });
    if (!existing) return firstName;
  }

  const playerCount = await prisma.user.count({
    where: { username: { startsWith: "player" } },
  });
  return `player${playerCount + 1}`;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  adapter: {
    ...adapter,
    async createUser(data) {
      const username = await getUniqueUsername(data.name);

      const created = await prisma.user.create({
        data: {
          email: data.email,
          image: data.image,
          emailVerified: data.emailVerified,
          username,
        },
      });

      return {
        id: created.id,
        email: created.email ?? data.email,
        name: created.username ?? data.name,
        image: created.image,
        emailVerified: created.emailVerified,
      };
    },
    //needed when automatically logged in and then try to log out
    async deleteSession(sessionToken) {
      try {
        return await prisma.session.delete({
          where: { sessionToken },
        });
      } catch {
        // Session already deleted or missing, treat sign-out as successful.
        return null;
      }
    },
  },
  
  providers: [
    // MANUAL LOGIN
    Credentials({
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          console.log("[auth] Missing identifier or password");
          return null;
        }

        const identifier = credentials.identifier as string;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
            ],
          },
        });

        if (!user) {
          console.log(`[auth] User not found: ${identifier}`);
          return null;
        }
        if (!user.password) {
          console.log(`[auth] User has no password: ${identifier}`);
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          console.log(`[auth] Password mismatch for: ${identifier}`);
          return null;
        }

        console.log(`[auth] Successfully authorized: ${identifier}`);
        return { id: String(user.id), email: user.email, name: user.username };
      },
    }),

    // GOOGLE PROVIDER
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  //signalling error=CredentialsSignin&code=credentials correctly
  logger: {
    error(error) {
      const authError = error as Error & { type?: string };
      if (authError.type === "CredentialsSignin") return;
      console.error(error);
    },
  },
  callbacks: {
    //to make sure session data is consistently populated
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      if (typeof token.email === "string") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { username: true },
        });
        if (dbUser?.username) {
          token.name = dbUser.username;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }
      return session;
    },
    async signIn({ user, account }) {
      // Auto-link Google account with existing email
      if (account?.provider === "google" && user.email) {
        // Check if user already has this provider linked
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId || "",
            },
          },
        });

        if (!existingAccount) {
          // Find user by email and link Google account
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            console.log(`[auth] ✓ Linking Google account to existing user: ${user.email}`);
            // Create Account linkage
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId || "",
                access_token: account.access_token,
                token_type: account.token_type,
                scope: account.scope,
              },
            });
          }
        }

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, username: true },
        });

        if (dbUser && !dbUser.username) {
          const firstName = user.name?.trim().split(/\s+/)[0];

          let username: string;
          if (firstName) {
            username = firstName;
          } else {
            const playerCount = await prisma.user.count({
              where: { username: { startsWith: "player" } },
            });
            username = "player" + (playerCount + 1);
          }

          await prisma.user.update({
            where: { id: dbUser.id },
            data: { username },
          });
        }
      }
      return true;
    },
  },
});

export const { GET, POST } = handlers;