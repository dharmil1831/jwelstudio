export type BrandVideoInput = {
  src: string;
  name: string;
  logoSrc: string | null;
  endCard: boolean;
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
  if (!name && !input.logoSrc) {
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
