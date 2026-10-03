"use client";

import type { BrandFormState } from "@/components/brand-marketing-panel";
import type { LogoPlacement } from "@/lib/brand-options";
import { useEffect, useState } from "react";

type MarketingPosterButtonProps = {
  imageUrl: string;
  brand: BrandFormState;
  className?: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the photo for the poster."));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

async function ensurePosterFonts() {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  await Promise.all([
    document.fonts.load("700 72px Newsreader"),
    document.fonts.load("600 40px Newsreader"),
    document.fonts.load("400 28px Newsreader"),
    document.fonts.load("600 26px Manrope"),
    document.fonts.load("700 30px Manrope"),
  ]).catch(() => undefined);
}

function logoBox(
  placement: LogoPlacement,
  canvasW: number,
  canvasH: number,
  lw: number,
  lh: number,
) {
  const pad = 48;
  switch (placement) {
    case "corner_bl":
      return { x: pad, y: canvasH - pad - lh - 110 };
    case "corner_tr":
      return { x: canvasW - pad - lw, y: pad };
    case "corner_br":
      return { x: canvasW - pad - lw, y: canvasH - pad - lh - 110 };
    case "bottom_center":
      return { x: (canvasW - lw) / 2, y: canvasH - pad - lh - 110 };
    case "center":
    case "jewelry_center":
      return { x: (canvasW - lw) / 2, y: (canvasH - lh) / 2 - 40 };
    case "subtle":
      return { x: canvasW - pad - lw * 0.75, y: canvasH - pad - lh * 0.75 - 110 };
    case "corner_tl":
    default:
      return { x: pad, y: pad };
  }
}

function drawLogoAt(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  placement: LogoPlacement,
  canvasW: number,
  canvasH: number,
  subtle: boolean,
) {
  const maxW = subtle ? 120 : 170;
  const maxH = subtle ? 70 : 100;
  const scale = Math.min(maxW / logo.width, maxH / logo.height);
  const lw = logo.width * scale;
  const lh = logo.height * scale;
  const { x, y } = logoBox(placement, canvasW, canvasH, lw, lh);
  ctx.save();
  if (subtle) ctx.globalAlpha = 0.72;
  ctx.shadowColor = "rgba(40, 28, 16, 0.25)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(logo, x, y, lw, lh);
  ctx.restore();
  return { x, y, lw, lh };
}

/** Luxury cream flyer inspired by jewelry WhatsApp posters. */
async function drawPoster(imageUrl: string, brand: BrandFormState): Promise<Blob> {
  const photo = await loadImage(imageUrl);
  const logo =
    brand.logoBase64
      ? await loadImage(
          `data:${brand.logoMimeType || "image/png"};base64,${brand.logoBase64}`,
        )
      : null;

  await ensurePosterFonts();

  const w = 1080;
  const h = 1440;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the poster.");

  const cream = "#f6efe4";
  const creamDeep = "#ebe2d2";
  const ink = "#3a2a1a";
  const gold = "#b8924a";
  const goldSoft = "#d4b56a";

  // Cream page
  const page = ctx.createLinearGradient(0, 0, 0, h);
  page.addColorStop(0, "#faf6ee");
  page.addColorStop(1, creamDeep);
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, w, h);

  // Outer gold frame
  ctx.strokeStyle = gold;
  ctx.lineWidth = 8;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(42, 42, w - 84, h - 84);

  // Header brand block
  const brandName = brand.brandName.trim();
  const headline = brand.headline.trim();
  const offer = brand.marketingLine.trim();
  const points = brand.highlights
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4);

  let headerBottom = 56;
  const logoPlacement = brand.logoPlacement || "corner_tl";
  const logoOnTop =
    logoPlacement === "corner_tl" ||
    logoPlacement === "corner_tr" ||
    logoPlacement === "subtle";

  let logoLayout: { x: number; y: number; lw: number; lh: number } | null = null;
  if (logo && logoOnTop) {
    logoLayout = drawLogoAt(
      ctx,
      logo,
      logoPlacement === "subtle" ? "corner_tr" : logoPlacement,
      w,
      h,
      logoPlacement === "subtle",
    );
    headerBottom = Math.max(headerBottom, logoLayout.y + logoLayout.lh + 16);
  }

  // Brand name under / beside logo area
  const titleX =
    logoLayout && logoPlacement === "corner_tl"
      ? logoLayout.x + logoLayout.lw + 24
      : 56;
  const titleMax =
    logoLayout && logoPlacement === "corner_tr"
      ? logoLayout.x - 72
      : w - titleX - 56;

  let ty = logoLayout ? logoLayout.y + 28 : 64;
  if (brandName) {
    ctx.fillStyle = ink;
    ctx.font = "700 42px Newsreader, Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(brandName, titleX, ty);
    ty += 36;
    ctx.strokeStyle = goldSoft;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(titleX, ty);
    ctx.lineTo(titleX + Math.min(180, titleMax), ty);
    ctx.stroke();
    ty += 40;
  }

  if (headline) {
    ctx.fillStyle = gold;
    ctx.font = "700 52px Newsreader, Georgia, serif";
    for (const line of wrapText(ctx, headline.toUpperCase(), titleMax)) {
      ctx.fillText(line, titleX, ty);
      ty += 58;
    }
  }

  if (offer) {
    ctx.fillStyle = ink;
    ctx.font = "italic 400 28px Newsreader, Georgia, serif";
    for (const line of wrapText(ctx, offer, titleMax)) {
      ctx.fillText(line, titleX, ty);
      ty += 36;
    }
  }

  headerBottom = Math.max(headerBottom, ty + 20, 200);

  // Photo window
  const phoneH = brand.phone.trim() ? 92 : 0;
  const footerReserve = 36 + phoneH;
  const sideRail = points.length ? 300 : 64;
  const photoX = sideRail;
  const photoY = headerBottom + 12;
  const photoW = w - photoX - 64;
  const photoH = h - photoY - footerReserve - 24;

  // Soft photo mat
  ctx.fillStyle = cream;
  roundRect(ctx, photoX - 10, photoY - 10, photoW + 20, photoH + 20, 8);
  ctx.fill();
  ctx.strokeStyle = goldSoft;
  ctx.lineWidth = 2;
  roundRect(ctx, photoX - 10, photoY - 10, photoW + 20, photoH + 20, 8);
  ctx.stroke();

  const cover = Math.max(photoW / photo.width, photoH / photo.height);
  const dw = photo.width * cover;
  const dh = photo.height * cover;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, photoX, photoY, photoW, photoH, 4);
  ctx.clip();
  ctx.drawImage(photo, photoX + (photoW - dw) / 2, photoY + (photoH - dh) / 2, dw, dh);
  ctx.restore();

  // Left feature rail (reference-style)
  if (points.length) {
    let py = photoY + 24;
    for (const point of points) {
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.arc(78, py + 10, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cream;
      ctx.font = "700 18px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("◆", 78, py + 16);
      ctx.textAlign = "left";

      ctx.fillStyle = ink;
      ctx.font = "600 22px Manrope, sans-serif";
      const wrapped = wrapText(ctx, point, 180);
      let ly = py + 4;
      for (const line of wrapped.slice(0, 2)) {
        ctx.fillText(line, 112, ly + 14);
        ly += 26;
      }
      py += Math.max(70, wrapped.length * 26 + 36);
    }
  }

  // Grams badge
  if (brand.grams.trim()) {
    const cx = photoX + photoW - 70;
    const cy = photoY + photoH - 70;
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(cx, cy, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = "700 22px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.grams.trim().slice(0, 12), cx, cy + 8);
    ctx.textAlign = "left";
  }

  // Soft watermark
  if (brand.watermark) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    if (logo) {
      const s = Math.min(380 / logo.width, 200 / logo.height);
      const mw = logo.width * s;
      const mh = logo.height * s;
      ctx.drawImage(logo, photoX + (photoW - mw) / 2, photoY + (photoH - mh) / 2, mw, mh);
    } else if (brandName) {
      ctx.fillStyle = ink;
      ctx.font = "700 64px Newsreader, Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(brandName.toUpperCase(), photoX + photoW / 2, photoY + photoH / 2);
    }
    ctx.restore();
  }

  // Corner / bottom logos when not already drawn on top
  if (logo && !logoOnTop) {
    drawLogoAt(ctx, logo, logoPlacement, w, h, false);
  }

  // Phone footer
  if (brand.phone.trim()) {
    const barY = h - 36 - phoneH;
    ctx.fillStyle = ink;
    roundRect(ctx, 56, barY, w - 112, phoneH, 10);
    ctx.fill();
    ctx.fillStyle = goldSoft;
    ctx.fillRect(56, barY, w - 112, 3);
    ctx.fillStyle = cream;
    ctx.font = "700 32px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.phone.trim(), w / 2, barY + 56);
    ctx.textAlign = "left";
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.94),
  );
  if (!blob) throw new Error("Could not save the poster.");
  return blob;
}

export function MarketingPosterButton({
  imageUrl,
  brand,
  className,
}: MarketingPosterButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function openPreview() {
    setBusy(true);
    setError(null);
    try {
      const blob = await drawPoster(imageUrl, brand);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poster failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadPreview() {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "jwelpixel-marketing-poster.jpg";
    a.click();
  }

  function closePreview() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={busy}
        onClick={() => void openPreview()}
        className={className}
      >
        {busy ? "Building preview…" : "Preview / marketing poster"}
      </button>
      {error ? <span className="mt-1 text-xs text-red-600">{error}</span> : null}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="Marketing poster preview"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="text-sm text-white/80">Marketing poster preview</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadPreview}
                className="cursor-pointer rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-background hover:bg-accent hover:text-foreground"
              >
                Download
              </button>
              <button
                type="button"
                onClick={closePreview}
                className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Marketing poster preview"
              className="max-h-[calc(100vh-6rem)] max-w-full rounded-sm object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </span>
  );
}
