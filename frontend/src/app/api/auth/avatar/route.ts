import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

async function readAvatarFiles() {
  const entries = await fs.readdir(AVATARS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

export async function GET() {
  try {
    const files = await readAvatarFiles();
    const avatars = files.map((file) => `/avatars/${file}`);
    return NextResponse.json({ avatars }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load avatars" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = (await request.json()) as { image?: string };

    if (typeof image !== "string" || !image.startsWith("/avatars/")) {
      return NextResponse.json({ error: "Invalid avatar path" }, { status: 400 });
    }

    const requestedFile = image.replace("/avatars/", "");

    if (!requestedFile || requestedFile.includes("/") || requestedFile.includes("..")) {
      return NextResponse.json({ error: "Invalid avatar file" }, { status: 400 });
    }

    const files = await readAvatarFiles();
    if (!files.includes(requestedFile)) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 400 });
    }

    const email = session.user.email ?? undefined;
    const username = session.user.name ?? undefined;

    if (!email && !username) {
      return NextResponse.json({ error: "Unable to resolve user" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(username ? [{ username }] : []),
        ],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { image },
    });

    return NextResponse.json({ image }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
  }
}
