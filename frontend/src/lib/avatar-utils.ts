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
const MAX_IMAGE_DIMENSION = 2048;
const MAX_UPLOADS_PER_USER = 2;
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "image/gif": [0x47, 0x49, 0x46],
};

// Verify magic bytes match declared MIME type
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const bytes = MAGIC_BYTES[mimeType];
  if (!bytes || buffer.length < bytes.length) return false;
  return bytes.every((b, i) => buffer[i] === b);
}

// Check image dimensions using buffer parsing (lightweight, no sharp dependency)
function verifyImageDimensions(buffer: Buffer, mimeType: string): boolean {
  try {
    if (mimeType === "image/png") {
      // PNG: width/height at bytes 16-24
      if (buffer.length < 24) return false;
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION;
    }
    if (mimeType === "image/jpeg") {
      // JPEG: scan for SOF marker and read dimensions
      for (let i = 2; i < Math.min(buffer.length, 8192); i++) {
        if (buffer[i] === 0xff && (buffer[i + 1] === 0xc0 || buffer[i + 1] === 0xc2)) {
          const height = buffer.readUInt16BE(i + 5);
          const width = buffer.readUInt16BE(i + 7);
          return width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION;
        }
      }
    }
    // GIF/WebP: allow without dimension parsing for simplicity
    return true;
  } catch {
    return false;
  }
}

// Clean up old uploads beyond quota
async function cleanupOldUploads(userId: string): Promise<void> {
  const files = await readAvatarFiles();
  const userUploads = files.filter((f) => isUserOwnedAvatarFile(f, userId));

  if (userUploads.length >= MAX_UPLOADS_PER_USER) {
    // Sort by timestamp in filename (sequential index = older files have lower numbers)
    const toDelete = userUploads.slice(0, userUploads.length - MAX_UPLOADS_PER_USER + 1);
    for (const file of toDelete) {
      try {
        await fs.unlink(path.join(AVATARS_DIR, file));
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

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

  return MIME_TO_EXTENSION[file.type] ?? null;
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

async function saveBufferAsUploaded(buffer: Buffer, ext: string, userId: string) {
  const existingFiles = await readAvatarFiles();
  const userUploadPrefix = getUserUploadPrefix(userId);
  const nextIndex = getNextUploadedIndex(existingFiles, userUploadPrefix);
  const fileName = `${userUploadPrefix}${nextIndex}${ext}`;
  const filePath = path.join(AVATARS_DIR, fileName);

  await fs.writeFile(filePath, buffer);

  return fileName;
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

  //Convert the browser File into a Node.js buffer so it can be saved locally
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Verify magic bytes match declared MIME type
  if (!verifyMagicBytes(buffer, file.type)) {
    throw new Error("File signature does not match declared type");
  }

  // Verify image dimensions
  if (!verifyImageDimensions(buffer, file.type)) {
    throw new Error("Image exceeds maximum dimensions (2048x2048)");
  }

  // Clean up old uploads before saving new one
  await cleanupOldUploads(userId);

  return saveBufferAsUploaded(buffer, ext, userId);
}

export async function saveRemoteAvatarAsUploaded(imageUrl: string, userId: string) {
  // Reuse upload rules for remote images so Google avatars are handled like user uploads.
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to download remote avatar");
  }

  const mimeType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error("Unsupported file type");
  }

  const ext = MIME_TO_EXTENSION[mimeType];
  if (!ext) {
    throw new Error("Unsupported avatar extension");
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File too large");
  }

  const buffer = Buffer.from(bytes);

  // Verify magic bytes
  if (!verifyMagicBytes(buffer, mimeType)) {
    throw new Error("Downloaded file signature does not match declared type");
  }

  // Verify dimensions
  if (!verifyImageDimensions(buffer, mimeType)) {
    throw new Error("Image exceeds maximum dimensions (2048x2048)");
  }

  // Clean up old uploads before saving
  await cleanupOldUploads(userId);

  return saveBufferAsUploaded(buffer, ext, userId);
}
