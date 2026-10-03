"use client";

import type { BrandFormState } from "@/components/brand-marketing-panel";
import type { PosterTemplateId } from "@/lib/poster-templates";
import { useEffect, useState } from "react";

type MarketingPosterButtonProps = {
  imageUrl: string;
  brand: BrandFormState;
  className?: string;
};

type IconKind = "shield" | "diamond" | "sparkle" | "gift" | "check";

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
    document.fonts.load("italic 700 54px Newsreader"),
    document.fonts.load("600 26px Manrope"),
    document.fonts.load("700 30px Manrope"),
  ]).catch(() => undefined);
}

/** Fill the box (may crop edges). */
function drawCoverPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cover = Math.max(w / photo.width, h / photo.height);
  const dw = photo.width * cover;
  const dh = photo.height * cover;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(photo, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

/** Fit entire jewelry inside the box (no crop) — preferred for catalog posters. */
function drawContainPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  pad = 24,
) {
  const boxW = Math.max(40, w - pad * 2);
  const boxH = Math.max(40, h - pad * 2);
  const fit = Math.min(boxW / photo.width, boxH / photo.height);
  const dw = photo.width * fit;
  const dh = photo.height * fit;
  ctx.drawImage(photo, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawTextBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, width, height, 14);
  ctx.fill();
}

function drawFeatureIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  kind: IconKind,
  gold: string,
  cream: string,
) {
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (kind === "diamond") {
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx, cy + 10);
    ctx.lineTo(cx - 10, cy);
    ctx.closePath();
  } else if (kind === "gift") {
    ctx.strokeRect(cx - 8, cy - 4, 16, 12);
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx, cy + 8);
    ctx.moveTo(cx - 8, cy + 2);
    ctx.lineTo(cx + 8, cy + 2);
  } else if (kind === "sparkle") {
    for (const [dx, dy] of [
      [0, -9],
      [9, 0],
      [0, 9],
      [-9, 0],
    ] as const) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx, cy + dy);
    }
  } else {
    // shield / check
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx + 9, cy - 6);
    ctx.lineTo(cx + 9, cy + 2);
    ctx.lineTo(cx, cy + 11);
    ctx.lineTo(cx - 9, cy + 2);
    ctx.lineTo(cx - 9, cy - 6);
    ctx.closePath();
  }
  ctx.stroke();
  if (kind === "shield" || kind === "check") {
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx - 1, cy + 4);
    ctx.lineTo(cx + 6, cy - 4);
    ctx.stroke();
  }
}

const ICON_CYCLE: IconKind[] = ["shield", "diamond", "sparkle", "gift", "check"];

function pointsOf(brand: BrandFormState) {
  return brand.highlights
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function drawLogoPlate(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  cream: string,
) {
  const scale = Math.min(maxW / logo.width, maxH / logo.height);
  const lw = logo.width * scale;
  const lh = logo.height * scale;
  ctx.fillStyle = cream;
  roundRect(ctx, x - 8, y - 8, lw + 16, lh + 16, 8);
  ctx.fill();
  ctx.drawImage(logo, x, y, lw, lh);
  return { lw, lh };
}

async function drawClassic(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  logo: HTMLImageElement | null,
  brand: BrandFormState,
) {
  const w = 1080;
  const h = 1440;
  const cream = "#f3ebe1";
  const ink = "#2c2016";
  const gold = "#b8924a";
  const goldSoft = "#d4b56a";
  const points = pointsOf(brand);

  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(34, 34, w - 68, h - 68);

  let headerBottom = 48;
  if (logo) {
    const { lh } = drawLogoPlate(ctx, logo, 52, 48, 130, 80, "#fffdf8");
    headerBottom = Math.max(headerBottom, 48 + lh);
  }

  const titleX = logo ? 210 : 52;
  let ty = 70;
  if (brand.brandName.trim()) {
    ctx.fillStyle = ink;
    ctx.font = "700 40px Newsreader, Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(brand.brandName.trim(), titleX, ty);
    ty += 28;
    ctx.fillStyle = gold;
    ctx.font = "600 16px Manrope, sans-serif";
    ctx.fillText("TRUSTED LEGACY · TIMELESS ELEGANCE", titleX, ty + 8);
    ty += 40;
  }

  ctx.textAlign = "right";
  ctx.fillStyle = ink;
  ctx.font = "600 22px Newsreader, Georgia, serif";
  ctx.fillText("TIMELESS", w - 52, 72);
  ctx.fillStyle = gold;
  ctx.font = "italic 700 48px Newsreader, Georgia, serif";
  ctx.fillText("Elegance", w - 52, 122);
  if (brand.marketingLine.trim()) {
    ctx.fillStyle = ink;
    ctx.font = "400 20px Newsreader, Georgia, serif";
    ctx.fillText(brand.marketingLine.trim().slice(0, 48), w - 52, 152);
  }
  ctx.textAlign = "left";
  headerBottom = Math.max(headerBottom, ty, 168);

  if (brand.headline.trim()) {
    ctx.fillStyle = ink;
    ctx.font = "700 36px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.headline.trim().toUpperCase(), w / 2, headerBottom + 40);
    ctx.textAlign = "left";
    headerBottom += 56;
  }

  const footerH =
    brand.phone?.trim() || brand.address?.trim() || brand.instagram?.trim()
      ? 170
      : 48;
  const photoX = points.length ? 300 : 56;
  const photoY = headerBottom + 12;
  const photoW = w - photoX - 56;
  const photoH = h - photoY - footerH;

  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = goldSoft;
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX - 3, photoY - 3, photoW + 6, photoH + 6);
  // Keep jewelry fully visible and centered — never crop into the gold frame.
  drawContainPhoto(ctx, photo, photoX, photoY, photoW, photoH, 36);

  if (points.length) {
    let py = photoY + 10;
    points.forEach((point, i) => {
      drawFeatureIcon(ctx, 90, py + 22, ICON_CYCLE[i % ICON_CYCLE.length], gold, cream);
      ctx.fillStyle = ink;
      ctx.font = "600 22px Manrope, sans-serif";
      const lines = wrapText(ctx, point, 170);
      let ly = py + 14;
      for (const line of lines.slice(0, 2)) {
        ctx.fillText(line, 122, ly);
        ly += 26;
      }
      py += 78;
    });
  }

  if (brand.grams.trim()) {
    const cx = 120;
    const cy = photoY + photoH - 70;
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = "700 18px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WEIGHT", cx, cy - 6);
    ctx.font = "700 22px Newsreader, Georgia, serif";
    ctx.fillText(brand.grams.trim().slice(0, 12), cx, cy + 20);
    ctx.textAlign = "left";
  }

  if (brand.watermark && logo) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    const s = Math.min(300 / logo.width, 160 / logo.height);
    ctx.drawImage(
      logo,
      photoX + (photoW - logo.width * s) / 2,
      photoY + (photoH - logo.height * s) / 2,
      logo.width * s,
      logo.height * s,
    );
    ctx.restore();
  }

  const barY = h - footerH + 8;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  roundRect(ctx, 48, barY, w - 96, footerH - 28, 8);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.font = "600 18px Manrope, sans-serif";
  let fy = barY + 36;
  if (brand.instagram?.trim()) {
    ctx.fillText(`Instagram  ${brand.instagram.trim()}`, 70, fy);
  }
  if (brand.whatsapp?.trim() || brand.phone?.trim()) {
    ctx.textAlign = "right";
    ctx.fillText(
      `WhatsApp  ${(brand.whatsapp || brand.phone).trim()}`,
      w - 70,
      fy,
    );
    ctx.textAlign = "left";
  }
  fy += 34;
  if (brand.phone?.trim()) {
    ctx.font = "700 28px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.phone.trim(), w / 2, fy);
    ctx.textAlign = "left";
    fy += 32;
  }
  if (brand.address?.trim()) {
    ctx.font = "500 18px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.address.trim().slice(0, 70), w / 2, fy);
    ctx.textAlign = "left";
  }
}

async function drawStory(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  logo: HTMLImageElement | null,
  brand: BrandFormState,
) {
  const w = 1080;
  const h = 1920;
  const cream = "#f6efe6";
  const ink = "#2c2016";
  const gold = "#b8924a";
  const points = pointsOf(brand);

  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);

  // Photo window with cream margins — jewelry contained & centered
  const photoX = 48;
  const photoY = 210;
  const photoW = w - 96;
  const photoH = h - 450;
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(photoX, photoY, photoW, photoH);
  drawContainPhoto(ctx, photo, photoX, photoY, photoW, photoH, 40);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Top cream band for readable titles
  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, 200);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  if (logo) {
    drawLogoPlate(ctx, logo, 40, 40, 120, 72, "#fffdf8");
  }

  ctx.fillStyle = ink;
  ctx.font = "700 42px Newsreader, Georgia, serif";
  ctx.textAlign = "left";
  const titleX = logo ? 180 : 40;
  if (brand.brandName.trim()) ctx.fillText(brand.brandName.trim(), titleX, 78);
  ctx.fillStyle = gold;
  ctx.font = "700 44px Newsreader, Georgia, serif";
  const head = (brand.headline.trim() || "TIMELESS ELEGANCE").toUpperCase();
  for (const line of wrapText(ctx, head, w - titleX - 40).slice(0, 2)) {
    ctx.fillText(line, titleX, 130);
  }
  if (brand.marketingLine.trim()) {
    ctx.fillStyle = ink;
    ctx.font = "italic 400 24px Newsreader, Georgia, serif";
    ctx.fillText(brand.marketingLine.trim().slice(0, 50), titleX, 170);
  }

  points.slice(0, 4).forEach((point, i) => {
    const py = photoY + 40 + i * 90;
    ctx.fillStyle = "rgba(246, 239, 230, 0.94)";
    roundRect(ctx, photoX + 24, py, 320, 70, 35);
    ctx.fill();
    drawFeatureIcon(
      ctx,
      photoX + 58,
      py + 35,
      ICON_CYCLE[i % ICON_CYCLE.length],
      gold,
      cream,
    );
    ctx.fillStyle = ink;
    ctx.font = "600 22px Manrope, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(point.slice(0, 22), photoX + 90, py + 42);
  });

  if (brand.grams.trim()) {
    const cx = photoX + photoW - 80;
    const cy = photoY + photoH - 90;
    ctx.fillStyle = "#2a1f18";
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = cream;
    ctx.font = "700 24px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.grams.trim().slice(0, 12), cx, cy + 8);
  }

  if (brand.watermark && logo) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    const s = Math.min(280 / logo.width, 150 / logo.height);
    ctx.drawImage(
      logo,
      photoX + (photoW - logo.width * s) / 2,
      photoY + (photoH - logo.height * s) / 2,
      logo.width * s,
      logo.height * s,
    );
    ctx.restore();
  }

  ctx.fillStyle = cream;
  ctx.fillRect(0, h - 220, w, 220);
  ctx.fillStyle = ink;
  ctx.fillRect(40, h - 200, w - 80, 160);
  ctx.fillStyle = gold;
  ctx.fillRect(40, h - 200, w - 80, 4);
  ctx.fillStyle = cream;
  ctx.font = "600 22px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FOR REQUIREMENT", w / 2, h - 150);
  ctx.font = "700 40px Manrope, sans-serif";
  ctx.fillText((brand.phone || brand.whatsapp || "").trim() || " ", w / 2, h - 100);
  if (brand.address?.trim()) {
    ctx.font = "500 20px Manrope, sans-serif";
    ctx.fillText(brand.address.trim().slice(0, 64), w / 2, h - 60);
  }
  ctx.textAlign = "left";
}

async function drawFestival(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  logo: HTMLImageElement | null,
  brand: BrandFormState,
) {
  const w = 1080;
  const h = 1440;
  const cream = "#f7f1e8";
  const ink = "#24180f";
  const gold = "#b8924a";
  const points = pointsOf(brand);
  const phoneH = brand.phone?.trim() ? 88 : 0;

  // Cream page — text and borders never sit on the busy photo
  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 8;
  ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  // Header band (solid cream for readable festival text)
  const festLabel =
    brand.headline.trim() ||
    brand.festivalLabel.trim() ||
    "HAPPY FESTIVAL";
  ctx.font = "700 56px Newsreader, Georgia, serif";
  const headLines = wrapText(ctx, festLabel.toUpperCase(), 720);
  const offer = brand.marketingLine.trim();
  const brandName = brand.brandName.trim();
  const headerH =
    48 +
    (logo ? 90 : 0) +
    (brandName ? 40 : 0) +
    headLines.length * 60 +
    (offer ? 36 : 0) +
    28;

  let ty = 56;
  if (logo) {
    drawLogoPlate(ctx, logo, 52, 48, 140, 85, "#fffdf8");
    ty = 48 + 95;
  }
  const textX = logo ? 220 : 56;
  if (brandName) {
    ctx.fillStyle = ink;
    ctx.font = "700 30px Manrope, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(brandName, textX, logo ? 78 : ty);
    if (!logo) ty += 40;
  }
  ty = Math.max(ty, logo ? 150 : 90);
  ctx.fillStyle = gold;
  ctx.font = "700 56px Newsreader, Georgia, serif";
  for (const line of headLines) {
    ctx.fillText(line, 56, ty);
    ty += 60;
  }
  if (offer) {
    // Offer chip — always readable
    ctx.font = "700 26px Manrope, sans-serif";
    const chipW = Math.min(420, ctx.measureText(offer).width + 48);
    drawTextBanner(ctx, 56, ty - 8, chipW, 44, ink);
    ctx.fillStyle = cream;
    ctx.fillText(offer, 80, ty + 22);
    ty += 52;
  }

  const photoY = Math.max(headerH, ty + 12);
  const photoX = 56;
  const photoW = w - 112;
  const photoH = h - photoY - phoneH - 48;

  // Soft mat behind jewelry; contain so piece stays centered and clear of borders
  ctx.fillStyle = "#1a120c";
  roundRect(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.fill();
  // Blurred cover as atmosphere, then sharp contain product on top
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.clip();
  ctx.globalAlpha = 0.35;
  drawCoverPhoto(ctx, photo, photoX, photoY, photoW, photoH);
  ctx.globalAlpha = 1;
  drawContainPhoto(ctx, photo, photoX, photoY, photoW, photoH, 48);
  ctx.restore();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  roundRect(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.stroke();

  // Highlights as cream pills over the lower photo area (not colliding with border)
  points.slice(0, 3).forEach((point, i) => {
    const py = photoY + photoH - 40 - (points.slice(0, 3).length - i) * 52;
    ctx.font = "600 22px Manrope, sans-serif";
    const label = point.slice(0, 28);
    const tw = ctx.measureText(label).width;
    drawTextBanner(ctx, photoX + 20, py, tw + 48, 40, "rgba(247,241,232,0.95)");
    ctx.fillStyle = ink;
    ctx.fillText(label, photoX + 40, py + 27);
  });

  if (brand.grams.trim()) {
    const cx = photoX + photoW - 78;
    const cy = photoY + photoH - 78;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = cream;
    ctx.font = "700 24px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.grams.trim().slice(0, 12), cx, cy + 8);
    ctx.textAlign = "left";
  }

  // Logo placement on the photo mat (never clipped by outer frame)
  if (logo) {
    const place = brand.logoPlacement || "corner_br";
    const maxW = 130;
    const maxH = 78;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    let lx = photoX + 18;
    let ly = photoY + 18;
    if (place === "corner_br") {
      lx = photoX + photoW - lw - 18;
      ly = photoY + photoH - lh - 18;
    } else if (place === "corner_tr") {
      lx = photoX + photoW - lw - 18;
      ly = photoY + 18;
    } else if (place === "corner_bl") {
      lx = photoX + 18;
      ly = photoY + photoH - lh - 18;
    } else if (place === "corner_tl") {
      // Already drawn in header — skip duplicate on photo
      lx = -1;
    }
    if (lx >= 0) {
      ctx.fillStyle = "rgba(247,241,232,0.96)";
      roundRect(ctx, lx - 8, ly - 8, lw + 16, lh + 16, 8);
      ctx.fill();
      ctx.drawImage(logo, lx, ly, lw, lh);
    }
  }

  if (brand.phone?.trim()) {
    const barY = h - 28 - phoneH;
    ctx.fillStyle = ink;
    roundRect(ctx, 48, barY, w - 96, phoneH, 8);
    ctx.fill();
    ctx.fillStyle = gold;
    ctx.fillRect(48, barY, w - 96, 3);
    ctx.fillStyle = cream;
    ctx.font = "700 32px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.phone.trim(), w / 2, barY + 54);
    ctx.textAlign = "left";
  }
}

async function drawPoster(imageUrl: string, brand: BrandFormState): Promise<Blob> {
  const photo = await loadImage(imageUrl);
  const logo = brand.logoBase64
    ? await loadImage(
        `data:${brand.logoMimeType || "image/png"};base64,${brand.logoBase64}`,
      )
    : null;

  await ensurePosterFonts();

  const template = (brand.posterTemplate || "classic") as PosterTemplateId;
  const w = 1080;
  const h = template === "story" ? 1920 : 1440;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the poster.");

  if (template === "story") await drawStory(ctx, photo, logo, brand);
  else if (template === "festival") await drawFestival(ctx, photo, logo, brand);
  else await drawClassic(ctx, photo, logo, brand);

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
    a.download = `jwelpixel-poster-${brand.posterTemplate || "classic"}.jpg`;
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
            <p className="text-sm text-white/80">
              {(brand.posterTemplate || "classic").toUpperCase()} poster preview
            </p>
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
