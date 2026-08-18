const UNREADABLE_IMAGE =
  "Could not read this photo. On iPhone, use JPG: Settings → Camera → Formats → Most Compatible, or share the photo as JPG.";

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

  let { width, height } = decoded;
  if (!width || !height) {
    throw new Error(UNREADABLE_IMAGE);
  }

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

  if ("close" in decoded.source && typeof decoded.source.close === "function") {
    decoded.source.close();
  }

  try {
    return await canvasToJpeg(canvas, quality);
  } catch (e) {
    if (isHeicLike(file)) throw new Error(UNREADABLE_IMAGE);
    throw e instanceof Error ? e : new Error(UNREADABLE_IMAGE);
  }
}
