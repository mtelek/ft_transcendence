import { promises as fs } from "fs";
import path from "path";

export const AVATAR_PREFIX = "/avatars/";

const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

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

function resolveFileExtension(file: File) {
  const extFromName = path.extname(file.name).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(extFromName)) {
    return extFromName;
  }

  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";

  return null;
}

function getNextUploadedIndex(existingFiles: string[]) {
  let maxIndex = 0;

  for (const fileName of existingFiles) {
    const match = /^uploaded(\d+)\.[a-z0-9]+$/i.exec(fileName);
    if (!match) continue;

    const index = Number.parseInt(match[1], 10);
    if (Number.isFinite(index) && index > maxIndex) {
      maxIndex = index;
    }
  }

  return maxIndex + 1;
}

export async function saveUploadedAvatar(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported file type");
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File too large");
  }

  const ext = resolveFileExtension(file);
  if (!ext) {
    throw new Error("Unsupported avatar extension");
  }

  const existingFiles = await readAvatarFiles();
  const nextIndex = getNextUploadedIndex(existingFiles);
  const fileName = `uploaded${nextIndex}${ext}`;
  const filePath = path.join(AVATARS_DIR, fileName);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await fs.writeFile(filePath, buffer);

  return fileName;
}
