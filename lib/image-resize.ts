/** Downscale large photos in-browser; keep high quality for jewelry detail. */
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

      // Prefer PNG to avoid JPEG artifacts on metal/stones; fall back to high-quality JPEG if huge.
      let mimeType = "image/png";
      let dataUrl = canvas.toDataURL(mimeType);
      if (dataUrl.length > 6_000_000) {
        mimeType = "image/jpeg";
        dataUrl = canvas.toDataURL(mimeType, Math.max(quality, 0.92));
      }
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve({ base64, mimeType });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };

    img.src = url;
  });
}
