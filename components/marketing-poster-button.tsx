"use client";

import type { BrandFormState } from "@/components/brand-marketing-panel";
import { useState } from "react";

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
  return lines.slice(0, 3);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  x: number,
  y: number,
) {
  const scale = Math.min(210 / logo.width, 110 / logo.height);
  const lw = logo.width * scale;
  const lh = logo.height * scale;
  const pad = 14;
  ctx.fillStyle = "#f7f1e4";
  roundRect(ctx, x - pad, y - pad, lw + pad * 2, lh + pad * 2, 12);
  ctx.fill();
  ctx.drawImage(logo, x, y, lw, lh);
}

async function drawPoster(imageUrl: string, brand: BrandFormState): Promise<Blob> {
  const photo = await loadImage(imageUrl);
  const logo =
    brand.logoBase64
      ? await loadImage(
          `data:${brand.logoMimeType || "image/png"};base64,${brand.logoBase64}`,
        )
      : null;

  const w = 1080;
  const h = 1440;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the poster.");

  const cream = "#f7f1e4";
  const gold = "#b9924a";
  const ink = "#3d2a12";

  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);

  const frame = 28;
  const photoX = frame + 18;
  const photoY = frame + 18;
  const photoW = w - (frame + 18) * 2;
  const photoH = h - (frame + 18) * 2;
  const cover = Math.max(photoW / photo.width, photoH / photo.height);
  const sw = photo.width * cover;
  const sh = photo.height * cover;
  ctx.save();
  ctx.beginPath();
  ctx.rect(photoX, photoY, photoW, photoH);
  ctx.clip();
  ctx.drawImage(photo, photoX + (photoW - sw) / 2, photoY + (photoH - sh) / 2, sw, sh);
  ctx.restore();

  ctx.strokeStyle = gold;
  ctx.lineWidth = 14;
  ctx.strokeRect(frame, frame, w - frame * 2, h - frame * 2);
  ctx.lineWidth = 2;
  ctx.strokeRect(frame + 16, frame + 16, w - (frame + 16) * 2, h - (frame + 16) * 2);

  if (logo) {
    drawLogo(ctx, logo, photoX + 28, photoY + 28);
  }

  const points = brand.highlights
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4);
  const headerLines: Array<{ text: string; font: string; color: string; gap: number }> = [];
  if (brand.brandName.trim()) {
    headerLines.push({
      text: brand.brandName.trim(),
      font: "700 36px Georgia, serif",
      color: ink,
      gap: 46,
    });
  }
  if (brand.headline.trim()) {
    ctx.font = "700 54px Georgia, serif";
    for (const line of wrapText(ctx, brand.headline.trim().toUpperCase(), 860)) {
      headerLines.push({ text: line, font: "700 54px Georgia, serif", color: "#8a6a2f", gap: 62 });
    }
  }
  if (brand.marketingLine.trim()) {
    ctx.font = "italic 28px Georgia, serif";
    for (const line of wrapText(ctx, brand.marketingLine.trim(), 860)) {
      headerLines.push({ text: line, font: "italic 28px Georgia, serif", color: "#5c4a32", gap: 36 });
    }
  }

  if (headerLines.length) {
    const blockH = Math.min(
      headerLines.reduce((sum, line) => sum + line.gap, 36),
      photoH * 0.42,
    );
    ctx.fillStyle = "rgba(247, 241, 228, 0.92)";
    ctx.fillRect(photoX, photoY, photoW, blockH);
    let y = photoY + 48;
    const textX = logo ? photoX + 280 : photoX + 36;
    for (const line of headerLines) {
      ctx.fillStyle = line.color;
      ctx.font = line.font;
      ctx.fillText(line.text, textX, y);
      y += line.gap;
    }
    if (logo) drawLogo(ctx, logo, photoX + 28, photoY + 28);
  }

  if (points.length) {
    const listH = points.length * 52 + 28;
    const listY = photoY + photoH - listH - (brand.phone.trim() ? 110 : 36);
    ctx.fillStyle = "rgba(247, 241, 228, 0.9)";
    roundRect(ctx, photoX + 28, listY, 420, listH, 16);
    ctx.fill();
    ctx.font = "600 26px Georgia, serif";
    let py = listY + 44;
    for (const point of points) {
      ctx.fillStyle = "#7c5cbf";
      ctx.beginPath();
      ctx.arc(photoX + 56, py - 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillText(point.slice(0, 28), photoX + 76, py);
      py += 52;
    }
  }

  if (brand.grams.trim()) {
    const cx = photoX + photoW - 100;
    const cy = photoY + photoH - (brand.phone.trim() ? 190 : 100);
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(cx, cy, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = cream;
    ctx.font = "700 26px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.grams.trim().slice(0, 12), cx, cy + 8);
    ctx.textAlign = "left";
  }

  if (brand.phone.trim()) {
    const barY = photoY + photoH - 96;
    ctx.fillStyle = ink;
    ctx.fillRect(photoX, barY, photoW, 96);
    ctx.fillStyle = cream;
    ctx.font = "700 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.phone.trim(), w / 2, barY + 60);
    ctx.textAlign = "left";
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
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

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const blob = await drawPoster(imageUrl, brand);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "jwelpixel-marketing-poster.jpg";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poster failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col">
      <button type="button" disabled={busy} onClick={() => void onClick()} className={className}>
        {busy ? "Making poster…" : "Marketing poster"}
      </button>
      {error ? <span className="mt-1 text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
