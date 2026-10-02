import { prisma } from "@/lib/prisma";
import { resolveUploadPath } from "@/lib/storage";
import { parseThemeStyleJson } from "@/lib/themes";
import { readFile } from "fs/promises";

function mimeFromPath(p: string): string {
  const ext = p.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Load a stored generation/theme image (local upload path or HTTP). */
export async function loadStoredImage(
  storedUrl: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const uploadsIdx = storedUrl.indexOf("/api/uploads/");
    if (uploadsIdx >= 0) {
      const rel = storedUrl
        .slice(uploadsIdx + "/api/uploads/".length)
        .split("?")[0];
      const full = resolveUploadPath(decodeURIComponent(rel));
      if (full) {
        const buf = await readFile(full);
        if (buf.length > 8_000_000) return null;
        return { data: buf.toString("base64"), mimeType: mimeFromPath(full) };
      }
    }

    const res = await fetch(storedUrl, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") || "image/jpeg";
    if (!mime.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 8_000_000) return null;
    return { data: buf.toString("base64"), mimeType: mime.split(";")[0] };
  } catch {
    return null;
  }
}

/** Load theme preview image for Gemini style reference (local file or HTTP). */
export async function fetchThemePreviewAsExtra(
  userId: string,
  themeId: string,
): Promise<{ data: string; mimeType: string } | null> {
  const theme = await prisma.theme.findFirst({
    where: { id: themeId, userId },
  });
  if (!theme?.previewUrl) return null;
  const style = parseThemeStyleJson(theme.styleJson);
  // Default true for older themes that omitted the flag
  if (style && style.usePreviewAsReference === false) return null;
  return loadStoredImage(theme.previewUrl);
}

/** Load one of this user's prior generations to reuse as a shared batch background. */
export async function fetchOwnedGenerationImage(
  userId: string,
  generationId: string,
): Promise<{ data: string; mimeType: string } | null> {
  const row = await prisma.generation.findFirst({
    where: { id: generationId, userId },
    select: { resultUrl: true },
  });
  if (!row?.resultUrl) return null;
  return loadStoredImage(row.resultUrl);
}
