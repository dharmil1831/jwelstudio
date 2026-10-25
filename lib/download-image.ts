import type { OutputFormat } from "@/lib/style-options";
import { OUTPUT_FORMAT_EXPORT_PX } from "@/lib/style-options";

export function filenameFromUrl(url: string, fallback = "jwelpixel.jpg"): string {
  try {
    const pathname = new URL(url, "http://localhost").pathname;
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
  const urlExt = /\.(png|jpe?g|webp|mp4|webm)$/i.exec(fromUrl)?.[1]?.toLowerCase();
  const ext =
    urlExt === "jpeg" ? "jpg" : urlExt || extensionFromMime(mimeHint) || "jpg";
  const base = preferredBase.replace(/\.(png|jpe?g|webp|mp4|webm)$/i, "");
  return `${base}.${ext}`;
}

/**
 * Resize a generated image to exact Instagram/WhatsApp pixel targets
 * (contain + soft plum letterbox so jewelry is never cropped).
 */
async function loadImage(
  sourceUrl: string,
): Promise<{ img: HTMLImageElement; revoke: () => void }> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error("Could not load image for export.");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load image for export."));
    el.src = objectUrl;
  });
  return { img, revoke: () => URL.revokeObjectURL(objectUrl) };
}

export async function exportExactSizeJpeg(
  sourceUrl: string,
  width: number,
  height: number,
): Promise<Blob> {
  const { img, revoke } = await loadImage(sourceUrl);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#e8e0f0";
  ctx.fillRect(0, 0, width, height);

  const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const x = Math.round((width - w) / 2);
  const y = Math.round((height - h) / 2);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, x, y, w, h);

  try {
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
        "image/jpeg",
        0.92,
      );
    });
  } finally {
    revoke();
  }
}

export async function exportSocialSizedJpeg(
  sourceUrl: string,
  format: OutputFormat,
): Promise<Blob> {
  const target = OUTPUT_FORMAT_EXPORT_PX[format] ?? {
    width: 1080,
    height: 1080,
  };
  return exportExactSizeJpeg(sourceUrl, target.width, target.height);
}

export async function downloadImage(
  url: string,
  filename: string,
  format?: OutputFormat,
): Promise<void> {
  let blob: Blob;
  let finalName = filename;

  if (format && typeof document !== "undefined") {
    try {
      blob = await exportSocialSizedJpeg(url, format);
      if (!/\.jpe?g$/i.test(finalName)) {
        finalName = finalName.replace(/\.[a-z0-9]+$/i, "") + ".jpg";
      }
    } catch {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not download image");
      blob = await res.blob();
    }
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not download image");
    blob = await res.blob();
  }

  if (!/\.(png|jpe?g|webp|mp4|webm)$/i.test(finalName)) {
    finalName = `${finalName.replace(/\.$/, "")}.${extensionFromBlob(blob)}`;
  } else {
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

  await saveBlob(blob, finalName);
}

/** Same-origin file route. The browser saves it; do not open the system share sheet. */
export function downloadGenerationFile(id: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = `/api/generations/${encodeURIComponent(id)}/file`;
  anchor.download = filename || `jwelpixel-${id}`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
