/**
 * Contact shadow and floor reflection composited onto a background still.
 * Flood-fill starts at the edges so stones inside the jewelry stay opaque.
 * Light gray floor shadows are treated as backdrop so they are not mirrored.
 */

export type FinishShadow = "off" | "soft" | "hard" | "floating";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

function cornerColor(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const samples = [
    0,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + (w - 1)) * 4,
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const i of samples) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return [r / samples.length, g / samples.length, b / samples.length];
}

/** Backdrop, including a pale gray contact shadow painted by the model. */
function isBackdrop(
  data: Uint8ClampedArray,
  i: number,
  bg: [number, number, number],
): boolean {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const dist = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
  if (dist <= 36) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  const bgLum = (bg[0] + bg[1] + bg[2]) / 3;
  return max - min < 22 && lum > 165 && Math.abs(lum - bgLum) < 95;
}

function edgeBackgroundMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8Array {
  const bg = cornerColor(data, w, h);
  const seen = new Uint8Array(w * h);
  const queue: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (seen[p]) return;
    if (!isBackdrop(data, p * 4, bg)) return;
    seen[p] = 1;
    queue.push(p);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  for (let q = 0; q < queue.length; q++) {
    const p = queue[q];
    const x = p % w;
    const y = (p - x) / w;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  return seen;
}

/** White trapped inside openwork. Flat and the same color as the backdrop, so it is not a stone. */
function isInteriorWhite(
  data: Uint8ClampedArray,
  i: number,
  bg: [number, number, number],
): boolean {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const dist = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  return dist <= 22 && chroma <= 18 && lum >= 196;
}

function clearInteriorHoles(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  bg: [number, number, number],
) {
  const n = w * h;
  const seen = new Uint8Array(n);
  for (let start = 0; start < n; start++) {
    if (seen[start] || data[start * 4 + 3] === 0) continue;
    if (!isInteriorWhite(data, start * 4, bg)) continue;
    const stack = [start];
    seen[start] = 1;
    const comp: number[] = [];
    let sumDist = 0;
    let sumLum = 0;
    let sumLum2 = 0;
    while (stack.length > 0) {
      const p = stack.pop() as number;
      comp.push(p);
      const i = p * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3;
      sumDist += Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
      sumLum += lum;
      sumLum2 += lum * lum;
      const x = p % w;
      const y = (p - x) / w;
      const next = [
        x > 0 ? p - 1 : -1,
        x + 1 < w ? p + 1 : -1,
        y > 0 ? p - w : -1,
        y + 1 < h ? p + w : -1,
      ];
      for (const np of next) {
        if (np < 0 || seen[np] || data[np * 4 + 3] === 0) continue;
        if (!isInteriorWhite(data, np * 4, bg)) continue;
        seen[np] = 1;
        stack.push(np);
      }
    }
    const count = comp.length;
    const meanLum = sumLum / count;
    const variance = sumLum2 / count - meanLum * meanLum;
    const meanDist = sumDist / count;
    // Faceted stones vary. A hole filled with backdrop white does not.
    if (meanDist <= 20 && variance < 36) {
      for (const p of comp) data[p * 4 + 3] = 0;
    }
  }
}

/** Eat the pale white rim that shows around the gold when the photo is zoomed. */
function defringeWhiteRim(data: Uint8ClampedArray, w: number, h: number) {
  for (let pass = 0; pass < 4; pass++) {
    const clear: number[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const i = p * 4;
        if (data[i + 3] === 0) continue;
        const touch =
          (x > 0 && data[i - 4 + 3] === 0) ||
          (x + 1 < w && data[i + 4 + 3] === 0) ||
          (y > 0 && data[i - w * 4 + 3] === 0) ||
          (y + 1 < h && data[i + w * 4 + 3] === 0);
        if (!touch) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        const lum = (r + g + b) / 3;
        if (chroma < 30 && lum > 188) clear.push(p);
      }
    }
    if (clear.length === 0) break;
    for (const p of clear) data[p * 4 + 3] = 0;
  }
}

type Box = { left: number; right: number; top: number; bottom: number };

function bounds(data: Uint8ClampedArray, w: number, h: number): Box {
  let top = h;
  let bottom = 0;
  let left = w;
  let right = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] <= 16) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (top > bottom) return { left: 0, right: w - 1, top: 0, bottom: h - 1 };
  return { left, right, top, bottom };
}

function drawCastShadow(
  ctx: CanvasRenderingContext2D,
  cut: HTMLCanvasElement,
  box: Box,
  kind: Exclude<FinishShadow, "off">,
) {
  const w = cut.width;
  const h = cut.height;
  const pieceW = Math.max(8, box.right - box.left);
  const pieceH = Math.max(8, box.bottom - box.top);
  let cx = (box.left + box.right) / 2;
  let rx = pieceW * 0.42;
  let ry = Math.max(10, pieceH * 0.04);
  let cy = box.bottom - ry * 0.1;
  let alpha = 0.34;
  let blur = Math.max(14, pieceH * 0.028);
  if (kind === "hard") {
    rx = pieceW * 0.46;
    ry = Math.max(5, pieceH * 0.018);
    cy = box.bottom + ry * 0.35;
    alpha = 0.55;
    blur = 3;
    cx += pieceW * 0.05;
  } else if (kind === "floating") {
    rx = pieceW * 0.3;
    ry = Math.max(8, pieceH * 0.028);
    cy = box.bottom + Math.max(22, pieceH * 0.07);
    alpha = 0.3;
    blur = Math.max(18, pieceH * 0.04);
  }

  const layer = document.createElement("canvas");
  layer.width = w;
  layer.height = h;
  const sctx = layer.getContext("2d");
  if (!sctx) return;
  sctx.filter = `blur(${blur}px)`;
  sctx.globalAlpha = alpha;
  sctx.fillStyle = "#1a1a1a";
  sctx.beginPath();
  sctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  sctx.fill();
  sctx.filter = "none";
  sctx.globalAlpha = 1;
  sctx.globalCompositeOperation = "destination-out";
  sctx.drawImage(cut, 0, 0);
  ctx.drawImage(layer, 0, 0);
}

/** Mirror only the bottom of the piece, touching its lowest pixels, then fade out. */
function drawReflection(
  ctx: CanvasRenderingContext2D,
  cut: HTMLCanvasElement,
  box: Box,
  opacity: number,
) {
  const w = cut.width;
  const h = cut.height;
  const pieceH = box.bottom - box.top;
  const room = h - box.bottom - 1;
  const reflectH = Math.min(Math.round(pieceH * 0.42), room);
  if (reflectH < 8) return;

  const layer = document.createElement("canvas");
  layer.width = w;
  layer.height = reflectH;
  const rctx = layer.getContext("2d");
  if (!rctx) return;
  const srcY = box.bottom - reflectH;
  rctx.save();
  rctx.scale(1, -1);
  rctx.drawImage(cut, 0, srcY, w, reflectH, 0, -reflectH, w, reflectH);
  rctx.restore();
  rctx.globalCompositeOperation = "destination-in";
  const fade = rctx.createLinearGradient(0, 0, 0, reflectH);
  const alpha = Math.max(0, Math.min(100, opacity)) / 100;
  fade.addColorStop(0, `rgba(0,0,0,${alpha})`);
  fade.addColorStop(0.55, `rgba(0,0,0,${alpha * 0.35})`);
  fade.addColorStop(1, "rgba(0,0,0,0)");
  rctx.fillStyle = fade;
  rctx.fillRect(0, 0, w, reflectH);
  ctx.drawImage(layer, 0, box.bottom);
}

export async function finishProductImage(params: {
  sourceUrl: string;
  cutout: boolean;
  reflection: boolean;
  reflectionOpacity: number;
  shadow?: FinishShadow;
}): Promise<Blob> {
  const img = await loadImage(params.sourceUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const mask = edgeBackgroundMask(image.data, w, h);

  const cut = document.createElement("canvas");
  cut.width = w;
  cut.height = h;
  const cutCtx = cut.getContext("2d");
  if (!cutCtx) throw new Error("Canvas not supported");
  const cutData = new ImageData(new Uint8ClampedArray(image.data), w, h);
  const bg = cornerColor(image.data, w, h);
  for (let p = 0; p < w * h; p++) {
    if (mask[p]) cutData.data[p * 4 + 3] = 0;
  }
  if (params.cutout) {
    clearInteriorHoles(cutData.data, w, h, bg);
    defringeWhiteRim(cutData.data, w, h);
  }
  cutCtx.putImageData(cutData, 0, 0);
  const box = bounds(cutData.data, w, h);
  const shadow = params.shadow ?? "off";

  if (params.cutout) ctx.clearRect(0, 0, w, h);
  else ctx.drawImage(img, 0, 0);

  if (shadow === "soft" || shadow === "hard") {
    drawCastShadow(ctx, cut, box, shadow);
  }
  if (params.cutout) ctx.drawImage(cut, 0, 0);
  if (params.reflection && params.reflectionOpacity > 0) {
    drawReflection(ctx, cut, box, params.reflectionOpacity);
  }
  if (shadow === "floating") {
    drawCastShadow(ctx, cut, box, "floating");
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      "image/png",
    );
  });
}
