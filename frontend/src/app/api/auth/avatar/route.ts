import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-response";
import { findUserFromSession } from "@/lib/auth-user";
import {
  isSharedAvatarFile,
  isUserOwnedAvatarFile,
  parseAvatarPath,
  readAvatarFiles,
  saveUploadedAvatar,
  toAvatarPath,
} from "@/lib/avatar-utils";

// Simple in-memory rate limiter: max 5 uploads per user per 24 hours
const uploadAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 86400000; // 24 hours in milliseconds
const RATE_LIMIT_MAX = 5;

function okError(message: string) {
  return jsonOk({ error: message });
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const attempts = uploadAttempts.get(userId) || [];

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (recentAttempts.length >= RATE_LIMIT_MAX) {
    return false;
  }

  recentAttempts.push(now);
  uploadAttempts.set(userId, recentAttempts);
  return true;
}

export async function GET() {
  try {
    // Restrict avatar list to shared defaults + current user's own uploads.
    const session = await auth();
    if (!session?.user) {
      return okError("Unauthorized");
    }

    const user = await findUserFromSession(session);
    if (!user) {
      return okError("User not found");
    }

    const files = await readAvatarFiles();
    const avatars = files
      .filter((file) => isSharedAvatarFile(file) || isUserOwnedAvatarFile(file, user.id))
      .map((file) => toAvatarPath(file));

    const response = jsonOk({ avatars });
    response.headers.set("Cache-Control", "public, max-age=300");
    return response;
  } catch {
    return okError("Failed to load avatars");
  }
}

export async function PATCH(request: Request) {
  try {
    //Avatar selection endpoint: assign an existing avatar file to the current user
    const session = await auth();

    if (!session?.user) {
      return okError("Unauthorized");
    }

    const { image } = (await request.json()) as { image?: string };

    //Validate path shape and block invalid/non-local avatar values
    const requestedFile = parseAvatarPath(image);
    if (!requestedFile) {
      return okError("Invalid avatar path");
    }

    //Resolve authenticated app user and update avatar path in DB
    const user = await findUserFromSession(session);

    if (!user) {
      return okError("User not found");
    }

    //Ensure the requested file exists and belongs to the current user's visible set
    const files = await readAvatarFiles();
    if (!files.includes(requestedFile)) {
      return okError("Avatar not found");
    }

    if (!isSharedAvatarFile(requestedFile) && !isUserOwnedAvatarFile(requestedFile, user.id)) {
      return okError("You cannot use this avatar");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { image: toAvatarPath(requestedFile) },
    });

    const response = jsonOk({ image: toAvatarPath(requestedFile) });
    response.headers.set("Cache-Control", "public, max-age=300");
    return response;
  } catch {
    return okError("Failed to update avatar");
  }
}

export async function POST(request: Request) {
  try {
    //Avatar upload endpoint: store uploaded image and assign it to current user
    const session = await auth();

    if (!session?.user) {
      return okError("Unauthorized");
    }

    const user = await findUserFromSession(session);

    if (!user) {
      return okError("User not found");
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return okError("Too many uploads. Maximum 5 per day.");
    }

    const formData = await request.formData();
    const file = formData.get("file");

    // Require multipart field named "file".
    if (!(file instanceof File)) {
      return okError("No file provided");
    }

    let fileName: string;
    try {
      //saveUploadedAvatar performs type/size/magic byte/dimension checks and writes the file
      fileName = await saveUploadedAvatar(file, user.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload avatar";
      return okError(message);
    }

    const image = toAvatarPath(fileName);

    await prisma.user.update({
      where: { id: user.id },
      data: { image },
    });

    const response = jsonOk({ image }, 201);
    return response;
  } catch {
    return okError("Failed to upload avatar");
  }
}
