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

/** Same-origin file route. Phones save it into the gallery; browsers download the file. */
export async function downloadGenerationFile(id: string, filename: string): Promise<void> {
  const res = await fetch(`/api/generations/${encodeURIComponent(id)}/file`);
  if (!res.ok) throw new Error("Could not download image");
  const blob = await res.blob();
  let name = filename || `jwelpixel-${id}`;
  if (!/\.(png|jpe?g|webp|mp4|webm)$/i.test(name)) {
    name = `${name.replace(/\.$/, "")}.${extensionFromBlob(blob)}`;
  }
  await saveBlob(blob, name);
}

type GalleryBridge = {
  saveBase64: (data: string, filename: string, mime: string) => boolean;
};

function galleryBridge(): GalleryBridge | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as Window & { JwelpixelDownload?: GalleryBridge }).JwelpixelDownload;
  if (!bridge || typeof bridge.saveBase64 !== "function") return null;
  return bridge;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

/** iPhone Photos and camera uploads only reliably accept a normal JPEG. */
async function ensureJpeg(blob: Blob): Promise<Blob> {
  if (blob.type.startsWith("video/")) return blob;
  if (blob.type === "image/jpeg" || blob.type === "image/jpg") return blob;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx || !canvas.width || !canvas.height) throw new Error("Could not read image");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (out) => (out ? resolve(out) : reject(new Error("Could not read image"))),
        "image/jpeg",
        0.92,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** JPEG cannot store a clear background. Keep a PNG only when pixels are actually transparent. */
async function hasTransparentPixels(blob: Blob): Promise<boolean> {
  if (!blob.type.includes("png")) return false;
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !canvas.width || !canvas.height) return false;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function jpgName(filename: string): string {
  const base = filename.replace(/\.(png|jpe?g|webp|heic|heif)$/i, "");
  return `${base}.jpg`;
}

function pngName(filename: string): string {
  const base = filename.replace(/\.(png|jpe?g|webp|heic|heif)$/i, "");
  return `${base}.png`;
}

export async function saveBlob(blob: Blob, filename: string): Promise<void> {
  const video = blob.type.startsWith("video/");
  const transparent = !video && (await hasTransparentPixels(blob));
  const fileBlob = video || transparent ? blob : await ensureJpeg(blob);
  const name = video ? filename : transparent ? pngName(filename) : jpgName(filename);
  const mime = video
    ? fileBlob.type || "video/mp4"
    : transparent
      ? "image/png"
      : "image/jpeg";

  const bridge = galleryBridge();
  if (bridge) {
    const data = await blobToBase64(fileBlob);
    const saved = bridge.saveBase64(data, name, mime);
    if (!saved) throw new Error("Could not save image");
    return;
  }

  const objectUrl = URL.createObjectURL(fileBlob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
