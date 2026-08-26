const UNREADABLE_IMAGE =
  "Could not read this photo. On iPhone, use JPG: Settings → Camera → Formats → Most Compatible, or share the photo as JPG.";

/** Soft cap for generate API (server rejects above 6_000_000). */
export const MAX_UPLOAD_BASE64_CHARS = 5_800_000;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.split(",")[1] ?? "";
      if (!base64) {
        reject(new Error("Could not process image"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not process image"));
    reader.readAsDataURL(file);
  });
}

/**
 * Prefer the original photo (no recompress). Only downscale if the payload
 * would exceed the API size limit — then use the largest size that still fits.
 */
export async function prepareImageForUpload(
  file: File,
  maxBase64Chars = MAX_UPLOAD_BASE64_CHARS,
): Promise<{ base64: string; mimeType: string }> {
  const type = (file.type || "image/jpeg").toLowerCase();
  const canSendOriginal =
    !isHeicLike(file) &&
    (type.startsWith("image/jpeg") ||
      type.startsWith("image/png") ||
      type.startsWith("image/webp") ||
      type === "image/jpg");

  if (canSendOriginal) {
    try {
      const base64 = await fileToBase64(file);
      if (base64.length <= maxBase64Chars) {
        return {
          base64,
          mimeType: type === "image/jpg" ? "image/jpeg" : type || "image/jpeg",
        };
      }
    } catch {
      /* fall through to canvas path */
    }
  }

  let decoded: { source: CanvasImageSource; width: number; height: number };
  try {
    decoded = await decodeImage(file);
  } catch (e) {
    if (isHeicLike(file)) throw new Error(UNREADABLE_IMAGE);
    throw e instanceof Error ? e : new Error(UNREADABLE_IMAGE);
  }

  if (!decoded.width || !decoded.height) {
    throw new Error(UNREADABLE_IMAGE);
  }

  // Quality-first: only shrink enough to fit the payload — no aggressive compress ladder.
  const edges = [2048, 1920, 1600, 1536, 1280, 1024];
  const quality = 0.95;
  let lastError: Error | null = null;
  let lastResult: { base64: string; mimeType: string } | null = null;

  try {
    for (const maxEdge of edges) {
      try {
        const canvas = drawScaled(decoded, maxEdge);
        const result = await canvasToJpeg(canvas, quality);
        lastResult = result;
        if (result.base64.length <= maxBase64Chars) {
          return result;
        }
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(UNREADABLE_IMAGE);
      }
    }
  } finally {
    if ("close" in decoded.source && typeof decoded.source.close === "function") {
      decoded.source.close();
    }
  }

  if (lastResult && lastResult.base64.length <= maxBase64Chars) {
    return lastResult;
  }

  throw new Error(
    lastResult
      ? "This photo is too large to upload. Please use a JPG under ~4 MB, or take a closer shot of the jewelry."
      : isHeicLike(file)
        ? UNREADABLE_IMAGE
        : (lastError?.message ?? UNREADABLE_IMAGE),
  );
}

/** @deprecated Use prepareImageForUpload — kept for callers that need a fixed edge. */
export async function resizeImageForUpload(
  file: File,
  maxBase64Chars = MAX_UPLOAD_BASE64_CHARS,
): Promise<{ base64: string; mimeType: string }> {
  return prepareImageForUpload(file, maxBase64Chars);
}

function isHeicLike(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(UNREADABLE_IMAGE));
    img.src = src;
  });
}

async function decodeImage(
  file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 0 && bitmap.height > 0) {
        return { source: bitmap, width: bitmap.width, height: bitmap.height };
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await loadHtmlImage(objectUrl);
      return { source: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    /* FileReader fallback — some iOS HEIC paths fail createObjectURL */
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(UNREADABLE_IMAGE));
    reader.readAsDataURL(file);
  });
  const img = await loadHtmlImage(dataUrl);
  return {
    source: img,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.split(",")[1] ?? "";
      if (!base64) {
        reject(new Error("Could not process image"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not process image"));
    reader.readAsDataURL(blob);
  });
}

async function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<{ base64: string; mimeType: string }> {
  const toBlobJpeg = () =>
    new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not process image"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          quality,
        );
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Could not process image"));
      }
    });

  try {
    const blob = await toBlobJpeg();
    return { base64: await blobToBase64(blob), mimeType: "image/jpeg" };
  } catch {
    /* Safari sometimes throws "The string did not match the expected pattern" */
  }

  try {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1] ?? "";
    if (base64) return { base64, mimeType: "image/jpeg" };
  } catch {
    /* continue */
  }

  try {
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1] ?? "";
    if (base64) return { base64, mimeType: "image/png" };
  } catch {
    /* continue */
  }

  throw new Error(UNREADABLE_IMAGE);
}

function drawScaled(
  decoded: { source: CanvasImageSource; width: number; height: number },
  maxEdge: number,
): HTMLCanvasElement {
  let { width, height } = decoded;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decoded.source, 0, 0, width, height);
  return canvas;
}

/** Downscale photos in-browser. JPEG keeps payloads under Vercel body limits. */
export async function resizeImageFile(
  file: File,
  maxEdge: number,
  quality: number,
): Promise<{ base64: string; mimeType: string }> {
  let decoded: { source: CanvasImageSource; width: number; height: number };
  try {
    decoded = await decodeImage(file);
  } catch (e) {
    if (isHeicLike(file)) throw new Error(UNREADABLE_IMAGE);
    throw e instanceof Error ? e : new Error(UNREADABLE_IMAGE);
  }

  if (!decoded.width || !decoded.height) {
    throw new Error(UNREADABLE_IMAGE);
  }

  try {
    const canvas = drawScaled(decoded, maxEdge);
    if ("close" in decoded.source && typeof decoded.source.close === "function") {
      decoded.source.close();
    }
    return await canvasToJpeg(canvas, quality);
  } catch (e) {
    if (isHeicLike(file)) throw new Error(UNREADABLE_IMAGE);
    throw e instanceof Error ? e : new Error(UNREADABLE_IMAGE);
  }
}
