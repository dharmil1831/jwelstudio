export function filenameFromUrl(url: string, fallback = "jewel-studio.png"): string {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const base = pathname.split("/").pop();
    if (base) return base;
  } catch {
    // ignore invalid URLs
  }
  return fallback;
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not download image");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
