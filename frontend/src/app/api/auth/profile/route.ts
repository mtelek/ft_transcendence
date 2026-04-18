import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type ProfilePatchBody = {
  username?: string;
  email?: string;
  password?: string;
};

async function getCurrentUserFromSession(session: { user?: { email?: string | null; name?: string | null } }) {
  const sessionEmail = session.user?.email ?? undefined;
  const sessionUsername = session.user?.name ?? undefined;

  if (!sessionEmail && !sessionUsername) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: [
        ...(sessionEmail ? [{ email: sessionEmail }] : []),
        ...(sessionUsername ? [{ username: sessionUsername }] : []),
      ],
    },
    select: { id: true, username: true, email: true, password: true },
  });
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await getCurrentUserFromSession(session);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: { username: currentUser.username, email: currentUser.email },
        canChangePassword: Boolean(currentUser.password),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ProfilePatchBody;
    const nextUsername = body.username?.trim();
    const nextEmail = body.email?.trim();
    const nextPassword = body.password?.trim();

    if (!nextUsername && !nextEmail && !nextPassword) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const currentUser = await getCurrentUserFromSession(session);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dataToUpdate: { username?: string; email?: string; password?: string } = {};

    if (nextUsername) {
      dataToUpdate.username = nextUsername;
    }

    if (nextEmail) {
      dataToUpdate.email = nextEmail;
    }

    if (nextPassword) {
      dataToUpdate.password = await bcrypt.hash(nextPassword, 10);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        {
          message: "No changes detected",
          user: { username: currentUser.username, email: currentUser.email },
        },
        { status: 200 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: dataToUpdate,
      select: { username: true, email: true },
    });

    return NextResponse.json(
      {
        message: "Profile updated",
        user: { username: updatedUser.username, email: updatedUser.email },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
