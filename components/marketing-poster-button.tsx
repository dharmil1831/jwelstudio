"use client";

import type { BrandFormState } from "@/lib/brand-form-state";
import type { LogoPlacement } from "@/lib/brand-options";
import {
  getPosterTemplate,
  type PosterTemplateId,
} from "@/lib/poster-templates";
import { useEffect, useRef, useState } from "react";

type MarketingPosterButtonProps = {
  imageUrl: string;
  brand: BrandFormState;
  className?: string;
  /** Button label when idle (default: Preview share card). */
  label?: string;
  busyLabel?: string;
  /** Increment to auto-open the share card (Scalio-style after generate). */
  autoOpenToken?: number;
};

function accentOf(brand: BrandFormState): string {
  return /^#[0-9a-fA-F]{6}$/.test(brand.accentColor || "")
    ? brand.accentColor
    : "#b8924a";
}

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
  alpha = 1,
) {
  const scale = Math.min(maxW / logo.width, maxH / logo.height);
  const lw = logo.width * scale;
  const lh = logo.height * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = cream;
  roundRect(ctx, x - 8, y - 8, lw + 16, lh + 16, 8);
  ctx.fill();
  ctx.drawImage(logo, x, y, lw, lh);
  ctx.restore();
  return { lw, lh };
}

/** Place logo on the photo using the user's Logo placement setting. */
function drawLogoOnPhoto(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  photoX: number,
  photoY: number,
  photoW: number,
  photoH: number,
  placement: LogoPlacement,
  cream: string,
  /** Keep clear of a bottom-right grams badge */
  gramsAtBr = false,
) {
  const subtle = placement === "subtle";
  const maxW = subtle ? 88 : 120;
  const maxH = subtle ? 52 : 72;
  const pad = 18;
  const scale = Math.min(maxW / logo.width, maxH / logo.height);
  const lw = logo.width * scale;
  const lh = logo.height * scale;
  const brClear = gramsAtBr ? 110 : 0;

  let lx = photoX + pad;
  let ly = photoY + pad;
  switch (placement) {
    case "corner_bl":
      lx = photoX + pad;
      ly = photoY + photoH - lh - pad;
      break;
    case "corner_br":
      lx = photoX + photoW - lw - pad - brClear;
      ly = photoY + photoH - lh - pad;
      break;
    case "corner_tr":
      lx = photoX + photoW - lw - pad;
      ly = photoY + pad;
      break;
    case "corner_tl":
      lx = photoX + pad;
      ly = photoY + pad;
      break;
    case "bottom_center":
      lx = photoX + (photoW - lw) / 2;
      ly = photoY + photoH - lh - pad;
      break;
    case "center":
    case "jewelry_center":
      lx = photoX + (photoW - lw) / 2;
      ly = photoY + (photoH - lh) / 2;
      break;
    case "subtle":
      lx = photoX + photoW - lw - pad - brClear;
      ly = photoY + photoH - lh - pad;
      break;
    default:
      lx = photoX + pad;
      ly = photoY + photoH - lh - pad;
  }

  drawLogoPlate(ctx, logo, lx, ly, maxW, maxH, cream, subtle ? 0.72 : 1);
}

function contactLines(brand: BrandFormState): string[] {
  const lines: string[] = [];
  const phone = brand.phone.trim();
  const wa = brand.whatsapp.trim();
  const ig = brand.instagram.trim().replace(/^@/, "");
  const address = brand.address.trim();
  if (phone) lines.push(phone);
  if (wa && wa !== phone) lines.push(`WhatsApp ${wa}`);
  if (ig) lines.push(`Instagram @${ig}`);
  if (address) lines.push(address.slice(0, 64));
  return lines;
}

function drawContactFooter(
  ctx: CanvasRenderingContext2D,
  brand: BrandFormState,
  w: number,
  h: number,
  ink: string,
  cream: string,
  gold: string,
) {
  const lines = contactLines(brand);
  if (lines.length === 0) return 40;
  const footerH = 36 + lines.length * 32 + 20;
  const barY = h - footerH - 16;
  ctx.fillStyle = ink;
  roundRect(ctx, 48, barY, w - 96, footerH, 8);
  ctx.fill();
  ctx.fillStyle = gold;
  ctx.fillRect(48, barY, w - 96, 3);
  ctx.fillStyle = cream;
  ctx.textAlign = "center";
  lines.forEach((line, i) => {
    const isPrimary = i === 0 && Boolean(brand.phone.trim());
    ctx.font = isPrimary
      ? "700 28px Manrope, sans-serif"
      : "600 20px Manrope, sans-serif";
    ctx.fillText(line, w / 2, barY + 40 + i * 32);
  });
  ctx.textAlign = "left";
  return footerH + 24;
}

async function drawClassic(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  logo: HTMLImageElement | null,
  brand: BrandFormState,
) {
  const w = 1080;
  const h = 1440;
  const cream = "#f4ebe0";
  const ink = "#2c2016";
  const gold = accentOf(brand);
  const points = pointsOf(brand).slice(0, 3);
  const brandName = brand.brandName.trim();
  const headline = brand.headline.trim();
  const offer = brand.marketingLine.trim();
  const grams = brand.grams.trim();
  const placement = (brand.logoPlacement || "corner_br") as LogoPlacement;
  const contacts = contactLines(brand);
  const pointsH = points.length > 0 ? 56 : 0;
  const footerH =
    contacts.length > 0 ? 36 + contacts.length * 32 + 44 : 40;

  // Page + frame
  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(34, 34, w - 68, h - 68);

  // Header: brand text only — logo follows Logo placement on the photo
  let y = 56;
  if (brandName) {
    ctx.fillStyle = ink;
    ctx.font = "700 42px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(brandName.slice(0, 32), w / 2, y + 28);
    ctx.fillStyle = gold;
    ctx.font = "700 15px Manrope, sans-serif";
    ctx.fillText("JEWELLERS", w / 2, y + 54);
    ctx.textAlign = "left";
    y += 78;
  }

  if (offer) {
    ctx.font = "700 22px Manrope, sans-serif";
    const chip = offer.slice(0, 36);
    const chipW = Math.min(480, ctx.measureText(chip).width + 36);
    drawTextBanner(ctx, (w - chipW) / 2, y, chipW, 38, ink);
    ctx.fillStyle = cream;
    ctx.textAlign = "center";
    ctx.fillText(chip, w / 2, y + 26);
    ctx.textAlign = "left";
    y += 52;
  }

  if (headline) {
    ctx.fillStyle = ink;
    ctx.font = "700 36px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    for (const line of wrapText(ctx, headline.toUpperCase(), w - 120).slice(0, 2)) {
      ctx.fillText(line, w / 2, y + 30);
      y += 40;
    }
    ctx.textAlign = "left";
    y += 8;
  } else {
    y += 4;
  }

  const photoX = 56;
  const photoY = y;
  const photoW = w - 112;
  const photoH = Math.max(420, h - photoY - pointsH - footerH - 28);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);
  drawContainPhoto(ctx, photo, photoX, photoY, photoW, photoH, 36);

  if (grams) {
    const cx = photoX + photoW - 64;
    const cy = photoY + photoH - 64;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = cream;
    ctx.textAlign = "center";
    ctx.font = "700 20px Newsreader, Georgia, serif";
    ctx.fillText(grams.slice(0, 10), cx, cy + 7);
    ctx.textAlign = "left";
  }

  if (logo) {
    drawLogoOnPhoto(
      ctx,
      logo,
      photoX,
      photoY,
      photoW,
      photoH,
      placement,
      "#fffdf9",
      Boolean(grams),
    );
  }

  if (points.length > 0) {
    const chipY = photoY + photoH + 14;
    ctx.font = "600 18px Manrope, sans-serif";
    const gap = 12;
    const chipHs = 36;
    const totalTextW = points.reduce(
      (sum, p) => sum + ctx.measureText(p.slice(0, 22)).width + 28,
      0,
    );
    let cx = Math.max(56, (w - (totalTextW + gap * (points.length - 1))) / 2);
    for (const point of points) {
      const label = point.slice(0, 22);
      const tw = ctx.measureText(label).width + 28;
      drawTextBanner(ctx, cx, chipY, tw, chipHs, ink);
      ctx.fillStyle = cream;
      ctx.textAlign = "center";
      ctx.fillText(label, cx + tw / 2, chipY + 24);
      cx += tw + gap;
    }
    ctx.textAlign = "left";
  }

  drawContactFooter(ctx, brand, w, h, ink, cream, gold);
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
  const gold = accentOf(brand);
  const points = pointsOf(brand).slice(0, 3);
  const placement = (brand.logoPlacement || "corner_br") as LogoPlacement;
  const contacts = contactLines(brand);
  const footerH =
    contacts.length > 0 ? 36 + contacts.length * 32 + 44 : 80;
  const pointsH = points.length > 0 ? 50 : 0;

  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  ctx.fillStyle = ink;
  ctx.font = "700 40px Newsreader, Georgia, serif";
  ctx.textAlign = "center";
  if (brand.brandName.trim()) {
    ctx.fillText(brand.brandName.trim().slice(0, 28), w / 2, 70);
  }
  ctx.fillStyle = gold;
  ctx.font = "700 36px Newsreader, Georgia, serif";
  const head = (brand.headline.trim() || "TIMELESS ELEGANCE").toUpperCase();
  let hy = 120;
  for (const line of wrapText(ctx, head, w - 100).slice(0, 2)) {
    ctx.fillText(line, w / 2, hy);
    hy += 40;
  }
  if (brand.marketingLine.trim()) {
    ctx.fillStyle = ink;
    ctx.font = "italic 400 22px Newsreader, Georgia, serif";
    ctx.fillText(brand.marketingLine.trim().slice(0, 48), w / 2, hy + 8);
    hy += 36;
  }
  ctx.textAlign = "left";

  const photoX = 48;
  const photoY = Math.max(200, hy + 20);
  const photoW = w - 96;
  const photoH = h - photoY - pointsH - footerH - 24;
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(photoX, photoY, photoW, photoH);
  drawContainPhoto(ctx, photo, photoX, photoY, photoW, photoH, 40);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  const grams = brand.grams.trim();
  if (grams) {
    const cx = photoX + photoW - 70;
    const cy = photoY + photoH - 80;
    ctx.fillStyle = "#2a1f18";
    ctx.beginPath();
    ctx.arc(cx, cy, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = cream;
    ctx.font = "700 22px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(grams.slice(0, 12), cx, cy + 8);
    ctx.textAlign = "left";
  }

  if (logo) {
    drawLogoOnPhoto(
      ctx,
      logo,
      photoX,
      photoY,
      photoW,
      photoH,
      placement,
      "#fffdf8",
      Boolean(grams),
    );
  }

  if (points.length > 0) {
    const chipY = photoY + photoH + 12;
    ctx.font = "600 18px Manrope, sans-serif";
    const gap = 10;
    const totalW = points.reduce(
      (sum, p) => sum + ctx.measureText(p.slice(0, 20)).width + 28,
      0,
    );
    let cx = Math.max(40, (w - (totalW + gap * (points.length - 1))) / 2);
    for (const point of points) {
      const label = point.slice(0, 20);
      const tw = ctx.measureText(label).width + 28;
      drawTextBanner(ctx, cx, chipY, tw, 34, ink);
      ctx.fillStyle = cream;
      ctx.textAlign = "center";
      ctx.fillText(label, cx + tw / 2, chipY + 23);
      cx += tw + gap;
    }
    ctx.textAlign = "left";
  }

  drawContactFooter(ctx, brand, w, h, ink, cream, gold);
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
  const gold = accentOf(brand);
  const points = pointsOf(brand).slice(0, 3);
  const placement = (brand.logoPlacement || "corner_br") as LogoPlacement;
  const contacts = contactLines(brand);
  const footerH =
    contacts.length > 0 ? 36 + contacts.length * 32 + 44 : 40;
  const pointsH = points.length > 0 ? 52 : 0;
  const grams = brand.grams.trim();
  const offer = brand.marketingLine.trim();
  const brandName = brand.brandName.trim();
  const festLabel =
    brand.headline.trim() ||
    brand.festivalLabel.trim() ||
    "HAPPY FESTIVAL";

  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  let ty = 56;
  if (brandName) {
    ctx.fillStyle = ink;
    ctx.font = "700 28px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(brandName.slice(0, 28), w / 2, ty + 20);
    ctx.textAlign = "left";
    ty += 48;
  }

  ctx.fillStyle = gold;
  ctx.font = "700 48px Newsreader, Georgia, serif";
  ctx.textAlign = "center";
  for (const line of wrapText(ctx, festLabel.toUpperCase(), w - 120).slice(0, 2)) {
    ctx.fillText(line, w / 2, ty + 36);
    ty += 52;
  }
  ctx.textAlign = "left";
  if (offer) {
    ctx.font = "700 22px Manrope, sans-serif";
    const chipW = Math.min(420, ctx.measureText(offer).width + 40);
    drawTextBanner(ctx, (w - chipW) / 2, ty, chipW, 40, ink);
    ctx.fillStyle = cream;
    ctx.textAlign = "center";
    ctx.fillText(offer.slice(0, 40), w / 2, ty + 28);
    ctx.textAlign = "left";
    ty += 56;
  } else {
    ty += 12;
  }

  const photoX = 56;
  const photoY = ty;
  const photoW = w - 112;
  const photoH = Math.max(400, h - photoY - pointsH - footerH - 28);

  ctx.fillStyle = "#1a120c";
  roundRect(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.clip();
  drawContainPhoto(ctx, photo, photoX, photoY, photoW, photoH, 40);
  ctx.restore();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  roundRect(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.stroke();

  if (grams) {
    const cx = photoX + photoW - 64;
    const cy = photoY + photoH - 64;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = cream;
    ctx.font = "700 20px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(grams.slice(0, 10), cx, cy + 7);
    ctx.textAlign = "left";
  }

  if (logo) {
    drawLogoOnPhoto(
      ctx,
      logo,
      photoX,
      photoY,
      photoW,
      photoH,
      placement,
      "#fffdf8",
      Boolean(grams),
    );
  }

  if (points.length > 0) {
    const chipY = photoY + photoH + 12;
    ctx.font = "600 18px Manrope, sans-serif";
    const gap = 10;
    const totalW = points.reduce(
      (sum, p) => sum + ctx.measureText(p.slice(0, 22)).width + 28,
      0,
    );
    let cx = Math.max(56, (w - (totalW + gap * (points.length - 1))) / 2);
    for (const point of points) {
      const label = point.slice(0, 22);
      const tw = ctx.measureText(label).width + 28;
      drawTextBanner(ctx, cx, chipY, tw, 34, ink);
      ctx.fillStyle = cream;
      ctx.textAlign = "center";
      ctx.fillText(label, cx + tw / 2, chipY + 23);
      cx += tw + gap;
    }
    ctx.textAlign = "left";
  }

  drawContactFooter(ctx, brand, w, h, ink, cream, gold);
}

async function drawOffer(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  logo: HTMLImageElement | null,
  brand: BrandFormState,
) {
  const w = 1080;
  const h = 1440;
  const ink = "#120e0b";
  const cream = "#fff8ee";
  const gold = accentOf(brand);
  const fest =
    brand.festivalLabel.trim() ||
    brand.headline.trim() ||
    "SPECIAL OFFER";
  const offer = brand.marketingLine.trim() || "Limited festive offer";

  drawCoverPhoto(ctx, photo, 0, 0, w, h);
  const grad = ctx.createLinearGradient(0, h * 0.35, 0, h);
  grad.addColorStop(0, "rgba(18,14,11,0)");
  grad.addColorStop(0.45, "rgba(18,14,11,0.55)");
  grad.addColorStop(1, "rgba(18,14,11,0.92)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Festival pill
  ctx.font = "700 22px Manrope, sans-serif";
  const pill = fest.toUpperCase().slice(0, 36);
  const pillW = Math.min(520, ctx.measureText(pill).width + 48);
  drawTextBanner(ctx, 48, 48, pillW, 44, gold);
  ctx.fillStyle = ink;
  ctx.fillText(pill, 72, 78);

  const placement = (brand.logoPlacement || "corner_br") as LogoPlacement;
  if (logo) {
    drawLogoOnPhoto(ctx, logo, 0, 0, w, h, placement, cream, false);
  }

  ctx.fillStyle = cream;
  ctx.font = "700 64px Newsreader, Georgia, serif";
  ctx.textAlign = "left";
  const headLines = wrapText(
    ctx,
    (brand.headline.trim() || brand.brandName.trim() || "Festive Collection").toUpperCase(),
    w - 96,
  ).slice(0, 3);
  const contacts = contactLines(brand);
  const footerH = Math.max(72, 28 + contacts.length * 28);
  let ty = h - 280 - footerH;
  for (const line of headLines) {
    ctx.fillText(line, 48, ty);
    ty += 70;
  }

  // Big offer badge
  ctx.font = "700 36px Manrope, sans-serif";
  const offerW = Math.min(w - 96, ctx.measureText(offer).width + 64);
  drawTextBanner(ctx, 48, ty + 8, offerW, 64, gold);
  ctx.fillStyle = ink;
  ctx.fillText(offer.slice(0, 42), 80, ty + 52);

  if (brand.grams.trim()) {
    ctx.fillStyle = cream;
    ctx.font = "600 26px Manrope, sans-serif";
    ctx.fillText(brand.grams.trim(), 48, ty + 120);
  }

  // Contact CTA — phone, WhatsApp, Instagram, address
  ctx.fillStyle = gold;
  roundRect(ctx, 40, h - footerH - 24, w - 80, footerH, 12);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  if (contacts.length === 0) {
    ctx.font = "700 30px Manrope, sans-serif";
    ctx.fillText(brand.brandName.trim() || "Shop now", w / 2, h - footerH / 2 - 10);
  } else {
    contacts.forEach((line, i) => {
      ctx.font =
        i === 0 ? "700 26px Manrope, sans-serif" : "600 18px Manrope, sans-serif";
      ctx.fillText(line.slice(0, 48), w / 2, h - footerH + 8 + i * 28);
    });
  }
  ctx.textAlign = "left";
}

async function drawLuxury(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  logo: HTMLImageElement | null,
  brand: BrandFormState,
) {
  const w = 1080;
  const h = 1440;
  const bg = "#0f0d0b";
  const cream = "#f5efe6";
  const gold = accentOf(brand);
  const points = pointsOf(brand);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  const placement = (brand.logoPlacement || "corner_br") as LogoPlacement;

  ctx.fillStyle = cream;
  ctx.font = "700 28px Manrope, sans-serif";
  ctx.textAlign = "left";
  if (brand.brandName.trim()) {
    ctx.fillText(brand.brandName.trim().slice(0, 28), 56, 88);
  }
  ctx.font = "600 16px Manrope, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    (brand.festivalLabel || "PRIVATE COLLECTION").toUpperCase().slice(0, 28),
    w - 56,
    88,
  );
  ctx.textAlign = "left";

  const photoX = 72;
  const photoY = 130;
  const photoW = w - 144;
  const photoH = 780;
  ctx.fillStyle = "#1a1612";
  ctx.fillRect(photoX, photoY, photoW, photoH);
  drawContainPhoto(ctx, photo, photoX, photoY, photoW, photoH, 40);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  if (logo) {
    drawLogoOnPhoto(
      ctx,
      logo,
      photoX,
      photoY,
      photoW,
      photoH,
      placement,
      cream,
      Boolean(brand.grams.trim()),
    );
  }

  if (brand.grams.trim()) {
    const cx = photoX + photoW - 70;
    const cy = photoY + 70;
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bg;
    ctx.font = "700 20px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.grams.trim().slice(0, 10), cx, cy + 7);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = cream;
  ctx.font = "700 48px Newsreader, Georgia, serif";
  const title =
    brand.headline.trim() || brand.brandName.trim() || "Timeless Luxury";
  let ty = photoY + photoH + 56;
  for (const line of wrapText(ctx, title, w - 144).slice(0, 2)) {
    ctx.fillText(line, 72, ty);
    ty += 54;
  }

  if (brand.marketingLine.trim()) {
    ctx.fillStyle = gold;
    ctx.font = "italic 400 26px Newsreader, Georgia, serif";
    ctx.fillText(brand.marketingLine.trim().slice(0, 56), 72, ty + 8);
    ty += 40;
  }

  points.slice(0, 3).forEach((p, i) => {
    ctx.fillStyle = "rgba(245,239,230,0.85)";
    ctx.font = "500 20px Manrope, sans-serif";
    ctx.fillText(`·  ${p.slice(0, 34)}`, 72 + i * 0, ty + 28 + i * 28);
  });

  const contacts = contactLines(brand);
  ctx.fillStyle = gold;
  ctx.fillRect(72, h - 36 - contacts.length * 28, w - 144, 1);
  ctx.fillStyle = cream;
  ctx.textAlign = "center";
  if (contacts.length === 0) {
    ctx.font = "600 22px Manrope, sans-serif";
    ctx.fillText(brand.brandName.trim() || " ", w / 2, h - 48);
  } else {
    contacts.forEach((line, i) => {
      ctx.font =
        i === 0 ? "700 24px Manrope, sans-serif" : "500 18px Manrope, sans-serif";
      ctx.fillText(line.slice(0, 52), w / 2, h - 28 - (contacts.length - 1 - i) * 28);
    });
  }
  ctx.textAlign = "left";
}

/** Build the branded share-card JPEG (brand text, grams, points, festival). */
export async function buildShareCardBlob(
  imageUrl: string,
  brand: BrandFormState,
): Promise<Blob> {
  return drawPoster(imageUrl, brand);
}

async function drawPoster(imageUrl: string, brand: BrandFormState): Promise<Blob> {
  const photo = await loadImage(imageUrl);
  const logo = brand.logoBase64
    ? await loadImage(
        `data:${brand.logoMimeType || "image/png"};base64,${brand.logoBase64}`,
      )
    : null;

  await ensurePosterFonts();

  const template = getPosterTemplate(brand.posterTemplate);
  const id = template.id as PosterTemplateId;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = id === "story" ? 1920 : 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the poster.");

  if (id === "story") await drawStory(ctx, photo, logo, brand);
  else if (id === "festival") await drawFestival(ctx, photo, logo, brand);
  else if (id === "offer") await drawOffer(ctx, photo, logo, brand);
  else if (id === "luxury") await drawLuxury(ctx, photo, logo, brand);
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
  label = "Preview share card",
  busyLabel = "Building preview…",
  autoOpenToken = 0,
}: MarketingPosterButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const lastAutoToken = useRef(0);

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

  useEffect(() => {
    if (!autoOpenToken || autoOpenToken === lastAutoToken.current) return;
    if (!imageUrl) return;
    lastAutoToken.current = autoOpenToken;
    void openPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open on token bump only
  }, [autoOpenToken, imageUrl]);

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
        {busy ? busyLabel : label}
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
