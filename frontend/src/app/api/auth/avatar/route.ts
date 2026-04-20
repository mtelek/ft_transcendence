import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { findUserFromSession } from "@/lib/auth-user";
import {
  isSharedAvatarFile,
  isUserOwnedAvatarFile,
  parseAvatarPath,
  readAvatarFiles,
  saveUploadedAvatar,
  toAvatarPath,
} from "@/lib/avatar-utils";

export async function GET() {
  try {
    // Restrict avatar list to shared defaults + current user's own uploads.
    const session = await auth();
    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    const user = await findUserFromSession(session);
    if (!user) {
      return jsonError("User not found", 404);
    }

    const files = await readAvatarFiles();
    const avatars = files
      .filter((file) => isSharedAvatarFile(file) || isUserOwnedAvatarFile(file, user.id))
      .map((file) => toAvatarPath(file));

    return jsonOk({ avatars });
  } catch {
    return jsonError("Failed to load avatars", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    //Avatar selection endpoint: assign an existing avatar file to the current user
    const session = await auth();

    if (!session?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { image } = (await request.json()) as { image?: string };

    //Validate path shape and block invalid/non-local avatar values
    const requestedFile = parseAvatarPath(image);
    if (!requestedFile) {
      return jsonError("Invalid avatar path", 400);
    }

    //Resolve authenticated app user and update avatar path in DB
    const user = await findUserFromSession(session);

    if (!user) {
      return jsonError("User not found", 404);
    }

    //Ensure the requested file exists and belongs to the current user's visible set
    const files = await readAvatarFiles();
    if (!files.includes(requestedFile)) {
      return jsonError("Avatar not found", 400);
    }

    if (!isSharedAvatarFile(requestedFile) && !isUserOwnedAvatarFile(requestedFile, user.id)) {
      return jsonError("You cannot use this avatar", 403);
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
    //Avatar upload endpoint: store uploaded image and assign it to current user
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

    // Require multipart field named "file".
    if (!(file instanceof File)) {
      return jsonError("No file provided", 400);
    }

    let fileName: string;
    try {
      //saveUploadedAvatar performs type/size checks and writes the file
      fileName = await saveUploadedAvatar(file, user.id);
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
