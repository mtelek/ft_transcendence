import { promises as fs } from "fs";
import path from "path";

//Public URL prefix used when storing avatar paths in user records
export const AVATAR_PREFIX = "/avatars/";

//Avatar files live in the public folder so they can be served directly by Next.js
const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const LEGACY_UPLOAD_RE = /^uploaded\d+\.[a-z0-9]+$/i;
const USER_UPLOAD_RE = /^user-[a-z0-9_-]+-uploaded\d+\.[a-z0-9]+$/i;

export async function readAvatarFiles() {
  //Return only supported avatar image files in a stable sorted order
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
  //Accept only local avatar paths that use the expected public prefix
  if (typeof image !== "string" || !image.startsWith(AVATAR_PREFIX)) {
    return null;
  }

  const requestedFile = image.slice(AVATAR_PREFIX.length);

  //Reject nested paths and traversal attempts so only direct avatar files are allowed
  if (!requestedFile || requestedFile.includes("/") || requestedFile.includes("..")) {
    return null;
  }

  return requestedFile;
}

function resolveFileExtension(file: File) {
  //Prefer the original extension when valid, otherwise fall back to MIME type mapping
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUserIdForFile(userId: string) {
  return userId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function getUserUploadPrefix(userId: string) {
  const safeUserId = normalizeUserIdForFile(userId);
  if (!safeUserId) {
    throw new Error("Invalid user id");
  }
  return `user-${safeUserId}-uploaded`;
}

export function isSharedAvatarFile(fileName: string) {
  // Shared avatars are predefined assets, not uploaded-* files.
  return !LEGACY_UPLOAD_RE.test(fileName) && !USER_UPLOAD_RE.test(fileName);
}

export function isUserOwnedAvatarFile(fileName: string, userId: string) {
  const prefix = getUserUploadPrefix(userId);
  return new RegExp(`^${escapeRegExp(prefix)}\\d+\\.[a-z0-9]+$`, "i").test(fileName);
}

function getNextUploadedIndex(existingFiles: string[], userUploadPrefix: string) {
  // Keep each user's uploaded names sequential so files stay owner-scoped.
  let maxIndex = 0;
  const pattern = new RegExp(`^${escapeRegExp(userUploadPrefix)}(\\d+)\\.[a-z0-9]+$`, "i");

  for (const fileName of existingFiles) {
    const match = pattern.exec(fileName);
    if (!match) continue;

    const index = Number.parseInt(match[1], 10);
    if (Number.isFinite(index) && index > maxIndex) {
      maxIndex = index;
    }
  }

  return maxIndex + 1;
}

export async function saveUploadedAvatar(file: File, userId: string) {
  //Validate upload type and size before writing anything to disk
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
  const userUploadPrefix = getUserUploadPrefix(userId);
  const nextIndex = getNextUploadedIndex(existingFiles, userUploadPrefix);
  const fileName = `${userUploadPrefix}${nextIndex}${ext}`;
  const filePath = path.join(AVATARS_DIR, fileName);

  //Convert the browser File into a Node.js buffer so it can be saved locally
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await fs.writeFile(filePath, buffer);

  return fileName;
}
