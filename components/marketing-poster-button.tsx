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

  const cream = "#f4ebe0";
  const ink = "#2f2116";
  const gold = "#b8924a";
  const goldSoft = "#d4b56a";

  const brandName = brand.brandName.trim();
  const headline = brand.headline.trim();
  const offer = brand.marketingLine.trim();
  const points = brand.highlights
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4);
  const logoPlacement = brand.logoPlacement || "corner_tl";
  const phoneH = brand.phone.trim() ? 84 : 0;

  // Cream page
  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);

  // Outer gold frame
  ctx.strokeStyle = gold;
  ctx.lineWidth = 7;
  ctx.strokeRect(24, 24, w - 48, h - 48);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  // Compact header: logo (if top) + brand + headline + offer in one tight band
  const headerTop = 52;
  let headerH = 120;
  const topLogo =
    logo &&
    (logoPlacement === "corner_tl" ||
      logoPlacement === "corner_tr" ||
      logoPlacement === "subtle");

  let topLogoBox: { x: number; y: number; lw: number; lh: number } | null = null;
  if (topLogo && logo) {
    const place = logoPlacement === "subtle" ? "corner_tr" : logoPlacement;
    topLogoBox = drawLogoAt(ctx, logo, place, w, h, logoPlacement === "subtle");
  }

  const textLeft =
    topLogoBox && logoPlacement === "corner_tl"
      ? topLogoBox.x + topLogoBox.lw + 20
      : 56;
  const textRight =
    topLogoBox && (logoPlacement === "corner_tr" || logoPlacement === "subtle")
      ? topLogoBox.x - 24
      : w - 56;
  const textMax = Math.max(280, textRight - textLeft);

  // Measure header height first
  ctx.font = "700 34px Newsreader, Georgia, serif";
  const brandLines = brandName ? wrapText(ctx, brandName, textMax) : [];
  ctx.font = "700 48px Newsreader, Georgia, serif";
  const headLines = headline ? wrapText(ctx, headline.toUpperCase(), textMax) : [];
  ctx.font = "italic 400 26px Newsreader, Georgia, serif";
  const offerLines = offer ? wrapText(ctx, offer, textMax) : [];
  const contentH =
    (brandLines.length ? brandLines.length * 38 + 10 : 0) +
    headLines.length * 52 +
    offerLines.length * 32 +
    8;
  headerH = Math.max(
    contentH + 24,
    topLogoBox ? topLogoBox.lh + 24 : 0,
    brandName || headline || offer ? 96 : 20,
  );

  let ty = headerTop + 28;
  ctx.textAlign = "left";
  if (brandLines.length) {
    ctx.fillStyle = ink;
    ctx.font = "700 34px Newsreader, Georgia, serif";
    for (const line of brandLines) {
      ctx.fillText(line, textLeft, ty);
      ty += 38;
    }
    ctx.strokeStyle = goldSoft;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(textLeft, ty - 12);
    ctx.lineTo(textLeft + 140, ty - 12);
    ctx.stroke();
    ty += 8;
  }
  if (headLines.length) {
    ctx.fillStyle = gold;
    ctx.font = "700 48px Newsreader, Georgia, serif";
    for (const line of headLines) {
      ctx.fillText(line, textLeft, ty);
      ty += 52;
    }
  }
  if (offerLines.length) {
    ctx.fillStyle = ink;
    ctx.font = "italic 400 26px Newsreader, Georgia, serif";
    for (const line of offerLines) {
      ctx.fillText(line, textLeft, ty);
      ty += 32;
    }
  }

  // Optional right-side script accent (reference flyers)
  if (headline || brandName) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = gold;
    ctx.font = "italic 700 54px Newsreader, Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillText("Elegance", w - 56, headerTop + Math.min(70, headerH - 20));
    ctx.restore();
  }

  const photoX = 56;
  const photoY = headerTop + headerH + 8;
  const photoW = w - 112;
  const photoH = h - photoY - (phoneH ? phoneH + 40 : 48);

  // Photo with thin gold mat
  ctx.strokeStyle = goldSoft;
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX - 4, photoY - 4, photoW + 8, photoH + 8);

  const cover = Math.max(photoW / photo.width, photoH / photo.height);
  const dw = photo.width * cover;
  const dh = photo.height * cover;
  ctx.save();
  ctx.beginPath();
  ctx.rect(photoX, photoY, photoW, photoH);
  ctx.clip();
  ctx.drawImage(photo, photoX + (photoW - dw) / 2, photoY + (photoH - dh) / 2, dw, dh);
  ctx.restore();

  // Feature pills over the photo (left), like reference flyers
  if (points.length) {
    let py = photoY + 28;
    for (const point of points) {
      ctx.font = "600 22px Manrope, sans-serif";
      const label = point.slice(0, 28);
      const tw = ctx.measureText(label).width;
      const pillW = tw + 70;
      ctx.fillStyle = "rgba(244, 235, 224, 0.92)";
      roundRect(ctx, photoX + 18, py, pillW, 44, 22);
      ctx.fill();
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.arc(photoX + 40, py + 22, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillText(label, photoX + 60, py + 29);
      py += 56;
    }
  }

  // Grams badge
  if (brand.grams.trim()) {
    const cx = photoX + photoW - 72;
    const cy = photoY + photoH - 72;
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
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

  // Soft watermark on photo
  if (brand.watermark) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    if (logo) {
      const s = Math.min(340 / logo.width, 180 / logo.height);
      const mw = logo.width * s;
      const mh = logo.height * s;
      ctx.drawImage(
        logo,
        photoX + (photoW - mw) / 2,
        photoY + (photoH - mh) / 2,
        mw,
        mh,
      );
    } else if (brandName) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 60px Newsreader, Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(brandName.toUpperCase(), photoX + photoW / 2, photoY + photoH / 2);
    }
    ctx.restore();
  }

  // Logo on photo corners when placement is not top header
  if (logo && !topLogo) {
    const maxW = 150;
    const maxH = 90;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    let lx = photoX + 20;
    let ly = photoY + 20;
    if (logoPlacement === "corner_br") {
      lx = photoX + photoW - lw - 20;
      ly = photoY + photoH - lh - 20;
    } else if (logoPlacement === "corner_bl") {
      lx = photoX + 20;
      ly = photoY + photoH - lh - 20;
    } else if (logoPlacement === "bottom_center") {
      lx = photoX + (photoW - lw) / 2;
      ly = photoY + photoH - lh - 20;
    } else if (logoPlacement === "center" || logoPlacement === "jewelry_center") {
      lx = photoX + (photoW - lw) / 2;
      ly = photoY + (photoH - lh) / 2;
    }
    // Cream plate behind logo so it reads on busy photos
    ctx.fillStyle = "rgba(244, 235, 224, 0.92)";
    roundRect(ctx, lx - 10, ly - 10, lw + 20, lh + 20, 10);
    ctx.fill();
    ctx.drawImage(logo, lx, ly, lw, lh);
  }

  // Phone footer
  if (brand.phone.trim()) {
    const barY = h - 28 - phoneH;
    ctx.fillStyle = ink;
    roundRect(ctx, 48, barY, w - 96, phoneH, 8);
    ctx.fill();
    ctx.fillStyle = goldSoft;
    ctx.fillRect(48, barY, w - 96, 3);
    ctx.fillStyle = cream;
    ctx.font = "700 30px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.phone.trim(), w / 2, barY + 52);
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
