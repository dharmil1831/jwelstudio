export type BrandVideoInput = {
  src: string;
  name: string;
  logoSrc: string | null;
  endCard: boolean;
  /** A case opens from the center over the jewelry. The jewelry pixels stay the clip underneath. */
  unbox?: boolean;
};

export type BrandVideoResult = {
  blob: Blob;
  clipSeconds: number;
};

export function videoLengthLabel(clipSeconds: number, withEndCard: boolean): string {
  const clip = Math.max(1, Math.round(clipSeconds));
  if (withEndCard) return `${clip}s clip + 3s brand card`;
  return `Jewelry clip · ${clip}s`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the logo."));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function contain(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
): { x: number; y: number; w: number; h: number } {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}

/**
 * Closed jewelry case, then the two sides hinge open from the center.
 * Nothing slides upward. The frame fades once the piece is visible.
 */
function paintUnboxLid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const shut = 0.28;
  const openEnd = 2.05;
  const fadeEnd = 2.55;
  if (t >= fadeEnd) return;

  const openT = Math.min(1, Math.max(0, (t - shut) / (openEnd - shut)));
  const eased = openT * openT * (3 - 2 * openT);
  const angle = eased * (Math.PI / 2) * 0.96;
  const face = Math.cos(angle);
  const thickness = Math.sin(angle);

  ctx.save();

  const dim = (1 - eased) * 0.18;
  if (dim > 0.015) {
    ctx.fillStyle = `rgba(16, 10, 8, ${dim})`;
    ctx.fillRect(0, 0, w, h);
  }

  const doorW = (w / 2) * face;
  if (doorW > 1.5 && t < openEnd + 0.05) {
    const lip = Math.max(3, w * 0.012);
    const depth = thickness * Math.min(w * 0.045, 28);

    const paintDoor = (x: number, width: number, hingeLeft: boolean) => {
      const velvet = ctx.createLinearGradient(x, 0, x + width, 0);
      if (hingeLeft) {
        velvet.addColorStop(0, "#100c0a");
        velvet.addColorStop(0.55, "#241911");
        velvet.addColorStop(1, "#3a2c22");
      } else {
        velvet.addColorStop(0, "#3a2c22");
        velvet.addColorStop(0.45, "#241911");
        velvet.addColorStop(1, "#100c0a");
      }
      ctx.fillStyle = velvet;
      ctx.fillRect(x, 0, width, h);

      const edgeX = hingeLeft ? x + width - lip : x;
      const gold = ctx.createLinearGradient(edgeX, 0, edgeX + lip, 0);
      gold.addColorStop(0, hingeLeft ? "#8d7344" : "#e6d3a4");
      gold.addColorStop(1, hingeLeft ? "#e6d3a4" : "#8d7344");
      ctx.fillStyle = gold;
      ctx.fillRect(edgeX, 0, lip, h);

      if (depth > 1.2) {
        const slabX = hingeLeft ? x + width : x - depth;
        const slab = ctx.createLinearGradient(slabX, 0, slabX + depth, 0);
        slab.addColorStop(0, "#5c482c");
        slab.addColorStop(0.5, "#e8d7ad");
        slab.addColorStop(1, "#6e5834");
        ctx.fillStyle = slab;
        ctx.fillRect(slabX, 0, depth, h);
      }

      const shadeW = Math.min(w * 0.12, 72);
      const shadeX = hingeLeft ? x + width + depth : x - depth - shadeW;
      const shade = ctx.createLinearGradient(shadeX, 0, shadeX + shadeW, 0);
      const dark = `rgba(0,0,0,${0.28 * face})`;
      if (hingeLeft) {
        shade.addColorStop(0, dark);
        shade.addColorStop(1, "rgba(0,0,0,0)");
      } else {
        shade.addColorStop(0, "rgba(0,0,0,0)");
        shade.addColorStop(1, dark);
      }
      ctx.fillStyle = shade;
      ctx.fillRect(shadeX, 0, shadeW, h);
    };

    paintDoor(0, doorW, true);
    paintDoor(w - doorW, doorW, false);

    if (eased < 0.72) {
      ctx.globalAlpha = eased < 0.4 ? 1 : 1 - (eased - 0.4) / 0.32;
      const ch = Math.max(28, h * 0.07);
      const cw = Math.max(7, w * 0.018);
      const y = h / 2 - ch / 2;
      ctx.fillStyle = "#e4d2a2";
      roundRect(ctx, doorW - cw - 2, y, cw, ch, 3);
      ctx.fill();
      roundRect(ctx, w - doorW + 2, y, cw, ch, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  const frameAlpha =
    t < openEnd ? 1 : Math.max(0, 1 - (t - openEnd) / (fadeEnd - openEnd));
  if (frameAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = frameAlpha;
    const inset = Math.max(14, Math.round(Math.min(w, h) * 0.022));
    ctx.strokeStyle = "#c6a56e";
    ctx.lineWidth = Math.max(3, inset * 0.22);
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    ctx.strokeStyle = "rgba(198, 165, 110, 0.55)";
    ctx.lineWidth = Math.max(1.5, inset * 0.1);
    ctx.strokeRect(inset * 1.8, inset * 1.8, w - inset * 3.6, h - inset * 3.6);
    ctx.restore();
  }

  ctx.restore();
}

function paintCorner(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
  logo: HTMLImageElement | null,
  name: string,
) {
  if (alpha <= 0.01 || (!logo && !name)) return;
  const unit = Math.min(w, h);
  const pad = Math.round(unit * 0.04);
  const logoBox = logo ? Math.round(unit * 0.12) : 0;
  const fontPx = Math.max(16, Math.round(unit * 0.042));
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.font = `600 ${fontPx}px sans-serif`;
  const textW = name ? Math.min(ctx.measureText(name).width, w * 0.55) : 0;
  const gap = logo && name ? Math.round(pad * 0.4) : 0;
  const innerH = Math.max(logoBox, fontPx);
  const boxW = pad * 1.4 + textW + gap + logoBox;
  const boxH = innerH + pad;
  const x = w - pad - boxW;
  const y = h - pad - boxH;
  ctx.fillStyle = "rgba(26, 18, 36, 0.62)";
  roundRect(ctx, x, y, boxW, boxH, Math.round(pad * 0.7));
  ctx.fill();
  let cursor = x + pad * 0.7;
  if (name) {
    ctx.fillStyle = "#f6f1e8";
    ctx.textBaseline = "middle";
    ctx.fillText(name, cursor, y + boxH / 2, textW);
    cursor += textW + gap;
  }
  if (logo && logoBox) {
    const fit = contain(logo.naturalWidth || logoBox, logo.naturalHeight || logoBox, logoBox, logoBox);
    ctx.drawImage(logo, cursor + fit.x, y + (boxH - logoBox) / 2 + fit.y, fit.w, fit.h);
  }
  ctx.restore();
}

function paintEndCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  logo: HTMLImageElement | null,
  name: string,
) {
  ctx.fillStyle = "#2a1f33";
  ctx.fillRect(0, 0, w, h);
  const logoA = Math.min(1, t / 0.75);
  const scale = 0.82 + 0.18 * logoA;
  const nameA = Math.min(1, Math.max(0, (t - 0.45) / 0.65));
  const unit = Math.min(w, h);
  const logoBox = Math.round(unit * 0.28);
  const cx = w / 2;
  const cy = h / 2 - (name ? unit * 0.06 : 0);
  if (logo) {
    ctx.save();
    ctx.globalAlpha = logoA;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    const fit = contain(logo.naturalWidth || logoBox, logo.naturalHeight || logoBox, logoBox, logoBox);
    ctx.drawImage(logo, -logoBox / 2 + fit.x, -logoBox / 2 + fit.y, fit.w, fit.h);
    ctx.restore();
  }
  if (name && nameA > 0) {
    ctx.save();
    ctx.globalAlpha = nameA;
    const fontPx = Math.max(22, Math.round(unit * 0.055));
    ctx.font = `600 ${fontPx}px sans-serif`;
    ctx.fillStyle = "#f6f1e8";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const y = logo ? cy + logoBox / 2 + unit * 0.04 : cy - fontPx / 2;
    ctx.fillText(name, cx, y, w * 0.8);
    ctx.restore();
  }
}

function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["video/mp4", "video/webm;codecs=vp8", "video/webm"];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

/**
 * Plays the finished jewelry clip once and paints the shop mark on top.
 * The model is not asked to draw text. Returns a new video file.
 */
export async function renderBrandedVideo(input: BrandVideoInput): Promise<BrandVideoResult> {
  const name = input.name.trim().slice(0, 40);
  const unbox = Boolean(input.unbox);
  if (!name && !input.logoSrc && !unbox) {
    throw new Error("Add a shop name or logo first.");
  }
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    throw new Error("This phone cannot add the shop mark to the file.");
  }

  const response = await fetch(input.src, { credentials: "include" });
  if (!response.ok) throw new Error("Could not open the video.");
  const sourceBlob = await response.blob();
  if (!sourceBlob.size) throw new Error("Could not open the video.");
  const objectUrl = URL.createObjectURL(sourceBlob);
  const video = document.createElement("video");
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  video.src = objectUrl;
  video.style.cssText =
    "position:fixed;left:0;top:0;width:4px;height:4px;opacity:0.02;pointer-events:none;z-index:-1";
  document.body.appendChild(video);

  const logo = input.logoSrc ? await loadImage(input.logoSrc).catch(() => null) : null;
  if (input.logoSrc && !logo && !name) {
    video.remove();
    URL.revokeObjectURL(objectUrl);
    throw new Error("Could not read the logo.");
  }

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const ok = () => {
        if (settled || video.videoWidth <= 0) return;
        settled = true;
        window.clearTimeout(timer);
        resolve();
      };
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("Could not open the video."));
      }, 20000);
      video.onloadeddata = ok;
      video.onloadedmetadata = ok;
      if (video.readyState >= 2) ok();
      video.onerror = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(new Error("Could not open the video."));
      };
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream?.(30);
    if (!ctx || !stream) throw new Error("This phone cannot add the shop mark to the file.");

    const mime = pickRecorderMime();
    const recorder = mime
      ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 })
      : new MediaRecorder(stream, { videoBitsPerSecond: 2_500_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };

    let phase: "clip" | "card" | "done" = "clip";
    let cardStart = 0;
    let seen = 0;
    let movedAt = performance.now();
    let lastTime = -1;
    let failed: Error | null = null;

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error("Could not write the shop mark."));
      recorder.onstop = () => {
        const type = (recorder.mimeType || mime || "video/webm").split(";")[0] || "video/webm";
        const blob = new Blob(chunks, { type });
        if (failed || blob.size < 2000) {
          reject(failed ?? new Error("Could not write the shop mark."));
          return;
        }
        resolve(blob);
      };
    });

    const clipLength = () =>
      Number.isFinite(video.duration) && video.duration > 0 ? video.duration : Math.max(seen, 1);

    const finish = () => {
      if (phase === "done") return;
      phase = "done";
      if (recorder.state !== "inactive") recorder.stop();
    };

    const draw = () => {
      if (phase === "done") return;
      if (phase === "clip") {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          movedAt = performance.now();
          seen = Math.max(seen, video.currentTime);
        } else if (performance.now() - movedAt > 8000) {
          failed = new Error("Could not play the video.");
          finish();
          return;
        }
        const alpha = Math.min(1, (video.currentTime || 0) / 1);
        paintCorner(ctx, canvas.width, canvas.height, alpha, logo, name);
        if (unbox) paintUnboxLid(ctx, canvas.width, canvas.height, video.currentTime || 0);
        const known = Number.isFinite(video.duration) && video.duration > 0.4;
        if (video.ended || (known && video.currentTime >= video.duration - 0.05)) {
          if (input.endCard) {
            phase = "card";
            cardStart = performance.now();
          } else {
            finish();
            return;
          }
        }
      } else {
        const t = (performance.now() - cardStart) / 1000;
        if (t >= 3) {
          paintEndCard(ctx, canvas.width, canvas.height, 3, logo, name);
          finish();
          return;
        }
        paintEndCard(ctx, canvas.width, canvas.height, t, logo, name);
      }
      requestAnimationFrame(draw);
    };

    const capMs = (clipLength() + (input.endCard ? 3 : 0) + 10) * 1000;
    const cap = window.setTimeout(() => finish(), capMs);
    recorder.start(200);
    try {
      await video.play();
    } catch {
      failed = new Error("Could not play the video.");
      finish();
    }
    if (!failed) draw();
    const blob = await recorded;
    window.clearTimeout(cap);
    stream.getTracks().forEach((track) => track.stop());
    return { blob, clipSeconds: clipLength() };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
