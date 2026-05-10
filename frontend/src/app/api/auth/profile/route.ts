import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { findUserFromSession } from "@/lib/auth-user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_USERNAME_LENGTH = 15;

type ProfilePatchBody = {
  username?: string;
  email?: string;
  password?: string;
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return jsonOk({ error: "Unauthorized" });
    }

    const currentUser = await findUserFromSession(session);

    if (!currentUser) {
      return jsonOk({ error: "User not found" });
    }

    return jsonOk(
      {
        user: { username: currentUser.username, email: currentUser.email },
        canChangePassword: Boolean(currentUser.password),
      }
    );
  } catch {
    return jsonOk({ error: "Failed to load profile" });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return jsonOk({ error: "Unauthorized" });
    }

    const body = (await request.json()) as ProfilePatchBody;
    const nextUsername = body.username?.trim();
    const nextEmail = body.email?.trim();
    const nextPassword = body.password?.trim();

    if (!nextUsername && !nextEmail && !nextPassword) {
      return jsonOk({ error: "No changes provided" });
    }

    const currentUser = await findUserFromSession(session);

    if (!currentUser) {
      return jsonOk({ error: "User not found" });
    }

    // Keep profile edits aligned with registration minimum validation rules.
    if (nextUsername && nextUsername.length > MAX_USERNAME_LENGTH) {
      return jsonOk({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or less` });
    }

    if (nextEmail && !EMAIL_RE.test(nextEmail)) {
      return jsonOk({ error: "Invalid email format" });
    }

    if (nextPassword && nextPassword.length < MIN_PASSWORD_LENGTH) {
      return jsonOk({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
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
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return jsonOk({ error: "Email or username already taken" });
    }

    return jsonOk({ error: "Failed to update profile" });
  }
}
