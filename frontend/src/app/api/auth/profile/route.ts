import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { findUserFromSession } from "@/lib/auth-user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type ProfilePatchBody = {
  username?: string;
  email?: string;
  password?: string;
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    const currentUser = await findUserFromSession(session);

    if (!currentUser) {
      return jsonError("User not found", 404);
    }

    return jsonOk(
      {
        user: { username: currentUser.username, email: currentUser.email },
        canChangePassword: Boolean(currentUser.password),
      }
    );
  } catch {
    return jsonError("Failed to load profile", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    const body = (await request.json()) as ProfilePatchBody;
    const nextUsername = body.username?.trim();
    const nextEmail = body.email?.trim();
    const nextPassword = body.password?.trim();

    if (!nextUsername && !nextEmail && !nextPassword) {
      return jsonError("No changes provided", 400);
    }

    const currentUser = await findUserFromSession(session);

    if (!currentUser) {
      return jsonError("User not found", 404);
    }

    // Keep profile edits aligned with registration minimum validation rules.
    if (nextEmail && !EMAIL_RE.test(nextEmail)) {
      return jsonError("Invalid email format", 400);
    }

    if (nextPassword && nextPassword.length < MIN_PASSWORD_LENGTH) {
      return jsonError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
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
      return jsonOk(
        {
          message: "No changes detected",
          user: { username: currentUser.username, email: currentUser.email },
        }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: dataToUpdate,
      select: { username: true, email: true },
    });

    return jsonOk(
      {
        message: "Profile updated",
        user: { username: updatedUser.username, email: updatedUser.email },
      }
    );
  } catch {
    return jsonError("Failed to update profile", 500);
  }
}
