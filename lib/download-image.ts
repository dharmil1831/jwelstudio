export function filenameFromUrl(url: string, fallback = "jewel-studio.jpg"): string {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const base = pathname.split("/").pop();
    if (base) return base;
  } catch {
    // ignore invalid URLs
  }
  return fallback;
}

export function extensionFromMime(mimeType: string | undefined | null): string {
  const mime = (mimeType ?? "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "jpg";
}

export function extensionFromBlob(blob: Blob): string {
  return extensionFromMime(blob.type);
}

/** Prefer URL extension, then Content-Type / blob type, then requested name. */
export function downloadFilename(
  url: string,
  preferredBase: string,
  mimeHint?: string | null,
): string {
  const fromUrl = filenameFromUrl(url, "");
  if (fromUrl && /\.(png|jpe?g|webp|mp4|webm)$/i.test(fromUrl)) {
    return fromUrl;
  }
  const base = preferredBase.replace(/\.(png|jpe?g|webp|mp4|webm)$/i, "");
  const ext = extensionFromMime(mimeHint) || "jpg";
  return `${base}.${ext}`;
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not download image");
  const blob = await res.blob();

  let finalName = filename;
  if (!/\.(png|jpe?g|webp|mp4|webm)$/i.test(finalName)) {
    finalName = `${finalName.replace(/\.$/, "")}.${extensionFromBlob(blob)}`;
  } else {
    // Fix wrong .png when server actually returned JPEG (common with Gemini).
    const realExt = extensionFromBlob(blob);
    if (realExt && !finalName.toLowerCase().endsWith(`.${realExt}`)) {
      if (
        (finalName.toLowerCase().endsWith(".png") && realExt === "jpg") ||
        (finalName.toLowerCase().endsWith(".jpg") && realExt === "png") ||
        (finalName.toLowerCase().endsWith(".jpeg") && realExt === "png")
      ) {
        finalName = finalName.replace(/\.(png|jpe?g|webp)$/i, `.${realExt}`);
      }
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = finalName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
