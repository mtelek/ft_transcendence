import { promises as fs } from "fs";
import path from "path";

export const AVATAR_PREFIX = "/avatars/";

const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function readAvatarFiles() {
  const entries = await fs.readdir(AVATARS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

export function toAvatarPath(fileName: string) {
  return `${AVATAR_PREFIX}${fileName}`;
}

export function parseAvatarPath(image: unknown) {
  if (typeof image !== "string" || !image.startsWith(AVATAR_PREFIX)) {
    return null;
  }

  const requestedFile = image.slice(AVATAR_PREFIX.length);

  if (!requestedFile || requestedFile.includes("/") || requestedFile.includes("..")) {
    return null;
  }

  return requestedFile;
}
