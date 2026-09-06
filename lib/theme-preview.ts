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

  try {
    const previewUrl = theme.previewUrl;
    const uploadsIdx = previewUrl.indexOf("/api/uploads/");
    if (uploadsIdx >= 0) {
      const rel = previewUrl
        .slice(uploadsIdx + "/api/uploads/".length)
        .split("?")[0];
      const full = resolveUploadPath(decodeURIComponent(rel));
      if (full) {
        const buf = await readFile(full);
        if (buf.length > 8_000_000) return null;
        return { data: buf.toString("base64"), mimeType: mimeFromPath(full) };
      }
    }

    const res = await fetch(previewUrl, { signal: AbortSignal.timeout(20_000) });
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
