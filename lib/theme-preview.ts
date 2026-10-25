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

/** Keep style-reference photos small enough for the image model. */
const EXTRA_IMAGE_MAX_BYTES = 1_200_000;

function supabaseRenderUrl(storedUrl: string): string | null {
  const marker = "/storage/v1/object/public/";
  const idx = storedUrl.indexOf(marker);
  if (idx < 0) return null;
  const objectPath = storedUrl.slice(idx + marker.length).split("?")[0];
  return `${storedUrl.slice(0, idx)}/storage/v1/render/image/public/${objectPath}?width=768&resize=contain&quality=70`;
}

async function packImageResponse(
  res: Response,
): Promise<{ data: string; mimeType: string } | null> {
  if (!res.ok) return null;
  const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  if (!mime.startsWith("image/")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > EXTRA_IMAGE_MAX_BYTES) return null;
  return {
    data: buf.toString("base64"),
    mimeType: mime === "image/jpg" ? "image/jpeg" : mime,
  };
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
        if (!buf.length || buf.length > EXTRA_IMAGE_MAX_BYTES) return null;
        return { data: buf.toString("base64"), mimeType: mimeFromPath(full) };
      }
    }

    const renderUrl = supabaseRenderUrl(storedUrl);
    if (renderUrl) {
      const rendered = await fetch(renderUrl, { signal: AbortSignal.timeout(20_000) });
      const packed = await packImageResponse(rendered);
      if (packed) return packed;
    }

    const res = await fetch(storedUrl, { signal: AbortSignal.timeout(20_000) });
    return packImageResponse(res);
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
