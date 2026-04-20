import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { AVATAR_PREFIX, saveRemoteAvatarAsUploaded, toAvatarPath } from "@/lib/avatar-utils";
import { authConfig } from "@/auth.config";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

//Base adapter is extended below to enforce project-specific user/session behavior
const adapter = PrismaAdapter(prisma);

//Prefer a readable username from OAuth name; otherwise fall back to playerN
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

type TokenShape = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  image?: unknown;
  hasPassword?: unknown;
};

type UserShape = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  image?: unknown;
};

//Keep token/session synchronization logic in small helpers to avoid callback bloat
function applyUserToToken(token: TokenShape, user: UserShape) {
  token.id = user.id;
  token.name = user.name;
  token.email = user.email;
  token.image = user.image ?? DEFAULT_AVATAR;
}

function applySessionUpdateToToken(token: TokenShape, session: { image?: unknown; name?: unknown; email?: unknown }) {
  if (typeof session.image === "string") {
    token.image = session.image;
  }
  if (typeof session.name === "string") {
    token.name = session.name;
  }
  if (typeof session.email === "string") {
    token.email = session.email;
  }
}

function applyDbUserToToken(
  token: TokenShape,
  dbUser: { username: string | null; image: string | null; password: string | null } | null
) {
  if (dbUser?.username) {
    token.name = dbUser.username;
  }
  token.image = dbUser?.image ?? (typeof token.image === "string" ? token.image : DEFAULT_AVATAR);
  // Expose whether this account has a local password so UI can avoid post-render capability fetches.
  token.hasPassword = Boolean(dbUser?.password);
}

function applyTokenToSession(
  session: { user?: { name?: string | null; email?: string | null; image?: string | null; hasPassword?: boolean } },
  token: TokenShape
) {
  if (!session.user) {
    return;
  }

  if (typeof token.name === "string") {
    session.user.name = token.name;
  }
  if (typeof token.email === "string") {
    session.user.email = token.email;
  }
  session.user.image = typeof token.image === "string" ? token.image : DEFAULT_AVATAR;
  session.user.hasPassword = Boolean(token.hasPassword);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  adapter: {
    ...adapter,
    //Ensure users created via OAuth always get project defaults and a username
    async createUser(data) {
      const username = await getUniqueUsername(data.name);
      const initialImage = data.image ?? DEFAULT_AVATAR;

      const created = await prisma.user.create({
        data: {
          email: data.email,
          image: initialImage,
          emailVerified: data.emailVerified,
          username,
        },
      });

      // Persist OAuth profile image as a local avatar on first account creation.
      if (typeof initialImage === "string" && !initialImage.startsWith(AVATAR_PREFIX)) {
        try {
          const fileName = await saveRemoteAvatarAsUploaded(initialImage, created.id);
          const localImage = toAvatarPath(fileName);

          await prisma.user.update({
            where: { id: created.id },
            data: { image: localImage },
          });

          created.image = localImage;
        } catch {
          // Keep OAuth signup successful even if avatar localization fails.
        }
      }

      return {
        id: created.id,
        email: created.email ?? data.email,
        name: created.username ?? data.name,
        image: created.image,
        emailVerified: created.emailVerified,
      };
    },
    //Treat missing/deleted session records as successful sign-out
    async deleteSession(sessionToken) {
      try {
        return await prisma.session.delete({
          where: { sessionToken },
        });
      } catch {
        //Session already deleted or missing, treat sign-out as successful
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
        return {
          id: String(user.id),
          email: user.email,
          name: user.username,
          image: user.image ?? DEFAULT_AVATAR,
        };
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
  //Signalling error=CredentialsSignin&code=credentials correctly
  logger: {
    error(error) {
      const authError = error as Error & { type?: string };
      if (authError.type === "CredentialsSignin") return;
      console.error(error);
    },
  },
  callbacks: {
    //Keep token fields in sync with user data and client-triggered profile updates
    async jwt({ token, user, trigger, session }) {
      if (user) {
        applyUserToToken(token, user);
      }

      if (trigger === "update" && session) {
        applySessionUpdateToToken(token, session as { image?: unknown; name?: unknown; email?: unknown });
      }

      //Refresh name/avatar from DB so sessions reflect profile edits across devices
      if (typeof token.email === "string") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { username: true, image: true, password: true },
        });
        applyDbUserToToken(token, dbUser);
      }

      return token;
    },
    async session({ session, token }) {
      applyTokenToSession(session, token);
      return session;
    },
    async signIn({ user, account }) {
      //Auto-link Google account with existing email
      if (account?.provider === "google" && user.email) {
        //Check if user already has this provider linked
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId || "",
            },
          },
        });

        if (!existingAccount) {
          //Find user by email and link Google account
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
          select: { id: true, username: true, image: true },
        });

        // On first Google sign-in, store provider avatar locally so it appears in this user's picker.
        if (
          dbUser &&
          typeof user.image === "string" &&
          user.image.length > 0 &&
          (!dbUser.image || !dbUser.image.startsWith(AVATAR_PREFIX))
        ) {
          try {
            const fileName = await saveRemoteAvatarAsUploaded(user.image, dbUser.id);
            const localImage = toAvatarPath(fileName);

            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: localImage },
            });

            user.image = localImage;
          } catch {
            // Keep sign-in successful even if remote avatar download/storage fails.
          }
        }

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