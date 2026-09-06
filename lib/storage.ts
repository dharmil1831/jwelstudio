import { randomId } from "@/lib/auth-utils";
import {
  getSupabaseAdmin,
  getSupabaseStorageBucket,
  isSupabaseStorageConfigured,
} from "@/lib/supabase";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function uploadsDir(): string {
  return path.join(process.cwd(), "data", "uploads");
}

function publicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

function contentTypeForExt(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  return "image/jpeg";
}

export function extensionForMime(mimeType: string | undefined | null): "png" | "jpg" | "webp" {
  const mime = (mimeType ?? "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

async function storeLocal(
  userId: string,
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const rel = `${userId}/${filename}`;
  const dir = path.join(uploadsDir(), userId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(uploadsDir(), rel), buffer);
  return `${publicBaseUrl()}/api/uploads/${rel}`;
}

async function storeSupabase(
  userId: string,
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const bucket = getSupabaseStorageBucket();
  const objectPath = `${userId}/${filename}`;

  const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    throw new Error("Supabase Storage did not return a public URL.");
  }
  return data.publicUrl;
}

async function storeImage(
  userId: string,
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  if (isSupabaseStorageConfigured()) {
    return storeSupabase(userId, buffer, filename, contentType);
  }
  return storeLocal(userId, buffer, filename);
}

/** Store generated image; returns a public URL (Supabase or local /api/uploads/...). */
export async function storeGenerationImage(
  userId: string,
  buffer: Buffer,
  ext: "png" | "jpg" | "webp" = "png",
): Promise<string> {
  const id = randomId();
  const filename = `${id}.${ext}`;
  return storeImage(userId, buffer, filename, contentTypeForExt(ext));
}

/** Store generated video (mp4/webm). */
export async function storeGenerationVideo(
  userId: string,
  buffer: Buffer,
  ext: "mp4" | "webm" = "mp4",
): Promise<string> {
  const id = randomId();
  const filename = `${id}.${ext}`;
  return storeImage(userId, buffer, filename, contentTypeForExt(ext));
}

export async function storeThumbnail(
  userId: string,
  buffer: Buffer,
): Promise<string> {
  const id = randomId();
  const filename = `thumb-${id}.jpg`;
  return storeImage(userId, buffer, filename, "image/jpeg");
}

/** Resolve local upload path only (used by /api/uploads). Returns null for cloud URLs. */
export function resolveUploadPath(relativePath: string): string | null {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  if (normalized.includes("..")) return null;
  const full = path.join(uploadsDir(), normalized);
  if (!full.startsWith(uploadsDir())) return null;
  return full;
}
