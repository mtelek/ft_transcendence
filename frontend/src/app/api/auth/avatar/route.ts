import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { findUserFromSession } from "@/lib/auth-user";
import { parseAvatarPath, readAvatarFiles, saveUploadedAvatar, toAvatarPath } from "@/lib/avatar-utils";

export async function GET() {
  try {
    const files = await readAvatarFiles();
    const avatars = files.map((file) => toAvatarPath(file));
    return jsonOk({ avatars });
  } catch {
    return jsonError("Failed to load avatars", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { image } = (await request.json()) as { image?: string };
    const requestedFile = parseAvatarPath(image);
    if (!requestedFile) {
      return jsonError("Invalid avatar path", 400);
    }

    const files = await readAvatarFiles();
    if (!files.includes(requestedFile)) {
      return jsonError("Avatar not found", 400);
    }

    const user = await findUserFromSession(session);

    if (!user) {
      return jsonError("User not found", 404);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { image: toAvatarPath(requestedFile) },
    });

    return jsonOk({ image: toAvatarPath(requestedFile) });
  } catch {
    return jsonError("Failed to update avatar", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    const user = await findUserFromSession(session);

    if (!user) {
      return jsonError("User not found", 404);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("No file provided", 400);
    }

    let fileName: string;
    try {
      fileName = await saveUploadedAvatar(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload avatar";
      return jsonError(message, 400);
    }

    const image = toAvatarPath(fileName);

    await prisma.user.update({
      where: { id: user.id },
      data: { image },
    });

    return jsonOk({ image }, 201);
  } catch {
    return jsonError("Failed to upload avatar", 500);
  }
}
