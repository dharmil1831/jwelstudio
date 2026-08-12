/** Downscale photos in-browser. JPEG keeps payloads under Vercel body limits. */
export function resizeImageFile(
  file: File,
  maxEdge: number,
  quality: number,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const scale = Math.min(1, maxEdge / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64 = dataUrl.split(",")[1] ?? "";
      if (!base64) {
        reject(new Error("Could not process image"));
        return;
      }
      resolve({ base64, mimeType });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "Could not read this image. Please use JPG, PNG, or WebP (not HEIC).",
        ),
      );
    };

    img.src = url;
  });
}
